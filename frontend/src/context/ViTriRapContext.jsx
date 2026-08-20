import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  docViTriDaLuu, luuViTri, sapXepRapTheoKhoangCach, yeuCauViTriGps,
} from '../utils/viTriRap'

const ViTriRapContext = createContext(null)

export function ViTriRapProvider({ children }) {
  const daLuu = docViTriDaLuu()
  const [cheDo, datCheDo] = useState(daLuu?.cheDo || null)
  const [viTri, datViTri] = useState(daLuu?.viTri || null)
  const [khuVuc, datKhuVuc] = useState(daLuu?.khuVuc || '')
  const [dangTaiGps, datDangTaiGps] = useState(false)
  const [thongBao, datThongBao] = useState('')

  const layViTriGps = useCallback(async () => {
    datDangTaiGps(true)
    datThongBao('')
    try {
      const toaDo = await yeuCauViTriGps()
      datCheDo('gps')
      datViTri(toaDo)
      datKhuVuc('')
      luuViTri({ cheDo: 'gps', viTri: toaDo, khuVuc: '' })
      return toaDo
    } catch {
      datThongBao('Không lấy được vị trí GPS. Bạn có thể chọn khu vực thủ công.')
      return null
    } finally {
      datDangTaiGps(false)
    }
  }, [])

  const chonKhuVuc = useCallback((tenKhuVuc) => {
    datCheDo('khu_vuc')
    datKhuVuc(tenKhuVuc)
    datViTri(null)
    luuViTri({ cheDo: 'khu_vuc', khuVuc: tenKhuVuc, viTri: null })
    datThongBao('')
  }, [])

  const xoaViTri = useCallback(() => {
    datCheDo(null)
    datViTri(null)
    datKhuVuc('')
    localStorage.removeItem('phongg_vi_tri_rap')
    datThongBao('')
  }, [])

  const tinhRapGan = useCallback((danhSachRap = []) => {
    if (!danhSachRap.length) return []
    if (cheDo === 'gps' && viTri?.viDo) {
      return sapXepRapTheoKhoangCach(danhSachRap, viTri)
    }
    if (cheDo === 'khu_vuc' && khuVuc) {
      return danhSachRap.filter((rap) => rap.khuVuc === khuVuc)
    }
    return danhSachRap
  }, [cheDo, viTri, khuVuc])

  const giaTri = useMemo(() => ({
    cheDo,
    viTri,
    khuVuc,
    dangTaiGps,
    thongBao,
    coViTri: cheDo === 'gps' ? !!viTri?.viDo : cheDo === 'khu_vuc' ? !!khuVuc : false,
    coGps: cheDo === 'gps' && !!viTri?.viDo,
    layViTriGps,
    chonKhuVuc,
    xoaViTri,
    tinhRapGan,
    rapGanNhat: (danhSachRap) => tinhRapGan(danhSachRap)[0] || null,
    rapGanTop: (danhSachRap, soLuong = 3) => tinhRapGan(danhSachRap).slice(0, soLuong),
  }), [cheDo, viTri, khuVuc, dangTaiGps, thongBao, layViTriGps, chonKhuVuc, xoaViTri, tinhRapGan])

  return <ViTriRapContext.Provider value={giaTri}>{children}</ViTriRapContext.Provider>
}

export const useViTriRap = () => {
  const giaTri = useContext(ViTriRapContext)
  if (!giaTri) throw new Error('useViTriRap phải dùng trong ViTriRapProvider')
  return giaTri
}
