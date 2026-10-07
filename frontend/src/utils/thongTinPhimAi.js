import { layVideoIdYoutube } from './chuyenLinkYoutube.js'

const text = (value) => {
  if (typeof value !== 'string') return ''
  const result = value.trim()
  return /^(đang cập nhật|chưa cập nhật|unknown|n\/a|null)$/i.test(result) ? '' : result
}
const list = (value) => (Array.isArray(value) ? value : String(value || '').split(',')).map(text).filter(Boolean)

export function posterAiHopLe(value) {
  try {
    const url = new URL(text(value))
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return ''
    if (/(^|\.)(picsum\.photos|placehold\.co|via\.placeholder\.com)$/.test(url.hostname)) return ''
    return url.pathname && url.pathname !== '/' && !url.href.includes('...') ? url.href : ''
  } catch { return '' }
}

export function trailerAiHopLe(value) {
  const id = layVideoIdYoutube(value)
  return id ? `https://www.youtube.com/watch?v=${id}` : ''
}

export function xoaPosterNgauNhien(phim) {
  try {
    const host = new URL(phim.posterUrl).hostname
    if (/(^|\.)(picsum\.photos|placehold\.co|via\.placeholder\.com)$/.test(host)) return { ...phim, posterUrl: '' }
  } catch { /* Relative upload paths and empty values are preserved. */ }
  return { ...phim }
}

/** Merge only usable fields; missing AI data must not erase existing metadata. */
export function gopThongTinPhimAi(phim, ai = {}, form = false) {
  const sanitized = xoaPosterNgauNhien(phim)
  if (typeof ai.canhBao === 'string' && ai.canhBao.startsWith('Dữ liệu tự động điền.')) {
    return { duLieu: sanitized, coDuLieu: false, canhBao: 'Nguồn AI trả về dữ liệu dự phòng chưa xác thực. Đã loại bỏ poster ngẫu nhiên nếu có; cần cập nhật backend trước khi đồng bộ.' }
  }
  const next = sanitized
  const fields = []
  const put = (key, value) => { if (value !== '' && value != null) { next[key] = value; fields.push(key) } }
  const duration = Number(ai.duration)
  if (Number.isInteger(duration) && duration > 0 && duration <= 600) put('duration', duration)
  for (const [key, value] of [['genres', ai.genres || ai.genre], ['actors', ai.actors]]) {
    const items = list(value)
    if (items.length) put(key, form ? items.join(', ') : items)
  }
  for (const key of ['director', 'description', 'language']) put(key, text(ai[key]))
  const age = text(ai.ageRating).toUpperCase().replace(/^C(?=13|16|18)/, 'T')
  if (['P', 'T13', 'T16', 'T18'].includes(age)) put('ageRating', age)
  put('posterUrl', posterAiHopLe(ai.posterUrl))
  put('trailerUrl', trailerAiHopLe(ai.trailerUrl))
  const warnings = [text(ai.canhBao)]
  if (sanitized.posterUrl !== phim.posterUrl) warnings.push('Đã loại bỏ poster ngẫu nhiên được lưu trước đây. Cần tra cứu lại poster của phim.')
  if (text(ai.posterUrl) && !posterAiHopLe(ai.posterUrl)) warnings.push('Đã bỏ qua poster không hợp lệ; giữ nguyên poster hiện có.')
  if (text(ai.trailerUrl) && !trailerAiHopLe(ai.trailerUrl)) warnings.push('Đã bỏ qua trailer không hợp lệ; giữ nguyên trailer hiện có.')
  if (!fields.length) warnings.push('Không tìm được thông tin phù hợp để cập nhật; dữ liệu hiện có được giữ nguyên.')
  return { duLieu: next, coDuLieu: fields.length > 0, canhBao: warnings.filter(Boolean).join(' ') }
}
