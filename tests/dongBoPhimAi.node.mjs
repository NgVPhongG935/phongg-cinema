import test from 'node:test'
import assert from 'node:assert/strict'
import { taoPayloadDongBo, layTatCaPhimDongBo, chayDongBoPhim } from '../frontend/src/utils/dongBoPhimAi.js'
const movie = (id) => ({ id, title: `Film ${id}`, duration: 118, actors: ['Existing actor'], genres: ['Animation'], status: 'SHOWING', rating: 8 })

test('legacy search trailers are cleared; valid fields survive; aliases are not sent', () => {
  const input = { ...movie('a'), trailerUrl: 'https://youtube.com/results?search_query=Film', duongDanTrailer: 'https://youtube.com/results?search_query=Film', posterUrl: 'https://picsum.photos/300/450' }
  const result = taoPayloadDongBo(input, { director: 'Actual director' })
  assert.equal(result.payload.trailerUrl, '')
  assert.equal(result.payload.posterUrl, '')
  assert.equal(result.payload.duongDanTrailer, undefined)
  assert.deepEqual(result.payload.actors, input.actors)
  assert.deepEqual(result.payload.genres, input.genres)
  assert.equal(result.payload.rating, 8)
  assert.equal(input.trailerUrl, 'https://youtube.com/results?search_query=Film')
  assert.equal(result.coDuLieu, true)
})

test('valid old trailer is preserved and normalized when AI lacks one', () => {
  const result = taoPayloadDongBo({ ...movie('a'), trailerUrl: 'https://youtu.be/abcdefghijk?si=shared' }, { description: 'New plot' })
  assert.equal(result.payload.trailerUrl, 'https://www.youtube.com/watch?v=abcdefghijk')
})

test('all 300 movies are collected across pages with duplicate IDs deduplicated', async () => {
  const pages = []
  const rows = await layTatCaPhimDongBo(async ({ page }) => {
    pages.push(page)
    const content = Array.from({ length: 100 }, (_, index) => movie(String(page * 100 + index)))
    if (page > 0) content.push(movie('0'))
    return { content, totalPages: 3 }
  })
  assert.equal(rows.length, 300)
  assert.deepEqual(pages, [0, 1, 2])
})

test('page failure prevents writes rather than updating an incomplete subset', async () => {
  let writes = 0
  const result = await chayDongBoPhim({ loadPage: async ({ page }) => {
    if (page === 1) throw new Error('Page unavailable')
    return { content: [movie('a')], totalPages: 2 }
  }, generate: async () => ({ description: 'Plot' }), save: async () => { writes++ }, delayMs: 0 })
  assert.equal(result.phase, 'failed')
  assert.equal(writes, 0)
})

test('updated, skipped, failed and processed counts remain accurate', async () => {
  const writes = []
  const result = await chayDongBoPhim({ loadPage: async () => [movie('a'), movie('b'), movie('c'), { ...movie('d'), trailerUrl: 'https://youtube.com/results?search_query=Film' }],
    generate: async (title) => title === 'Film b' || title === 'Film d' ? {} : { director: 'Director' },
    save: async (id, payload) => { if (id === 'c') throw new Error('Database failure'); writes.push({ id, payload }) }, delayMs: 0 })
  assert.equal(result.phase, 'completed')
  assert.deepEqual([result.daXong, result.daLuu, result.boQua, result.loi], [4, 2, 1, 1])
  assert.equal(result.phanTram, 100)
  assert.equal(writes[1].payload.trailerUrl, '')
})

test('stop during metadata read saves nothing and never logs completion', async () => {
  const controller = new AbortController()
  let ready
  const started = new Promise((resolve) => { ready = resolve })
  let writes = 0
  const pending = chayDongBoPhim({ loadPage: async () => [movie('a'), movie('b')], signal: controller.signal,
    generate: async (title, id, { signal }) => new Promise((resolve, reject) => { signal.addEventListener('abort', () => reject(new Error('Cancelled'))); ready() }),
    save: async () => { writes++ }, delayMs: 0 })
  await started
  controller.abort()
  const result = await pending
  assert.equal(result.phase, 'stopped')
  assert.equal(result.daXong, 0)
  assert.equal(writes, 0)
  assert.ok(!result.danhSachLog.some((message) => message.startsWith('🎉')))
})

test('stop during a pending save counts the committed result and prevents the next film', async () => {
  const controller = new AbortController()
  let ready, complete
  const started = new Promise((resolve) => { ready = resolve })
  let generated = 0
  const pending = chayDongBoPhim({ loadPage: async () => [movie('a'), movie('b')], signal: controller.signal,
    generate: async () => { generated++; return { director: 'Director' } },
    save: async () => new Promise((resolve) => { complete = resolve; ready() }), delayMs: 0 })
  await started
  controller.abort()
  complete()
  const result = await pending
  assert.deepEqual([result.phase, result.daXong, result.daLuu, generated], ['stopped', 1, 1, 1])
})

test('lost authorization stops subsequent saves', async () => {
  let writes = 0
  const result = await chayDongBoPhim({ loadPage: async () => [movie('a'), movie('b')], generate: async () => ({ director: 'Director' }),
    save: async () => { writes++; throw Object.assign(new Error('Forbidden'), { response: { status: 403 } }) }, delayMs: 0 })
  assert.equal(result.phase, 'failed')
  assert.equal(writes, 1)
})

test('stop during a failed save counts its failure and prevents the next film', async () => {
  const controller = new AbortController()
  let ready, fail
  const started = new Promise((resolve) => { ready = resolve })
  let generated = 0
  const pending = chayDongBoPhim({ loadPage: async () => [movie('a'), movie('b')], signal: controller.signal,
    generate: async () => { generated++; return { director: 'Director' } },
    save: async () => new Promise((resolve, reject) => { fail = reject; ready() }), delayMs: 0 })
  await started
  controller.abort()
  fail(new Error('Save failed'))
  const result = await pending
  assert.deepEqual([result.phase, result.daXong, result.daLuu, result.loi, generated], ['stopped', 1, 0, 1, 1])
})
