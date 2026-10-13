import { test, expect } from '@playwright/test'

test.use({ timezoneId: 'Asia/Ho_Chi_Minh' })

const movie = { id: 'movie', title: 'Test movie', duration: 100, status: 'SHOWING' }
const cinema = { id: 'cinema', tenRap: 'PhongG Cinema - Hùng Vương Plaza', khuVuc: 'TP. Hồ Chí Minh', danhSachPhong: [{ maPhong: 'P01', tenPhong: 'Phòng 01' }] }

async function setup(page) {
  await page.clock.install({ time: new Date('2026-10-12T18:05:00Z') }) // 13 October, 01:05 in Vietnam.
  await page.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({ id: 'admin-preview', role: 'ADMIN' }))
    localStorage.setItem('phongg_rap_da_chon', 'cinema')
  })
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/movies')) return route.fulfill({ json: { content: [movie], totalElements: 1, totalPages: 1 } })
    if (path.endsWith('/movies/movie')) return route.fulfill({ json: movie })
    if (path.endsWith('/cinemas')) return route.fulfill({ json: [cinema] })
    if (path.endsWith('/regions')) return route.fulfill({ json: ['TP. Hồ Chí Minh'] })
    if (path.endsWith('/filter-index')) return route.fulfill({ json: { rapTheoPhim: { movie: ['cinema'] }, dinhDangTheoPhim: { movie: ['2D'] } } })
    return route.fulfill({ json: [] })
  })
}

test('admin and public schedule use the same local date after midnight', async ({ page }) => {
  await setup(page)
  await page.goto('http://localhost:5173/admin/showtimes')
  await page.getByRole('button', { name: 'Tạo hàng loạt', exact: true }).click()
  await expect(page.locator('input[name=tuNgay]')).toHaveValue('2026-10-13')
  await expect(page.locator('input[name=denNgay]')).toHaveValue('2026-10-13')
  await page.goto('http://localhost:5173/admin/showtimes')
  await page.getByRole('button', { name: /AI Xếp Lịch Tự Động/ }).click()
  await expect(page.locator('input[type=date]').first()).toHaveValue('2026-10-13')
  const request = page.waitForRequest(r => new URL(r.url()).pathname.endsWith('/showtimes') && r.url().includes('ngayChieu='))
  await page.goto('http://localhost:5173/movies/movie/schedule')
  expect(new URL((await request).url()).searchParams.get('ngayChieu')).toBe('2026-10-13')
})

test('public cinema distinguishes API errors from empty days and refreshes newly created slots', async ({ page }) => {
  await setup(page)
  let created = false
  let failing = true
  const dates: string[] = []
  await page.route('**/showtimes/cinema-day?**', route => {
    dates.push(new URL(route.request().url()).searchParams.get('ngayChieu')!)
    if (failing) return route.fulfill({ status: 400, json: { message: 'Cannot load showtimes' } })
    return route.fulfill({ json: created ? [{ movieId: 'movie', title: movie.title, showtimes: [{ id: 'show', movieId: 'movie', cinemaId: 'cinema', roomId: 'P01', startTime: '2026-10-13T20:00:00', endTime: '2026-10-13T21:40:00', format: '2D', price: 69000 }] }] : [] })
  })
  await page.goto('http://localhost:5173/')
  const section = page.locator('#cinema-showtimes-section')
  await expect(section.getByRole('alert')).toContainText('Chưa tải được lịch chiếu')
  await expect(section).not.toContainText('Không có suất chiếu cho ngày đã chọn')
  failing = false
  await section.getByRole('button', { name: 'Làm mới lịch chiếu' }).click()
  await expect(section).toContainText('Không có suất chiếu cho ngày đã chọn')
  created = true
  await section.getByRole('button', { name: 'Làm mới lịch chiếu' }).click()
  await expect(section).toContainText(movie.title)
  await expect(section).toContainText('20:00')
  expect(dates.every(date => date === '2026-10-13')).toBe(true)
})
