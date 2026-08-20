import { useCallback, useEffect, useState } from 'react'

export function useInVePhim() {
  const [moXacNhanIn, datMoXacNhanIn] = useState(false)
  const [veCanIn, datVeCanIn] = useState(null)
  const [thongTinPhimCanIn, datThongTinPhimCanIn] = useState(null)
  const [hienTemplateIn, datHienTemplateIn] = useState(false)

  const yeuCauInVe = useCallback((ve, thongTinPhim = null) => {
    if (!ve?.id) return
    datVeCanIn(ve)
    datThongTinPhimCanIn(thongTinPhim)
    datMoXacNhanIn(true)
  }, [])

  const huyInVe = useCallback(() => {
    datMoXacNhanIn(false)
  }, [])

  const xacNhanInVe = useCallback(() => {
    datMoXacNhanIn(false)
    datHienTemplateIn(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => window.print())
    })
  }, [])

  useEffect(() => {
    if (!hienTemplateIn) return undefined
    const xuLySauIn = () => {
      datHienTemplateIn(false)
      datVeCanIn(null)
      datThongTinPhimCanIn(null)
    }
    window.addEventListener('afterprint', xuLySauIn)
    return () => window.removeEventListener('afterprint', xuLySauIn)
  }, [hienTemplateIn])

  return {
    moXacNhanIn,
    veCanIn,
    thongTinPhimCanIn,
    hienTemplateIn,
    yeuCauInVe,
    huyInVe,
    xacNhanInVe,
  }
}
