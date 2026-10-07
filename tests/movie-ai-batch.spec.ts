import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const base = process.env.QLBVXP_E2E_BASE_URL || 'http://127.0.0.1:5174';
const oldMovie = (id: string, title = `Film ${id}`) => ({ id, title, duration: 118, genres: ['Action'], actors: ['Existing actor'], director: 'Old director', language: 'English', ageRating: 'P', status: 'SHOWING', rating: 8, posterUrl: 'https://picsum.photos/300/450', trailerUrl: 'https://youtube.com/results?search_query=trailer', duongDanTrailer: 'https://youtube.com/results?search_query=trailer' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'batch-test');
    localStorage.setItem('user', JSON.stringify({ id: 'batch-test', role: 'ADMIN', hoTen: 'Batch Tester' }));
  });
});

async function setup(page: import('@playwright/test').Page, catalog: any[], generate: (title: string) => any | Promise<any>, save?: (id: string, payload: any) => Promise<void>, paginate = false) {
  const writes: any[] = [];
  const generated: string[] = [];
  let catalogRequests = 0;
  await page.route('**/api/v1/**', async route => {
    const request = route.request(), url = new URL(request.url());
    if (url.pathname.endsWith('/movies')) {
      if (url.searchParams.get('size') === '200') catalogRequests++;
      const index = Number(url.searchParams.get('page') || 0);
      await route.fulfill({ json: { content: paginate ? catalog.slice(index * 2, index * 2 + 2) : catalog, totalPages: paginate ? Math.ceil(catalog.length / 2) : 1 } });
    } else if (url.pathname.endsWith('/ai/generate-movie-info')) {
      const title = request.postDataJSON().title;
      generated.push(title);
      const data = await generate(title);
      try { await route.fulfill({ json: data }); } catch { /* Client may have cancelled a read. */ }
    } else if (request.method() === 'PUT' && url.pathname.includes('/movies/admin/')) {
      const payload = request.postDataJSON(), id = url.pathname.split('/').at(-1)!;
      if (payload.trailerUrl?.includes('results?') || payload.trailerUrl?.includes('search_query=')) {
        await route.fulfill({ status: 400, json: { message: 'Trailer phải là URL video YouTube, không phải URL tìm kiếm.' } });
        return;
      }
      try {
        await save?.(id, payload);
        writes.push({ id, payload });
        const movie = catalog.find(item => item.id === id);
        Object.assign(movie, payload);
        await route.fulfill({ json: movie });
      } catch {
        await route.fulfill({ status: 500, json: { message: 'Database test failure' } });
      }
    } else await route.fulfill({ json: [] });
  });
  await page.goto(`${base}/admin/movies`);
  await page.locator('tbody tr').first().waitFor();
  return { writes, generated, requests: () => catalogRequests };
}
const start = (page: import('@playwright/test').Page) => page.locator('main button[title^="AI"]').click();

test('all pages save with old invalid media removed and existing metadata preserved', async ({ page }) => {
  const data = await setup(page, [oldMovie('1'), oldMovie('2'), oldMovie('3')], () => ({ director: 'Actual director' }), undefined, true);
  await start(page);
  await expect(page.getByText(/Đã xử lý 3\/3: lưu 3, bỏ qua 0, lỗi 0/)).toBeVisible();
  expect(data.requests()).toBe(2);
  expect(data.writes).toHaveLength(3);
  for (const { payload } of data.writes) {
    expect(payload.trailerUrl).toBe(''); expect(payload.posterUrl).toBe('');
    expect(payload.duongDanTrailer).toBeUndefined();
    expect(payload.actors).toEqual(['Existing actor']); expect(payload.genres).toEqual(['Action']);
    expect(payload.rating).toBe(8);
  }
});

test('stop on third metadata request reports two committed saves and no completion', async ({ page }) => {
  let ready!: () => void, release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { ready = resolve; });
  const data = await setup(page, [oldMovie('1'), oldMovie('2'), oldMovie('3')], async title => {
    if (title === 'Film 3') { ready(); await pending; }
    return { director: 'Director' };
  });
  await start(page); await started;
  await page.getByRole('button', { name: 'Dừng lại', exact: true }).click();
  await expect(page.getByText(/Đã dừng sau 2\/3: lưu 2/)).toBeVisible();
  expect(data.writes).toHaveLength(2);
  await expect(page.getByText(/Đã xử lý 3\/3/)).toHaveCount(0);
  release();
});

test('stop during save waits for the committed outcome before ending', async ({ page }) => {
  let ready!: () => void, release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { ready = resolve; });
  const data = await setup(page, [oldMovie('1'), oldMovie('2')], () => ({ director: 'Director' }), async () => { ready(); await pending; });
  await start(page); await started;
  await page.getByRole('button', { name: 'Dừng lại', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đang dừng...', exact: true })).toBeDisabled();
  release();
  await expect(page.getByText(/Đã dừng sau 1\/2: lưu 1/)).toBeVisible();
  expect(data.writes).toHaveLength(1); expect(data.generated).toHaveLength(1);
});

test('save errors are counted while later movies continue', async ({ page }) => {
  const data = await setup(page, [oldMovie('1'), oldMovie('2')], () => ({ director: 'Director' }), async id => { if (id === '1') throw new Error('failure'); });
  await start(page);
  await expect(page.getByText(/Đã xử lý 2\/2: lưu 1, bỏ qua 0, lỗi 1/)).toBeVisible();
  expect(data.writes[0].id).toBe('2');
});

test('real metadata from the three reported films completes an isolated batch', async ({ page }) => {
  test.skip(process.env.MOVIE_LOOKUP_LIVE !== 'true', 'Run the public-source batch metadata test first.');
  const real = JSON.parse(readFileSync('target/live-batch-movie-data.json', 'utf8'));
  const catalog = real.map((item: any, index: number) => oldMovie(String(index), item.title));
  const data = await setup(page, catalog, title => real.find((item: any) => item.title === title).info);
  await start(page);
  await expect(page.getByText(/Đã xử lý 3\/3: lưu 3, bỏ qua 0, lỗi 0/)).toBeVisible();
  expect(data.writes).toHaveLength(3);
  for (const { payload } of data.writes) {
    expect(payload.director).not.toBe('Old director');
    expect(payload.posterUrl).toMatch(/^https:\/\/upload\.wikimedia\.org\//);
    expect(payload.trailerUrl).not.toContain('search_query');
  }
  await page.screenshot({ path: `${process.env.TEMP}/qlbvxp-live-batch.png`, fullPage: true });
});
