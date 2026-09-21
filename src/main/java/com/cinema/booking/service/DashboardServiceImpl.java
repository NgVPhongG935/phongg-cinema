package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Movie;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.dto.AdminDashboardActivityDto;
import com.cinema.booking.dto.AdminDashboardChartDto;
import com.cinema.booking.dto.AdminDashboardChartsDto;
import com.cinema.booking.dto.AdminDashboardDto;
import com.cinema.booking.dto.AdminDashboardItemDto;
import com.cinema.booking.dto.AdminDashboardPaymentDto;
import com.cinema.booking.dto.AdminDashboardSummaryDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.RegionRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private static final DateTimeFormatter NHAN_NGAY = DateTimeFormatter.ofPattern("dd/MM", Locale.forLanguageTag("vi-VN"));
    private static final DateTimeFormatter GIO_HIEN_THI = DateTimeFormatter.ofPattern("HH:mm", Locale.forLanguageTag("vi-VN"));
    private static final DateTimeFormatter NGAY_GIO_HIEN_THI = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final List<TicketStatus> TRANG_THAI_VE_HOP_LE = List.of(TicketStatus.PAID, TicketStatus.USED);

    private final MovieRepository khoPhim;
    private final CinemaRepository khoRap;
    private final RegionRepository khoKhuVuc;
    private final ShowtimeRepository khoSuatChieu;
    private final TicketRepository khoVe;

    @Override
    public AdminDashboardSummaryDto layTomTat() {
        LocalDate homNay = LocalDate.now();
        LocalDateTime batDauHomNay = homNay.atStartOfDay();
        LocalDateTime ketThucHomNay = homNay.plusDays(1).atStartOfDay();
        List<Ticket> veHomNay = khoVe.findDashboardByTrangThaiInAndNgayTaoBetween(
                TRANG_THAI_VE_HOP_LE, batDauHomNay, ketThucHomNay);
        List<Ticket> veWebHomNay = veHomNay.stream().filter(ve -> !laKenhMobile(ve)).toList();
        List<Ticket> veAppHomNay = veHomNay.stream().filter(DashboardServiceImpl::laKenhMobile).toList();

        return AdminDashboardSummaryDto.builder()
                .tongPhim(khoPhim.count())
                .tongRap(khoRap.count())
                .tongKhuVuc(khoKhuVuc.count())
                .tongSuatChieu(khoSuatChieu.count())
                .suatHomNay(khoSuatChieu.countDashboardByThoiGianBatDauBetween(batDauHomNay, ketThucHomNay))
                .tongVe(khoVe.countDashboardByTrangThaiIn(TRANG_THAI_VE_HOP_LE))
                .veHomNay(veHomNay.size())
                .veWebHomNay(veWebHomNay.size())
                .veAppHomNay(veAppHomNay.size())
                .doanhThuWebHomNay(tongTien(veWebHomNay))
                .doanhThuAppHomNay(tongTien(veAppHomNay))
                .build();
    }

    @Override
    public AdminDashboardChartsDto layBieuDo() {
        LocalDate homNay = LocalDate.now();
        List<Ticket> veHopLe = khoVe.findDashboardByTrangThaiIn(TRANG_THAI_VE_HOP_LE);
        List<Ticket> veWeb = veHopLe.stream().filter(ve -> !laKenhMobile(ve)).toList();
        List<Ticket> veApp = veHopLe.stream().filter(DashboardServiceImpl::laKenhMobile).toList();

        List<AdminDashboardChartDto> ve7Ngay = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate ngay = homNay.minusDays(i);
            LocalDateTime batDau = ngay.atStartOfDay();
            LocalDateTime ketThuc = ngay.plusDays(1).atStartOfDay();
            List<Ticket> veTrongNgay = veHopLe.stream()
                    .filter(ve -> trongNgay(ve, batDau, ketThuc))
                    .toList();
            List<Ticket> webTrongNgay = veTrongNgay.stream().filter(ve -> !laKenhMobile(ve)).toList();
            List<Ticket> appTrongNgay = veTrongNgay.stream().filter(DashboardServiceImpl::laKenhMobile).toList();
            ve7Ngay.add(AdminDashboardChartDto.builder()
                    .nhan(NHAN_NGAY.format(ngay))
                    .soVe(veTrongNgay.size())
                    .doanhThu(tongTien(veTrongNgay))
                    .veWeb(webTrongNgay.size())
                    .veApp(appTrongNgay.size())
                    .doanhThuWeb(tongTien(webTrongNgay))
                    .doanhThuApp(tongTien(appTrongNgay))
                    .build());
        }

        Map<String, List<Ticket>> theoPt = veHopLe.stream()
                .collect(Collectors.groupingBy(
                        ve -> chuanHoaPhuongThuc(ve.getHinhThucThanhToan()),
                        LinkedHashMap::new,
                        Collectors.toList()));
        List<AdminDashboardPaymentDto> theoPhuongThuc = theoPt.entrySet().stream()
                .map(muc -> AdminDashboardPaymentDto.builder()
                        .nhan(nhanPhuongThuc(muc.getKey()))
                        .soVe(muc.getValue().size())
                        .doanhThu(tongTien(muc.getValue()))
                        .build())
                .sorted(Comparator.comparingLong(AdminDashboardPaymentDto::getSoVe).reversed())
                .toList();

        return AdminDashboardChartsDto.builder()
                .doanhThu(tongTien(veHopLe))
                .veWeb(veWeb.size())
                .veApp(veApp.size())
                .doanhThuWeb(tongTien(veWeb))
                .doanhThuApp(tongTien(veApp))
                .ve7Ngay(ve7Ngay)
                .theoPhuongThuc(theoPhuongThuc)
                .build();
    }

    @Override
    public AdminDashboardActivityDto layHoatDong() {
        List<Showtime> suatSapToiRaw = khoSuatChieu.findDashboardUpcoming(LocalDateTime.now(), PageRequest.of(0, 6));
        List<Ticket> veGanDayRaw = khoVe.findDashboardRecent(PageRequest.of(0, 6));

        Set<String> maSuatCanDoc = veGanDayRaw.stream()
                .map(Ticket::getMaSuatChieu)
                .filter(ma -> ma != null && !ma.isBlank())
                .collect(Collectors.toCollection(HashSet::new));
        Map<String, Showtime> suatTheoMa = new HashMap<>();
        suatSapToiRaw.forEach(suat -> suatTheoMa.put(suat.getId(), suat));
        khoSuatChieu.findAllById(maSuatCanDoc).forEach(suat -> suatTheoMa.put(suat.getId(), suat));

        Set<String> maPhimCanDoc = suatTheoMa.values().stream()
                .map(Showtime::getMaPhim)
                .filter(ma -> ma != null && !ma.isBlank())
                .collect(Collectors.toSet());
        Set<String> maRapCanDoc = suatSapToiRaw.stream()
                .map(Showtime::getMaRap)
                .filter(ma -> ma != null && !ma.isBlank())
                .collect(Collectors.toSet());
        Map<String, String> tenPhimTheoMa = khoPhim.findAllById(maPhimCanDoc).stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle, (a, b) -> a));
        Map<String, String> tenRapTheoMa = khoRap.findAllById(maRapCanDoc).stream()
                .collect(Collectors.toMap(Cinema::getId, Cinema::getTenRap, (a, b) -> a));

        List<AdminDashboardItemDto> suatSapToi = suatSapToiRaw.stream()
                .filter(suat -> suat.getThoiGianBatDau() != null)
                .map(suat -> AdminDashboardItemDto.builder()
                        .id(suat.getId())
                        .tieuDe(tenPhimTheoMa.getOrDefault(suat.getMaPhim(), "Phim"))
                        .phuDe(String.format("%s · Phòng %s · %s",
                                tenRapTheoMa.getOrDefault(suat.getMaRap(), "Rạp"),
                                suat.getMaPhong(),
                                GIO_HIEN_THI.format(suat.getThoiGianBatDau())))
                        .giaTri(suat.getThoiGianBatDau().format(NGAY_GIO_HIEN_THI))
                        .build())
                .toList();

        List<AdminDashboardItemDto> veGanDay = veGanDayRaw.stream()
                .map(ve -> {
                    Showtime suat = suatTheoMa.get(ve.getMaSuatChieu());
                    String tenPhim = suat != null ? tenPhimTheoMa.getOrDefault(suat.getMaPhim(), "Phim") : "Phim";
                    String kenh = laKenhMobile(ve) ? "App" : "Web";
                    return AdminDashboardItemDto.builder()
                            .id(ve.getId())
                            .tieuDe(tenPhim)
                            .phuDe("Ghế " + String.join(", ", ve.getDanhSachGheChon() != null ? ve.getDanhSachGheChon() : List.of()) + " · " + kenh)
                            .giaTri(ve.getNgayTao() != null ? ve.getNgayTao().format(NGAY_GIO_HIEN_THI) : "—")
                            .soTien(ve.getTongTien())
                            .build();
                })
                .toList();

        return AdminDashboardActivityDto.builder()
                .suatSapToi(suatSapToi)
                .veGanDay(veGanDay)
                .build();
    }

    /** Giữ endpoint cũ để các client cũ vẫn hoạt động. */
    @Override
    public AdminDashboardDto layTongQuan() {
        AdminDashboardSummaryDto tomTat = layTomTat();
        AdminDashboardChartsDto bieuDo = layBieuDo();
        AdminDashboardActivityDto hoatDong = layHoatDong();
        return AdminDashboardDto.builder()
                .tongPhim(tomTat.getTongPhim())
                .tongRap(tomTat.getTongRap())
                .tongKhuVuc(tomTat.getTongKhuVuc())
                .tongSuatChieu(tomTat.getTongSuatChieu())
                .suatHomNay(tomTat.getSuatHomNay())
                .tongVe(tomTat.getTongVe())
                .veHomNay(tomTat.getVeHomNay())
                .veWebHomNay(tomTat.getVeWebHomNay())
                .veAppHomNay(tomTat.getVeAppHomNay())
                .doanhThuWebHomNay(tomTat.getDoanhThuWebHomNay())
                .doanhThuAppHomNay(tomTat.getDoanhThuAppHomNay())
                .doanhThu(bieuDo.getDoanhThu())
                .veWeb(bieuDo.getVeWeb())
                .veApp(bieuDo.getVeApp())
                .doanhThuWeb(bieuDo.getDoanhThuWeb())
                .doanhThuApp(bieuDo.getDoanhThuApp())
                .ve7Ngay(bieuDo.getVe7Ngay())
                .theoPhuongThuc(bieuDo.getTheoPhuongThuc())
                .suatSapToi(hoatDong.getSuatSapToi())
                .veGanDay(hoatDong.getVeGanDay())
                .build();
    }

    private static boolean laKenhMobile(Ticket ve) {
        if (ve.getKenhDatVe() == null || ve.getKenhDatVe().isBlank()) return false;
        String kenh = ve.getKenhDatVe().trim().toUpperCase(Locale.ROOT);
        return kenh.equals("MOBILE") || kenh.equals("APP");
    }

    private static boolean trongNgay(Ticket ve, LocalDateTime batDau, LocalDateTime ketThuc) {
        return ve.getNgayTao() != null
                && !ve.getNgayTao().isBefore(batDau)
                && ve.getNgayTao().isBefore(ketThuc);
    }

    private static BigDecimal tongTien(List<Ticket> danhSach) {
        return danhSach.stream()
                .map(Ticket::getTongTien)
                .filter(tien -> tien != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static String chuanHoaPhuongThuc(String ma) {
        if (ma == null || ma.isBlank()) return "KHAC";
        return ma.trim().toUpperCase(Locale.ROOT);
    }

    private static String nhanPhuongThuc(String ma) {
        return switch (ma) {
            case "BANK_TRANSFER" -> "Chuyển khoản MB";
            case "MOMO" -> "MoMo thủ công";
            case "VNPAY" -> "VNPay";
            case "MOMO_GATEWAY" -> "MoMo cổng";
            default -> ma;
        };
    }
}
