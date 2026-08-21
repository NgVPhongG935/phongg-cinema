package com.cinema.booking.controller;

import com.cinema.booking.document.Movie;
import com.cinema.booking.dto.MovieDto;
import com.cinema.booking.service.MovieService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/v1/movies", "/movies"})
public class MovieController {
    private final MovieService dichVuPhim;

    @GetMapping
    public Page<Movie> layDanhSachPhim(@RequestParam(required = false) String tuKhoa, @RequestParam(required = false) String trangThai, Pageable phanTrang) {
        return dichVuPhim.layDanhSachPhim(tuKhoa, trangThai, phanTrang);
    }

    @GetMapping("/search")
    public Page<Movie> timKiemPhim(@RequestParam String keyword, Pageable phanTrang) {
        return dichVuPhim.layDanhSachPhim(keyword, null, phanTrang);
    }

    @GetMapping("/{id}")
    public Movie layChiTietPhim(@PathVariable String id) {
        return dichVuPhim.layChiTietPhim(id);
    }

    @PostMapping(value = {"/admin", ""}, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Movie themPhimMoi(@RequestBody MovieDto dto) {
        return dichVuPhim.themPhimMoi(dto);
    }

    @PutMapping(value = {"/admin/{id}", "/{id}"}, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public Movie capNhatPhim(@PathVariable String id, @RequestBody MovieDto dto) {
        return dichVuPhim.capNhatPhim(id, dto);
    }

    @DeleteMapping(value = {"/admin/{id}", "/{id}"}, produces = MediaType.APPLICATION_JSON_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public void xoaPhim(@PathVariable String id) {
        dichVuPhim.xoaPhim(id);
    }

    // AI Batch Sync: Chấp nhận GET, POST, PUT để kiểm tra trực tiếp và không bị 405 Method Not Allowed
    @RequestMapping(
            value = {"/ai-batch-sync", "/admin/ai-batch-sync", "/ai-sync", "/admin/ai-sync"},
            method = {RequestMethod.POST, RequestMethod.GET, RequestMethod.PUT},
            produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> dongBoAiHangLoatPhim() {
        Map<String, Object> ketQua = dichVuPhim.dongBoAiHangLoatPhim();
        return ResponseEntity.ok(ketQua);
    }

    // AI Single Movie Sync: Chấp nhận GET, POST, PUT
    @RequestMapping(
            value = {"/ai-sync/{id}", "/{id}/ai-sync", "/admin/ai-sync/{id}", "/admin/{id}/ai-sync"},
            method = {RequestMethod.POST, RequestMethod.GET, RequestMethod.PUT},
            produces = org.springframework.http.MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<?> dongBoAiChoPhim(@PathVariable String id) {
        Movie phim = dichVuPhim.dongBoAiChoPhim(id);
        return ResponseEntity.ok(phim);
    }
}
