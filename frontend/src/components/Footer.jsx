export default function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-transparent to-black/30">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent" />
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-4 py-8 text-sm text-slate-400 md:flex-row">
        <span>© 2026 PhongG Cinema. Trải nghiệm điện ảnh bắt đầu từ đây.</span>
        <span>Hotline: 1900 1234 · support@phonggcinema.vn</span>
      </div>
    </footer>
  )
}
