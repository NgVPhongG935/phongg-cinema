import apiClient from './apiClient'

export const layDanhSachPhim = (thamSo = {}) => apiClient.get('/movies', { params: thamSo }).then((phanHoi) => phanHoi.data)
export const layChiTietPhim = (id) => apiClient.get(`/movies/${id}`).then((phanHoi) => phanHoi.data)
export const themPhim = (duLieu) => apiClient.post('/movies/admin', duLieu).then((phanHoi) => phanHoi.data)
export const capNhatPhim = (id, duLieu) => apiClient.put(`/movies/admin/${id}`, duLieu).then((phanHoi) => phanHoi.data)
export const xoaPhim = (id) => apiClient.delete(`/movies/admin/${id}`).then((phanHoi) => phanHoi.data)

export const dongBoAiHangLoatPhim = () => {
  console.log('[movieService] Calling AI Batch Sync URL -> /movies/ai-batch-sync')
  return apiClient.post('/movies/ai-batch-sync').then((phanHoi) => phanHoi.data)
}

export const dongBoAiChoPhim = (id) => {
  console.log(`[movieService] Calling Single Movie AI Sync URL -> /movies/ai-sync/${id}`)
  return apiClient.post(`/movies/ai-sync/${id}`).then((phanHoi) => phanHoi.data)
}

// English aliases
export const getMovies = layDanhSachPhim
export const getMovieById = layChiTietPhim
export const createMovie = themPhim
export const updateMovie = capNhatPhim
export const deleteMovie = xoaPhim
export const syncAllMoviesAi = dongBoAiHangLoatPhim
export const syncMovieAi = dongBoAiChoPhim

const movieService = {
  layDanhSachPhim,
  layChiTietPhim,
  themPhim,
  capNhatPhim,
  xoaPhim,
  dongBoAiHangLoatPhim,
  dongBoAiChoPhim,
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  syncAllMoviesAi,
  syncMovieAi,
}

export default movieService
