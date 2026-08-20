package com.cinema.booking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class ShowtimeSlotDto {
    private LocalDateTime thoiGianBatDau;
    private LocalDateTime thoiGianKetThuc;
    private BigDecimal giaVeTu;
}
