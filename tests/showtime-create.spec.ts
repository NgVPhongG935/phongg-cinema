import { test, expect } from '@playwright/test'

test.use({ timezoneId: 'Asia/Ho_Chi_Minh' })

async function setup(page) {
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({ id: 'admin-test', role: 'ADMIN' })))
  await page.route('**/api/v1/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/movies')) return route.fulfill({ json: { content: [{ id: 'movie', title: 'Test film', duration: 100 }] } })
    if (path.endsWith('/cinemas')) return route.fulfill({ json: [{ id: 'cinema', tenRap: 'Test cinema', danhSachPhong: [{ maPhong: 'P01', tenPhong: 'Room 1' }] }] })
    return route.fulfill({ json: [] })
  })
  await page.goto('http://localhost:5173/admin/showtimes')
}

test('calculates movie end time, shows errors inside modal, and prevents duplicate saves', async ({ page }) => {
  await setup(page)
  await page.getByRole('button', { name: 'Thêm 1 suất', exact: true }).click()
  await page.locator('select[name=maPhim]').selectOption('movie')
  await page.locator('select[name=maRap]').selectOption('cinema')
  await page.locator('select[name=maPhong]').selectOption('P01')
  await page.locator('input[name=thoiGianBatDau]').fill('2027-01-01T09:00')
  await expect(page.locator('input[name=thoiGianKetThuc]')).toHaveValue('2027-01-01T10:40')
  await page.locator('input[name=thoiGianKetThuc]').fill('2027-01-01T08:00')
  await page.getByRole('button', { name: 'Tạo suất chiếu', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Giờ kết thúc phải sau')
  await page.locator('input[name=thoiGianKetThuc]').fill('2027-01-01T10:40')
  let saves = 0
  await page.route('**/showtimes/admin', async route => {
    saves++
    await new Promise(resolve => setTimeout(resolve, 500))
    return route.fulfill({ status: 400, json: { message: 'Phòng đã có suất chiếu' } })
  })
  await page.getByRole('button', { name: 'Tạo suất chiếu', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang lưu...' })).toBeDisabled()
  await expect(page.getByRole('alert')).toContainText('Phòng đã có suất chiếu')
  expect(saves).toBe(1)
})

test('changing batch inputs discards old suggested slots', async ({ page }) => {
  await setup(page)
  await page.route('**/preview-slots', route => route.fulfill({ json: [{ maKhoa: 'slot', ngay: '2027-01-01', thoiGianBatDau: '2027-01-01T09:00:00', thoiGianKetThuc: '2027-01-01T10:40:00', giaVeTu: 69000, trungLich: false }] }))
  await page.getByRole('button', { name: 'Tạo hàng loạt', exact: true }).click()
  await page.locator('select[name=maPhim]').selectOption('movie')
  await page.locator('select[name=maRap]').selectOption('cinema')
  await page.locator('select[name=maPhong]').selectOption('P01')
  await page.getByRole('button', { name: /Gợi ý khung giờ/ }).click()
  await expect(page.getByRole('button', { name: 'Tạo 1 suất đã chọn' })).toBeVisible()
  await page.locator('input[name=tuNgay]').fill('2027-01-02')
  await expect(page.getByRole('button', { name: 'Tạo 1 suất đã chọn' })).toHaveCount(0)
})

test('successful save closes modal and refreshes history', async ({ page }) => {
  await setup(page)
  let created = false
  await page.route('**/showtimes/admin/history', route => route.fulfill({ json: created ? [{ id: 'created', movieId: 'movie', movieTitle: 'Test film', cinemaId: 'cinema', cinemaName: 'Test cinema', roomId: 'P01', startTime: '2027-01-01T09:00:00', endTime: '2027-01-01T10:40:00', price: 69000, format: '2D' }] : [] }))
  await page.route('**/showtimes/admin', route => {
    const data = route.request().postDataJSON()
    expect(data.maPhim).toBe('movie')
    expect(data.thoiGianKetThuc).toBe('2027-01-01T10:40:00')
    created = true
    return route.fulfill({ json: { id: 'created' } })
  })
  await page.getByRole('button', { name: 'Thêm 1 suất', exact: true }).click()
  await page.locator('select[name=maPhim]').selectOption('movie')
  await page.locator('select[name=maRap]').selectOption('cinema')
  await page.locator('select[name=maPhong]').selectOption('P01')
  await page.locator('input[name=thoiGianBatDau]').fill('2027-01-01T09:00')
  await page.getByRole('button', { name: 'Tạo suất chiếu', exact: true }).click()
  await expect(page.locator('input[name=thoiGianBatDau]')).toHaveCount(0)
  await expect(page.locator('tbody')).toContainText('Test film')
})

test('upcoming shows come first and pagination and status filters work together', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-10-14T03:00:00Z') })
  await setup(page)
  const upcoming = Array.from({ length: 12 }, (_, i) => ({ id: `future-${i}`, movieId: 'movie', movieTitle: `Upcoming ${i + 1}`, startTime: `2026-10-${String(15 + i).padStart(2, '0')}T09:00:00`, expired: false }))
  const past = [
    { id: 'old', movieTitle: 'Older show', startTime: '2026-10-10T09:00:00', expired: true },
    { id: 'recent', movieTitle: 'Recent past show', startTime: '2026-10-13T09:00:00', expired: true },
  ]
  await page.route('**/showtimes/admin/history', route => route.fulfill({ json: [...past, ...upcoming.reverse()] }))
  await page.reload()
  const rows = page.locator('tbody tr')
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toContainText('Upcoming 1')
  await expect(rows.last()).toContainText('Upcoming 10')
  await expect(page.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
  await page.getByRole('button', { name: 'Trang sau' }).click()
  await expect(rows).toHaveCount(4)
  await expect(rows.first()).toContainText('Upcoming 11')
  await expect(rows.nth(2)).toContainText('Recent past show')
  await expect(rows.last()).toContainText('Older show')
  await expect(page.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
  await page.getByRole('combobox', { name: 'Trạng thái suất chiếu' }).selectOption('daQua')
  await expect(rows).toHaveCount(2)
  await expect(rows.first()).toContainText('Recent past show')
  await expect(page.getByRole('combobox', { name: 'Chọn trang suất chiếu' })).toHaveValue('1')
  await page.getByRole('combobox', { name: 'Trạng thái suất chiếu' }).selectOption('sapChieu')
  await expect(rows).toHaveCount(10)
  await expect(rows.first()).toContainText('Upcoming 1')
  await page.getByRole('button', { name: 'Trang sau' }).click()
  await page.getByPlaceholder('Tìm phim, rạp, phòng...').fill('Upcoming 1')
  await expect(page.getByRole('combobox', { name: 'Chọn trang suất chiếu' })).toHaveValue('1')
  await expect(rows).toHaveCount(4)
})

