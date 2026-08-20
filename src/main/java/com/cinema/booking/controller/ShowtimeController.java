package com.cinema.booking.controller;

import com.cinema.booking.document.Showtime;
import com.cinema.booking.dto.ShowtimeSeatMapDto;
import com.cinema.booking.dto.HoldSeatsRequest;
import com.cinema.booking.dto.HoldSeatsResponse;
import com.cinema.booking.dto.PhimSuatHomNayDto;
import com.cinema.booking.dto.ShowtimeAutoSeedRequestDto;
import com.cinema.booking.dto.ShowtimeAutoSeedResultDto;
import com.cinema.booking.dto.ShowtimeBatchCreateDto;
import com.cinema.booking.dto.ShowtimeBatchResultDto;
import com.cinema.booking.dto.ShowtimeDto;
import com.cinema.booking.dto.ShowtimeFilterIndexDto;
import com.cinema.booking.dto.ShowtimeGenerateRequestDto;
import com.cinema.booking.dto.ShowtimeResponseDto;
import com.cinema.booking.dto.ShowtimeAiGenerateRequestDto;
import com.cinema.booking.dto.ShowtimeAiGenerateResultDto;
import com.cinema.booking.dto.ShowtimeSlotPreviewDto;
import com.cinema.booking.service.BookingService;
import com.cinema.booking.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/showtimes")
public class ShowtimeController {
    private final ShowtimeService dichVuSuatChieu;
    private final BookingService dichVuDatVe;
    @GetMapping public List<ShowtimeResponseDto> layLichChieuTheoPhimVaNgay(@RequestParam String maPhim, @RequestParam String ngayChieu, @RequestParam(required = false) String maRap) { return dichVuSuatChieu.layLichChieuTheoPhimVaNgay(maPhim, ngayChieu, maRap); }
    @GetMapping("/cinema-day") public List<PhimSuatHomNayDto> layLichChieuHomNayTheoRap(@RequestParam String maRap, @RequestParam String ngayChieu) { return dichVuSuatChieu.layLichChieuHomNayTheoRap(maRap, ngayChieu); }
    @GetMapping("/admin/history") @PreAuthorize("hasRole('ADMIN')") public List<ShowtimeResponseDto> layLichSuSuatChieuAdmin() { return dichVuSuatChieu.layLichSuSuatChieuAdmin(); }
    @PostMapping("/admin/preview-slots") @PreAuthorize("hasRole('ADMIN')") public List<ShowtimeSlotPreviewDto> goiYSuatChieu(@RequestBody ShowtimeGenerateRequestDto yeuCau) { return dichVuSuatChieu.goiYSuatChieu(yeuCau); }
    @PostMapping("/admin/batch") @PreAuthorize("hasRole('ADMIN')") public ShowtimeBatchResultDto taoHangLoatSuatChieu(@RequestBody ShowtimeBatchCreateDto yeuCau) {
        ShowtimeBatchResultDto ketQua = new ShowtimeBatchResultDto();
        ketQua.setSoLuong(dichVuSuatChieu.taoHangLoatSuatChieu(yeuCau));
        return ketQua;
    }
    @PostMapping("/admin/auto-seed") @PreAuthorize("hasRole('ADMIN')") public ShowtimeAutoSeedResultDto taoSuatChieuTuDong(@RequestBody(required = false) ShowtimeAutoSeedRequestDto yeuCau) {
        return dichVuSuatChieu.taoSuatChieuTuDong(yeuCau != null ? yeuCau : new ShowtimeAutoSeedRequestDto());
    }
    @PostMapping("/ai-generate") @PreAuthorize("hasRole('ADMIN')") public ShowtimeAiGenerateResultDto xeLichChieuAi(@RequestBody ShowtimeAiGenerateRequestDto yeuCau) {
        return dichVuSuatChieu.xeLichChieuAi(yeuCau);
    }
    @GetMapping("/filter-index") public ShowtimeFilterIndexDto layChiSoLocPhim() { return dichVuSuatChieu.layChiSoLocPhim(); }
    @GetMapping("/{id}/seats") public ShowtimeSeatMapDto laySoDoGheSuatChieu(@PathVariable String id) { return dichVuSuatChieu.laySoDoGheSuatChieu(id); }
    @PostMapping("/{id}/hold-seats") public HoldSeatsResponse giuGheTamThoi(@PathVariable String id, @RequestBody HoldSeatsRequest yeuCau, @RequestParam String maNguoiDung) { yeuCau.setMaSuatChieu(id); return dichVuDatVe.giuGheTamThoi(yeuCau, maNguoiDung); }
    @PostMapping("/admin") @PreAuthorize("hasRole('ADMIN')") public Showtime taoSuatChieuMoi(@RequestBody ShowtimeDto dto) { return dichVuSuatChieu.taoSuatChieuMoi(dto); }
    @PutMapping("/admin/{id}") @PreAuthorize("hasRole('ADMIN')") public Showtime capNhatSuatChieu(@PathVariable String id, @RequestBody ShowtimeDto dto) { return dichVuSuatChieu.capNhatSuatChieu(id, dto); }
    @DeleteMapping("/admin/{id}") @PreAuthorize("hasRole('ADMIN')") public void xoaSuatChieu(@PathVariable String id) { dichVuSuatChieu.xoaSuatChieu(id); }
}
