/** Poster dự phòng đẹp (TMDB) — không dùng placehold.co xám */
export const POSTER_MAC_DINH =
  'https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg'

/**
 * Lấy URL poster từ object phim — hỗ trợ nhiều tên field Backend có thể trả về.
 */
export function layUrlPosterPhim(phim) {
  if (!phim || typeof phim !== 'object') return ''
  const raw = phim.posterUrl || ''
  return typeof raw === 'string' ? raw.trim() : ''
}

/**
 * Đưa URL TMDB qua proxy backend để client vẫn xem được khi image.tmdb.org bị chặn.
 */
export function urlPosterQuaProxyBackend(urlTuyetDoi) {
  if (!urlTuyetDoi || !/^https?:\/\//i.test(urlTuyetDoi)) return urlTuyetDoi || ''
  if (!/image\.tmdb\.org/i.test(urlTuyetDoi)) return urlTuyetDoi
  return `/api/v1/media/proxy?url=${encodeURIComponent(urlTuyetDoi)}`
}

/**
 * Chuẩn hóa URL poster — hỗ trợ đường dẫn tương đối (/uploads) và TMDB w500.
 * Poster TMDB được proxy qua backend.
 */
export function chuanHoaUrlPoster(url) {
  if (!url || typeof url !== 'string') return ''
  const s = url.trim()
  if (!s) return ''

  if (s.startsWith('/')) return s

  if (!/^https?:\/\//i.test(s)) return ''

  const khopTmdb = s.match(/image\.tmdb\.org\/t\/p\/[^/]+\/(.+)$/i)
  if (khopTmdb) {
    const tmdb = `https://image.tmdb.org/t/p/w500/${khopTmdb[1]}`
    return urlPosterQuaProxyBackend(tmdb)
  }
  return s
}

/** URL hiển thị cuối cùng cho thẻ img */
export function urlPosterHienThi(phim) {
  return chuanHoaUrlPoster(layUrlPosterPhim(phim))
}

/** Xử lý onError — thử lại TMDB w500 qua proxy → poster dự phòng */
export function xuLyLoiPoster(suKien) {
  const img = suKien?.currentTarget || suKien?.target
  if (!img) return

  const goc = img.dataset.posterGoc || img.src
  if (!img.dataset.posterGoc) img.dataset.posterGoc = goc

  if (img.dataset.posterThuTmdb !== '1') {
    const tmdb = chuanHoaUrlPoster(goc.includes('image.tmdb.org') ? goc : img.dataset.posterGoc)
    if (tmdb && tmdb !== img.src) {
      img.dataset.posterThuTmdb = '1'
      img.src = tmdb
      return
    }
  }

  const fallback = urlPosterQuaProxyBackend(POSTER_MAC_DINH)
  if (img.src !== fallback && img.src !== POSTER_MAC_DINH) {
    img.src = fallback
    img.onerror = null
  }
}
