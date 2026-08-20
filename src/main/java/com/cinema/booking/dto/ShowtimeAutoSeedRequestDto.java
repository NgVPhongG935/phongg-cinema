package com.cinema.booking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class ShowtimeAutoSeedRequestDto {
    private LocalDate tuNgay;
    private LocalDate denNgay;
    private LocalTime tuGio;
    private LocalTime denGio;
    private Integer thoiGianNghiPhut = 15;
    private Integer buocLamTronPhut = 15;
    private BigDecimal giaVeTuNgay = BigDecimal.valueOf(69000);
    private BigDecimal giaVeTuToi = BigDecimal.valueOf(75000);
    private Integer gioApGiaToi = 18;
    private String dinhDang = "2D Lồng Tiếng";
    private Boolean chiPhimChuaCoSuat = true;
}
