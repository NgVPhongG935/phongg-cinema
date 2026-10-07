import { test, expect } from '@playwright/test';

const base = process.env.QLBVXP_E2E_BASE_URL || 'http://127.0.0.1:5173';
const movie = {
  id: 'movie1', title: 'Ratatouille', duration: 111, genres: ['Animation', 'Comedy'],
  actors: ['Patton Oswalt'], director: 'Brad Bird', language: 'English', ageRating: 'P',
  description: 'Original plot', posterUrl: 'https://image.tmdb.org/t/p/w500/original.jpg',
  trailerUrl: 'https://www.youtube.com/watch?v=abcdefghijk', status: 'SHOWING', rating: 8,
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
    localStorage.setItem('user', JSON.stringify({ id: 'preview', hoTen: 'Admin Preview', role: 'ADMIN' }));
  });
  await page.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = [];
    if (path.endsWith('/reviews/summary')) data = { diemTrungBinh: 0, soLuong: 0 };
    else if (path.endsWith('/reviews')) data = { content: [] };
    else if (path.endsWith('/movies/movie1')) data = movie;
    else if (path.endsWith('/movies')) data = { content: [movie], totalPages: 1, totalElements: 1 };
    await route.fulfill({ json: data });
  });
  await page.route('https://www.youtube-nocookie.com/**', route => route.fulfill({ contentType: 'text/html', body: '<html>Video preview</html>' }));
});

async function edit(page: import('@playwright/test').Page) {
  await page.goto(`${base}/admin/movies`);
  await page.locator('tbody tr').first().locator('td').last().locator('button').first().click();
}

test('AI preserves existing fields; preview and normalized save work', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/v1/ai/generate-movie-info', route => route.fulfill({ json: {
    duration: 0, genres: [], actors: [], posterUrl: 'https://picsum.photos/seed/cinema322/300/450',
    trailerUrl: 'https://youtube.com/results?search_query=Ratatouille',
  } }));
  const saved: any[] = [];
  await page.route('**/api/v1/movies/admin/movie1', async route => {
    saved.push(route.request().postDataJSON());
    await route.fulfill({ json: movie });
  });
  await edit(page);
  await page.getByRole('button', { name: 'AI soạn thông tin' }).click();
  await expect(page.getByRole('button', { name: 'AI soạn thông tin' })).toBeEnabled();
  await expect(page.locator('#posterUrl')).toHaveValue(movie.posterUrl);
  await expect(page.locator('#trailerUrl')).toHaveValue(movie.trailerUrl);
  await expect(page.locator('#duration')).toHaveValue('111');
  await expect(page.locator('#actors')).toHaveValue('Patton Oswalt');
  await expect(page.locator('#genres')).toHaveValue('Animation, Comedy');
  await page.locator('#trailerUrl').fill('https://youtube.com/results?search_query=Trailer');
  await page.locator('form button[type=submit]').click();
  await expect(page.getByText('Trailer phải là link video YouTube, không phải link tìm kiếm. Bạn có thể để trống nếu chưa có.', { exact: true })).toBeVisible();
  expect(saved).toHaveLength(0);
  await page.locator('#trailerUrl').fill('https://youtu.be/abcdefghij2?si=shared');
  await page.getByRole('button', { name: 'Xem thử trailer' }).click();
  const trailer = page.getByRole('dialog', { name: 'Trailer Ratatouille' });
  await expect(trailer.locator('iframe')).toHaveAttribute('src', /\/embed\/abcdefghij2\?/);
  await expect(trailer.getByRole('link', { name: 'Xem trên YouTube' })).toHaveAttribute('href', 'https://www.youtube.com/watch?v=abcdefghij2');
  await trailer.getByRole('button', { name: 'Đóng cửa sổ' }).click();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
  await page.locator('form button[type=submit]').click();
  await expect(page.locator('#trailerUrl')).toHaveCount(0);
  expect(saved[0].trailerUrl).toBe('https://www.youtube.com/watch?v=abcdefghij2');
  expect(errors).toEqual([]);
});

test('bulk AI updates preserve actors, genres, title and rating when fields are missing', async ({ page }) => {
  await page.route('**/api/v1/ai/generate-movie-info', route => route.fulfill({ json: { title: 'Wrong movie', description: 'Updated plot', actors: [], genres: [] } }));
  const saved: any[] = [];
  await page.route('**/api/v1/movies/admin/movie1', async route => {
    saved.push(route.request().postDataJSON()); await route.fulfill({ json: movie });
  });
  await page.goto(`${base}/admin/movies`);
  await page.locator('tbody tr').first().waitFor();
  await page.locator('main button[title^="AI"]').click();
  await expect(page.getByText(/Đã xử lý 1\/1: lưu 1, bỏ qua 0, lỗi 0/)).toBeVisible();
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ title: movie.title, actors: movie.actors, genres: movie.genres, rating: movie.rating, description: 'Updated plot' });
});

