package com.cinema.booking.document;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "tickets")
public class Ticket {
    @Id
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
    private List<ComboItem> combos;

    @JsonAlias({"maQrCode"})
    private String qrCode;

    @JsonAlias({"trangThai"})
    private TicketStatus status;

    @JsonAlias({"hinhThucThanhToan"})
    private String paymentMethod;

    @JsonAlias({"ngayTao"})
    private LocalDateTime createdAt;

    /** Thời điểm nhân viên soát vé (PAID → USED) */
    @JsonAlias({"thoiGianSoatVe"})
    private LocalDateTime checkedInAt;

    @JsonAlias({"maCodeGiamGia"})
    private String voucherCode;

    @JsonAlias({"soTienGiam"})
    private BigDecimal discountAmount;

    /** Noi dung CK khach da chuyen (VD: PHONGG C4A85695) */
    @JsonAlias({"noiDungChuyenKhoan"})
    private String transferContent;

    /** Mã giao dịch cổng thanh toán (VNPay/MoMo) */
    private String paymentGatewayRef;

    /** Đã gửi email xác nhận */
    private LocalDateTime emailSentAt;

    /** Kênh đặt vé: WEB hoặc MOBILE */
    @JsonAlias({"kenhDatVe"})
    private String bookingChannel;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ComboItem {
        @JsonAlias({"maCombo"})
        private String comboId;

        @JsonAlias({"tenCombo"})
        private String comboName;

        @JsonAlias({"soLuong"})
        private Integer quantity;

        @JsonAlias({"donGia"})
        private BigDecimal unitPrice;

        public String getMaCombo() { return comboId; }
        public void setMaCombo(String v) { if (comboId == null) comboId = v; }
        public String getTenCombo() { return comboName; }
        public void setTenCombo(String v) { if (comboName == null) comboName = v; }
        public Integer getSoLuong() { return quantity; }
        public void setSoLuong(Integer v) { if (quantity == null) quantity = v; }
        public BigDecimal getDonGia() { return unitPrice; }
        public void setDonGia(BigDecimal v) { if (unitPrice == null) unitPrice = v; }
    }

    // Compatibility getters/setters
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
    public List<ComboItem> getDanhSachCombo() { return combos; }
    public void setDanhSachCombo(List<ComboItem> v) { if (combos == null) combos = v; }
    public String getMaQrCode() { return qrCode; }
    public void setMaQrCode(String v) { if (qrCode == null) qrCode = v; }
    public TicketStatus getTrangThai() { return status; }
    public void setTrangThai(TicketStatus v) { if (status == null) status = v; }
    public String getHinhThucThanhToan() { return paymentMethod; }
    public void setHinhThucThanhToan(String v) { if (paymentMethod == null) paymentMethod = v; }
    public LocalDateTime getNgayTao() { return createdAt; }
    public void setNgayTao(LocalDateTime v) { if (createdAt == null) createdAt = v; }
    public LocalDateTime getThoiGianSoatVe() { return checkedInAt; }
    public void setThoiGianSoatVe(LocalDateTime v) { if (checkedInAt == null) checkedInAt = v; }
    public String getMaCodeGiamGia() { return voucherCode; }
    public void setMaCodeGiamGia(String v) { if (voucherCode == null) voucherCode = v; }
    public BigDecimal getSoTienGiam() { return discountAmount; }
    public void setSoTienGiam(BigDecimal v) { if (discountAmount == null) discountAmount = v; }
    public String getNoiDungChuyenKhoan() { return transferContent; }
    public void setNoiDungChuyenKhoan(String v) { if (transferContent == null) transferContent = v; }
    public String getKenhDatVe() { return bookingChannel; }
    public void setKenhDatVe(String v) { if (bookingChannel == null) bookingChannel = v; }
}
