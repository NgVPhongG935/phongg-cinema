import QRCode from 'react-qr-code'
import { dinhDangKhoangGio, dinhDangNgayGio, dinhDangTien } from '../utils/formatters'
import { tenHinhThucThanhToan } from '../utils/hinhThucThanhToan'
import { taoMaQrVe } from '../utils/maVeQr'
import { LOI_CHUC_IN_VE, LUU_Y_IN_VE, THONG_TIN_RAP_IN_VE } from '../utils/thongTinRapInVe'

export default function PrintTicketTemplate({ ve, thongTinPhim, hienThi }) {
  if (!hienThi || !ve) return null

  const ngayChieu = ve.thoiGianBatDau
    ? new Date(ve.thoiGianBatDau).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
    : '—'
  const gioChieu = dinhDangKhoangGio(ve.thoiGianBatDau, ve.thoiGianKetThuc)
  const thoiLuong = thongTinPhim?.duration ? `${thongTinPhim.duration} phút` : '—'
  const tenKhach = ve.hoTenNguoiDung || (ve.maNguoiDung ? `Khách #${ve.maNguoiDung.slice(-6)}` : 'Khách hàng')
  const maSoat = ve.maQrCode || taoMaQrVe(ve.id)
  const maVeNgan = ve.id?.slice(-8)?.toUpperCase() || '—'
  const ghe = (ve.danhSachGheChon || []).join(', ') || '—'

  return (
    <div id="khu-in-ve" className="print-ticket-root">
      <div className="print-ticket-noi-dung">
        <header className="print-ticket-header">
          <div className="print-ticket-brand-row">
            <span className="print-ticket-brand-mark">PG</span>
            <div>
              <p className="print-ticket-logo">PHONGG CINEMA</p>
              <h1 className="print-ticket-ten-rap">{THONG_TIN_RAP_IN_VE.tenRap}</h1>
            </div>
          </div>
          <p className="print-ticket-phu">{THONG_TIN_RAP_IN_VE.diaChi}</p>
          <p className="print-ticket-phu">Hotline: {THONG_TIN_RAP_IN_VE.hotline}</p>
        </header>

        <h2 className="print-ticket-ten-phim">{ve.movieTitle || ve.title || '—'}</h2>

        <div className="print-ticket-highlight">
          <div className="print-ticket-highlight-item">
            <span>Ngày</span>
            <strong>{ngayChieu}</strong>
          </div>
          <div className="print-ticket-highlight-item">
            <span>Giờ</span>
            <strong>{gioChieu}</strong>
          </div>
          <div className="print-ticket-highlight-item print-ticket-ghe">
            <span>Ghế</span>
            <strong>{ghe}</strong>
          </div>
        </div>

        <table className="print-ticket-bang">
          <tbody>
            <tr><td>Phòng</td><td>{ve.maPhong ? `Phòng ${ve.maPhong}` : '—'}</td></tr>
            <tr><td>Định dạng</td><td>{ve.dinhDang || '—'}</td></tr>
            <tr><td>Rạp</td><td>{ve.tenRap || '—'}</td></tr>
            <tr><td>Giá ghế</td><td><strong>{dinhDangTien(ve.tienGhe ?? 0)}</strong></td></tr>
          </tbody>
        </table>

        {ve.danhSachCombo?.length > 0 && (
          <section className="print-ticket-section">
            <p className="print-ticket-tieu-de-muc">Combo bắp nước</p>
            <table className="print-ticket-bang print-ticket-bang-combo">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>SL</th>
                  <th>Giá</th>
                </tr>
              </thead>
              <tbody>
                {ve.danhSachCombo.map((combo) => (
                  <tr key={combo.maCombo || combo.tenCombo}>
                    <td>{combo.tenCombo}</td>
                    <td className="print-ticket-sl">{combo.soLuong}</td>
                    <td>{dinhDangTien((combo.donGia || 0) * (combo.soLuong || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ve.tienBapNuoc > 0 && (
              <p className="print-ticket-tong-combo">Combo: {dinhDangTien(ve.tienBapNuoc)}</p>
            )}
          </section>
        )}

        <section className="print-ticket-xac-thuc">
          <p className="print-ticket-xac-thuc-tieu-de">MÃ SOÁT VÉ — QUÉT ĐỂ KIỂM TRA</p>
          <div className="print-ticket-qr-wrap">
            <QRCode value={maSoat} size={128} level="M" fgColor="#000000" bgColor="#ffffff" />
          </div>
          <p className="print-ticket-ma-qr">{maSoat}</p>
          <p className="print-ticket-ma-ve">Mã vé: <strong>#{maVeNgan}</strong></p>
          <p className="print-ticket-huong-dan">
            Nhân viên quét mã QR hoặc nhập mã trên để xác minh vé thật. Vé giả không có mã hợp lệ trong hệ thống.
          </p>
        </section>

        <div className="print-ticket-tong-cong">
          <span>TỔNG THANH TOÁN</span>
          <span>{dinhDangTien(ve.tongTien ?? 0)}</span>
        </div>

        <section className="print-ticket-khach">
          <p><span>Khách:</span> {tenKhach}</p>
          {ve.emailNguoiDung && <p><span>Email:</span> {ve.emailNguoiDung}</p>}
          <p><span>Thời lượng:</span> {thoiLuong}</p>
          <p><span>Thanh toán:</span> {tenHinhThucThanhToan(ve.hinhThucThanhToan)} · {dinhDangNgayGio(ve.ngayTao)}</p>
          <p className="print-ticket-loi-chuc">{LOI_CHUC_IN_VE}</p>
          <p className="print-ticket-luu-y">{LUU_Y_IN_VE}</p>
        </section>

        <footer className="print-ticket-footer">
          <p>PhongG Cinema — Vé điện tử có mã QR chống giả</p>
        </footer>
      </div>
    </div>
  )
}
