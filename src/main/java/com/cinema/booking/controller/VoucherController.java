package com.cinema.booking.controller;

import com.cinema.booking.dto.ApDungVoucherRequest;
import com.cinema.booking.dto.ApDungVoucherResponseDto;
import com.cinema.booking.dto.VoucherDto;
import com.cinema.booking.dto.VoucherResponseDto;
import com.cinema.booking.service.VoucherService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/vouchers")
public class VoucherController {
    private final VoucherService dichVuVoucher;

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public List<VoucherResponseDto> layDanhSach() {
        return dichVuVoucher.layDanhSach();
    }

    @PostMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public VoucherResponseDto them(@RequestBody VoucherDto dto) {
        return dichVuVoucher.them(dto);
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public VoucherResponseDto capNhat(@PathVariable String id, @RequestBody VoucherDto dto) {
        return dichVuVoucher.capNhat(id, dto);
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void voHieuHoa(@PathVariable String id) {
        dichVuVoucher.voHieuHoa(id);
    }

    @PostMapping("/apply")
    public ApDungVoucherResponseDto apDungMa(@RequestBody ApDungVoucherRequest yeuCau) {
        return dichVuVoucher.apDungMa(yeuCau.getMaCode(), yeuCau.getTongTien());
    }
}
