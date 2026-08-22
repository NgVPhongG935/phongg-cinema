import MovieCard from './MovieCard'
import KhuonSkeletPhim from './KhuonSkeletPhim'

const LOP_LUOI =
  'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 xl:gap-6 2xl:grid-cols-5'

export default function MovieList({ danhSachPhim = [], dangTai = false, soKhung = 20 }) {
  if (dangTai) {
    return <KhuonSkeletPhim soLuong={soKhung} />
  }

  // #region agent log
  fetch('http://127.0.0.1:7246/ingest/4225d522-756d-4686-a16f-b71753054886',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'12750d'},body:JSON.stringify({sessionId:'12750d',runId:'grid',hypothesisId:'E',location:'MovieList.jsx:render',message:'rendered movie cards',data:{rendered:danhSachPhim.length,innerWidth:typeof window!=='undefined'?window.innerWidth:0},timestamp:Date.now()})}).catch(()=>{});
  // #endregion

  return (
    <div className={LOP_LUOI}>
      {danhSachPhim.map((phim, chiSo) => (
        <MovieCard key={phim.id} phim={phim} chiSo={chiSo} />
      ))}
    </div>
  )
}
