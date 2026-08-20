package com.cinema.booking.dto;

import com.cinema.booking.document.KieuGiamGiam;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class VoucherResponseDto {
    private String id;
    private String maCode;
    private KieuGiamGiam kieuGiam;
    private BigDecimal giaTriGiam;
    private BigDecimal giamToiDa;
    private BigDecimal donToiThieu;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private Integer soLuong;
    private Integer soLuongDaDung;
    private Integer soLuongConLai;
    private Boolean voHieuHoa;
    /** DANG_AP_DUNG | HET_HAN | HET_SO_LUONG | VO_HIEU */
    private String trangThai;
}
