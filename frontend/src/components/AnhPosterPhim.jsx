import { chuanHoaUrlPoster, POSTER_MAC_DINH, xuLyLoiPoster } from '../utils/anhPosterPhim'

export default function AnhPosterPhim({
  src,
  alt = '',
  className = '',
  loading = 'lazy',
  placeholderClassName = 'flex h-full items-center justify-center bg-gradient-to-br from-cinema-900 to-fuchsia-950 text-slate-400 text-xs',
  placeholderText = 'PhongG Cinema',
}) {
  const url = chuanHoaUrlPoster(src)

  if (!url) {
    return <div className={placeholderClassName}>{placeholderText}</div>
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      loading={loading}
      decoding="async"
      onError={(e) => {
        e.currentTarget.onerror = null // BẮT BUỘC: Ngắt vòng lặp vô hạn
        e.currentTarget.src = 'https://placehold.co/300x450?text=No+Image'
      }}
    />
  )
}
