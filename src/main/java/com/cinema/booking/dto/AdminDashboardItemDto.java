package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class AdminDashboardItemDto {
    private String id;
    private String tieuDe;
    private String phuDe;
    private String giaTri;
    private BigDecimal soTien;
}
