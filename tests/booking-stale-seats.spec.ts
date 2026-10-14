import { test, expect } from '@playwright/test'

for (const scenario of ['expired', 'booked', 'held-by-other', 'fresh'] as const) {
  test(`booking starts with no old selected seats when session is ${scenario}`, async ({ page }) => {
    let holdRequests = 0
    await page.addInitScript((scenario) => {
      localStorage.setItem('user', JSON.stringify({ id: 'seat-user', role: 'CUSTOMER' }))
      if (scenario !== 'fresh') sessionStorage.setItem('phongg-hold-v1:seat-user:seat-show', JSON.stringify({
        gheChon: ['D13', 'D15'], thoiGianHetHanMs: Date.now() + (scenario === 'expired' ? -10000 : 300000),
      }))
    }, scenario)
    await page.route('**/api/v1/**', route => {
      const path = new URL(route.request().url()).pathname
      if (path.endsWith('/hold-seats')) holdRequests++
      if (path.endsWith('/seats')) return route.fulfill({ json: { giaVeTu: 69000, danhSachGhe: ['D13', 'D15'].map(seatNumber => ({
        seatNumber, seatType: 'VIP', status: scenario === 'booked' ? 'BOOKED' : scenario === 'held-by-other' ? 'HELD' : 'AVAILABLE', heldBy: scenario === 'held-by-other' ? 'other-user' : null,
      })) } })
      return route.fulfill({ json: [] })
    })
    await page.goto('http://localhost:5173/booking/seat-show')
    await expect(page.getByRole('button', { name: 'D13', exact: true })).toBeVisible()
    await expect(page.locator('aside')).toContainText('Chưa chọn ghế')
    await expect(page.locator('aside')).not.toContainText('D13, D15')
    await expect(page.getByRole('button', { name: 'Giữ ghế 5 phút' })).toBeDisabled()
    if (scenario !== 'fresh') await expect.poll(() => page.evaluate(() => sessionStorage.getItem('phongg-hold-v1:seat-user:seat-show'))).toBeNull()
    expect(holdRequests).toBe(0)
  })
}

test('expired navigation state cannot select old seats after reloading', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('user', JSON.stringify({ id: 'seat-user', role: 'CUSTOMER' }))
    history.replaceState({ usr: { gheChon: ['D13', 'D15'], thoiGianHetHanMs: Date.now() - 10000 }, key: 'old-booking', idx: 0 }, '')
  })
  await page.route('**/api/v1/**', route => route.fulfill({ json: new URL(route.request().url()).pathname.endsWith('/seats')
    ? { giaVeTu: 69000, danhSachGhe: [{ seatNumber: 'D13', status: 'AVAILABLE' }] } : [] }))
  await page.goto('http://localhost:5173/booking/seat-show')
  await expect(page.locator('aside')).toContainText('Chưa chọn ghế')
  await expect(page.getByRole('button', { name: 'D13', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.locator('aside')).toContainText('Chưa chọn ghế')
})
