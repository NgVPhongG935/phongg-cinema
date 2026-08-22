import { QueryClient } from '@tanstack/react-query'

/** Cache dài cho catalog ít đổi (rạp, khu vực, PTTT) — giảm gọi API khi chuyển trang trên Render. */
export const STALE_CATALOG_MS = 10 * 60 * 1000
export const GC_CATALOG_MS = 30 * 60 * 1000

export const queryKeys = {
  cinemas: (khuVuc) => ['cinemas', khuVuc || 'ALL'],
  regions: ['regions'],
  paymentMethods: ['payment-methods'],
  movies: (params) => ['movies', params],
  filterIndex: ['showtimes', 'filter-index'],
  homeInit: (params) => ['home-init', params],
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})
