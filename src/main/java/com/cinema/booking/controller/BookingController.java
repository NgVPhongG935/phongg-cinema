package com.cinema.booking.controller;

import com.cinema.booking.dto.CreateTicketRequest;
import com.cinema.booking.dto.HoldSeatsRequest;
import com.cinema.booking.dto.HoldSeatsResponse;
import com.cinema.booking.dto.TicketResponseDto;
import com.cinema.booking.service.BookingService;
import com.cinema.booking.service.TicketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/bookings")
public class BookingController {
    private final BookingService dichVuDatVe;
    private final TicketService dichVuVe;

    @PostMapping("/hold-seats")
    public HoldSeatsResponse giuGheTamThoi(@RequestBody HoldSeatsRequest yeuCau, @RequestParam String maNguoiDung) {
        return dichVuDatVe.giuGheTamThoi(yeuCau, maNguoiDung);
    }

    @PostMapping("/create-ticket")
    public TicketResponseDto taoVeSauThanhToan(@RequestBody CreateTicketRequest yeuCau) {
        log.info("create-ticket: maSuat={}, ghe={}, hinhThuc={}", yeuCau.getMaSuatChieu(), yeuCau.getDanhSachGhe(), yeuCau.getHinhThucThanhToan());
        return dichVuVe.chuyenDoiVe(dichVuDatVe.taoVeSauThanhToan(yeuCau));
    }

    @PostMapping("/confirm-pending")
    public TicketResponseDto taoVaGuiYeuCauCk(@RequestBody CreateTicketRequest yeuCau) {
        return dichVuVe.chuyenDoiVe(dichVuDatVe.taoVaGuiYeuCauCk(yeuCau));
    }

    @PutMapping("/{id}/submit-payment")
    public TicketResponseDto guiYeuCauThanhToan(@PathVariable String id) {
        return dichVuVe.chuyenDoiVe(dichVuDatVe.guiYeuCauThanhToan(id));
    }

    @PostMapping("/{id}/confirm-transfer")
    public TicketResponseDto xacNhanChuyenKhoan(@PathVariable String id) {
        log.info("confirm-transfer: maVe={}", id);
        return dichVuVe.chuyenDoiVe(dichVuDatVe.guiYeuCauThanhToan(id));
    }

    @PostMapping("/{id}/request-confirm")
    public TicketResponseDto baogYeuCauXacNhan(@PathVariable String id) {
        return dichVuVe.chuyenDoiVe(dichVuDatVe.guiYeuCauThanhToan(id));
    }

    @DeleteMapping("/{id}/cancel-pending")
    public void huyVeTam(@PathVariable String id, @RequestParam String maNguoiDung) {
        dichVuDatVe.huyVeTam(id, maNguoiDung);
    }

    @PutMapping("/{id}/approve")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public TicketResponseDto duyetVe(@PathVariable String id) {
        return dichVuVe.chuyenDoiVe(dichVuDatVe.duyetVe(id));
    }

    @PutMapping("/{id}/confirm")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public TicketResponseDto xacNhanThanhToan(@PathVariable String id) {
        return dichVuVe.chuyenDoiVe(dichVuDatVe.duyetVe(id));
    }
}
