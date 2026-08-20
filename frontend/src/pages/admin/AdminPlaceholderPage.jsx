import { Link } from 'react-router-dom'

export default function AdminPlaceholderPage({ tieuDe, moTa }) {
  return (
    <div className="admin-glass rounded-2xl p-10 text-center">
      <h1 className="text-2xl font-black">{tieuDe}</h1>
      <p className="mt-3 text-slate-400">{moTa || 'Tính năng đang được phát triển.'}</p>
      <Link to="/admin/dashboard" className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white">
        Quay lại Tổng quan
      </Link>
    </div>
  )
}
