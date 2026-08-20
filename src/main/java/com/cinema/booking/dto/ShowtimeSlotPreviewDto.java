package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class ShowtimeSlotPreviewDto {
    private String maKhoa;
    private LocalDate ngay;
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianKetThuc;
    private BigDecimal giaVeTu;
    private String gioHienThi;
    private boolean trungLich;
    private String lyDo;
}
