/**
 * Trích xuất 11 ký tự Video ID từ mọi định dạng link YouTube
 * Hỗ trợ:
 * - https://www.youtube.com/watch?v=VIDEO_ID (kèm &si=..., &t=..., ?feature=shared)
 * - https://youtu.be/VIDEO_ID?si=...
 * - https://m.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube-nocookie.com/embed/VIDEO_ID
 * - Chuỗi 11 ký tự Video ID thuần
 */
export function layVideoIdYoutube(duongDan) {
  if (!duongDan || typeof duongDan !== 'string') return null
  const s = duongDan.trim().replace(/&amp;/g, '&')

  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  try {
    const url = new URL(s)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null
    let id = null
    if (['youtu.be', 'www.youtu.be'].includes(url.hostname)) id = url.pathname.slice(1)
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(url.hostname)) {
      if (url.pathname === '/watch') id = url.searchParams.get('v')
      else if (/^\/(embed|shorts|v|e)\/[^/]+\/?$/.test(url.pathname)) id = url.pathname.split('/')[2]
    }
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
  } catch { return null }
}

/**
 * Tạo URL nhúng youtube-nocookie phát trực tiếp trên web không bị chặn cookie:
 * https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1
 */
export function getYouTubeEmbedUrl(duongDan, tuDongPhat = true) {
  if (!duongDan || typeof duongDan !== 'string') return null
  const videoId = layVideoIdYoutube(duongDan)
  if (!videoId) return null

  const params = tuDongPhat
    ? 'autoplay=1&rel=0&enablejsapi=1'
    : 'rel=0&enablejsapi=1'
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
}

/** Alias hàm tương thích ngược */
export const chuyenLinkYoutubeEmbed = getYouTubeEmbedUrl
