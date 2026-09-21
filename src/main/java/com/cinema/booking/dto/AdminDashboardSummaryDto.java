package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminDashboardSummaryDto {
    private long tongPhim;
    private long tongRap;
    private long tongKhuVuc;
    private long tongSuatChieu;
    private long suatHomNay;
    private long tongVe;
    private long veHomNay;
    private long veWebHomNay;
    private long veAppHomNay;
    private BigDecimal doanhThuWebHomNay;
    private BigDecimal doanhThuAppHomNay;
}
