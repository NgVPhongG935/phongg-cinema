import apiClient from './apiClient'

export const layTongQuanAdmin = () => apiClient.get('/admin/dashboard').then((phanHoi) => phanHoi.data)
