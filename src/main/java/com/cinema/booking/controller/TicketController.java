package com.cinema.booking.controller;

import com.cinema.booking.dto.TicketResponseDto;
import com.cinema.booking.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tickets")
public class TicketController {
    private final TicketService dichVuVe;

    @GetMapping("/my-tickets")
    public List<TicketResponseDto> layDanhSachVeCuaToi(@RequestParam String maNguoiDung, @RequestParam(required = false) String tuKhoa) {
        return dichVuVe.layDanhSachVeCuaToi(maNguoiDung, tuKhoa);
    }

    @PostMapping("/staff/scan-qr") @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public TicketResponseDto soatVeQrcode(@RequestParam String maQrCode) {
        return dichVuVe.soatVeQrcode(maQrCode);
    }

    @GetMapping("/staff/preview-qr") @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public TicketResponseDto traCuuVeQrcode(@RequestParam String maQrCode) {
        return dichVuVe.traCuuVeQrcode(maQrCode);
    }

    @GetMapping("/staff/scanned-today") @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public List<TicketResponseDto> layVeDaSoatHomNay() {
        return dichVuVe.layVeDaSoatHomNay();
    }

    @GetMapping("/admin/pending") @PreAuthorize("hasRole('ADMIN')")
    public List<TicketResponseDto> layVeChoThanhToan() { return dichVuVe.layVeChoThanhToan(); }

    @GetMapping("/admin/confirmed") @PreAuthorize("hasRole('ADMIN')")
    public List<TicketResponseDto> layVeDaXacNhan() { return dichVuVe.layVeDaXacNhan(); }

    @PostMapping("/admin/{maVe}/confirm-payment") @PreAuthorize("hasRole('ADMIN')")
    public TicketResponseDto xacNhanThanhToan(@PathVariable String maVe) { return dichVuVe.xacNhanThanhToan(maVe); }
}
