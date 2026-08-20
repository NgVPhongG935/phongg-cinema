package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class AdminDashboardDto {
    private long tongPhim;
    private long tongRap;
    private long tongKhuVuc;
    private long tongSuatChieu;
    private long suatHomNay;
    private long tongVe;
    private long veHomNay;
    private BigDecimal doanhThu;
    private List<AdminDashboardItemDto> suatSapToi;
    private List<AdminDashboardItemDto> veGanDay;
    private List<AdminDashboardChartDto> ve7Ngay;
    private long veWeb;
    private long veApp;
    private long veWebHomNay;
    private long veAppHomNay;
    private BigDecimal doanhThuWeb;
    private BigDecimal doanhThuApp;
    private BigDecimal doanhThuWebHomNay;
    private BigDecimal doanhThuAppHomNay;
    private List<AdminDashboardPaymentDto> theoPhuongThuc;
}
