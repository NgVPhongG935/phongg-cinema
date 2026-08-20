package com.cinema.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateTicketRequest {
    @JsonAlias({"maSuatChieu"})
    private String showtimeId;

    @JsonAlias({"danhSachGhe", "danhSachGheChon"})
    private List<String> seats;

    @JsonAlias({"maNguoiDung"})
    private String userId;

    @JsonAlias({"tongTien"})
    private BigDecimal totalAmount;

    @JsonAlias({"tienGhe"})
    private BigDecimal seatAmount;

    @JsonAlias({"tienBapNuoc"})
    private BigDecimal comboAmount;

    @JsonAlias({"danhSachCombo"})
    private List<ComboItemDto> combos;

    @JsonAlias({"hinhThucThanhToan"})
    private String paymentMethod;

    /** Mã voucher khách áp dụng (tùy chọn) */
    @JsonAlias({"maCodeGiamGia"})
    private String voucherCode;

    /** Noi dung CK de admin doi chieu (VD: PHONGG C4A85695) */
    @JsonAlias({"noiDungChuyenKhoan"})
    private String transferContent;

    /** Kênh đặt: WEB (mặc định) hoặc MOBILE */
    @JsonAlias({"kenhDatVe"})
    private String bookingChannel;

    // Helper getters for backward compatibility
    public String getMaSuatChieu() { return showtimeId; }
    public void setMaSuatChieu(String v) { if (showtimeId == null) showtimeId = v; }

    public List<String> getDanhSachGhe() { return seats; }
    public void setDanhSachGhe(List<String> v) { if (seats == null) seats = v; }

    public String getMaNguoiDung() { return userId; }
    public void setMaNguoiDung(String v) { if (userId == null) userId = v; }

    public BigDecimal getTongTien() { return totalAmount; }
    public void setTongTien(BigDecimal v) { if (totalAmount == null) totalAmount = v; }

    public BigDecimal getTienGhe() { return seatAmount; }
    public void setTienGhe(BigDecimal v) { if (seatAmount == null) seatAmount = v; }

    public BigDecimal getTienBapNuoc() { return comboAmount; }
    public void setTienBapNuoc(BigDecimal v) { if (comboAmount == null) comboAmount = v; }

    public List<ComboItemDto> getDanhSachCombo() { return combos; }
    public void setDanhSachCombo(List<ComboItemDto> v) { if (combos == null) combos = v; }

    public String getHinhThucThanhToan() { return paymentMethod; }
    public void setHinhThucThanhToan(String v) { if (paymentMethod == null) paymentMethod = v; }

    public String getMaCodeGiamGia() { return voucherCode; }
    public void setMaCodeGiamGia(String v) { if (voucherCode == null) voucherCode = v; }

    public String getNoiDungChuyenKhoan() { return transferContent; }
    public void setNoiDungChuyenKhoan(String v) { if (transferContent == null) transferContent = v; }

    public String getKenhDatVe() { return bookingChannel; }
    public void setKenhDatVe(String v) { if (bookingChannel == null) bookingChannel = v; }
}
