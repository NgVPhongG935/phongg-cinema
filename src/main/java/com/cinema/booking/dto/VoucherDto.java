package com.cinema.booking.dto;

import com.cinema.booking.document.KieuGiamGiam;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class VoucherDto {
    private String maCode;
    private KieuGiamGiam kieuGiam;
    private BigDecimal giaTriGiam;
    private BigDecimal giamToiDa;
    private BigDecimal donToiThieu;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    private Integer soLuong;
}
