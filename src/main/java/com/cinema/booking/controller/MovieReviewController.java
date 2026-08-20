package com.cinema.booking.controller;

import com.cinema.booking.dto.MovieReviewDto;
import com.cinema.booking.dto.MovieReviewSummaryDto;
import com.cinema.booking.dto.TaoMovieReviewRequest;
import com.cinema.booking.service.MovieReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/movies/{maPhim}/reviews")
public class MovieReviewController {
    private final MovieReviewService dichVuDanhGia;

    @GetMapping
    public Page<MovieReviewDto> layDanhSach(@PathVariable String maPhim, Pageable phanTrang) {
        return dichVuDanhGia.layDanhSach(maPhim, phanTrang);
    }

    @GetMapping("/summary")
    public MovieReviewSummaryDto layTomTat(@PathVariable String maPhim) {
        return dichVuDanhGia.layTomTat(maPhim);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'STAFF')")
    public MovieReviewDto taoHoacCapNhat(@PathVariable String maPhim, @RequestBody TaoMovieReviewRequest yeuCau) {
        return dichVuDanhGia.taoHoacCapNhat(maPhim, layEmail(), yeuCau);
    }

    @DeleteMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'STAFF')")
    public void xoaCuaToi(@PathVariable String maPhim) {
        dichVuDanhGia.xoaCuaToi(maPhim, layEmail());
    }

    @PostMapping("/{maDanhGia}/replies")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'STAFF')")
    public com.cinema.booking.dto.MovieReviewReplyDto taoPhanHoi(
            @PathVariable String maPhim,
            @PathVariable String maDanhGia,
            @RequestBody com.cinema.booking.dto.TaoMovieReviewReplyRequest yeuCau) {
        return dichVuDanhGia.taoPhanHoi(maPhim, maDanhGia, layEmail(), yeuCau);
    }

    @DeleteMapping("/{maDanhGia}/replies/{maPhanHoi}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN', 'STAFF')")
    public void xoaPhanHoi(
            @PathVariable String maPhim,
            @PathVariable String maDanhGia,
            @PathVariable String maPhanHoi) {
        dichVuDanhGia.xoaPhanHoi(maPhim, maDanhGia, maPhanHoi, layEmail());
    }

    private String layEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chua dang nhap");
        return auth.getPrincipal().toString();
    }
}
