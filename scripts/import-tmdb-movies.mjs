import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const api = process.env.CINEMA_API_URL || 'https://phongg-cinema-api.onrender.com/api/v1'
const limit = Number(process.env.TMDB_IMPORT_LIMIT || 20)
if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('TMDB_IMPORT_LIMIT must be 1..100')
let local = ''
try { local = readFileSync(new URL('../tmdb.local.cmd', import.meta.url), 'utf8') } catch {}
const key = process.env.TMDB_API_KEY || local.match(/set\s+"?TMDB_API_KEY=([^"\r\n]+)/i)?.[1]?.trim()
if (!key) throw new Error('Missing TMDB_API_KEY')
async function json(url, options = {}) {
  let response
  try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(120000) }) }
  catch { throw new Error(`Cannot connect to ${new URL(url).hostname}. Check network/DNS and whether the backend is running.`) }
  if (!response.ok) throw new Error(`Request failed: HTTP ${response.status}`)
  return response.json()
}
function tmdb(path, params = {}) {
  const url = new URL(`https://api.themoviedb.org/3${path}`)
  url.search = new URLSearchParams({ language: 'vi-VN', ...params, ...(key.startsWith('eyJ') ? {} : { api_key: key }) })
  return json(url, key.startsWith('eyJ') ? { headers: { Authorization: `Bearer ${key}` } } : {})
}
const normalize = title => (title || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
const image = path => path ? `https://image.tmdb.org/t/p/w500${path}` : null
const movies = []
for (let page = 1; movies.length < limit && page <= 5; page++) {
  const listing = await tmdb('/movie/popular', { page })
  for (const item of listing.results || []) {
    if (movies.length >= limit) break
    if (item.adult || !item.poster_path) continue
    const detail = await tmdb(`/movie/${item.id}`, { append_to_response: 'credits,videos,release_dates' })
    if (detail.adult || !detail.runtime) continue
    const english = !detail.overview || !detail.videos?.results?.length
      ? await tmdb(`/movie/${item.id}`, { language: 'en-US', append_to_response: 'videos' }) : null
    const video = [...(detail.videos?.results || []), ...(english?.videos?.results || [])]
      .filter(v => v.site === 'YouTube' && v.type === 'Trailer').sort((a, b) => Number(b.official) - Number(a.official))[0]
    const certificate = detail.release_dates?.results?.find(r => r.iso_3166_1 === 'VN')?.release_dates?.find(r => r.certification)?.certification || null
    movies.push({ tmdbId: detail.id, originalTitle: detail.original_title, releaseDate: detail.release_date,
      title: detail.title, description: detail.overview || english?.overview || '', duration: detail.runtime,
      genres: detail.genres.map(g => g.name), language: detail.original_language, ageRating: certificate,
      posterUrl: image(detail.poster_path), trailerUrl: video ? `https://www.youtube.com/watch?v=${video.key}` : null,
      director: detail.credits?.crew?.filter(c => c.job === 'Director').map(c => c.name).join(', ') || '',
      actors: detail.credits?.cast?.slice(0, 8).map(c => c.name) || [], rating: detail.vote_average,
      status: 'UPCOMING' })
    console.log(`Downloaded ${movies.length}/${limit}: ${detail.title}`)
  }
}
mkdirSync(new URL('../data/', import.meta.url), { recursive: true })
writeFileSync(new URL('../data/tmdb-movies.json', import.meta.url), JSON.stringify(movies, null, 2))
if (process.argv.includes('--download-only')) process.exit(0)
const existing = []
for (let page = 0; ; page++) {
  const result = await json(`${api}/movies?size=100&page=${page}`)
  existing.push(...result.content)
  if (result.last || page + 1 >= result.totalPages) break
}
const titles = new Set(existing.map(m => normalize(m.title)))
const posters = new Set(existing.map(m => m.posterUrl).filter(Boolean))
const login = await json(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: process.env.CINEMA_ADMIN_EMAIL || 'admin@gmail.com', matKhau: process.env.CINEMA_ADMIN_PASSWORD || '123456' }) })
if (!login.token) throw new Error('Admin login returned no token')
const imported = []
for (const movie of movies) {
  if (titles.has(normalize(movie.title)) || titles.has(normalize(movie.originalTitle)) || posters.has(movie.posterUrl)) continue
  const { tmdbId, originalTitle, releaseDate, ...payload } = movie
  const saved = await json(`${api}/movies/admin`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` }, body: JSON.stringify(payload) })
  const verified = await json(`${api}/movies/${saved.id}`)
  if (verified.title !== movie.title || verified.posterUrl !== movie.posterUrl) throw new Error('Saved movie verification failed')
  titles.add(normalize(movie.title)); posters.add(movie.posterUrl)
  imported.push({ id: saved.id, tmdbId, title: saved.title })
  writeFileSync(new URL('../data/tmdb-import-result.json', import.meta.url), JSON.stringify({ api, imported, skipped: movies.length - imported.length }, null, 2))
  console.log(`Imported: ${saved.title}`)
}
console.log(JSON.stringify({ imported: imported.length, skipped: movies.length - imported.length, previousTotal: existing.length }))
