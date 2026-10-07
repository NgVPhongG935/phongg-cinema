import apiClient from './apiClient'

export const guiCauHoiToiAi = (userMessage, ngauCanh = {}) =>
  apiClient.post('/ai/chat', { userMessage, ...ngauCanh }, { timeout: 180000 }).then((phanHoi) => phanHoi.data)

export const taoThongTinPhimAi = (title, tmdbId = null, config = {}) =>
  apiClient.post('/ai/generate-movie-info', { title, ...(tmdbId != null ? { tmdbId } : {}) }, { timeout: 180000, ...config }).then((phanHoi) => phanHoi.data)

export const timLuaChonPhimAi = (title) =>
  apiClient.get('/ai/movie-options', { params: { title } }).then((r) => ({ options: Array.isArray(r.data) ? r.data : [], warning: '' })).catch((error) => {
    const status = error.response?.status
    if (status === 404) return { options: [], warning: '' }
    if (!status || status >= 500) return { options: [], warning: 'Nguồn TMDB chưa phản hồi; đã thử tra cứu bằng nguồn dự phòng.' }
    throw error
  })

export const chatWithAi = guiCauHoiToiAi
export const generateMovieInfo = taoThongTinPhimAi

const aiService = {
  guiCauHoiToiAi,
  taoThongTinPhimAi,
  chatWithAi,
  generateMovieInfo,
}

export default aiService
