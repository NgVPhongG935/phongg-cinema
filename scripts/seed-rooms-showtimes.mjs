const API = 'http://localhost:8080/api/v1'

async function goiApi(duongDan, tuyChon = {}) {
  const phanHoi = await fetch(`${API}${duongDan}`, tuyChon)
  const noiDung = await phanHoi.text()
  let duLieu = null
  try { duLieu = noiDung ? JSON.parse(noiDung) : null } catch { duLieu = noiDung }
  if (!phanHoi.ok) {
    throw new Error(duLieu?.message || duLieu || `HTTP ${phanHoi.status}`)
  }
  return duLieu
}

async function main() {
  console.log('Đang đăng nhập admin...')
  const dangNhap = await goiApi('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@gmail.com', matKhau: '123456' }),
  })
  const token = dangNhap.token
  if (!token) throw new Error('Không lấy được token đăng nhập')

  console.log('Đang nạp phòng + suất chiếu...')
  const ketQua = await goiApi('/admin/seed/rooms-showtimes', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  console.log('Xong!')
  console.log(`  Rạp cập nhật: ${ketQua.soRapCapNhat}`)
  console.log(`  Phòng thêm: ${ketQua.soPhongThem}`)
  console.log(`  Suất chiếu thêm: ${ketQua.soSuatThem}`)
  console.log(`  Phim có lịch: ${ketQua.soPhim}`)
}

main().catch((loi) => {
  console.error('Lỗi:', loi.message)
  process.exit(1)
})
