package com.cinema.booking.controller;

import com.cinema.booking.dto.CapNhatRapNhanVienRequest;
import com.cinema.booking.dto.CapNhatTrangThaiNguoiDungRequest;
import com.cinema.booking.dto.DatLaiMatKhauNhanVienRequest;
import com.cinema.booking.dto.StaffResponseDto;
import com.cinema.booking.dto.TaoNhanVienRequest;
import com.cinema.booking.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/staffs")
@PreAuthorize("hasRole('ADMIN')")
public class StaffController {
    private final StaffService dichVuNhanVien;

    @GetMapping
    public List<StaffResponseDto> layDanhSach() {
        return dichVuNhanVien.layDanhSach();
    }

    @PostMapping
    public StaffResponseDto them(@RequestBody TaoNhanVienRequest yeuCau) {
        return dichVuNhanVien.them(yeuCau);
    }

    @PutMapping("/{id}/cinema")
    public StaffResponseDto capNhatRap(@PathVariable String id, @RequestBody CapNhatRapNhanVienRequest yeuCau) {
        return dichVuNhanVien.capNhatRap(id, yeuCau);
    }

    @PutMapping("/{id}/reset-password")
    public void datLaiMatKhau(@PathVariable String id, @RequestBody DatLaiMatKhauNhanVienRequest yeuCau) {
        dichVuNhanVien.datLaiMatKhau(id, yeuCau);
    }

    @PutMapping("/{id}/status")
    public StaffResponseDto capNhatTrangThai(@PathVariable String id, @RequestBody CapNhatTrangThaiNguoiDungRequest yeuCau) {
        return dichVuNhanVien.capNhatTrangThai(id, yeuCau);
    }
}