test('missing trailer provides a YouTube search for this film', async ({ page }) => {
  await page.route('**/api/v1/movies/movie1', route => route.fulfill({ json: { ...movie, trailerUrl: '' } }));
  await page.goto(`${base}/movies/movie1`);
  await page.getByRole('button', { name: 'Tìm Trailer' }).click();
  const trailer = page.getByRole('dialog', { name: 'Trailer Ratatouille' });
  await expect(trailer.locator('iframe')).toHaveCount(0);
  const link = trailer.getByRole('link', { name: 'Tìm trailer trên YouTube' });
  await expect(link).toBeVisible();
  expect(new URL((await link.getAttribute('href'))!).searchParams.get('search_query')).toBe('Ratatouille official trailer');
  await expect(link).toHaveAttribute('target', '_blank');
});

test('opening a movie removes its stored random poster and AI can replace it', async ({ page }) => {
  await page.route('**/api/v1/movies?**', route => route.fulfill({ json: { content: [{ ...movie, title: 'The Dark Knight', posterUrl: 'https://picsum.photos/seed/cinema648/300/450' }] } }));
  await page.route('**/api/v1/ai/generate-movie-info', route => route.fulfill({ json: { posterUrl: 'https://upload.wikimedia.org/wikipedia/en/8/8a/Dark_Knight.jpg' } }));
  await edit(page);
  await expect(page.locator('#posterUrl')).toHaveValue('');
  await expect(page.getByText(/Poster cũ là ảnh ngẫu nhiên/)).toBeVisible();
  await page.getByRole('button', { name: 'AI soạn thông tin' }).click();
  await expect(page.locator('#posterUrl')).toHaveValue('https://upload.wikimedia.org/wikipedia/en/8/8a/Dark_Knight.jpg');
  await expect(page.locator('img[src*="picsum.photos"]')).toHaveCount(0);
});

test('late AI response cannot overwrite a different title', async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  let started!: () => void;
  const ready = new Promise<void>(resolve => { started = resolve; });
  await page.route('**/api/v1/ai/generate-movie-info', async route => {
    started(); await pending;
    await route.fulfill({ json: { duration: 999, director: 'Wrong director', description: 'Wrong plot' } });
  });
  await edit(page);
  await page.getByRole('button', { name: 'AI soạn thông tin' }).click();
  await ready;
  await page.locator('#title').fill('Another movie');
  const response = page.waitForResponse('**/api/v1/ai/generate-movie-info');
  release(); await response;
  await expect(page.locator('#director')).toHaveValue('Brad Bird');
  await expect(page.locator('#description')).toHaveValue('Original plot');
});

test('Harry Potter query offers individual films and fills the selected film by TMDB ID', async ({ page }) => {
  await page.route('**/api/v1/ai/movie-options?**', route => route.fulfill({ json: [
    { id: 671, title: "Harry Potter and the Philosopher's Stone", originalTitle: "Harry Potter and the Philosopher's Stone", year: '2001' },
    { id: 672, title: 'Harry Potter and the Chamber of Secrets', originalTitle: 'Harry Potter and the Chamber of Secrets', year: '2002' },
  ] }));
  const generated: any[] = [];
  await page.route('**/api/v1/ai/generate-movie-info', async route => {
    generated.push(route.request().postDataJSON());
    await route.fulfill({ json: { duration: 161, genre: 'Fantasy, Adventure', director: 'Chris Columbus', posterUrl: 'https://image.tmdb.org/t/p/w500/selected.jpg', trailerUrl: 'https://youtu.be/abcdefghij2' } });
  });
  await edit(page);
  await page.locator('#title').fill('harry potter');
  await page.getByRole('button', { name: 'AI soạn thông tin' }).click();
  await expect(page.locator('#phimTraCuu')).toBeVisible();
  await expect(page.locator('#phimTraCuu option')).toHaveCount(2);
  expect(generated).toHaveLength(0);
  await page.locator('#phimTraCuu').selectOption('672');
  await page.getByRole('button', { name: 'Lấy thông tin phim' }).click();
  await expect(page.locator('#title')).toHaveValue('Harry Potter and the Chamber of Secrets');
  await expect(page.locator('#duration')).toHaveValue('161');
  await expect(page.locator('#posterUrl')).toHaveValue('https://image.tmdb.org/t/p/w500/selected.jpg');
  expect(generated).toEqual([{ title: 'Harry Potter and the Chamber of Secrets', tmdbId: 672 }]);
});

test('lookup connection errors still allow fallback metadata and preserve the poster', async ({ page }) => {
  await page.route('**/api/v1/ai/movie-options?**', route => route.fulfill({ status: 502, json: { message: 'Nguồn tra cứu phim từ chối yêu cầu (401). Kiểm tra TMDB_API_KEY.' } }));
  await page.route('**/api/v1/ai/generate-movie-info', route => route.fulfill({ json: { description: 'Fallback plot', director: 'Brad Bird' } }));
  await edit(page);
  await page.getByRole('button', { name: 'AI soạn thông tin' }).click();
  await expect(page.getByText(/Nguồn TMDB chưa phản hồi/)).toBeVisible();
  await expect(page.locator('#description')).toHaveValue('Fallback plot');
  await expect(page.locator('#director')).toHaveValue('Brad Bird');
  await expect(page.locator('#duration')).toHaveValue('111');
  await expect(page.locator('#posterUrl')).toHaveValue(movie.posterUrl);
});
