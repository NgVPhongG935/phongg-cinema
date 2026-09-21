import apiClient from './apiClient'

export const layTongQuanAdmin = () => apiClient.get('/admin/dashboard').then((phanHoi) => phanHoi.data)

export const layTomTatAdmin = () => apiClient.get('/admin/dashboard/summary').then((phanHoi) => phanHoi.data)

export const layBieuDoAdmin = () => apiClient.get('/admin/dashboard/charts').then((phanHoi) => phanHoi.data)

export const layHoatDongAdmin = () => apiClient.get('/admin/dashboard/activity').then((phanHoi) => phanHoi.data)
