package com.cinema.booking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ShowtimeGenerateRequestDto {
    private String maPhim;
    private String maRap;
    private String maPhong;
    private LocalDate tuNgay;
    private LocalDate denNgay;
    private LocalTime tuGio;
    private LocalTime denGio;
    private Integer thoiGianNghiPhut = 15;
    private Integer buocLamTronPhut = 15;
    private BigDecimal giaVeTuNgay = BigDecimal.valueOf(69000);
    private BigDecimal giaVeTuToi = BigDecimal.valueOf(75000);
    private Integer gioApGiaToi = 18;
}
