import apiClient from './apiClient'

export const guiCauHoiToiAi = (userMessage, ngauCanh = {}) =>
  apiClient.post('/ai/chat', { userMessage, ...ngauCanh }, { timeout: 180000 }).then((phanHoi) => phanHoi.data)

export const taoThongTinPhimAi = (title) =>
  apiClient.post('/ai/generate-movie-info', { title }, { timeout: 180000 }).then((phanHoi) => phanHoi.data)

export const chatWithAi = guiCauHoiToiAi
export const generateMovieInfo = taoThongTinPhimAi

const aiService = {
  guiCauHoiToiAi,
  taoThongTinPhimAi,
  chatWithAi,
  generateMovieInfo,
}

export default aiService
