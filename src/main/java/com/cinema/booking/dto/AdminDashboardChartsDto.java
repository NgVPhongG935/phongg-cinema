package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AdminDashboardChartsDto {
    private BigDecimal doanhThu;
    private long veWeb;
    private long veApp;
    private BigDecimal doanhThuWeb;
    private BigDecimal doanhThuApp;
    private List<AdminDashboardChartDto> ve7Ngay;
    private List<AdminDashboardPaymentDto> theoPhuongThuc;
}
