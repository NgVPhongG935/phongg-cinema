package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentMethodConfigResponseDto {
    private String ma;
    private String ten;
    private String moTa;
    private String mau;
    private String soTaiKhoan;
    private String soDienThoai;
    private String tenTaiKhoan;
    private String chiNhanh;
    private String anhQr;
    private Boolean kichHoat;
    private Integer thuTu;
    private String loaiCong;
}
