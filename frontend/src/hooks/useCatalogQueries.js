import { useQuery } from '@tanstack/react-query'
import { queryKeys, STALE_CATALOG_MS, GC_CATALOG_MS } from '../lib/queryClient'
import { layDanhSachRap, layChiSoLocPhim } from '../services/showtimeService'
import { layDanhSachKhuVuc } from '../services/regionService'
import { layDanhSachHinhThucThanhToan } from '../services/paymentMethodService'
import { layDanhSachPhim } from '../services/movieService'
import { KICH_THUOC_TRANG_CHU } from '../services/homeService'
import { CHI_SO_LOC_RONG } from '../utils/locPhim'
import { datCacheHinhThuc } from '../utils/hinhThucThanhToan'
import { docCacheTrangChu, luuCacheTrangChu } from '../utils/homeCache'

const catalogOpts = {
  staleTime: STALE_CATALOG_MS,
  gcTime: GC_CATALOG_MS,
}

export function useDanhSachRap(khuVuc) {
  return useQuery({
    queryKey: queryKeys.cinemas(khuVuc),
    queryFn: () => layDanhSachRap(khuVuc),
    ...catalogOpts,
  })
}

export function useDanhSachKhuVuc() {
  return useQuery({
    queryKey: queryKeys.regions,
    queryFn: layDanhSachKhuVuc,
    ...catalogOpts,
  })
}

export function useHinhThucThanhToan() {
  return useQuery({
    queryKey: queryKeys.paymentMethods,
    queryFn: async () => {
      const ds = await layDanhSachHinhThucThanhToan()
      datCacheHinhThuc(ds)
      return ds
    },
    ...catalogOpts,
  })
}

export function useChiSoLocPhim() {
  return useQuery({
    queryKey: queryKeys.filterIndex,
    queryFn: () => layChiSoLocPhim().catch(() => CHI_SO_LOC_RONG),
    staleTime: 2 * 60 * 1000,
  })
}

/** Init Home: phim (phân trang) + catalog song song; dedupe với React Query. */
export function useDuLieuTrangChu({ trangThai, page, tuKhoa, size = KICH_THUOC_TRANG_CHU }) {
  const params = { trangThai, page, size, tuKhoa: tuKhoa || '' }
  const phimQuery = useQuery({
    queryKey: queryKeys.movies(params),
    queryFn: async () => {
      const phim = await layDanhSachPhim({ trangThai, page, size, ...(tuKhoa ? { tuKhoa } : {}) })
      return luuCacheTrangChu(params, phim)
    },
    initialData: () => docCacheTrangChu(params),
    initialDataUpdatedAt: 0,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
  const rapQuery = useDanhSachRap()
  const chiSoQuery = useChiSoLocPhim()

  const phim = phimQuery.data
  const danhSachPhim = phim?.content || (Array.isArray(phim) ? phim : [])
  const tongPhim = phim?.totalElements ?? danhSachPhim.length

  return {
    ...phimQuery,
    data: phim
      ? {
          danhSachPhim,
          tongPhim,
          tongTrang: phim?.totalPages ?? Math.max(1, Math.ceil(tongPhim / size)),
          danhSachRap: Array.isArray(rapQuery.data) ? rapQuery.data : [],
          chiSoLocPhim: chiSoQuery.data || CHI_SO_LOC_RONG,
        }
      : undefined,
  }
}
