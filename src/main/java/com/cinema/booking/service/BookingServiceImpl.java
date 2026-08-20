package com.cinema.booking.service;

import com.cinema.booking.document.PhuongThucThanhToan;
import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.SeatAvailability;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.dto.CreateTicketRequest;
import com.cinema.booking.dto.HoldSeatsRequest;
import com.cinema.booking.dto.HoldSeatsResponse;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.util.TinhGiaVeUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {
    private static final Logger nhatKy = LoggerFactory.getLogger(BookingServiceImpl.class);
    private final ShowtimeRepository khoSuatChieu;
    private final CinemaRepository khoRap;
    private final TicketRepository khoVe;
    private final VoucherService dichVuVoucher;
    private final TicketService dichVuVe;
    private final TicketPaidService dichVuVePaid;
    private final EmailService dichVuEmail;

    public HoldSeatsResponse giuGheTamThoi(HoldSeatsRequest yeuCau, String maNguoiDung) {
        LocalDateTime thoiGianHetHan = LocalDateTime.now().plusMinutes(10);
        for (int lanThu = 0; lanThu < 3; lanThu++) try {
            Showtime suatChieu = timSuatChieu(yeuCau.getMaSuatChieu());
            for (String soGhe : yeuCau.getDanhSachGheChon()) {
                Showtime.SeatStatus ghe = timGhe(suatChieu, soGhe);
                boolean biNguoiKhacGiu = ghe.getTrangThai() == SeatAvailability.HELD
                        && ghe.getNguoiGiuGhe() != null
                        && !ghe.getNguoiGiuGhe().equals(maNguoiDung)
                        && ghe.getThoiGianHetHanGiu() != null
                        && ghe.getThoiGianHetHanGiu().isAfter(LocalDateTime.now());
                if (ghe.getTrangThai() == SeatAvailability.BOOKED || biNguoiKhacGiu)
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ghế đã được chọn hoặc đang được người khác giữ: " + soGhe);
            }
            suatChieu.getTrangThaiGhe().stream().filter(ghe -> yeuCau.getDanhSachGheChon().contains(ghe.getSoGhe())).forEach(ghe -> {
                ghe.setTrangThai(SeatAvailability.HELD);
                ghe.setNguoiGiuGhe(maNguoiDung);
                ghe.setThoiGianHetHanGiu(thoiGianHetHan);
            });
            khoSuatChieu.save(suatChieu);
            return HoldSeatsResponse.builder().maSuatChieu(suatChieu.getId()).danhSachGheGiu(yeuCau.getDanhSachGheChon()).thoiGianHetHan(thoiGianHetHan).build();
        } catch (OptimisticLockingFailureException ngoaiLe) { }
        throw new ResponseStatusException(HttpStatus.CONFLICT, "Ghế vừa được cập nhật, vui lòng thử lại");
    }

    public Ticket taoVeSauThanhToan(CreateTicketRequest yeuCau) {
        nhatKy.info("taoVeSauThanhToan: maSuat={}, ghe={}, maNguoiDung={}, hinhThuc={}",
                yeuCau.getMaSuatChieu(), yeuCau.getDanhSachGhe(), yeuCau.getMaNguoiDung(), yeuCau.getHinhThucThanhToan());
        if (yeuCau.getMaSuatChieu() == null || yeuCau.getMaSuatChieu().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã suất chiếu");
        if (yeuCau.getMaNguoiDung() == null || yeuCau.getMaNguoiDung().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thiếu mã người dùng");
        if (yeuCau.getDanhSachGhe() == null || yeuCau.getDanhSachGhe().isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chưa chọn ghế");
        PhuongThucThanhToan hinhThuc = PhuongThucThanhToan.chuanHoa(yeuCau.getHinhThucThanhToan());
        if (hinhThuc == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Hình thức thanh toán không hợp lệ — dùng BANK_TRANSFER, MOMO hoặc VNPAY");
        yeuCau.setHinhThucThanhToan(hinhThuc.name());
        Showtime suatChieu = timSuatChieu(yeuCau.getMaSuatChieu());
        Cinema rap = khoRap.findById(suatChieu.getMaRap())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy rạp"));
        BigDecimal tienGheKyVong = TinhGiaVeUtil.tinhTienGhe(suatChieu, rap, yeuCau.getDanhSachGhe());
        BigDecimal tienGheClient = yeuCau.getTienGhe() != null ? yeuCau.getTienGhe() : BigDecimal.ZERO;
        if (tienGheKyVong.compareTo(tienGheClient) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Giá vé không khớp, vui lòng tải lại trang");
        }
        yeuCau.setTienGhe(tienGheKyVong);

        // Kiểm tra tính hợp lệ của từng ghế
        for (String soGhe : yeuCau.getDanhSachGhe()) {
            Showtime.SeatStatus ghe = timGhe(suatChieu, soGhe);

            // 1. Kiểm tra nếu ghế đang bị người dùng KHÁC giữ trong thời gian hiệu lực
            boolean biNguoiKhacGiu = ghe.getTrangThai() == SeatAvailability.HELD
                    && ghe.getNguoiGiuGhe() != null
                    && !ghe.getNguoiGiuGhe().equals(yeuCau.getMaNguoiDung())
                    && ghe.getThoiGianHetHanGiu() != null
                    && ghe.getThoiGianHetHanGiu().isAfter(LocalDateTime.now());

            if (biNguoiKhacGiu) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ghế đang được giữ bởi người khác: " + soGhe);
            }

            // 2. Kiểm tra nếu ghế đã BOOKED (chỉ cho phép nếu thuộc đơn hàng PENDING của chính user này)
            if (ghe.getTrangThai() == SeatAvailability.BOOKED) {
                boolean laVeCuaChinhUser = khoVe.findByMaSuatChieu(suatChieu.getId()).stream()
                        .anyMatch(v -> v.getSelectedSeats() != null
                                && v.getSelectedSeats().contains(soGhe)
                                && (v.getStatus() == TicketStatus.PENDING || v.getStatus() == TicketStatus.CHO_XAC_NHAN)
                                && yeuCau.getMaNguoiDung().equals(v.getUserId()));
                if (!laVeCuaChinhUser) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ghế đã được đặt: " + soGhe);
                }
            }

            // Cập nhật trạng thái ghế sang BOOKED gắn với người dùng
            ghe.setTrangThai(SeatAvailability.BOOKED);
            ghe.setNguoiGiuGhe(yeuCau.getMaNguoiDung());
            ghe.setThoiGianHetHanGiu(null);
        }
        khoSuatChieu.save(suatChieu);

        BigDecimal tongGoc = (yeuCau.getTienGhe() != null ? yeuCau.getTienGhe() : BigDecimal.ZERO)
                .add(yeuCau.getTienBapNuoc() != null ? yeuCau.getTienBapNuoc() : BigDecimal.ZERO);
        BigDecimal soTienGiam = BigDecimal.ZERO;
        String maCodeGiamGia = yeuCau.getMaCodeGiamGia();
        if (maCodeGiamGia != null && !maCodeGiamGia.isBlank()) {
            var ketQuaVoucher = dichVuVoucher.apDungMa(maCodeGiamGia, tongGoc);
            soTienGiam = ketQuaVoucher.getSoTienGiam();
            maCodeGiamGia = ketQuaVoucher.getMaCode();
        }
        BigDecimal tongThanhToan = tongGoc.subtract(soTienGiam);
        List<Ticket.ComboItem> danhSachCombo = yeuCau.getDanhSachCombo() == null ? List.of() : yeuCau.getDanhSachCombo().stream()
                .map(muc -> Ticket.ComboItem.builder()
                        .comboId(muc.getMaCombo())
                        .comboName(muc.getTenCombo())
                        .quantity(muc.getSoLuong())
                        .unitPrice(muc.getDonGia())
                        .build())
                .toList();
        // Kiểm tra xem đã có vé PENDING của chính user này với cùng suất chiếu và ghế chưa
        java.util.Optional<Ticket> vePendingTonTai = khoVe.findByMaSuatChieu(suatChieu.getId()).stream()
                .filter(v -> v.getSelectedSeats() != null
                        && v.getSelectedSeats().equals(yeuCau.getDanhSachGhe())
                        && (v.getStatus() == TicketStatus.PENDING || v.getStatus() == TicketStatus.CHO_XAC_NHAN)
                        && yeuCau.getMaNguoiDung().equals(v.getUserId()))
                .findFirst();

        Ticket veLuu;
        if (vePendingTonTai.isPresent()) {
            Ticket veHienCo = vePendingTonTai.get();
            veHienCo.setTotalAmount(tongThanhToan);
            veHienCo.setSeatAmount(yeuCau.getTienGhe());
            veHienCo.setComboAmount(yeuCau.getTienBapNuoc());
            veHienCo.setCombos(danhSachCombo);
            veHienCo.setPaymentMethod(yeuCau.getHinhThucThanhToan());
            if (yeuCau.getNoiDungChuyenKhoan() != null && !yeuCau.getNoiDungChuyenKhoan().isBlank()) {
                veHienCo.setTransferContent(chuanHoaChuoi(yeuCau.getNoiDungChuyenKhoan()));
            }
            veLuu = khoVe.save(veHienCo);
        } else {
            Ticket ve = Ticket.builder()
                    .userId(yeuCau.getMaNguoiDung())
                    .showtimeId(yeuCau.getMaSuatChieu())
                    .selectedSeats(yeuCau.getDanhSachGhe())
                    .totalAmount(tongThanhToan)
                    .seatAmount(yeuCau.getTienGhe())
                    .comboAmount(yeuCau.getTienBapNuoc())
                    .voucherCode(maCodeGiamGia != null && !maCodeGiamGia.isBlank() ? maCodeGiamGia : null)
                    .discountAmount(soTienGiam.signum() > 0 ? soTienGiam : null)
                    .combos(danhSachCombo)
                    .status(TicketStatus.PENDING)
                    .paymentMethod(yeuCau.getHinhThucThanhToan())
                    .transferContent(chuanHoaChuoi(yeuCau.getNoiDungChuyenKhoan()))
                    .bookingChannel(chuanHoaKenhDatVe(yeuCau.getKenhDatVe()))
                    .createdAt(LocalDateTime.now())
                    .build();
            veLuu = khoVe.save(ve);
        }
        if (maCodeGiamGia != null && !maCodeGiamGia.isBlank() && soTienGiam.signum() > 0)
            dichVuVoucher.tangSoLuongDaDung(maCodeGiamGia);
        return veLuu;
    }

    public Ticket guiYeuCauThanhToan(String maVe) {
        nhatKy.info("guiYeuCauThanhToan: {}", maVe);
        dichVuVe.baogYeuCauXacNhan(maVe);
        return khoVe.findById(maVe).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
    }

    public Ticket taoVaGuiYeuCauCk(CreateTicketRequest yeuCau) {
        Ticket ve = taoVeSauThanhToan(yeuCau);
        dichVuVe.baogYeuCauXacNhan(ve.getId());
        return khoVe.findById(ve.getId()).orElse(ve);
    }

    public void huyVeTam(String maVe, String maNguoiDung) {
        Ticket ve = khoVe.findById(maVe).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
        if (ve.getTrangThai() != TicketStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ve khong o trang thai tam");
        if (!maNguoiDung.equals(ve.getMaNguoiDung()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Khong duoc huy ve cua nguoi khac");
        Showtime suatChieu = timSuatChieu(ve.getMaSuatChieu());
        for (String soGhe : ve.getDanhSachGheChon()) {
            Showtime.SeatStatus ghe = timGhe(suatChieu, soGhe);
            if (ghe.getTrangThai() == SeatAvailability.BOOKED) {
                ghe.setTrangThai(SeatAvailability.AVAILABLE);
                ghe.setNguoiGiuGhe(null);
                ghe.setThoiGianHetHanGiu(null);
            }
        }
        khoSuatChieu.save(suatChieu);
        ve.setTrangThai(TicketStatus.CANCELLED);
        khoVe.save(ve);
        nhatKy.info("huyVeTam: {}", maVe);
    }

    public Ticket duyetVe(String maVe) {
        nhatKy.info("duyetVe: {}", maVe);
        Ticket ve = khoVe.findById(maVe).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
        if (ve.getTrangThai() != TicketStatus.CHO_XAC_NHAN && ve.getTrangThai() != TicketStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ve khong o trang thai cho duyet");
        dichVuVePaid.danhDauThanhToanThanhCong(maVe, "admin-approve");
        dichVuEmail.guiEmailVe(maVe);
        return khoVe.findById(maVe).orElse(ve);
    }

    private Showtime timSuatChieu(String id) { return khoSuatChieu.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay suat chieu")); }
    private Showtime.SeatStatus timGhe(Showtime suatChieu, String soGhe) { return suatChieu.getTrangThaiGhe().stream().filter(ghe -> ghe.getSoGhe().equals(soGhe)).findFirst().orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ghe khong ton tai: " + soGhe)); }
    private String chuanHoaChuoi(String giaTri) {
        if (giaTri == null) return null;
        String s = giaTri.trim();
        return s.isEmpty() ? null : s;
    }

    private String chuanHoaKenhDatVe(String kenh) {
        if (kenh == null || kenh.isBlank()) return "WEB";
        String chuan = kenh.trim().toUpperCase();
        if (chuan.equals("MOBILE") || chuan.equals("APP")) return "MOBILE";
        return "WEB";
    }
}
