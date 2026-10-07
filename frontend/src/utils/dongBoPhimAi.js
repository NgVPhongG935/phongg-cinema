import { gopThongTinPhimAi, posterAiHopLe, trailerAiHopLe } from './thongTinPhimAi.js'

const SAVE_FIELDS = ['title', 'duration', 'genres', 'actors', 'director', 'language', 'ageRating', 'description', 'posterUrl', 'trailerUrl', 'status', 'rating', 'audioUrl', 'releaseDate']

export function taoPayloadDongBo(phim, ai) {
  const merged = gopThongTinPhimAi(phim, ai)
  const data = merged.duLieu
  const warnings = [merged.canhBao]
  let cleaned = false
  const oldTrailer = phim.trailerUrl || phim.duongDanTrailer || ''
  if (data.trailerUrl || oldTrailer) {
    const valid = trailerAiHopLe(data.trailerUrl || oldTrailer)
    if (!valid) {
      data.trailerUrl = ''
      cleaned = true
      warnings.push('Đã xóa trailer cũ không hợp lệ; chưa tìm được video thay thế.')
    } else data.trailerUrl = valid
  }
  const oldPoster = phim.posterUrl || phim.anhPoster || ''
  const poster = data.posterUrl || oldPoster
  if (poster) {
    data.posterUrl = poster.startsWith('/uploads/') ? poster : posterAiHopLe(poster)
    if (!data.posterUrl) {
      cleaned = true
      warnings.push('Đã xóa URL poster cũ không hợp lệ.')
    }
  }
  const payload = Object.fromEntries(SAVE_FIELDS.filter((key) => data[key] != null).map((key) => [key, data[key]]))
  for (const key of ['genres', 'actors']) {
    if (typeof payload[key] === 'string') payload[key] = payload[key].split(',').map((value) => value.trim()).filter(Boolean)
  }
  return { payload, coDuLieu: merged.coDuLieu || cleaned, canhBao: warnings.filter(Boolean).join(' ') }
}

export async function layTatCaPhimDongBo(loadPage, signal) {
  const movies = new Map()
  for (let page = 0; page < 10000; page += 1) {
    signal?.throwIfAborted()
    const response = await loadPage({ page, size: 200 }, { signal })
    signal?.throwIfAborted()
    const rows = Array.isArray(response) ? response : response?.content
    if (!Array.isArray(rows)) throw new Error('Danh sách phim trả về không hợp lệ; chưa bắt đầu cập nhật.')
    const previousSize = movies.size
    rows.forEach((movie, index) => movies.set(movie.id || movie._id || `missing-${page}-${index}`, movie))
    if (Array.isArray(response) || response.last === true || (Number.isInteger(response.totalPages) && page + 1 >= response.totalPages)) return [...movies.values()]
    if (!Number.isInteger(response.totalPages) && response.last !== false) return [...movies.values()]
    if (!rows.length || movies.size === previousSize) throw new Error('Không lấy được đầy đủ các trang phim; chưa bắt đầu cập nhật.')
  }
  throw new Error('Danh sách phim phân trang không hợp lệ; chưa bắt đầu cập nhật.')
}

const delay = (ms, signal) => new Promise((resolve, reject) => {
  const cancel = () => { clearTimeout(timer); reject(signal.reason || new Error('Đã dừng')) }
  const timer = setTimeout(() => { signal?.removeEventListener('abort', cancel); resolve() }, ms)
  signal?.addEventListener('abort', cancel, { once: true })
  if (signal?.aborted) cancel()
})

/** Abort reads/delays immediately. Let an in-flight save finish so its result can be counted. */
export async function chayDongBoPhim({ loadPage, generate, save, signal, onProgress, onSaved, delayMs = 1500 }) {
  const state = { phase: 'loading', tongSo: 0, daXong: 0, daLuu: 0, boQua: 0, loi: 0, phanTram: 0, phimHienTai: '', danhSachLog: ['⏳ Đang tải đầy đủ danh sách phim...'] }
  const emit = (message) => {
    if (message) state.danhSachLog.push(message)
    state.phanTram = state.tongSo ? Math.round(state.daXong / state.tongSo * 100) : 0
    onProgress?.({ ...state, danhSachLog: [...state.danhSachLog], dangChay: ['loading', 'running'].includes(state.phase) })
  }
  emit()
  try {
    const movies = await layTatCaPhimDongBo(loadPage, signal)
    state.tongSo = movies.length
    state.phase = 'running'
    emit(`🚀 Bắt đầu cập nhật ${movies.length} phim.`)
    for (const [index, movie] of movies.entries()) {
      signal?.throwIfAborted()
      const id = movie.id || movie._id
      const title = movie.title || movie.tenPhim || `Phim #${index + 1}`
      state.phimHienTai = title
      emit(`⏳ [${index + 1}/${movies.length}] Đang tìm thông tin: «${title}»...`)
      let saving = false
      try {
        if (!id) throw new Error('Phim không có mã để cập nhật.')
        const ai = await generate(title, null, { signal })
        signal?.throwIfAborted()
        const { payload, coDuLieu, canhBao } = taoPayloadDongBo(movie, ai)
        if (!coDuLieu) {
          state.boQua += 1
          state.daXong += 1
          emit(`⚠️ Bỏ qua «${title}»: ${canhBao || 'Chưa tìm được dữ liệu phù hợp.'}`)
        } else {
          saving = true
          await save(id, payload)
          state.daLuu += 1
          state.daXong += 1
          onSaved?.(id, payload)
          emit(`✅ Đã lưu «${title}». ${canhBao || ''}`)
        }
      } catch (error) {
        if (signal?.aborted && !saving) throw error
        state.loi += 1
        state.daXong += 1
        const message = error.response?.data?.message || error.message || 'Không cập nhật được phim.'
        emit(`❌ Lỗi «${title}»: ${message}`)
        if (signal?.aborted) throw error
        if ([401, 403].includes(error.response?.status)) throw error
      }
      if (state.daXong < movies.length) await delay(delayMs, signal)
    }
    state.phase = 'completed'
    emit(`🎉 Đã xử lý ${state.daXong}/${state.tongSo}: lưu ${state.daLuu}, bỏ qua ${state.boQua}, lỗi ${state.loi}.`)
  } catch (error) {
    state.phase = signal?.aborted ? 'stopped' : 'failed'
    emit(signal?.aborted ? `🛑 Đã dừng sau ${state.daXong}/${state.tongSo}: lưu ${state.daLuu}, bỏ qua ${state.boQua}, lỗi ${state.loi}.` : `❌ Dừng do lỗi: ${error.response?.data?.message || error.message}`)
  }
  state.phimHienTai = ''
  emit()
  return { ...state, danhSachLog: [...state.danhSachLog] }
}
