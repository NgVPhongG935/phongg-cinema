import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Clapperboard,
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  Sparkles,
  Ticket,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAuth } from '../../context/AuthContext'
import { layTongQuanAdmin } from '../../services/adminDashboardService'
import { dinhDangTien } from '../../utils/formatters'

const THE_THONG_KE = [
  { khoa: 'tongPhim', nhan: 'Phim đang quản lý', bieuTuong: Clapperboard, mau: 'from-violet-500 to-fuchsia-500' },
  { khoa: 'tongRap', nhan: 'Rạp chiếu', bieuTuong: Building2, mau: 'from-cyan-500 to-blue-500' },
  { khoa: 'tongKhuVuc', nhan: 'Khu vực', bieuTuong: MapPin, mau: 'from-emerald-500 to-teal-500' },
  { khoa: 'tongSuatChieu', nhan: 'Tổng suất chiếu', bieuTuong: CalendarDays, mau: 'from-amber-500 to-orange-500' },
  { khoa: 'suatHomNay', nhan: 'Suất hôm nay', bieuTuong: Sparkles, mau: 'from-pink-500 to-rose-500' },
  { khoa: 'tongVe', nhan: 'Vé đã bán', bieuTuong: Ticket, mau: 'from-indigo-500 to-purple-500' },
]

const HANH_DONG_NHANH = [
  { duongDan: '/admin/movies', nhan: 'Thêm phim mới', moTa: 'Cập nhật kho phim' },
  { duongDan: '/admin/showtimes', nhan: 'Tạo suất chiếu', moTa: 'Lên lịch chiếu hàng loạt' },
  { duongDan: '/admin/cinemas', nhan: 'Quản lý rạp', moTa: 'Phòng & ghế ngồi' },
  { duongDan: '/admin/tickets', nhan: 'Xác nhận vé CK', moTa: 'Duyệt thanh toán online' },
]

const MAU_KENH = { Web: '#8b5cf6', App: '#f472b6' }
const MAU_PT = ['#8b5cf6', '#06b6d4', '#f472b6', '#fbbf24', '#34d399', '#fb7185']

function TooltipChart({ active, payload, label, dangTien }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#12121f]/95 px-3 py-2 shadow-xl backdrop-blur-md">
      <p className="text-xs font-semibold text-slate-300">{label}</p>
      {payload.map((muc) => (
        <p key={muc.dataKey} className="text-sm font-bold" style={{ color: muc.color }}>
          {muc.name}: {dangTien ? dinhDangTien(muc.value) : muc.value}
        </p>
      ))}
    </div>
  )
}

function TheKpiLon({ nhan, giaTri, phuDe, icon: Icon, mau }) {
  return (
    <div className="admin-glass rounded-2xl p-5 transition hover:border-white/15">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${mau} shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        <TrendingUp size={16} className="text-slate-600" />
      </div>
      <p className="mt-4 text-2xl font-black tabular-nums text-white">{giaTri}</p>
      <p className="mt-1 text-sm font-semibold text-slate-300">{nhan}</p>
      {phuDe && <p className="mt-0.5 text-xs text-slate-500">{phuDe}</p>}
    </div>
  )
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="admin-hero h-40 rounded-3xl skeleton" />
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="admin-glass h-28 rounded-2xl skeleton" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="admin-card h-32 skeleton" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="admin-card h-80 skeleton" />
        <div className="admin-card h-80 skeleton" />
      </div>
    </div>
  )
}

