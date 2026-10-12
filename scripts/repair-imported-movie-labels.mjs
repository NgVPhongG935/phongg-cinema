import { readFileSync, writeFileSync } from 'node:fs'
const dataPath = new URL('../data/wikidata-movies.json', import.meta.url)
const reportPath = new URL('../data/wikidata-import-result.json', import.meta.url)
const movies = JSON.parse(readFileSync(dataPath, 'utf8'))
const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const fixes = report.imported.filter(m => /^Q\d+$/.test(m.title))
if (fixes.length) {
  async function request(path, options = {}) {
    const response = await fetch(report.api + path, { ...options, signal: AbortSignal.timeout(60000) })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
  const login = await request('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.CINEMA_ADMIN_EMAIL || 'admin@gmail.com', matKhau: process.env.CINEMA_ADMIN_PASSWORD || '123456' }) })
  if (!login.token) throw new Error('No admin token')
  for (const item of fixes) {
    const source = movies.find(m => m.sourceId === item.sourceId)
    const title = decodeURIComponent(new URL(source.articleUrl).pathname.split('/wiki/')[1]).replaceAll('_', ' ').replace(/ \((?:\d{4} )?film\)$/, '')
    const current = await request(`/movies/${item.id}`)
    if (current.title !== item.title) throw new Error('Movie was edited since import; skipping repair')
    await request(`/movies/admin/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` }, body: JSON.stringify({ ...current, title }) })
    const saved = await request(`/movies/${item.id}`)
    if (saved.title !== title) throw new Error('Repair verification failed')
    item.title = title; source.title = title
    console.log(`Repaired: ${title}`)
  }
  writeFileSync(dataPath, JSON.stringify(movies, null, 2))
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
}
console.log(`Verified import report: ${report.imported.length} movies`)
