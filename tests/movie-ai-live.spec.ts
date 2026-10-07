import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';

test('live public Harry Potter results allow choosing a film when TMDB is unavailable', async ({ page }) => {
  test.skip(process.env.MOVIE_LOOKUP_LIVE !== 'true', 'Opt-in: run the real Harry Potter backend test first.');
  test.setTimeout(90_000);
  const options = JSON.parse(readFileSync('target/live-harry-potter-options.json', 'utf8'));
  const metadata = JSON.parse(readFileSync('target/live-harry-potter-result.json', 'utf8'));
  const base = process.env.QLBVXP_E2E_BASE_URL || 'http://127.0.0.1:5174';
  await page.addInitScript(() => {
    localStorage.setItem('token', 'local-live-test');
    localStorage.setItem('user', JSON.stringify({ id: 'local-preview', role: 'ADMIN', hoTen: 'Live Tester' }));
  });
  const requests: any[] = [];
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/ai/movie-options')) await route.fulfill({ json: options });
    else if (path.endsWith('/ai/generate-movie-info')) {
      requests.push(route.request().postDataJSON()); await route.fulfill({ json: metadata });
    } else if (path.endsWith('/movies')) await route.fulfill({ json: { content: [] } });
    else await route.fulfill({ json: [] });
  });
  await page.goto(`${base}/admin/movies`);
  await page.getByRole('button', { name: 'Thêm phim', exact: true }).click();
  await page.locator('#title').fill('harry potter');
  await page.getByRole('button', { name: 'AI soạn thông tin' }).click();
  await expect(page.locator('#phimTraCuu option')).toHaveCount(8);
  await page.locator('#phimTraCuu').selectOption(String(options[0].id));
  await page.getByRole('button', { name: 'Lấy thông tin phim' }).click();
  await expect(page.locator('#title')).toHaveValue("Harry Potter and the Philosopher's Stone");
  await expect(page.locator('#duration')).toHaveValue('152');
  await expect(page.locator('#director')).toHaveValue('Chris Columbus');
  await expect(page.locator('#genres')).toHaveValue(/Giả tưởng/);
  expect(requests).toEqual([{ title: "Harry Potter and the Philosopher's Stone" }]);
  const poster = page.getByAltText('Xem trước poster');
  await poster.scrollIntoViewIfNeeded();
  await expect.poll(() => poster.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 100), { timeout: 30_000 }).toBe(true);
  await expect(poster).not.toHaveAttribute('src', /picsum|placehold/);
  await page.screenshot({ path: `${process.env.TEMP}/qlbvxp-live-harry-potter.png`, fullPage: true });
  console.log('LIVE_HARRY_POTTER_BROWSER_VERIFIED: 8 actual film choices, selected film metadata, actual poster loaded, no TMDB ID sent.');
});

test('live public movie: Incredibles 2 loads real metadata and poster despite TMDB failure', async ({ page }) => {
  test.skip(process.env.MOVIE_LOOKUP_LIVE !== 'true', 'Opt-in: run LiveMovieLookupTest first. No API keys are used.');
  test.setTimeout(150_000);
  const base = process.env.QLBVXP_E2E_BASE_URL || 'http://127.0.0.1:5174';
  const resultPath = 'target/live-movie-result.json';
  expect(Date.now() - statSync(resultPath).mtimeMs).toBeLessThan(60 * 60 * 1000);
  const realMetadata = JSON.parse(readFileSync(resultPath, 'utf8'));
  await page.addInitScript(() => {
    localStorage.setItem('token', 'local-live-test');
    localStorage.setItem('user', JSON.stringify({ id: 'local-preview', role: 'ADMIN', hoTen: 'Live Tester' }));
  });
  await page.route('**/api/v1/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname.endsWith('/ai/movie-options')) {
      await route.fulfill({ status: 502, json: { message: 'TMDB is unavailable in this public-source test' } });
      return;
    }
    if (url.pathname.endsWith('/ai/generate-movie-info')) {
      await route.fulfill({ json: realMetadata });
      return;
    }
    if (url.pathname.endsWith('/movies')) {
      await route.fulfill({ json: { content: [{ id: 'live-test', title: 'The Incredibles 2', duration: 118, genres: ['Animation'], actors: [], ageRating: 'P', status: 'SHOWING', posterUrl: '', trailerUrl: '' }] } });
    } else await route.fulfill({ json: [] });
  });
  await page.goto(`${base}/admin/movies`);
  await page.locator('tbody tr').first().locator('td').last().locator('button').first().click();
  await page.getByRole('button', { name: 'AI soạn thông tin' }).click();
  await expect(page.locator('#director')).toHaveValue('Brad Bird', { timeout: 120_000 });
  await expect(page.locator('#duration')).toHaveValue('118');
  await expect(page.locator('#actors')).toHaveValue(/Holly Hunter/);
  await expect(page.locator('#description')).toHaveValue(/Incredibles 2/);
  await expect(page.locator('#posterUrl')).toHaveValue(/^https:\/\/upload\.wikimedia\.org\//);
  await expect(page.locator('#trailerUrl')).toHaveValue('https://www.youtube.com/watch?v=i5qOzqD9Rms');
  const poster = page.getByAltText('Xem trước poster');
  await poster.scrollIntoViewIfNeeded();
  await poster.scrollIntoViewIfNeeded();
  await expect(poster).toBeVisible();
  await expect.poll(() => poster.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 100), { timeout: 30_000 }).toBe(true);
  await expect(poster).not.toHaveAttribute('src', /picsum|placehold/);
  await page.getByRole('button', { name: 'Xem thử trailer' }).click();
  const trailer = page.getByRole('dialog', { name: 'Trailer The Incredibles 2' });
  await expect(trailer.locator('iframe')).toHaveAttribute('src', /\/embed\/i5qOzqD9Rms\?/);
  await expect(trailer.getByRole('link', { name: 'Xem trên YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=i5qOzqD9Rms');
  await trailer.getByRole('button', { name: 'Đóng cửa sổ' }).click();
  await page.screenshot({ path: process.env.MOVIE_LOOKUP_SCREENSHOT || `${process.env.TEMP}/qlbvxp-live-incredibles.png`, fullPage: true });
  console.log('LIVE_BROWSER_VERIFIED: metadata captured from real backend/Wikipedia + poster loaded over network. No database writes.');
});
