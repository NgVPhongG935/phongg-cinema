package com.cinema.booking.controller;

import com.cinema.booking.dto.PaymentMethodConfigDto;
import com.cinema.booking.dto.PaymentMethodConfigResponseDto;
import com.cinema.booking.service.PaymentMethodConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/payments")
public class PaymentMethodConfigController {
    private final PaymentMethodConfigService dichVuCauHinh;

    @GetMapping("/methods")
    public List<PaymentMethodConfigResponseDto> layDanhSachKichHoat() {
        return dichVuCauHinh.layDanhSachKichHoat();
    }

    @GetMapping("/admin/methods")
    @PreAuthorize("hasRole('ADMIN')")
    public List<PaymentMethodConfigResponseDto> layDanhSachAdmin() {
        return dichVuCauHinh.layDanhSachAdmin();
    }

    @PostMapping("/admin/methods")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentMethodConfigResponseDto them(@RequestBody PaymentMethodConfigDto dto) {
        return dichVuCauHinh.them(dto);
    }

    @PutMapping("/admin/methods/{ma}")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentMethodConfigResponseDto capNhat(@PathVariable String ma, @RequestBody PaymentMethodConfigDto dto) {
        return dichVuCauHinh.capNhat(ma, dto);
    }

    @DeleteMapping("/admin/methods/{ma}")
    @PreAuthorize("hasRole('ADMIN')")
    public void xoa(@PathVariable String ma) {
        dichVuCauHinh.xoa(ma);
    }

    @PostMapping("/admin/methods/{ma}/qr")
    @PreAuthorize("hasRole('ADMIN')")
    public PaymentMethodConfigResponseDto uploadQr(@PathVariable String ma, @RequestParam("file") MultipartFile file) throws Exception {
        return dichVuCauHinh.uploadQr(ma, file.getBytes(), file.getContentType());
    }
}
