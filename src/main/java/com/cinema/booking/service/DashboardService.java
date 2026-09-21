package com.cinema.booking.service;

import com.cinema.booking.dto.AdminDashboardDto;
import com.cinema.booking.dto.AdminDashboardActivityDto;
import com.cinema.booking.dto.AdminDashboardChartsDto;
import com.cinema.booking.dto.AdminDashboardSummaryDto;

public interface DashboardService {
    AdminDashboardDto layTongQuan();
    AdminDashboardSummaryDto layTomTat();
    AdminDashboardChartsDto layBieuDo();
    AdminDashboardActivityDto layHoatDong();
}
