import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys, STALE_CATALOG_MS, GC_CATALOG_MS } from '../lib/queryClient'
import { layDanhSachRap, layChiSoLocPhim } from '../services/showtimeService'
import { layDanhSachKhuVuc } from '../services/regionService'
import { layDanhSachHinhThucThanhToan } from '../services/paymentMethodService'
import { taiDuLieuTrangChu, KICH_THUOC_TRANG_CHU } from '../services/homeService'
import { CHI_SO_LOC_RONG } from '../utils/locPhim'
import { datCacheHinhThuc } from '../utils/hinhThucThanhToan'

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
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: queryKeys.homeInit({ trangThai, page, tuKhoa: tuKhoa || '', size }),
    queryFn: () =>
      taiDuLieuTrangChu({
        trangThai,
        page,
        size,
        tuKhoa,
        queryClient,
        queryKeys,
        catalogOpts,
        datCacheHinhThuc,
      }),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })
}
