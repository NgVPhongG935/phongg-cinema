import { useEffect, useState } from 'react'

const khoaPhien = (maSuat, maNguoiDung) => `phongg-hold-v1:${maNguoiDung || ''}:${maSuat}`

export function docPhienGiuGhe(maSuat, maNguoiDung) {
  try { return JSON.parse(sessionStorage.getItem(khoaPhien(maSuat, maNguoiDung)) || 'null') }
  catch { return null }
}

export default function useThoiGianGiuGhe(maSuat, maNguoiDung, trangThai) {
  const khoa = khoaPhien(maSuat, maNguoiDung)
  const docHetHan = () => docPhienGiuGhe(maSuat, maNguoiDung)?.thoiGianHetHanMs || trangThai?.thoiGianHetHanMs || 0
  const [phien, datPhien] = useState(() => ({ khoa, hetHan: docHetHan() }))
  const thoiGianHetHanMs = phien.khoa === khoa ? phien.hetHan : docHetHan()
  const tinhGiay = () => Math.max(0, Math.ceil((thoiGianHetHanMs - Date.now()) / 1000))
  const [giayConLai, datGiay] = useState(tinhGiay)
  useEffect(() => {
    const capNhat = () => datGiay(tinhGiay())
    capNhat()
    if (!thoiGianHetHanMs) return undefined
    const boDem = setInterval(capNhat, 1000)
    window.addEventListener('focus', capNhat)
    document.addEventListener('visibilitychange', capNhat)
    return () => {
      clearInterval(boDem)
      window.removeEventListener('focus', capNhat)
      document.removeEventListener('visibilitychange', capNhat)
    }
  }, [thoiGianHetHanMs, khoa])

  const luuThoiGianGiuGhe = (phanHoi, gheChon) => {
    const deadline = Number(phanHoi.thoiGianHetHanEpochMs) || Date.parse(phanHoi.thoiGianHetHan)
    if (!Number.isFinite(deadline)) throw new Error('Thời gian giữ ghế không hợp lệ')
    try { sessionStorage.setItem(khoaPhien(maSuat, maNguoiDung), JSON.stringify({ thoiGianHetHanMs: deadline, gheChon })) } catch {}
    datPhien({ khoa, hetHan: deadline })
    datGiay(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
  }
  return { thoiGianHetHanMs, giayConLai, luuThoiGianGiuGhe }
}
