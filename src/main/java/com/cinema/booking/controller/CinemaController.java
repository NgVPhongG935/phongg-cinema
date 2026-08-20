package com.cinema.booking.controller;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Cinema.Room;
import com.cinema.booking.document.Cinema.Seat;
import com.cinema.booking.dto.CinemaDto;
import com.cinema.booking.dto.RoomDto;
import com.cinema.booking.dto.RoomSeatLayoutDto;
import com.cinema.booking.service.CinemaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/cinemas")
public class CinemaController {
    private final CinemaService dichVuRap;

    @GetMapping("/regions")
    public List<String> layDanhSachKhuVuc() { return dichVuRap.layDanhSachKhuVuc(); }

    @GetMapping
    public List<Cinema> layDanhSachRap(@RequestParam(required = false) String khuVuc) {
        return dichVuRap.layDanhSachRap(khuVuc);
    }

    @GetMapping("/{id}")
    public Cinema layChiTietRap(@PathVariable String id) { return dichVuRap.layChiTietRap(id); }

    @GetMapping("/{id}/rooms")
    public List<Room> layDanhSachPhong(@PathVariable String id) { return dichVuRap.layDanhSachPhong(id); }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Cinema themRapMoi(@RequestBody CinemaDto dto) { return dichVuRap.themRapMoi(dto); }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Cinema capNhatRap(@PathVariable String id, @RequestBody CinemaDto dto) { return dichVuRap.capNhatRap(id, dto); }

    @PostMapping("/{id}/rooms/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Room themPhong(@PathVariable String id, @RequestBody RoomDto dto) { return dichVuRap.themPhong(id, dto); }

    @PutMapping("/{id}/rooms/admin/{maPhong}")
    @PreAuthorize("hasRole('ADMIN')")
    public Room capNhatPhong(@PathVariable String id, @PathVariable String maPhong, @RequestBody RoomDto dto) {
        return dichVuRap.capNhatPhong(id, maPhong, dto);
    }

    @DeleteMapping("/{id}/rooms/admin/{maPhong}")
    @PreAuthorize("hasRole('ADMIN')")
    public void xoaPhong(@PathVariable String id, @PathVariable String maPhong) { dichVuRap.xoaPhong(id, maPhong); }

    @GetMapping("/{id}/rooms/{maPhong}/seats")
    @PreAuthorize("hasRole('ADMIN')")
    public RoomSeatLayoutDto laySoDoGhePhong(@PathVariable String id, @PathVariable String maPhong) {
        return dichVuRap.laySoDoGhePhong(id, maPhong);
    }

    @PutMapping("/{id}/rooms/admin/{maPhong}/seats")
    @PreAuthorize("hasRole('ADMIN')")
    public RoomSeatLayoutDto capNhatSoDoGhePhong(@PathVariable String id, @PathVariable String maPhong, @RequestBody List<Seat> danhSachGhe) {
        return dichVuRap.capNhatSoDoGhePhong(id, maPhong, danhSachGhe);
    }
}
