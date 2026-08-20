package com.cinema.booking.controller;

import com.cinema.booking.dto.SeedResultDto;
import com.cinema.booking.service.SeedService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/seed")
public class AdminSeedController {
    private final SeedService dichVuSeed;

    @PostMapping("/rooms-showtimes")
    @PreAuthorize("hasRole('ADMIN')")
    public SeedResultDto napPhongVaSuatChieu() {
        return dichVuSeed.napPhongVaSuatChieu();
    }
}
