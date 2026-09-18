import MovieCard from './MovieCard'
import KhuonSkeletPhim from './KhuonSkeletPhim'

const LOP_LUOI =
  'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 xl:gap-6 2xl:grid-cols-5'

export default function MovieList({ danhSachPhim = [], dangTai = false, soKhung = 20 }) {
  if (dangTai) {
    return <KhuonSkeletPhim soLuong={soKhung} />
  }

  return (
    <div className={LOP_LUOI}>
      {danhSachPhim.map((phim, chiSo) => (
        <MovieCard key={phim.id} phim={phim} chiSo={chiSo} />
      ))}
    </div>
  )
}
