package com.cinema.booking.controller;

import com.cinema.booking.dto.ComboDto;
import com.cinema.booking.dto.ComboResponseDto;
import com.cinema.booking.service.ComboService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/combos")
public class ComboController {
    private final ComboService dichVuCombo;

    @GetMapping
    public List<ComboResponseDto> layDanhSach(Authentication xacThuc) {
        boolean laAdmin = xacThuc != null && xacThuc.getAuthorities().stream()
                .anyMatch(quyen -> "ROLE_ADMIN".equals(quyen.getAuthority()));
        return dichVuCombo.layDanhSach(laAdmin);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ComboResponseDto them(@RequestBody ComboDto dto) {
        return dichVuCombo.them(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ComboResponseDto capNhat(@PathVariable String id, @RequestBody ComboDto dto) {
        return dichVuCombo.capNhat(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void xoa(@PathVariable String id) {
        dichVuCombo.xoa(id);
    }
}
