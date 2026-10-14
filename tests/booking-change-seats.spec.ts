import { test, expect } from '@playwright/test'

async function setup(page, couple = false, failRelease = false) {
  const numbers = couple ? ['L1', 'L2'] : ['D14', 'E14']
  const seats = numbers.map(seatNumber => ({ seatNumber, seatType: couple ? 'COUPLE' : 'VIP', status: 'HELD', heldBy: 'seat-user' }))
  seats.push({ seatNumber: 'D15', seatType: 'VIP', status: 'HELD', heldBy: 'other-user' })
  seats.push({ seatNumber: 'D16', seatType: 'VIP', status: 'BOOKED', heldBy: null })
  let deadline = 0
  const released: string[][] = []
  await page.addInitScript((numbers) => {
    localStorage.setItem('user', JSON.stringify({ id: 'seat-user', role: 'CUSTOMER' }))
    const key = 'phongg-hold-v1:seat-user:seat-show'
    if (!sessionStorage.getItem(key)) sessionStorage.setItem(key, JSON.stringify({ gheChon: numbers, thoiGianHetHanMs: Date.now() + 300000 }))
  }, numbers)
  await page.route('**/api/v1/**', route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/release-seats')) {
      if (failRelease) return route.fulfill({ status: 409, json: { message: 'Không thể bỏ giữ ghế, thử lại' } })
      const requested = route.request().postDataJSON().danhSachGheChon
      released.push(requested)
      seats.forEach(s => { if (requested.includes(s.seatNumber) && s.heldBy === 'seat-user') { s.status = 'AVAILABLE'; s.heldBy = null } })
      return route.fulfill({ json: {} })
    }
    if (path.endsWith('/seats')) return route.fulfill({ json: { giaVeTu: 69000, danhSachGhe: seats } })
    return route.fulfill({ json: [] })
  })
  await page.goto('http://localhost:5173/booking/seat-show')
  await expect(page.getByRole('button', { name: 'Chọn bắp nước →' })).toBeEnabled()
  deadline = await page.evaluate(() => JSON.parse(sessionStorage.getItem('phongg-hold-v1:seat-user:seat-show')).thoiGianHetHanMs)
  return { released, deadline }
}

test('returning to own held seats allows deselection and releases the seat immediately', async ({ page }) => {
  const { released, deadline } = await setup(page)
  await expect(page.getByRole('button', { name: 'D15', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'D16', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'D14', exact: true }).click()
  await expect(page.locator('aside')).not.toContainText('D14')
  await expect(page.locator('aside')).toContainText('E14')
  expect(released).toEqual([['D14']])
  const session = await page.evaluate(() => JSON.parse(sessionStorage.getItem('phongg-hold-v1:seat-user:seat-show')))
  expect(session.gheChon).toEqual(['E14'])
  expect(session.thoiGianHetHanMs).toBe(deadline)
  await page.reload()
  await expect(page.locator('aside')).not.toContainText('D14')
  await expect(page.locator('aside')).toContainText('E14')
  await page.getByRole('button', { name: 'Bỏ chọn tất cả' }).click()
  await expect(page.locator('aside')).toContainText('Chưa chọn ghế')
  expect(released).toEqual([['D14'], ['E14']])
  expect(await page.evaluate(() => sessionStorage.getItem('phongg-hold-v1:seat-user:seat-show'))).toBeNull()
})

test('own held couple seats can be deselected together', async ({ page }) => {
  const { released } = await setup(page, true)
  await page.getByRole('button', { name: 'L1 · L2', exact: true }).click()
  await expect(page.locator('aside')).toContainText('Chưa chọn ghế')
  expect(released).toEqual([['L1', 'L2']])
})

test('failed release keeps selected seats and shows an actionable error', async ({ page }) => {
  await setup(page, false, true)
  await page.getByRole('button', { name: 'D14', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Không thể bỏ giữ ghế')
  await expect(page.locator('aside')).toContainText('D14, E14')
  await expect(page.getByRole('button', { name: 'Bỏ chọn tất cả' })).toBeEnabled()
})
