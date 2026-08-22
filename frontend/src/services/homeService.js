import { layDanhSachPhim } from './movieService'
import { layDanhSachRap, layChiSoLocPhim } from './showtimeService'
import { layDanhSachKhuVuc } from './regionService'
import { layDanhSachHinhThucThanhToan } from './paymentMethodService'
import { CHI_SO_LOC_RONG } from '../utils/locPhim'

/** 5 cột × 4 dòng trên desktop. Banner vẫn lấy riêng số lượng nhỏ hơn. */
export const KICH_THUOC_TRANG_CHU = 20
export const SO_PHIM_BANNER = 8

/**
 * Gộp request khởi tạo trang chủ — chạy song song bằng Promise.all.
 * Khi có queryClient, dùng fetchQuery để dedupe với React Query cache.
 */
export async function taiDuLieuTrangChu({
  trangThai = 'SHOWING',
  page = 0,
  size = KICH_THUOC_TRANG_CHU,
  tuKhoa,
  queryClient,
  queryKeys,
  catalogOpts,
  datCacheHinhThuc,
} = {}) {
  const fetchRap = () => layDanhSachRap().catch(() => [])
  const fetchChiSo = () => layChiSoLocPhim().catch(() => CHI_SO_LOC_RONG)
  const fetchKhuVuc = () => layDanhSachKhuVuc().catch(() => [])
  const fetchPttt = async () => {
    const ds = await layDanhSachHinhThucThanhToan().catch(() => [])
    if (datCacheHinhThuc && Array.isArray(ds)) datCacheHinhThuc(ds)
    return ds
  }

  const [phim, danhSachRap, chiSoLocPhim, danhSachKhuVuc, hinhThucThanhToan] = await Promise.all([
    layDanhSachPhim({
      trangThai,
      page,
      size,
      ...(tuKhoa ? { tuKhoa } : {}),
    }),
    queryClient && queryKeys
      ? queryClient.fetchQuery({ queryKey: queryKeys.cinemas(), queryFn: fetchRap, ...catalogOpts })
      : fetchRap(),
    queryClient && queryKeys
      ? queryClient.fetchQuery({
          queryKey: queryKeys.filterIndex,
          queryFn: fetchChiSo,
          staleTime: 2 * 60 * 1000,
        })
      : fetchChiSo(),
    queryClient && queryKeys
      ? queryClient.fetchQuery({ queryKey: queryKeys.regions, queryFn: fetchKhuVuc, ...catalogOpts })
      : fetchKhuVuc(),
    queryClient && queryKeys
      ? queryClient.fetchQuery({ queryKey: queryKeys.paymentMethods, queryFn: fetchPttt, ...catalogOpts })
      : fetchPttt(),
  ])

  const danhSach = phim?.content || (Array.isArray(phim) ? phim : [])
  const tongPhim = phim?.totalElements ?? danhSach.length
  const tongTrang = phim?.totalPages ?? Math.max(1, Math.ceil(tongPhim / size))

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/4225d522-756d-4686-a16f-b71753054886',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'12750d'},body:JSON.stringify({sessionId:'12750d',runId:'grid',hypothesisId:'A',location:'homeService.js:taiDuLieuTrangChu',message:'movies page payload',data:{requestedSize:size,page,trangThai,contentLen:danhSach.length,apiSize:phim?.size,totalElements:tongPhim,totalPages:tongTrang,isArray:Array.isArray(phim),hasContent:Array.isArray(phim?.content)},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return {
    danhSachPhim: danhSach,
    tongPhim,
    tongTrang,
    danhSachRap: Array.isArray(danhSachRap) ? danhSachRap : [],
    chiSoLocPhim: chiSoLocPhim || CHI_SO_LOC_RONG,
    danhSachKhuVuc: Array.isArray(danhSachKhuVuc) ? danhSachKhuVuc : [],
    hinhThucThanhToan: Array.isArray(hinhThucThanhToan) ? hinhThucThanhToan : [],
  }
}
