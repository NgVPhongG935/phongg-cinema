package com.cinema.booking.service;

import com.cinema.booking.document.PhuongThucThanhToan;
import com.cinema.booking.document.Movie;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.document.User;
import com.cinema.booking.dto.ComboItemDto;
import com.cinema.booking.dto.TicketResponseDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.repository.UserRepository;
import com.cinema.booking.util.KiemTraThoiGianSoatVe;
import com.cinema.booking.util.MaVeQrUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {
    private static final DateTimeFormatter DINH_DANG_TIM_KIEM = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("vi-VN"));

    private final TicketRepository khoVe;
    private final ShowtimeRepository khoSuatChieu;
    private final MovieRepository khoPhim;
    private final CinemaRepository khoRap;
    private final UserRepository khoNguoiDung;
    private final TicketPaidService dichVuVePaid;

    private record BangTraCuu(
            Map<String, Showtime> suatTheoMa,
            Map<String, Movie> phimTheoMa,
            Map<String, String> tenRapTheoMa
    ) {}

    public List<TicketResponseDto> layDanhSachVeCuaToi(String maNguoiDung, String tuKhoa) {
        List<Ticket> danhSachVe = khoVe.findByMaNguoiDungOrderByIdDesc(maNguoiDung);
        String khoa = chuanHoaTuKhoa(tuKhoa);
        return chuyenDoiDanhSachVe(danhSachVe).stream()
                .filter(ve -> khoa.isEmpty() || khopTuKhoa(ve, khoa))
                .toList();
    }

    public List<TicketResponseDto> layVeChoThanhToan() {
        List<Ticket> gop = khoVe.findByTrangThaiInOrderByNgayTaoDesc(
                List.of(TicketStatus.PENDING, TicketStatus.CHO_XAC_NHAN));
        return chuyenDoiDanhSachVe(gop.stream().filter(this::veCanAdminDuyetThuCong).toList());
    }

    /** Vé cần admin duyệt tay: đã báo CK hoặc CK/MoMo thủ công — bỏ vé cổng online chưa thanh toán */
    private boolean veCanAdminDuyetThuCong(Ticket ve) {
        if (ve.getTrangThai() == TicketStatus.CHO_XAC_NHAN) return true;
        if (ve.getTrangThai() != TicketStatus.PENDING) return false;
        PhuongThucThanhToan ht = PhuongThucThanhToan.chuanHoa(ve.getHinhThucThanhToan());
        if (ht == null) return true;
        return ht == PhuongThucThanhToan.BANK_TRANSFER || ht == PhuongThucThanhToan.MOMO;
    }

    public TicketResponseDto baogYeuCauXacNhan(String maVe) {
        Ticket ve = khoVe.findById(maVe).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
        if (ve.getTrangThai() != TicketStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ve khong o trang thai cho bao chuyen khoan");
        ve.setTrangThai(TicketStatus.CHO_XAC_NHAN);
        return chuyenDoiVe(khoVe.save(ve));
    }

    public TicketResponseDto xacNhanThanhToan(String maVe) {
        Ticket ve = khoVe.findById(maVe).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
        if (ve.getTrangThai() != TicketStatus.CHO_XAC_NHAN && ve.getTrangThai() != TicketStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ve khong o trang thai cho duyet");
        dichVuVePaid.danhDauThanhToanThanhCong(maVe, "admin-confirm");
        return chuyenDoiVe(khoVe.findById(maVe).orElse(ve));
    }

    public List<TicketResponseDto> layVeDaXacNhan() {
        return chuyenDoiDanhSachVe(khoVe.findByTrangThaiOrderByNgayTaoDesc(TicketStatus.PAID));
    }

    public List<TicketResponseDto> layVeDaSoatHomNay() {
        LocalDate homNay = LocalDate.now();
        LocalDateTime tu = homNay.atStartOfDay();
        LocalDateTime den = homNay.plusDays(1).atStartOfDay();
        List<Ticket> danhSachVe = khoVe.findByTrangThaiAndThoiGianSoatVeBetweenOrderByThoiGianSoatVeDesc(
                TicketStatus.USED, tu, den);
        return chuyenDoiDanhSachVe(danhSachVe);
    }

    public TicketResponseDto traCuuVeQrcode(String maQrCode) {
        Ticket ve = timVeTheoMa(maQrCode);
        return chuyenDoiVeVoiKiemTraSoat(ve);
    }

    public TicketResponseDto soatVeQrcode(String maQrCode) {
        Ticket ve = timVeTheoMa(maQrCode);
        Showtime suat = laySuatChieu(ve.getMaSuatChieu());
        KiemTraThoiGianSoatVe.KetQua kiemTra = KiemTraThoiGianSoatVe.kiemTra(ve, suat, LocalDateTime.now());
        if (!kiemTra.coTheSoat())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, kiemTra.thongBao());
        ve.setTrangThai(TicketStatus.USED);
        ve.setThoiGianSoatVe(LocalDateTime.now());
        return chuyenDoiVe(khoVe.save(ve));
    }

    private Showtime laySuatChieu(String maSuat) {
        if (maSuat == null) return null;
        return khoSuatChieu.findById(maSuat).orElse(null);
    }

    private Ticket timVeTheoMa(String ma) {
        String raw = ma != null ? ma.trim() : "";
        String maChuan = MaVeQrUtil.chuanHoaMaQuet(ma);
        if (maChuan.isEmpty())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma QR khong hop le");
        java.util.Optional<Ticket> ketQua = khoVe.findById(maChuan);
        if (ketQua.isEmpty() && !raw.isEmpty())
            ketQua = khoVe.findByMaQrCode(raw);
        if (ketQua.isEmpty())
            ketQua = khoVe.findByMaQrCode(maChuan);
        if (ketQua.isEmpty())
            ketQua = khoVe.findByMaQrCode(MaVeQrUtil.taoMaQr(maChuan));
        return ketQua.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
    }

    public TicketResponseDto chuyenDoiVe(Ticket ve) {
        List<TicketResponseDto> ketQua = chuyenDoiDanhSachVe(List.of(ve));
        return ketQua.isEmpty() ? TicketResponseDto.builder().id(ve.getId()).build() : ketQua.get(0);
    }

    private TicketResponseDto chuyenDoiVeVoiKiemTraSoat(Ticket ve) {
        Showtime suat = laySuatChieu(ve.getMaSuatChieu());
        KiemTraThoiGianSoatVe.KetQua kiemTra = KiemTraThoiGianSoatVe.kiemTra(ve, suat, LocalDateTime.now());
        TicketResponseDto dto = chuyenDoiVe(ve);
        dto.setThongBaoSoat(kiemTra.thongBao());
        dto.setCoTheSoat(kiemTra.coTheSoat());
        return dto;
    }

    private List<TicketResponseDto> chuyenDoiDanhSachVe(List<Ticket> danhSachVe) {
        if (danhSachVe.isEmpty()) return List.of();
        BangTraCuu bang = taoBangTraCuuTuVe(danhSachVe);
        Map<String, User> nguoiTheoMa = taoBangNguoiDungTuVe(danhSachVe);
        return danhSachVe.stream()
                .map(ve -> chuyenDoiVe(ve, bang.suatTheoMa(), bang.phimTheoMa(), bang.tenRapTheoMa(), nguoiTheoMa))
                .toList();
    }

    private BangTraCuu taoBangTraCuuTuVe(List<Ticket> danhSachVe) {
        Set<String> maSuat = danhSachVe.stream()
                .map(Ticket::getMaSuatChieu)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (maSuat.isEmpty())
            return new BangTraCuu(Map.of(), Map.of(), Map.of());

        List<Showtime> suatList = khoSuatChieu.findAllById(maSuat);
        Map<String, Showtime> suatTheoMa = suatList.stream()
                .collect(Collectors.toMap(Showtime::getId, suat -> suat, (a, b) -> a));

        Set<String> maPhim = new HashSet<>();
        Set<String> maRap = new HashSet<>();
        for (Showtime suat : suatList) {
            if (suat.getMaPhim() != null) maPhim.add(suat.getMaPhim());
            if (suat.getMaRap() != null) maRap.add(suat.getMaRap());
        }

        Map<String, Movie> phimTheoMa = maPhim.isEmpty() ? Map.of() :
                khoPhim.findAllById(maPhim).stream()
                        .collect(Collectors.toMap(Movie::getId, phim -> phim, (a, b) -> a));
        Map<String, String> tenRapTheoMa = maRap.isEmpty() ? Map.of() :
                khoRap.findAllById(maRap).stream()
                        .collect(Collectors.toMap(com.cinema.booking.document.Cinema::getId,
                                com.cinema.booking.document.Cinema::getTenRap, (a, b) -> a));

        return new BangTraCuu(suatTheoMa, phimTheoMa, tenRapTheoMa);
    }

    private Map<String, User> taoBangNguoiDungTuVe(List<Ticket> danhSachVe) {
        Set<String> maNguoi = danhSachVe.stream()
                .map(Ticket::getMaNguoiDung)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (maNguoi.isEmpty()) return Map.of();
        return khoNguoiDung.findAllById(maNguoi).stream()
                .collect(Collectors.toMap(User::getId, nguoi -> nguoi, (a, b) -> a));
    }

    private TicketResponseDto chuyenDoiVe(Ticket ve, Map<String, Showtime> suatTheoMa, Map<String, Movie> phimTheoMa,
            Map<String, String> tenRapTheoMa, Map<String, User> nguoiTheoMa) {
        Showtime suat = suatTheoMa.get(ve.getMaSuatChieu());
        Movie phim = suat != null ? phimTheoMa.get(suat.getMaPhim()) : null;
        String tenPhim = phim != null ? phim.getTitle() : "Phim";
        String tenRap = suat != null ? tenRapTheoMa.getOrDefault(suat.getMaRap(), "Rạp chiếu") : "Rạp chiếu";
        User nguoiDung = nguoiTheoMa.get(ve.getMaNguoiDung());
        List<ComboItemDto> danhSachComboDto = ve.getDanhSachCombo() == null ? List.of() : ve.getDanhSachCombo().stream()
                .map(muc -> {
                    ComboItemDto dto = new ComboItemDto();
                    dto.setMaCombo(muc.getMaCombo());
                    dto.setTenCombo(muc.getTenCombo());
                    dto.setSoLuong(muc.getSoLuong());
                    dto.setDonGia(muc.getDonGia());
                    return dto;
                })
                .toList();
        return TicketResponseDto.builder()
                .id(ve.getId())
                .userId(ve.getUserId())
                .showtimeId(ve.getShowtimeId())
                .selectedSeats(ve.getSelectedSeats())
                .totalAmount(ve.getTotalAmount())
                .seatAmount(ve.getSeatAmount())
                .comboAmount(ve.getComboAmount())
                .combos(danhSachComboDto)
                .qrCode(ve.getQrCode())
                .status(ve.getStatus())
                .paymentMethod(ve.getPaymentMethod())
                .createdAt(ve.getCreatedAt())
                .checkedInAt(ve.getCheckedInAt())
                .movieTitle(tenPhim)
                .cinemaName(tenRap)
                .roomId(suat != null ? suat.getRoomId() : null)
                .format(suat != null ? suat.getFormat() : null)
                .posterUrl(phim != null ? phim.getPosterUrl() : null)
                .duration(phim != null ? phim.getDuration() : null)
                .genres(phim != null ? phim.getGenres() : null)
                .ageRating(phim != null ? phim.getAgeRating() : null)
                .startTime(suat != null ? suat.getStartTime() : null)
                .endTime(suat != null ? suat.getEndTime() : null)
                .customerName(nguoiDung != null ? nguoiDung.getHoTen() : null)
                .customerEmail(nguoiDung != null ? nguoiDung.getEmail() : null)
                .customerPhone(nguoiDung != null ? nguoiDung.getSoDienThoai() : null)
                .voucherCode(ve.getVoucherCode())
                .discountAmount(ve.getDiscountAmount())
                .transferContent(ve.getTransferContent())
                .build();
    }

    private boolean khopTuKhoa(TicketResponseDto ve, String khoa) {
        String noiDung = String.join(" ",
                ve.getTenPhim() != null ? ve.getTenPhim() : "",
                ve.getTenRap() != null ? ve.getTenRap() : "",
                ve.getMaPhong() != null ? ve.getMaPhong() : "",
                dinhDangTimKiem(ve.getThoiGianBatDau()),
                dinhDangTimKiem(ve.getThoiGianKetThuc()),
                dinhDangTimKiem(ve.getNgayTao()),
                ve.getDanhSachGheChon() != null ? String.join(" ", ve.getDanhSachGheChon()) : ""
        ).toLowerCase(Locale.ROOT);
        return noiDung.contains(khoa);
    }

    private String dinhDangTimKiem(LocalDateTime thoiGian) {
        return thoiGian != null ? DINH_DANG_TIM_KIEM.format(thoiGian) : "";
    }

    private String chuanHoaTuKhoa(String tuKhoa) {
        return tuKhoa == null ? "" : tuKhoa.trim().toLowerCase(Locale.ROOT);
    }
}
