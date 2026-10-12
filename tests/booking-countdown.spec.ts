import { test, expect } from '@playwright/test'

test('one deadline survives food, payment, back navigation and reload, then expires', async ({ page }) => {
  let holdRequests = 0
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install()
  await page.addInitScript(() => localStorage.setItem('user', JSON.stringify({ id: 'timer-user', email: 'timer@example.com', role: 'CUSTOMER' })))
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/hold-seats')) {
      holdRequests++
      const deadline = await page.evaluate(() => Date.now() + 5 * 60 * 1000)
      return route.fulfill({ json: { maSuatChieu: 'timer-show', danhSachGheGiu: ['A1'], thoiGianHetHanEpochMs: deadline } })
    }
    if (path.endsWith('/seats')) return route.fulfill({ json: { giaVeTu: 69000, danhSachGhe: [{ seatNumber: 'A1', seatType: 'STANDARD', status: 'AVAILABLE' }] } })
    if (path.endsWith('/filter-index')) return route.fulfill({ json: {} })
    return route.fulfill({ json: [] })
  })
  await page.goto('http://localhost:5173/booking/timer-show')
  await page.getByRole('button', { name: 'A1', exact: true }).click()
  await page.getByRole('button', { name: 'Giữ ghế 5 phút' }).click()
  const timer = page.locator('b').filter({ hasText: /^\d{2}:\d{2}$/ })
  await expect(timer).toHaveText('05:00')
  await page.clock.fastForward(60000)
  await expect(timer).toHaveText('04:00')
  await page.getByRole('button', { name: 'Chọn bắp nước →' }).click()
  await expect(page).toHaveURL(/\/combo$/)
  await expect(timer).toHaveText('04:00')
  await page.clock.fastForward(20000)
  await expect(timer).toHaveText('03:40')
  await page.getByRole('button', { name: 'Tăng' }).first().click()
  await expect(timer).toHaveText('03:40')
  await page.getByRole('button', { name: 'Tiếp tục thanh toán' }).click()
  await expect(page).toHaveURL(/\/payment$/)
  await expect(timer).toHaveText('03:40')
  await page.clock.fastForward(20000)
  await expect(timer).toHaveText('03:20')
  await page.goBack()
  await expect(timer).toHaveText('03:20')
  await page.reload()
  await expect(timer).toHaveText('03:20')
  await page.getByRole('link', { name: 'Quay lại chọn ghế' }).click()
  await expect(timer).toHaveText('03:20')
  await expect(page.getByRole('button', { name: 'Chọn bắp nước →' })).toBeEnabled()
  await page.getByRole('button', { name: 'Chọn bắp nước →' }).click()
  await page.clock.fastForward(201000)
  await expect(page).toHaveURL('http://localhost:5173/booking/timer-show')
  expect(holdRequests).toBe(1)
  expect(errors).toEqual([])
})
