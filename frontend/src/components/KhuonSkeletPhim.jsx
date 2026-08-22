export default function KhuonSkeletPhim({ soLuong = 20 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 xl:gap-6">
      {Array.from({ length: soLuong }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-white/5 bg-white/[0.03]">
          <div className="skeleton aspect-[2/3] w-full" style={{ animationDelay: `${i * 50}ms` }} />
          <div className="space-y-2 p-3">
            <div className="skeleton h-4 w-4/5 rounded-lg" />
            <div className="skeleton h-3 w-1/2 rounded-lg" />
            <div className="skeleton mt-2 h-8 w-full rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}
