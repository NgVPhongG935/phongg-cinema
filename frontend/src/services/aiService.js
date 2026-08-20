import apiClient from './apiClient'

export const guiCauHoiToiAi = (userMessage, ngauCanh = {}) =>
  apiClient.post('/ai/chat', { userMessage, ...ngauCanh }).then((phanHoi) => phanHoi.data)

export const taoThongTinPhimAi = (title) =>
  apiClient.post('/ai/generate-movie-info', { title }).then((phanHoi) => phanHoi.data)

export const chatWithAi = guiCauHoiToiAi
export const generateMovieInfo = taoThongTinPhimAi

const aiService = {
  guiCauHoiToiAi,
  taoThongTinPhimAi,
  chatWithAi,
  generateMovieInfo,
}

export default aiService

