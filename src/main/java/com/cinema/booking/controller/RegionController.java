package com.cinema.booking.controller;

import com.cinema.booking.document.Region;
import com.cinema.booking.dto.RegionDto;
import com.cinema.booking.service.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/regions")
public class RegionController {
    private final RegionService dichVuKhuVuc;

    @GetMapping
    public List<Region> layDanhSachKhuVuc() { return dichVuKhuVuc.layDanhSachKhuVuc(); }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public Region themKhuVuc(@RequestBody RegionDto dto) { return dichVuKhuVuc.themKhuVuc(dto); }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Region capNhatKhuVuc(@PathVariable String id, @RequestBody RegionDto dto) { return dichVuKhuVuc.capNhatKhuVuc(id, dto); }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void xoaKhuVuc(@PathVariable String id) { dichVuKhuVuc.xoaKhuVuc(id); }
}
