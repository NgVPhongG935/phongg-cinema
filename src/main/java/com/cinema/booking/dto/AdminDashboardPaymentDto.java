package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminDashboardPaymentDto {
    private String nhan;
    private long soVe;
    private BigDecimal doanhThu;
}
