package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ApDungVoucherResponseDto {
    private String maCode;
    private String maVoucher;
    private BigDecimal tongTienGoc;
    private BigDecimal soTienGiam;
    private BigDecimal tongTienSauGiam;
    private String thongBao;
}
