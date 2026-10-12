import { mkdirSync, writeFileSync } from 'node:fs'

const api = process.env.CINEMA_API_URL || 'https://phongg-cinema-api.onrender.com/api/v1'
const limit = Number(process.env.MOVIE_IMPORT_LIMIT || 100)
if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('MOVIE_IMPORT_LIMIT must be 1..500')
const folder = new URL('../data/', import.meta.url)
const normalize = title => (title || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
async function json(url, options = {}) {
  let response
  try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(60000), headers: { 'User-Agent': 'QLBVXP-MovieCatalog/1.0', ...options.headers } }) }
  catch { throw new Error(`Cannot connect to ${new URL(url).hostname}`) }
  if (!response.ok) throw new Error(`${new URL(url).hostname}: HTTP ${response.status}`)
  return response.json()
}
const query = `SELECT DISTINCT ?film ?filmLabel ?filmDescription ?duration ?date ?image ?article WHERE {
  ?film wdt:P31 wd:Q11424; wdt:P577 ?date; wdt:P2047 ?duration.
  FILTER(?date >= "2020-01-01T00:00:00Z"^^xsd:dateTime && ?date <= "2026-10-12T23:59:59Z"^^xsd:dateTime)
  FILTER(?duration >= 60 && ?duration <= 240)
  ?article schema:about ?film; schema:isPartOf <https://en.wikipedia.org/>.
  OPTIONAL { ?film wdt:P18 ?image. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "vi,en". }
} LIMIT ${limit * 3}`
const url = new URL('https://query.wikidata.org/sparql')
url.search = new URLSearchParams({ query, format: 'json' })
const data = await json(url)
const movies = []
const seen = new Set()
for (const row of data.results.bindings) {
  if (movies.length >= limit) break
  const sourceId = row.film.value.split('/').pop()
  if (seen.has(sourceId)) continue
  seen.add(sourceId)
  movies.push({ source: 'Wikidata', sourceId, sourceUrl: row.film.value, articleUrl: row.article.value,
    title: /^Q\d+$/.test(row.filmLabel.value) ? decodeURIComponent(new URL(row.article.value).pathname.split('/wiki/')[1]).replaceAll('_', ' ').replace(/ \((?:\d{4} )?film\)$/, '') : row.filmLabel.value,
    description: row.filmDescription?.value || '', duration: Math.round(Number(row.duration.value)),
    releaseDate: row.date.value.slice(0, 10), referenceImageUrl: row.image?.value || null,
    posterUrl: null, genres: [], actors: [], director: '', language: null, ageRating: null, rating: null, trailerUrl: null,
    status: 'UPCOMING' })
}
// Wikipedia's page image is used only when available; never invent a poster URL.
for (let offset = 0; offset < movies.length; offset += 20) {
  const batch = movies.slice(offset, offset + 20)
  const titles = batch.map(m => decodeURIComponent(new URL(m.articleUrl).pathname.split('/wiki/')[1]).replaceAll('_', ' '))
  const wiki = new URL('https://en.wikipedia.org/w/api.php')
  wiki.search = new URLSearchParams({ action: 'query', prop: 'pageimages|extracts', titles: titles.join('|'), piprop: 'original', pilicense: 'any', exintro: '1', explaintext: '1', format: 'json', redirects: '1' })
  const result = await json(wiki)
  const pages = Object.values(result.query?.pages || {})
  batch.forEach((movie, index) => {
    const redirected = result.query?.redirects?.find(r => r.from === titles[index])?.to || titles[index]
    const page = pages.find(p => normalize(p.title) === normalize(redirected))
    movie.posterUrl = page?.original?.source || null
    if (page?.extract) movie.description = page.extract
  })
  console.log(`Downloaded ${Math.min(offset + 20, movies.length)}/${movies.length}`)
}
mkdirSync(folder, { recursive: true })
writeFileSync(new URL('wikidata-movies.json', folder), JSON.stringify(movies, null, 2))
console.log(`Saved ${movies.length} movies to data/wikidata-movies.json`)
if (process.argv.includes('--download-only')) process.exit(0)
const existing = []
for (let page = 0; ; page++) {
  const result = await json(`${api}/movies?size=100&page=${page}`)
  existing.push(...result.content)
  if (result.last || page + 1 >= result.totalPages) break
}
const titles = new Set(existing.map(m => normalize(m.title)))
const posters = new Set(existing.map(m => m.posterUrl).filter(Boolean))
const candidates = movies.filter(m => !titles.has(normalize(m.title)) && !(m.posterUrl && posters.has(m.posterUrl)))
if (!candidates.length) { console.log('No new movies to import'); process.exit(0) }
const login = await json(`${api}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.CINEMA_ADMIN_EMAIL || 'admin@gmail.com', matKhau: process.env.CINEMA_ADMIN_PASSWORD || '123456' }) })
if (!login.token) throw new Error('Admin login returned no token')
const imported = []
for (const movie of candidates) {
  const { source, sourceId, sourceUrl, articleUrl, releaseDate, referenceImageUrl, ...payload } = movie
  const saved = await json(`${api}/movies/admin`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` }, body: JSON.stringify(payload) })
  const verified = await json(`${api}/movies/${saved.id}`)
  if (verified.title !== movie.title) throw new Error('Movie verification failed')
  imported.push({ id: saved.id, title: saved.title, sourceId, sourceUrl, articleUrl })
  writeFileSync(new URL('wikidata-import-result.json', folder), JSON.stringify({ api, imported }, null, 2))
  console.log(`Imported: ${saved.title}`)
}
console.log(`Imported ${imported.length} movies; skipped ${movies.length - imported.length}`)
