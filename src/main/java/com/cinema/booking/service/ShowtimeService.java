package com.cinema.booking.service;

import com.cinema.booking.document.Showtime;
import com.cinema.booking.dto.PhimSuatHomNayDto;
import com.cinema.booking.dto.ShowtimeAutoSeedRequestDto;
import com.cinema.booking.dto.ShowtimeAutoSeedResultDto;
import com.cinema.booking.dto.ShowtimeBatchCreateDto;
import com.cinema.booking.dto.ShowtimeDto;
import com.cinema.booking.dto.ShowtimeFilterIndexDto;
import com.cinema.booking.dto.ShowtimeGenerateRequestDto;
import com.cinema.booking.dto.ShowtimeResponseDto;
import com.cinema.booking.dto.ShowtimeAiGenerateRequestDto;
import com.cinema.booking.dto.ShowtimeAiGenerateResultDto;
import com.cinema.booking.dto.ShowtimeSeatMapDto;
import com.cinema.booking.dto.ShowtimeSlotPreviewDto;
import java.util.List;

public interface ShowtimeService {
    List<ShowtimeResponseDto> layLichChieuTheoPhimVaNgay(String maPhim, String ngayChieu, String maRap);
    List<ShowtimeResponseDto> layLichSuSuatChieuAdmin();
    List<ShowtimeSlotPreviewDto> goiYSuatChieu(ShowtimeGenerateRequestDto yeuCau);
    int taoHangLoatSuatChieu(ShowtimeBatchCreateDto yeuCau);
    ShowtimeAutoSeedResultDto taoSuatChieuTuDong(ShowtimeAutoSeedRequestDto yeuCau);
    ShowtimeSeatMapDto laySoDoGheSuatChieu(String id);
    Showtime taoSuatChieuMoi(ShowtimeDto dto);
    Showtime capNhatSuatChieu(String id, ShowtimeDto dto);
    ShowtimeFilterIndexDto layChiSoLocPhim();
    List<PhimSuatHomNayDto> layLichChieuHomNayTheoRap(String maRap, String ngayChieu);
    ShowtimeAiGenerateResultDto xeLichChieuAi(ShowtimeAiGenerateRequestDto yeuCau);
    void xoaSuatChieu(String id);
}
