package com.cinema.booking.controller;

import com.cinema.booking.dto.AdminDashboardDto;
import com.cinema.booking.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {
    private final DashboardService dichVuTongQuan;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AdminDashboardDto layTongQuan() {
        return dichVuTongQuan.layTongQuan();
    }
}
