/** Mã QR vé — format thống nhất PHONGG:{id} để soát vé ổn định */
export const taoMaQrVe = (maVe) => (maVe ? `PHONGG:${maVe}` : '')

export const chuanHoaMaQuet = (raw) => {
  const s = (raw || '').trim()
  if (!s) return ''
  if (s.startsWith('PHONGG:')) return s.slice(7).trim()
  if (s.toUpperCase().startsWith('PHONGG-')) return s.replace(/^PHONGG-VE-?/i, '').trim()
  const url = s.match(/tickets?\/([a-fA-F0-9-]+)/i)
  if (url) return url[1]
  const uuid = s.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}/)
  if (uuid) return uuid[0]
  const mongo = s.match(/\b[0-9a-fA-F]{24}\b/)
  if (mongo) return mongo[0]
  return s
}
