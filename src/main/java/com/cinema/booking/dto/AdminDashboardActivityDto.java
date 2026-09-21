package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class AdminDashboardActivityDto {
    private List<AdminDashboardItemDto> suatSapToi;
    private List<AdminDashboardItemDto> veGanDay;
}
