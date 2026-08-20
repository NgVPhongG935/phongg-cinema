package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Movie;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.dto.AdminDashboardChartDto;
import com.cinema.booking.dto.AdminDashboardDto;
import com.cinema.booking.dto.AdminDashboardItemDto;
import com.cinema.booking.dto.AdminDashboardPaymentDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.RegionRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private static final DateTimeFormatter NHAN_NGAY = DateTimeFormatter.ofPattern("dd/MM", Locale.forLanguageTag("vi-VN"));
    private static final DateTimeFormatter GIO_HIEN_THI = DateTimeFormatter.ofPattern("HH:mm", Locale.forLanguageTag("vi-VN"));

    private final MovieRepository khoPhim;
    private final CinemaRepository khoRap;
    private final RegionRepository khoKhuVuc;
    private final ShowtimeRepository khoSuatChieu;
    private final TicketRepository khoVe;

    public AdminDashboardDto layTongQuan() {
        LocalDate homNay = LocalDate.now();
        LocalDateTime batDauHomNay = homNay.atStartOfDay();
        LocalDateTime ketThucHomNay = homNay.plusDays(1).atStartOfDay();
        LocalDateTime bayGio = LocalDateTime.now();

        List<Showtime> danhSachSuat = khoSuatChieu.findAll();
        List<Ticket> danhSachVe = khoVe.findAll();
        Map<String, String> tenPhimTheoMa = khoPhim.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle, (a, b) -> a));
        Map<String, String> tenRapTheoMa = khoRap.findAll().stream()
                .collect(Collectors.toMap(Cinema::getId, Cinema::getTenRap, (a, b) -> a));
        Map<String, Showtime> suatTheoMa = danhSachSuat.stream()
                .collect(Collectors.toMap(Showtime::getId, suat -> suat, (a, b) -> a));

        long suatHomNay = danhSachSuat.stream()
                .filter(suat -> !suat.getThoiGianBatDau().isBefore(batDauHomNay) && suat.getThoiGianBatDau().isBefore(ketThucHomNay))
                .count();

        List<Ticket> veHopLe = danhSachVe.stream()
                .filter(ve -> ve.getTrangThai() == TicketStatus.PAID || ve.getTrangThai() == TicketStatus.USED)
                .toList();

        long veHomNay = veHopLe.stream()
                .filter(ve -> ve.getNgayTao() != null && !ve.getNgayTao().isBefore(batDauHomNay) && ve.getNgayTao().isBefore(ketThucHomNay))
                .count();

        BigDecimal doanhThu = veHopLe.stream()
                .map(Ticket::getTongTien)
                .filter(tien -> tien != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Ticket> veWeb = veHopLe.stream().filter(ve -> !laKenhMobile(ve)).toList();
        List<Ticket> veApp = veHopLe.stream().filter(ve -> laKenhMobile(ve)).toList();

        List<Ticket> veWebHomNay = veWeb.stream()
                .filter(ve -> trongNgay(ve, batDauHomNay, ketThucHomNay))
                .toList();
        List<Ticket> veAppHomNay = veApp.stream()
                .filter(ve -> trongNgay(ve, batDauHomNay, ketThucHomNay))
                .toList();

        List<AdminDashboardItemDto> suatSapToi = danhSachSuat.stream()
                .filter(suat -> !suat.getThoiGianBatDau().isBefore(bayGio))
                .sorted(Comparator.comparing(Showtime::getThoiGianBatDau))
                .limit(6)
                .map(suat -> AdminDashboardItemDto.builder()
                        .id(suat.getId())
                        .tieuDe(tenPhimTheoMa.getOrDefault(suat.getMaPhim(), "Phim"))
                        .phuDe(String.format("%s · Phòng %s · %s",
                                tenRapTheoMa.getOrDefault(suat.getMaRap(), "Rạp"),
                                suat.getMaPhong(),
                                GIO_HIEN_THI.format(suat.getThoiGianBatDau())))
                        .giaTri(suat.getThoiGianBatDau().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")))
                        .build())
                .toList();

        List<AdminDashboardItemDto> veGanDay = danhSachVe.stream()
                .sorted((a, b) -> {
                    LocalDateTime ta = a.getNgayTao() != null ? a.getNgayTao() : LocalDateTime.MIN;
                    LocalDateTime tb = b.getNgayTao() != null ? b.getNgayTao() : LocalDateTime.MIN;
                    return tb.compareTo(ta);
                })
                .limit(6)
                .map(ve -> {
                    Showtime suat = suatTheoMa.get(ve.getMaSuatChieu());
                    String tenPhim = suat != null ? tenPhimTheoMa.getOrDefault(suat.getMaPhim(), "Phim") : "Phim";
                    String kenh = laKenhMobile(ve) ? "App" : "Web";
                    return AdminDashboardItemDto.builder()
                            .id(ve.getId())
                            .tieuDe(tenPhim)
                            .phuDe("Ghế " + String.join(", ", ve.getDanhSachGheChon() != null ? ve.getDanhSachGheChon() : List.of()) + " · " + kenh)
                            .giaTri(ve.getNgayTao() != null ? ve.getNgayTao().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "—")
                            .soTien(ve.getTongTien())
                            .build();
                })
                .toList();

        List<AdminDashboardChartDto> ve7Ngay = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate ngay = homNay.minusDays(i);
            LocalDateTime batDau = ngay.atStartOfDay();
            LocalDateTime ketThuc = ngay.plusDays(1).atStartOfDay();
            List<Ticket> veTrongNgay = veHopLe.stream()
                    .filter(ve -> ve.getNgayTao() != null && !ve.getNgayTao().isBefore(batDau) && ve.getNgayTao().isBefore(ketThuc))
                    .toList();
            List<Ticket> webTrongNgay = veTrongNgay.stream().filter(ve -> !laKenhMobile(ve)).toList();
            List<Ticket> appTrongNgay = veTrongNgay.stream().filter(ve -> laKenhMobile(ve)).toList();
            BigDecimal doanhThuNgay = tongTien(veTrongNgay);
            ve7Ngay.add(AdminDashboardChartDto.builder()
                    .nhan(NHAN_NGAY.format(ngay))
                    .soVe(veTrongNgay.size())
                    .doanhThu(doanhThuNgay)
                    .veWeb(webTrongNgay.size())
                    .veApp(appTrongNgay.size())
                    .doanhThuWeb(tongTien(webTrongNgay))
                    .doanhThuApp(tongTien(appTrongNgay))
                    .build());
        }

        Map<String, List<Ticket>> theoPt = veHopLe.stream()
                .collect(Collectors.groupingBy(ve -> chuanHoaPhuongThuc(ve.getHinhThucThanhToan()), LinkedHashMap::new, Collectors.toList()));
        List<AdminDashboardPaymentDto> theoPhuongThuc = theoPt.entrySet().stream()
                .map(muc -> AdminDashboardPaymentDto.builder()
                        .nhan(nhanPhuongThuc(muc.getKey()))
                        .soVe(muc.getValue().size())
                        .doanhThu(tongTien(muc.getValue()))
                        .build())
                .sorted(Comparator.comparingLong(AdminDashboardPaymentDto::getSoVe).reversed())
                .toList();

        return AdminDashboardDto.builder()
                .tongPhim(khoPhim.count())
                .tongRap(khoRap.count())
                .tongKhuVuc(khoKhuVuc.count())
                .tongSuatChieu(danhSachSuat.size())
                .suatHomNay(suatHomNay)
                .tongVe(veHopLe.size())
                .veHomNay(veHomNay)
                .doanhThu(doanhThu)
                .veWeb(veWeb.size())
                .veApp(veApp.size())
                .veWebHomNay(veWebHomNay.size())
                .veAppHomNay(veAppHomNay.size())
                .doanhThuWeb(tongTien(veWeb))
                .doanhThuApp(tongTien(veApp))
                .doanhThuWebHomNay(tongTien(veWebHomNay))
                .doanhThuAppHomNay(tongTien(veAppHomNay))
                .suatSapToi(suatSapToi)
                .veGanDay(veGanDay)
                .ve7Ngay(ve7Ngay)
                .theoPhuongThuc(theoPhuongThuc)
                .build();
    }

    private static boolean laKenhMobile(Ticket ve) {
        if (ve.getKenhDatVe() == null || ve.getKenhDatVe().isBlank()) return false;
        String kenh = ve.getKenhDatVe().trim().toUpperCase(Locale.ROOT);
        return kenh.equals("MOBILE") || kenh.equals("APP");
    }

    private static boolean trongNgay(Ticket ve, LocalDateTime batDau, LocalDateTime ketThuc) {
        return ve.getNgayTao() != null && !ve.getNgayTao().isBefore(batDau) && ve.getNgayTao().isBefore(ketThuc);
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
        switch (ma) {
            case "BANK_TRANSFER": return "Chuyển khoản MB";
            case "MOMO": return "MoMo thủ công";
            case "VNPAY": return "VNPay";
            case "MOMO_GATEWAY": return "MoMo cổng";
            default: return ma;
        }
    }
}
