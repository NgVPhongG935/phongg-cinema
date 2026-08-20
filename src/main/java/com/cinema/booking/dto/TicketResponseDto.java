package com.cinema.booking.dto;

import com.cinema.booking.document.TicketStatus;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDto {
    private String id;

    @JsonAlias({"maNguoiDung"})
    private String userId;

    @JsonAlias({"maSuatChieu"})
    private String showtimeId;

    @JsonAlias({"danhSachGheChon", "danhSachGhe"})
    private List<String> selectedSeats;

    @JsonAlias({"tongTien"})
    private BigDecimal totalAmount;

    @JsonAlias({"tienGhe"})
    private BigDecimal seatAmount;

    @JsonAlias({"tienBapNuoc"})
    private BigDecimal comboAmount;

    @JsonAlias({"danhSachCombo"})
    private List<ComboItemDto> combos;

    @JsonAlias({"maQrCode"})
    private String qrCode;

    @JsonAlias({"trangThai"})
    private TicketStatus status;

    @JsonAlias({"hinhThucThanhToan"})
    private String paymentMethod;

    @JsonAlias({"ngayTao"})
    private LocalDateTime createdAt;

    // Phim & Rạp
    @JsonAlias({"tenPhim"})
    private String movieTitle;

    @JsonAlias({"tenRap"})
    private String cinemaName;

    @JsonAlias({"maPhong"})
    private String roomId;

    @JsonAlias({"dinhDang"})
    private String format;

    @JsonAlias({"anhPoster", "hinhAnh"})
    private String posterUrl;

    @JsonAlias({"thoiLuong"})
    private Integer duration;

    @JsonAlias({"theLoai"})
    private List<String> genres;

    @JsonAlias({"gioiHanTuoi"})
    private String ageRating;

    @JsonAlias({"thoiGianBatDau"})
    private LocalDateTime startTime;

    @JsonAlias({"thoiGianKetThuc"})
    private LocalDateTime endTime;

    @JsonAlias({"thoiGianSoatVe"})
    private LocalDateTime checkedInAt;

    @JsonAlias({"maCodeGiamGia"})
    private String voucherCode;

    @JsonAlias({"soTienGiam"})
    private BigDecimal discountAmount;

    @JsonAlias({"noiDungChuyenKhoan"})
    private String transferContent;

    /** Họ tên / email / SĐT người đặt (tra cứu từ tài khoản) */
    @JsonAlias({"hoTenNguoiDung"})
    private String customerName;

    @JsonAlias({"emailNguoiDung"})
    private String customerEmail;

    @JsonAlias({"soDienThoaiNguoiDung"})
    private String customerPhone;

    /** Cảnh báo / hướng dẫn khi tra cứu hoặc soát (chưa tới giờ, sai ngày, đã soát…) */
    @JsonAlias({"thongBaoSoat"})
    private String checkInMessage;

    /** Có thể bấm xác nhận soát ngay */
    @JsonAlias({"coTheSoat"})
    private Boolean canCheckIn;

    // Helper methods for backward compatibility
    public String getTenPhim() { return movieTitle; }
    public void setTenPhim(String v) { if (movieTitle == null) movieTitle = v; }

    public String getTenRap() { return cinemaName; }
    public void setTenRap(String v) { if (cinemaName == null) cinemaName = v; }

    public String getMaPhong() { return roomId; }
    public void setMaPhong(String v) { if (roomId == null) roomId = v; }

    public String getDinhDang() { return format; }
    public void setDinhDang(String v) { if (format == null) format = v; }

    public String getAnhPoster() { return posterUrl; }
    public void setAnhPoster(String v) { if (posterUrl == null) posterUrl = v; }

    public Integer getThoiLuong() { return duration; }
    public void setThoiLuong(Integer v) { if (duration == null) duration = v; }

    public List<String> getTheLoai() { return genres; }
    public void setTheLoai(List<String> v) { if (genres == null) genres = v; }

    public String getGioiHanTuoi() { return ageRating; }
    public void setGioiHanTuoi(String v) { if (ageRating == null) ageRating = v; }

    public LocalDateTime getThoiGianBatDau() { return startTime; }
    public void setThoiGianBatDau(LocalDateTime v) { if (startTime == null) startTime = v; }

    public LocalDateTime getThoiGianKetThuc() { return endTime; }
    public void setThoiGianKetThuc(LocalDateTime v) { if (endTime == null) endTime = v; }

    public LocalDateTime getThoiGianSoatVe() { return checkedInAt; }
    public void setThoiGianSoatVe(LocalDateTime v) { if (checkedInAt == null) checkedInAt = v; }

    public String getMaCodeGiamGia() { return voucherCode; }
    public void setMaCodeGiamGia(String v) { if (voucherCode == null) voucherCode = v; }

    public BigDecimal getSoTienGiam() { return discountAmount; }
    public void setSoTienGiam(BigDecimal v) { if (discountAmount == null) discountAmount = v; }

    public String getNoiDungChuyenKhoan() { return transferContent; }
    public void setNoiDungChuyenKhoan(String v) { if (transferContent == null) transferContent = v; }

    public String getHoTenNguoiDung() { return customerName; }
    public void setHoTenNguoiDung(String v) { if (customerName == null) customerName = v; }

    public String getEmailNguoiDung() { return customerEmail; }
    public void setEmailNguoiDung(String v) { if (customerEmail == null) customerEmail = v; }

    public String getSoDienThoaiNguoiDung() { return customerPhone; }
    public void setSoDienThoaiNguoiDung(String v) { if (customerPhone == null) customerPhone = v; }

    public String getThongBaoSoat() { return checkInMessage; }
    public void setThongBaoSoat(String v) { if (checkInMessage == null) checkInMessage = v; }

    public Boolean getCoTheSoat() { return canCheckIn; }
    public void setCoTheSoat(Boolean v) { if (canCheckIn == null) canCheckIn = v; }

    public String getMaNguoiDung() { return userId; }
    public void setMaNguoiDung(String v) { if (userId == null) userId = v; }

    public String getMaSuatChieu() { return showtimeId; }
    public void setMaSuatChieu(String v) { if (showtimeId == null) showtimeId = v; }

    public List<String> getDanhSachGheChon() { return selectedSeats; }
    public void setDanhSachGheChon(List<String> v) { if (selectedSeats == null) selectedSeats = v; }

    public BigDecimal getTongTien() { return totalAmount; }
    public void setTongTien(BigDecimal v) { if (totalAmount == null) totalAmount = v; }

    public BigDecimal getTienGhe() { return seatAmount; }
    public void setTienGhe(BigDecimal v) { if (seatAmount == null) seatAmount = v; }

    public BigDecimal getTienBapNuoc() { return comboAmount; }
    public void setTienBapNuoc(BigDecimal v) { if (comboAmount == null) comboAmount = v; }

    public List<ComboItemDto> getDanhSachCombo() { return combos; }
    public void setDanhSachCombo(List<ComboItemDto> v) { if (combos == null) combos = v; }

    public String getMaQrCode() { return qrCode; }
    public void setMaQrCode(String v) { if (qrCode == null) qrCode = v; }

    public TicketStatus getTrangThai() { return status; }
    public void setTrangThai(TicketStatus v) { if (status == null) status = v; }

    public String getHinhThucThanhToan() { return paymentMethod; }
    public void setHinhThucThanhToan(String v) { if (paymentMethod == null) paymentMethod = v; }

    public LocalDateTime getNgayTao() { return createdAt; }
    public void setNgayTao(LocalDateTime v) { if (createdAt == null) createdAt = v; }
}
