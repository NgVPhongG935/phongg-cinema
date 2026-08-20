package com.cinema.booking.dto;

import lombok.Data;

@Data
public class PaymentMethodConfigDto {
    private String ma;
    private String ten;
    private String moTa;
    private String mau;
    private String loaiCong;
    private Integer thuTu;
    private String soTaiKhoan;
    private String soDienThoai;
    private String tenTaiKhoan;
    private String chiNhanh;
    private String anhQr;
    private Boolean kichHoat;
}
