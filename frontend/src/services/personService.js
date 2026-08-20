import apiClient from './apiClient'

export const layDanhSachPersons = (params = {}) =>
  apiClient.get('/persons', { params }).then((res) => res.data)

export const layChiTietPerson = (id) =>
  apiClient.get(`/persons/${id}`).then((res) => res.data)

export const layPhimTheoPerson = (id) =>
  apiClient.get(`/persons/${id}/movies`).then((res) => res.data)

export const taoPerson = (data) =>
  apiClient.post('/persons', data).then((res) => res.data)

export const capNhatPerson = (id, data) =>
  apiClient.put(`/persons/${id}`, data).then((res) => res.data)

export const xoaPerson = (id) =>
  apiClient.delete(`/persons/${id}`).then((res) => res.data)

export const tuDongDienThongTinAi = (name) =>
  apiClient
    .post('/admin/persons/ai-fill', null, { params: { name } })
    .then((res) => res.data)

export const aiFillPerson = tuDongDienThongTinAi
