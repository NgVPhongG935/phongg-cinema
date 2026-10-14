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
  // The clock continues during navigation and loading, so allow elapsed real seconds.
  const expectRemaining = async (maximum: number) => {
    await expect.poll(async () => {
      const text = await timer.textContent()
      const parts = text?.split(':').map(Number)
      const seconds = parts ? parts[0] * 60 + parts[1] : -1
      return seconds <= maximum && seconds >= maximum - 20
    }).toBe(true)
  }
  await expectRemaining(300)
  await page.clock.fastForward(60000)
  await expectRemaining(240)
  await page.getByRole('button', { name: 'Chọn bắp nước →' }).click()
  await expect(page).toHaveURL(/\/combo$/)
  await expectRemaining(240)
  await page.clock.fastForward(20000)
  await expectRemaining(220)
  await page.getByRole('button', { name: 'Tăng' }).first().click()
  await expectRemaining(220)
  await page.getByRole('button', { name: 'Tiếp tục thanh toán' }).click()
  await expect(page).toHaveURL(/\/payment$/)
  await expectRemaining(220)
  await page.clock.fastForward(20000)
  await expectRemaining(200)
  await page.goBack()
  await expectRemaining(200)
  await page.reload()
  await expectRemaining(200)
  await page.getByRole('link', { name: 'Quay lại chọn ghế' }).click()
  await expectRemaining(200)
  await expect(page.getByRole('button', { name: 'Chọn bắp nước →' })).toBeEnabled()
  await page.getByRole('button', { name: 'Chọn bắp nước →' }).click()
  await page.clock.fastForward(201000)
  await expect(page).toHaveURL('http://localhost:5173/booking/timer-show')
  await expect(page.locator('aside')).toContainText('Chưa chọn ghế')
  await expect(page.getByRole('button', { name: 'Giữ ghế 5 phút' })).toBeDisabled()
  expect(holdRequests).toBe(1)
  expect(errors).toEqual([])
})
