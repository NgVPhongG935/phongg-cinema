import { ArrowRight, CheckCircle2, Clock3, History, RefreshCw, ScanLine, Ticket, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { layVeDaSoatHomNay } from '../../services/ticketService'

const time = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' })
}

export default function StaffOverviewPage() {
  const { nguoiDung } = useAuth()
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: ['staff', 'scanned-today', nguoiDung?.id],
    queryFn: layVeDaSoatHomNay,
    staleTime: 0,
    retry: 1,
    refetchOnWindowFocus: true,
  })
  const tickets = Array.isArray(data) ? data : []
  const recent = [...tickets].sort((a, b) => String(b.checkedInAt || b.thoiGianSoatVe || '').localeCompare(String(a.checkedInAt || a.thoiGianSoatVe || ''))).slice(0, 5)
  const count = isLoading ? '…' : isError ? '—' : tickets.length
  const date = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' })

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">Tổng quan nhân viên</p><h1 className="mt-2 text-2xl font-black sm:text-3xl">Chào {nguoiDung?.hoTen || 'bạn'} 👋</h1><p className="mt-2 text-sm text-slate-400">Chúc bạn một ngày làm việc thuận lợi.</p></div>
        <p className="flex items-center gap-2 text-xs capitalize text-slate-500"><Clock3 size={15} />{date}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-[#30224f] via-[#201b38] to-[#15182a] p-6 sm:p-8">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border-[35px] border-violet-400/5" />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-[11px] font-semibold text-violet-200"><Ticket size={13} />Đón khách tại rạp</span>
          <h2 className="relative mt-5 max-w-md text-3xl font-black leading-tight sm:text-4xl">Mỗi lượt soát vé,<br />một trải nghiệm tốt.</h2>
          <p className="relative mt-4 max-w-md text-sm leading-7 text-slate-300">Mở công cụ soát vé khi bạn sẵn sàng. Quét QR bằng camera, tải ảnh hoặc nhập mã vé để kiểm tra.</p>
          <Link to="/staff/scan-qr" className="relative mt-7 inline-flex items-center gap-3 rounded-xl bg-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"><ScanLine size={19} />Bắt đầu soát vé<ArrowRight size={17} /></Link>
        </section>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
            <div className="flex items-center justify-between"><p className="text-sm text-slate-400">Vé đã soát hôm nay</p><CheckCircle2 size={22} className="text-emerald-400" /></div>
            <p aria-live="polite" className="mt-4 text-5xl font-black tracking-tight">{count}</p>
            <p className="mt-3 text-xs text-slate-500">Theo lịch sử soát vé của hệ thống</p>
          </section>
          <Link to="/staff/scan-qr?tab=lich-su" className="group flex items-center gap-4 rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6 transition hover:border-violet-400/30 hover:bg-violet-500/5">
            <span className="rounded-2xl bg-sky-400/10 p-3 text-sky-300"><History size={23} /></span><div className="flex-1"><h2 className="font-bold">Lịch sử soát vé</h2><p className="mt-2 text-xs leading-5 text-slate-500">Tra cứu các lượt khách đã vào rạp hôm nay.</p></div><ArrowRight size={18} className="text-slate-500 group-hover:text-violet-300" />
          </Link>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_1fr]">
        <section className="min-w-0 overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025]">
          <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] p-5 sm:p-6"><div><h2 className="font-bold">Lượt soát gần đây</h2><p className="mt-1 text-xs text-slate-500">5 lượt mới nhất trong hôm nay</p></div><button type="button" disabled={isFetching} onClick={() => refetch()} aria-label="Làm mới lịch sử soát vé" className="rounded-xl border border-white/10 p-2.5 text-slate-400 hover:text-white disabled:opacity-50"><RefreshCw size={17} className={isFetching ? 'animate-spin' : ''} /></button></div>
          {isError ? <div role="alert" className="p-8 text-center text-sm text-rose-300">Chưa tải được lịch sử soát vé. Bấm làm mới để thử lại.</div>
            : isLoading ? <p role="status" className="p-10 text-center text-sm text-slate-400">Đang tải lịch sử…</p>
            : recent.length === 0 ? <div className="px-6 py-12 text-center"><Ticket size={32} className="mx-auto text-slate-600" /><p className="mt-4 text-sm font-semibold text-slate-300">Chưa có lượt soát vé hôm nay</p><p className="mt-2 text-xs text-slate-500">Các vé đã xác nhận vào rạp sẽ xuất hiện tại đây.</p></div>
            : <ul className="divide-y divide-white/[0.06]">{recent.map((item) => <li key={item.id} className="flex items-center gap-4 p-5 sm:px-6"><span className="rounded-xl bg-emerald-400/10 p-2.5 text-emerald-300"><CheckCircle2 size={18} /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.movieTitle || item.tenPhim || 'Vé xem phim'}</p><p className="mt-1 truncate text-xs text-slate-500">{item.cinemaName || item.tenRap || '—'} · Phòng {item.roomId || item.maPhong || '—'}</p></div><span className="text-xs text-slate-400">{time(item.checkedInAt || item.thoiGianSoatVe)}</span></li>)}</ul>}
        </section>
        <section className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-6">
          <h2 className="font-bold">Soát vé trong 3 bước</h2>
          <ol className="mt-6 space-y-6">{[
            ['Quét mã vé', 'Dùng camera, ảnh QR hoặc nhập mã vé của khách.'],
            ['Kiểm tra thông tin', 'Đối chiếu phim, rạp, phòng chiếu và giờ vào rạp.'],
            ['Xác nhận soát vé', 'Xác nhận vé hợp lệ trước khi hướng dẫn khách vào phòng.'],
          ].map(([title, description], index) => <li key={title} className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-300">{index + 1}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-6 text-slate-500">{description}</p></div></li>)}</ol>
          <Link to="/staff/profile" className="mt-7 flex items-center gap-2 border-t border-white/[0.07] pt-5 text-xs text-slate-400 hover:text-violet-300"><UserRound size={16} />Thông tin tài khoản<ArrowRight size={14} className="ml-auto" /></Link>
        </section>
      </div>
    </div>
  )
}
