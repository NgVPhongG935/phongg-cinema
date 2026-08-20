package com.cinema.booking.controller;

import com.cinema.booking.document.Movie;
import com.cinema.booking.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/phim")
public class PhimController {
    private final MovieService dichVuPhim;

    @GetMapping("/search")
    public Page<Movie> timKiemPhim(@RequestParam String keyword, Pageable phanTrang) {
        return dichVuPhim.layDanhSachPhim(keyword, null, phanTrang);
    }
}
