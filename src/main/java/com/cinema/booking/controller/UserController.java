package com.cinema.booking.controller;

import com.cinema.booking.dto.*;
import com.cinema.booking.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/users")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {
    private final UserService dichVuNguoiDung;

    @GetMapping
    public Page<UserResponseDto> layDanhSach(
            @RequestParam(required = false) String tuKhoa,
            @RequestParam(required = false) String vaiTro,
            @RequestParam(required = false) String trangThai,
            Pageable phanTrang) {
        return dichVuNguoiDung.layDanhSach(tuKhoa, vaiTro, trangThai, phanTrang);
    }

    @GetMapping("/{id}")
    public UserResponseDto layChiTiet(@PathVariable String id) {
        return dichVuNguoiDung.layChiTiet(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponseDto taoNguoiDung(@RequestBody TaoNguoiDungRequest yeuCau) {
        return dichVuNguoiDung.taoNguoiDung(yeuCau);
    }

    @PutMapping("/{id}")
    public UserResponseDto capNhatNguoiDung(@PathVariable String id, @RequestBody CapNhatNguoiDungRequest yeuCau) {
        return dichVuNguoiDung.capNhatNguoiDung(id, yeuCau);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void xoaNguoiDung(@PathVariable String id) {
        dichVuNguoiDung.xoaNguoiDung(id);
    }

    @PutMapping("/{id}/role")
    public UserResponseDto capNhatVaiTro(@PathVariable String id, @RequestBody CapNhatVaiTroNguoiDungRequest yeuCau) {
        return dichVuNguoiDung.capNhatVaiTro(id, yeuCau);
    }

    @PutMapping("/{id}/status")
    public UserResponseDto capNhatTrangThai(@PathVariable String id, @RequestBody CapNhatTrangThaiNguoiDungRequest yeuCau) {
        return dichVuNguoiDung.capNhatTrangThai(id, yeuCau);
    }
}
