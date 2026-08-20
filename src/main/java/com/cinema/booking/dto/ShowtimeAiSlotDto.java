package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ShowtimeAiSlotDto {
    private String maKhoa;
    private String maPhim;
    private String tenPhim;
    private String maPhong;
    private String tenPhong;
    private LocalDate ngay;
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianKetThuc;
    private BigDecimal giaVeTu;
    private String dinhDang;
    private String gioHienThi;
    private String lyDoToiUu;
    private boolean trungLich;
}
