package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminDashboardChartDto {
    private String nhan;
    private long soVe;
    private BigDecimal doanhThu;
    private long veWeb;
    private long veApp;
    private BigDecimal doanhThuWeb;
    private BigDecimal doanhThuApp;
}