export default function AdminOverviewPage() {
  const { nguoiDung } = useAuth()
  const [duLieu, datDuLieu] = useState(null)
  const [dangTai, datDangTai] = useState(true)

  useEffect(() => {
    layTongQuanAdmin()
      .then(datDuLieu)
      .catch(() => datDuLieu(null))
      .finally(() => datDangTai(false))
  }, [])

  const tenHienThi = nguoiDung?.hoTen || localStorage.getItem('hoTen') || 'Admin'

  const duLieuDoanhThu = useMemo(() => {
    if (!duLieu?.ve7Ngay) return []
    return duLieu.ve7Ngay.map((muc) => ({
      nhan: muc.nhan,
      tong: Number(muc.doanhThu) || 0,
      web: Number(muc.doanhThuWeb) || 0,
      app: Number(muc.doanhThuApp) || 0,
    }))
  }, [duLieu])

  const duLieuVeKenh = useMemo(() => {
    if (!duLieu?.ve7Ngay) return []
    return duLieu.ve7Ngay.map((muc) => ({
      nhan: muc.nhan,
      Web: muc.veWeb ?? 0,
      App: muc.veApp ?? 0,
    }))
  }, [duLieu])

  const pieHomNay = useMemo(() => {
    if (!duLieu) return []
    return [
      { name: 'Web', value: duLieu.veWebHomNay ?? 0 },
      { name: 'App', value: duLieu.veAppHomNay ?? 0 },
    ].filter((m) => m.value > 0)
  }, [duLieu])

  const pieTong = useMemo(() => {
    if (!duLieu) return []
    return [
      { name: 'Web', value: duLieu.veWeb ?? 0 },
      { name: 'App', value: duLieu.veApp ?? 0 },
    ].filter((m) => m.value > 0)
  }, [duLieu])

  const piePhuongThuc = useMemo(() => {
    if (!duLieu?.theoPhuongThuc) return []
    return duLieu.theoPhuongThuc.map((m) => ({ name: m.nhan, value: m.soVe }))
  }, [duLieu])

  if (dangTai) return <SkeletonDashboard />

  if (!duLieu) {
    return (
      <div className="admin-hero rounded-3xl p-10 text-center">
        <p className="text-slate-300">Không tải được dữ liệu tổng quan. Hãy restart backend và đăng nhập lại bằng tài khoản admin.</p>
      </div>
    )
  }

  const tongVeKenhHomNay = (duLieu.veWebHomNay ?? 0) + (duLieu.veAppHomNay ?? 0)
  const tyLeAppHomNay = tongVeKenhHomNay > 0 ? Math.round(((duLieu.veAppHomNay ?? 0) / tongVeKenhHomNay) * 100) : 0

  return (
    <div className="space-y-6">
      <section className="admin-hero relative overflow-hidden rounded-3xl p-6 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
              <Sparkles size={14} /> Bảng điều khiển
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Xin chào,{' '}
              <span className="bg-gradient-to-r from-white via-fuchsia-200 to-cyan-200 bg-clip-text text-transparent">
                {tenHienThi}
              </span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Tổng quan doanh thu, vé bán qua Web và App mobile — theo dõi rạp PhongG Cinema realtime.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="admin-glass rounded-2xl px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Vé hôm nay</p>
              <p className="text-xl font-black text-white">{duLieu.veHomNay}</p>
            </div>
            <div className="admin-glass rounded-2xl px-4 py-3 text-center">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">App hôm nay</p>
              <p className="text-xl font-black text-pink-300">{duLieu.veAppHomNay ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-3 text-right">
              <p className="text-[10px] uppercase tracking-wider text-emerald-300/80">Doanh thu tích lũy</p>
              <p className="text-2xl font-black text-emerald-300">{dinhDangTien(duLieu.doanhThu)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <TheKpiLon
          nhan="Doanh thu hôm nay"
          giaTri={dinhDangTien(Number(duLieu.doanhThuWebHomNay ?? 0) + Number(duLieu.doanhThuAppHomNay ?? 0))}
          phuDe={`Web ${dinhDangTien(duLieu.doanhThuWebHomNay)} · App ${dinhDangTien(duLieu.doanhThuAppHomNay)}`}
          icon={Wallet}
          mau="from-emerald-500 to-teal-600"
        />
        <TheKpiLon
          nhan="Vé Web hôm nay"
          giaTri={duLieu.veWebHomNay ?? 0}
          phuDe={`Tổng Web: ${duLieu.veWeb ?? 0} vé`}
          icon={Monitor}
          mau="from-violet-500 to-indigo-600"
        />
        <TheKpiLon
          nhan="Vé App hôm nay"
          giaTri={duLieu.veAppHomNay ?? 0}
          phuDe={tongVeKenhHomNay > 0 ? `${tyLeAppHomNay}% đơn hôm nay` : 'Chưa có vé app hôm nay'}
          icon={Smartphone}
          mau="from-pink-500 to-rose-600"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {THE_THONG_KE.map((muc) => {
          const BieuTuong = muc.bieuTuong
          return (
            <article key={muc.khoa} className="admin-card group p-5 transition hover:-translate-y-0.5 hover:border-fuchsia-400/25">
              <div className="flex items-start justify-between">
                <div className={`rounded-2xl bg-gradient-to-br ${muc.mau} p-3 text-white shadow-lg shadow-fuchsia-900/20`}>
                  <BieuTuong size={22} />
                </div>
                <TrendingUp className="text-slate-600 transition group-hover:text-fuchsia-300" size={18} />
              </div>
              <p className="mt-5 text-3xl font-black tabular-nums">{duLieu[muc.khoa] ?? 0}</p>
              <p className="mt-1 text-sm text-slate-400">{muc.nhan}</p>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <article className="admin-card p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Doanh thu 7 ngày</h2>
              <p className="text-sm text-slate-400">Web + App theo ngày đặt vé</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">Live</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={duLieuDoanhThu} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradTong" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradWeb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradApp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="nhan" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipChart dangTien />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Area type="monotone" dataKey="tong" name="Tổng" stroke="#c084fc" fill="url(#gradTong)" strokeWidth={2} />
                <Area type="monotone" dataKey="web" name="Web" stroke="#818cf8" fill="url(#gradWeb)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="app" name="App" stroke="#f472b6" fill="url(#gradApp)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-card p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Web vs App</h2>
            <p className="text-sm text-slate-400">Phân bổ vé đã thanh toán</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Hôm nay</p>
              <div className="h-[140px]">
                {pieHomNay.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieHomNay} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={3}>
                        {pieHomNay.map((m) => <Cell key={m.name} fill={MAU_KENH[m.name]} />)}
                      </Pie>
                      <Tooltip content={<TooltipChart />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">Chưa có vé hôm nay</div>
                )}
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-violet-300"><Monitor size={12} /> {duLieu.veWebHomNay ?? 0}</span>
                <span className="flex items-center gap-1 text-pink-300"><Smartphone size={12} /> {duLieu.veAppHomNay ?? 0}</span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Tổng cộng</p>
              <div className="h-[140px]">
                {pieTong.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieTong} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={3}>
                        {pieTong.map((m) => <Cell key={m.name} fill={MAU_KENH[m.name]} />)}
                      </Pie>
                      <Tooltip content={<TooltipChart />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-500">Chưa có dữ liệu</div>
                )}
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-violet-300"><Globe size={12} /> {duLieu.veWeb ?? 0}</span>
                <span className="flex items-center gap-1 text-pink-300"><Smartphone size={12} /> {duLieu.veApp ?? 0}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-4">
            <div className="rounded-xl bg-violet-500/10 px-3 py-2">
              <p className="text-[10px] text-slate-400">DT Web</p>
              <p className="text-sm font-bold text-violet-200">{dinhDangTien(duLieu.doanhThuWeb)}</p>
            </div>
            <div className="rounded-xl bg-pink-500/10 px-3 py-2">
              <p className="text-[10px] text-slate-400">DT App</p>
              <p className="text-sm font-bold text-pink-200">{dinhDangTien(duLieu.doanhThuApp)}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="admin-card p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Vé theo kênh — 7 ngày</h2>
            <p className="text-sm text-slate-400">So sánh Web và App mỗi ngày</p>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={duLieuVeKenh} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="nhan" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<TooltipChart />} />
                <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
                <Bar dataKey="Web" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="App" stackId="a" fill="#f472b6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-card p-5 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">Phương thức thanh toán</h2>
            <p className="text-sm text-slate-400">Vé đã thanh toán theo cổng</p>
          </div>
          <div className="h-[280px] w-full">
            {piePhuongThuc.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={piePhuongThuc} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {piePhuongThuc.map((_, i) => <Cell key={i} fill={MAU_PT[i % MAU_PT.length]} />)}
                  </Pie>
                  <Tooltip content={<TooltipChart />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Chưa có dữ liệu thanh toán</div>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <article className="admin-card p-6">
          <h2 className="text-lg font-bold text-white">Thao tác nhanh</h2>
          <p className="text-sm text-slate-400">Đi tới các mục quản trị chính</p>
          <div className="mt-5 space-y-3">
            {HANH_DONG_NHANH.map((muc) => (
              <Link
                key={muc.duongDan}
                to={muc.duongDan}
                className="admin-glass flex items-center justify-between rounded-2xl px-4 py-3 transition hover:border-fuchsia-400/40 hover:bg-white/10"
              >
                <div>
                  <p className="font-semibold text-white">{muc.nhan}</p>
                  <p className="text-xs text-slate-400">{muc.moTa}</p>
                </div>
                <ArrowUpRight className="text-fuchsia-300" size={18} />
              </Link>
            ))}
          </div>
        </article>

        <article className="admin-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Suất sắp chiếu</h2>
              <p className="text-sm text-slate-400">6 suất gần nhất</p>
            </div>
            <Link to="/admin/showtimes" className="text-sm text-fuchsia-300 hover:underline">Xem tất cả</Link>
          </div>
          <div className="space-y-3">
            {duLieu.suatSapToi.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có suất chiếu sắp tới.</p>
            ) : duLieu.suatSapToi.map((suat) => (
              <div key={suat.id} className="admin-glass flex items-center justify-between rounded-2xl px-4 py-3">
                <div>
                  <p className="font-semibold text-white">{suat.tieuDe}</p>
                  <p className="text-xs text-slate-400">{suat.phuDe}</p>
                </div>
                <span className="text-xs font-medium text-cyan-300">{suat.giaTri}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-card p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Vé bán gần đây</h2>
            <p className="text-sm text-slate-400">Giao dịch mới — có ghi kênh Web/App</p>
          </div>
          <Link to="/admin/tickets" className="text-sm text-fuchsia-300 hover:underline">Quản lý vé</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {duLieu.veGanDay.length === 0 ? (
            <p className="text-sm text-slate-500">Chưa có vé nào được bán.</p>
          ) : duLieu.veGanDay.map((ve) => (
            <div key={ve.id} className="admin-glass rounded-2xl px-4 py-3">
              <p className="font-semibold text-white">{ve.tieuDe}</p>
              <p className="mt-1 text-xs text-slate-400">{ve.phuDe}</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm font-bold text-emerald-300">{dinhDangTien(ve.soTien)}</p>
                <p className="text-[11px] text-slate-500">{ve.giaTri}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
