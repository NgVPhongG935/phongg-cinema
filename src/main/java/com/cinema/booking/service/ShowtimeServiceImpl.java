package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieStatus;
import com.cinema.booking.dto.ShowtimeSeatMapDto;
import com.cinema.booking.dto.ShowtimeSeatMapDto;
import com.cinema.booking.util.ShowtimeSeatMapper;
import com.cinema.booking.util.TinhGiaVeUtil;
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
import com.cinema.booking.dto.ShowtimeAiSlotDto;
import com.cinema.booking.dto.ShowtimeSlotPreviewDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.TicketRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShowtimeServiceImpl implements ShowtimeService {
    private static final int GIOI_HAN_LICH_SU_ADMIN = 500;
    private static final int GIOI_HAN_PHIM_TU_DONG = 12;
    private static final int GAP_DON_PHONG_PHUT = 20;
    private final ShowtimeRepository khoSuatChieu;
    private final CinemaRepository khoRap;
    private final MovieRepository khoPhim;
    private final TicketRepository khoVe;
    private final MongoTemplate mongoTemplate;
    private final AiService dichVuAi;
    private final ObjectMapper boChuyenDoiJson;

    public List<ShowtimeResponseDto> layLichChieuTheoPhimVaNgay(String maPhim, String ngayChieu, String maRap) {
        LocalDate ngay = LocalDate.parse(ngayChieu);
        LocalDateTime batDauNgay = ngay.atStartOfDay();
        LocalDateTime ketThucNgay = ngay.plusDays(1).atStartOfDay();
        List<Showtime> danhSachSuat = (maRap == null || maRap.isBlank())
                ? khoSuatChieu.findByMaPhimAndThoiGianBatDauBetween(maPhim, batDauNgay, ketThucNgay)
                : khoSuatChieu.findByMaPhimAndMaRapAndThoiGianBatDauBetween(maPhim, maRap, batDauNgay, ketThucNgay);
        // #region agent log
        try {
            java.util.Set<String> ids = new java.util.HashSet<>();
            java.util.Set<String> slotKeys = new java.util.HashSet<>();
            for (Showtime s : danhSachSuat) {
                ids.add(s.getId());
                slotKeys.add(String.valueOf(s.getStartTime()) + "|" + s.getRoomId());
            }
            String line = "{\"sessionId\":\"12750d\",\"runId\":\"post-fix\",\"hypothesisId\":\"B\",\"location\":\"ShowtimeServiceImpl.layLichChieuTheoPhimVaNgay\",\"message\":\"showtimes query\",\"data\":{\"maPhim\":\"" + maPhim + "\",\"maRap\":\"" + String.valueOf(maRap) + "\",\"raw\":" + danhSachSuat.size() + ",\"uniqueIds\":" + ids.size() + ",\"uniqueSlot\":" + slotKeys.size() + "},\"timestamp\":" + System.currentTimeMillis() + "}\n";
            java.nio.file.Files.writeString(java.nio.file.Path.of("d:/QLBVXP/debug-12750d.log"), line, java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception ignored) {}
        // #endregion
        return locGioDuyNhat(chuyenDoiDanhSach(danhSachSuat, false));
    }

    public List<ShowtimeResponseDto> layLichSuSuatChieuAdmin() {
        Query truyVan = new Query().with(Sort.by(Sort.Direction.DESC, "thoiGianBatDau")).limit(GIOI_HAN_LICH_SU_ADMIN);
        truyVan.fields().include("maPhim", "maRap", "maPhong", "thoiGianBatDau", "thoiGianKetThuc", "giaVeTu", "dinhDang");
        return chuyenDoiDanhSach(mongoTemplate.find(truyVan, Showtime.class), true);
    }

    public ShowtimeSeatMapDto laySoDoGheSuatChieu(String id) {
        Showtime suat = timSuatChieu(id);
        return ShowtimeSeatMapDto.builder()
                .giaVeTu(suat.getGiaVeTu())
                .danhSachGhe(suat.getTrangThaiGhe())
                .build();
    }

    public Showtime taoSuatChieuMoi(ShowtimeDto dto) {
        Cinema rap = khoRap.findById(dto.getMaRap()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay rap"));
        Cinema.Room phong = timPhong(rap, dto.getMaPhong());
        kiemTraTrungLich(dto.getMaRap(), dto.getMaPhong(), dto.getThoiGianBatDau(), dto.getThoiGianKetThuc(), null);
        return khoSuatChieu.save(Showtime.builder()
                .movieId(dto.getMaPhim())
                .cinemaId(dto.getMaRap())
                .roomId(dto.getMaPhong())
                .startTime(dto.getThoiGianBatDau())
                .endTime(dto.getThoiGianKetThuc())
                .price(dto.getGiaVeTu())
                .format(dto.getDinhDang())
                .seats(taoTrangThaiGheTuPhong(rap, phong, dto.getGiaVeTu()))
                .build());
    }

    public Showtime capNhatSuatChieu(String id, ShowtimeDto dto) {
        Showtime suat = timSuatChieu(id);
        Cinema rap = khoRap.findById(dto.getMaRap()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay rap"));
        boolean doiPhong = !suat.getMaRap().equals(dto.getMaRap()) || !suat.getMaPhong().equals(dto.getMaPhong());
        kiemTraTrungLich(dto.getMaRap(), dto.getMaPhong(), dto.getThoiGianBatDau(), dto.getThoiGianKetThuc(), id);
        suat.setMaPhim(dto.getMaPhim());
        suat.setMaRap(dto.getMaRap());
        suat.setMaPhong(dto.getMaPhong());
        suat.setThoiGianBatDau(dto.getThoiGianBatDau());
        suat.setThoiGianKetThuc(dto.getThoiGianKetThuc());
        suat.setGiaVeTu(dto.getGiaVeTu());
        suat.setDinhDang(dto.getDinhDang());
        if (doiPhong) {
            Cinema.Room phong = timPhong(rap, dto.getMaPhong());
            suat.setTrangThaiGhe(taoTrangThaiGheTuPhong(rap, phong, dto.getGiaVeTu()));
        } else {
            TinhGiaVeUtil.capNhatPhuThuGhe(suat, rap);
        }
        return khoSuatChieu.save(suat);
    }

    public List<ShowtimeSlotPreviewDto> goiYSuatChieu(ShowtimeGenerateRequestDto yeuCau) {
        Movie phim = khoPhim.findById(yeuCau.getMaPhim()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phim"));
        if (yeuCau.getTuNgay() == null || yeuCau.getDenNgay() == null || yeuCau.getTuGio() == null || yeuCau.getDenGio() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thieu thong tin ngay hoac gio");
        }
        if (yeuCau.getTuNgay().isAfter(yeuCau.getDenNgay())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tu ngay phai truoc den ngay");
        }
        int thoiLuong = phim.getDuration() != null ? phim.getDuration() : 120;
        int nghi = yeuCau.getThoiGianNghiPhut() != null ? yeuCau.getThoiGianNghiPhut() : 15;
        int buoc = yeuCau.getBuocLamTronPhut() != null ? yeuCau.getBuocLamTronPhut() : 15;
        int gioToi = yeuCau.getGioApGiaToi() != null ? yeuCau.getGioApGiaToi() : 18;
        BigDecimal giaNgay = yeuCau.getGiaVeTuNgay() != null ? yeuCau.getGiaVeTuNgay() : BigDecimal.valueOf(69000);
        BigDecimal giaToi = yeuCau.getGiaVeTuToi() != null ? yeuCau.getGiaVeTuToi() : BigDecimal.valueOf(75000);
        List<Showtime> suatDaCo = laySuatTheoPhongTrongKhoang(yeuCau.getMaRap(), yeuCau.getMaPhong(), yeuCau.getTuNgay(), yeuCau.getDenNgay());

        List<ShowtimeSlotPreviewDto> ketQua = new ArrayList<>();
        LocalDate ngay = yeuCau.getTuNgay();
        while (!ngay.isAfter(yeuCau.getDenNgay())) {
            LocalDateTime batDau = lamTronLen(ngay.atTime(yeuCau.getTuGio()), buoc);
            LocalDateTime gioiHan = ngay.atTime(yeuCau.getDenGio());
            while (true) {
                LocalDateTime ketThuc = batDau.plusMinutes(thoiLuong);
                if (ketThuc.isAfter(gioiHan)) break;
                BigDecimal gia = batDau.getHour() >= gioToi ? giaToi : giaNgay;
                boolean trungLich = coTrungLich(suatDaCo, batDau, ketThuc, null);
                ketQua.add(ShowtimeSlotPreviewDto.builder()
                        .maKhoa(batDau.toString())
                        .ngay(ngay)
                        .thoiGianBatDau(batDau)
                        .thoiGianKetThuc(ketThuc)
                        .giaVeTu(gia)
                        .gioHienThi(String.format("%02d:%02d - %02d:%02d", batDau.getHour(), batDau.getMinute(), ketThuc.getHour(), ketThuc.getMinute()))
                        .trungLich(trungLich)
                        .lyDo(trungLich ? "Phong da co suat trong khung gio nay" : null)
                        .build());
                batDau = lamTronLen(ketThuc.plusMinutes(nghi), buoc);
            }
            ngay = ngay.plusDays(1);
        }
        return ketQua;
    }

    public int taoHangLoatSuatChieu(ShowtimeBatchCreateDto yeuCau) {
        if (yeuCau.getDanhSachSuat() == null || yeuCau.getDanhSachSuat().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chua chon suat nao");
        }
        Cinema rap = khoRap.findById(yeuCau.getMaRap()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay rap"));
        Cinema.Room phong = timPhong(rap, yeuCau.getMaPhong());
        List<Showtime> suatDaTao = new ArrayList<>();
        for (var slot : yeuCau.getDanhSachSuat()) {
            kiemTraTrungLich(yeuCau.getMaRap(), yeuCau.getMaPhong(), slot.getThoiGianBatDau(), slot.getThoiGianKetThuc(), null);
            if (coTrungLich(suatDaTao, slot.getThoiGianBatDau(), slot.getThoiGianKetThuc(), null)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Danh sach suat chon bi trung gio voi nhau");
            }
            Showtime suatMoi = khoSuatChieu.save(Showtime.builder()
                    .movieId(yeuCau.getMaPhim())
                    .cinemaId(yeuCau.getMaRap())
                    .roomId(yeuCau.getMaPhong())
                    .startTime(slot.getThoiGianBatDau())
                    .endTime(slot.getThoiGianKetThuc())
                    .price(slot.getGiaVeTu())
                    .format(yeuCau.getDinhDang())
                    .seats(taoTrangThaiGheTuPhong(rap, phong, slot.getGiaVeTu()))
                    .build());
            suatDaTao.add(suatMoi);
        }
        return yeuCau.getDanhSachSuat().size();
    }

    public ShowtimeAutoSeedResultDto taoSuatChieuTuDong(ShowtimeAutoSeedRequestDto yeuCau) {
        LocalDate tuNgay = yeuCau.getTuNgay() != null ? yeuCau.getTuNgay() : LocalDate.now();
        LocalDate denNgay = yeuCau.getDenNgay() != null ? yeuCau.getDenNgay() : tuNgay.plusDays(6);
        if (tuNgay.isAfter(denNgay)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tu ngay phai truoc den ngay");
        }
        LocalTime tuGio = yeuCau.getTuGio() != null ? yeuCau.getTuGio() : LocalTime.of(9, 0);
        LocalTime denGio = yeuCau.getDenGio() != null ? yeuCau.getDenGio() : LocalTime.of(23, 45);
        int nghi = yeuCau.getThoiGianNghiPhut() != null ? yeuCau.getThoiGianNghiPhut() : 15;
        int buoc = yeuCau.getBuocLamTronPhut() != null ? yeuCau.getBuocLamTronPhut() : 15;
        int gioToi = yeuCau.getGioApGiaToi() != null ? yeuCau.getGioApGiaToi() : 18;
        BigDecimal giaNgay = yeuCau.getGiaVeTuNgay() != null ? yeuCau.getGiaVeTuNgay() : BigDecimal.valueOf(69000);
        BigDecimal giaToi = yeuCau.getGiaVeTuToi() != null ? yeuCau.getGiaVeTuToi() : BigDecimal.valueOf(75000);
        String dinhDang = yeuCau.getDinhDang() != null && !yeuCau.getDinhDang().isBlank() ? yeuCau.getDinhDang() : "2D Lồng Tiếng";
        boolean chiChuaCo = yeuCau.getChiPhimChuaCoSuat() == null || yeuCau.getChiPhimChuaCoSuat();

        List<Movie> danhSachPhim = khoPhim.findAll().stream()
                .filter(phim -> phim.getStatus() == MovieStatus.SHOWING)
                .filter(phim -> phim.getDuration() != null && phim.getDuration() > 0)
                .filter(phim -> !chiChuaCo || !khoSuatChieu.existsByMaPhim(phim.getId()))
                .limit(GIOI_HAN_PHIM_TU_DONG)
                .toList();
        if (danhSachPhim.isEmpty()) {
            return ShowtimeAutoSeedResultDto.builder().soPhim(0).soSuat(0).soPhimBoQua(0).build();
        }

        List<Cinema> danhSachRap = khoRap.findAll();
        if (danhSachRap.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chua co rap nao de tao suat");
        }

        int soSuat = 0;
        Set<String> phimDaCoSuat = new HashSet<>();
        int chiSoPhim = 0;

        for (LocalDate ngay = tuNgay; !ngay.isAfter(denNgay); ngay = ngay.plusDays(1)) {
            int ngayIndex = (int) ChronoUnit.DAYS.between(tuNgay, ngay);
            for (Cinema rap : danhSachRap) {
                for (Cinema.Room phong : rap.getDanhSachPhong()) {
                    List<Showtime> suatTrongPhong = new ArrayList<>(laySuatTheoPhongTrongKhoang(rap.getId(), phong.getMaPhong(), ngay, ngay));
                    LocalDateTime batDau = lamTronLen(ngay.atTime(tuGio), buoc);
                    LocalDateTime gioiHan = ngay.atTime(denGio);
                    int lanThu = 0;
                    while (lanThu < danhSachPhim.size() * 2) {
                        Movie phim = danhSachPhim.get((chiSoPhim + ngayIndex + lanThu) % danhSachPhim.size());
                        LocalDateTime ketThuc = batDau.plusMinutes(phim.getDuration() != null ? phim.getDuration() : 120);
                        if (ketThuc.isAfter(gioiHan)) break;
                        if (!coTrungLich(suatTrongPhong, batDau, ketThuc, null)) {
                            BigDecimal gia = batDau.getHour() >= gioToi ? giaToi : giaNgay;
                            Showtime suatMoi = khoSuatChieu.save(Showtime.builder()
                                    .movieId(phim.getId())
                                    .cinemaId(rap.getId())
                                    .roomId(phong.getMaPhong())
                                    .startTime(batDau)
                                    .endTime(ketThuc)
                                    .price(gia)
                                    .format(dinhDang)
                                    .seats(taoTrangThaiGheTuPhong(rap, phong, gia))
                                    .build());
                            suatTrongPhong.add(suatMoi);
                            phimDaCoSuat.add(phim.getId());
                            soSuat++;
                        }
                        batDau = lamTronLen(ketThuc.plusMinutes(nghi), buoc);
                        lanThu++;
                    }
                    chiSoPhim = (chiSoPhim + 1) % danhSachPhim.size();
                }
            }
        }

        return ShowtimeAutoSeedResultDto.builder()
                .soPhim(phimDaCoSuat.size())
                .soSuat(soSuat)
                .soPhimBoQua(Math.max(0, danhSachPhim.size() - phimDaCoSuat.size()))
                .build();
    }

    public void xoaSuatChieu(String id) {
        if (khoVe.existsByMaSuatChieu(id)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong the xoa suat chieu da co ve dat");
        }
        khoSuatChieu.delete(timSuatChieu(id));
    }

    public ShowtimeAiGenerateResultDto xeLichChieuAi(ShowtimeAiGenerateRequestDto yeuCau) {
        if (yeuCau.getDanhSachMaPhim() == null || yeuCau.getDanhSachMaPhim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chon it nhat mot phim");
        }
        if (yeuCau.getMaRap() == null || yeuCau.getMaRap().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chon rap");
        }
        if (yeuCau.getNgayChieu() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chon ngay chieu");
        }
        Cinema rap = khoRap.findById(yeuCau.getMaRap())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay rap"));
        if (rap.getDanhSachPhong() == null || rap.getDanhSachPhong().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rap chua co phong");
        }
        String dinhDang = yeuCau.getDinhDang() != null && !yeuCau.getDinhDang().isBlank()
                ? yeuCau.getDinhDang() : "2D Lồng Tiếng";
        LocalDate ngay = yeuCau.getNgayChieu();

        List<Movie> danhSachPhim = khoPhim.findAllById(yeuCau.getDanhSachMaPhim()).stream()
                .filter(phim -> phim.getDuration() != null && phim.getDuration() > 0)
                .toList();
        if (danhSachPhim.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong tim thay phim hop le");
        }

        Map<String, List<Showtime>> suatCoSan = new HashMap<>();
        for (Cinema.Room phong : rap.getDanhSachPhong()) {
            suatCoSan.put(phong.getMaPhong(), new ArrayList<>(
                    laySuatTheoPhongTrongKhoang(rap.getId(), phong.getMaPhong(), ngay, ngay)));
        }

        String nguon = "RULE_BASED";
        List<ShowtimeAiSlotDto> danhSachGoiY = null;
        if (danhSachPhim.size() <= 8) {
            String prompt = taoPromptGeminiXepLich(ngay, rap, danhSachPhim, suatCoSan, dinhDang);
            String jsonGemini = dichVuAi.xeLichChieuTuGemini(prompt);
            if (jsonGemini != null && !jsonGemini.isBlank()) {
                danhSachGoiY = docLichTuJsonGemini(jsonGemini, ngay, danhSachPhim, rap, dinhDang);
                if (danhSachGoiY != null && !danhSachGoiY.isEmpty()) nguon = "GEMINI";
            }
        }
        if (danhSachGoiY == null || danhSachGoiY.isEmpty()) {
            danhSachGoiY = xeLichChieuThongMinh(ngay, rap, danhSachPhim, suatCoSan, dinhDang);
        }
        danhSachGoiY = lamGiuAiSlot(danhSachGoiY, suatCoSan, danhSachPhim, rap);
        return ShowtimeAiGenerateResultDto.builder().nguon(nguon).danhSachGoiY(danhSachGoiY).build();
    }

    public ShowtimeFilterIndexDto layChiSoLocPhim() {
        LocalDateTime bayGio = LocalDateTime.now();
        Query truyVan = new Query(Criteria.where("thoiGianBatDau").gte(bayGio));
        truyVan.fields().include("maPhim", "maRap", "dinhDang");
        List<Showtime> danhSachSuat = mongoTemplate.find(truyVan, Showtime.class);

        Map<String, java.util.Set<String>> rapTheoPhim = new java.util.HashMap<>();
        Map<String, java.util.Set<String>> dinhDangTheoPhim = new java.util.HashMap<>();
        for (Showtime suat : danhSachSuat) {
            if (suat.getMaPhim() == null) continue;
            if (suat.getMaRap() != null) {
                rapTheoPhim.computeIfAbsent(suat.getMaPhim(), k -> new java.util.HashSet<>()).add(suat.getMaRap());
            }
            if (suat.getDinhDang() != null && !suat.getDinhDang().isBlank()) {
                dinhDangTheoPhim.computeIfAbsent(suat.getMaPhim(), k -> new java.util.HashSet<>()).add(suat.getDinhDang());
            }
        }
        return ShowtimeFilterIndexDto.builder()
                .rapTheoPhim(rapTheoPhim.entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> List.copyOf(e.getValue()))))
                .dinhDangTheoPhim(dinhDangTheoPhim.entrySet().stream()
                        .collect(Collectors.toMap(Map.Entry::getKey, e -> List.copyOf(e.getValue()))))
                .build();
    }

    public List<PhimSuatHomNayDto> layLichChieuHomNayTheoRap(String maRap, String ngayChieu) {
        if (maRap == null || maRap.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thieu ma rap");
        }
        LocalDate ngay = LocalDate.parse(ngayChieu);
        LocalDateTime batDauNgay = ngay.atStartOfDay();
        LocalDateTime ketThucNgay = ngay.plusDays(1).atStartOfDay();
        LocalDateTime bayGio = LocalDateTime.now();

        List<Showtime> danhSachSuat = khoSuatChieu.findByMaRapAndThoiGianBatDauBetween(maRap, batDauNgay, ketThucNgay)
                .stream()
                .filter(suat -> ngay.isAfter(LocalDate.now()) || !suat.getThoiGianBatDau().isBefore(bayGio))
                .toList();
        // #region agent log
        try {
            java.util.Set<String> ids = new java.util.HashSet<>();
            java.util.Set<String> slotKeys = new java.util.HashSet<>();
            java.util.Map<String, Integer> gioDem = new java.util.HashMap<>();
            for (Showtime s : danhSachSuat) {
                ids.add(s.getId());
                String gio = s.getStartTime() != null ? s.getStartTime().toString() : "null";
                slotKeys.add(gio + "|" + s.getRoomId());
                gioDem.merge(gio, 1, Integer::sum);
            }
            String line = "{\"sessionId\":\"12750d\",\"runId\":\"post-fix\",\"hypothesisId\":\"A\",\"location\":\"ShowtimeServiceImpl.layLichChieuHomNayTheoRap\",\"message\":\"cinema-day raw\",\"data\":{\"maRap\":\"" + maRap + "\",\"ngay\":\"" + ngayChieu + "\",\"raw\":" + danhSachSuat.size() + ",\"uniqueIds\":" + ids.size() + ",\"uniqueSlot\":" + slotKeys.size() + ",\"gioCounts\":" + gioDem.size() + "},\"timestamp\":" + System.currentTimeMillis() + "}\n";
            java.nio.file.Files.writeString(java.nio.file.Path.of("d:/QLBVXP/debug-12750d.log"), line, java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.APPEND);
        } catch (Exception ignored) {}
        // #endregion

        if (danhSachSuat.isEmpty()) return List.of();

        Map<String, List<Showtime>> suatTheoPhim = danhSachSuat.stream()
                .filter(suat -> suat.getMaPhim() != null)
                .collect(Collectors.groupingBy(Showtime::getMaPhim));

        Map<String, Movie> phimTheoMa = khoPhim.findAllById(suatTheoPhim.keySet()).stream()
                .collect(Collectors.toMap(Movie::getId, phim -> phim, (a, b) -> a));

        return suatTheoPhim.entrySet().stream()
                .map(muc -> {
                    Movie phim = phimTheoMa.get(muc.getKey());
                    List<ShowtimeResponseDto> danhSachSuatPhim = locGioDuyNhat(chuyenDoiDanhSach(muc.getValue(), false));
                    return PhimSuatHomNayDto.builder()
                            .movieId(muc.getKey())
                            .title(phim != null ? phim.getTitle() : danhSachSuatPhim.get(0).getMovieTitle())
                            .posterUrl(phim != null ? phim.getPosterUrl() : null)
                            .duration(phim != null ? phim.getDuration() : null)
                            .ageRating(phim != null ? phim.getAgeRating() : null)
                            .showtimes(danhSachSuatPhim)
                            .build();
                })
                .sorted((PhimSuatHomNayDto a, PhimSuatHomNayDto b) -> {
                    String tenA = a.getTitle() != null ? a.getTitle() : "";
                    String tenB = b.getTitle() != null ? b.getTitle() : "";
                    return tenA.compareToIgnoreCase(tenB);
                })
                .toList();
    }

    /** Public UI: một suất / một mốc giờ / một rạp / một định dạng. */
    private List<ShowtimeResponseDto> locGioDuyNhat(List<ShowtimeResponseDto> danhSach) {
        Map<String, ShowtimeResponseDto> theoGio = new LinkedHashMap<>();
        for (ShowtimeResponseDto suat : danhSach) {
            if (suat == null || suat.getStartTime() == null) continue;
            String gio = suat.getStartTime().withSecond(0).withNano(0).toString();
            String dinhDang = suat.getFormat() != null ? suat.getFormat() : "";
            String rap = suat.getCinemaId() != null ? suat.getCinemaId() : "";
            theoGio.putIfAbsent(gio + "|" + dinhDang + "|" + rap, suat);
        }
        return new ArrayList<>(theoGio.values());
    }

    /** Distinct theo (startTime, roomId) — tránh suất trùng từ seed. */
    private List<Showtime> locSuatTrung(List<Showtime> danhSachSuat) {
        Map<String, Showtime> theoSlot = new LinkedHashMap<>();
        for (Showtime suat : danhSachSuat) {
            if (suat == null) continue;
            String khoaSlot = String.valueOf(suat.getStartTime()) + "|" + suat.getRoomId();
            theoSlot.putIfAbsent(khoaSlot, suat);
        }
        return new ArrayList<>(theoSlot.values());
    }

    private List<ShowtimeResponseDto> chuyenDoiDanhSach(List<Showtime> danhSachSuat, boolean giamDanTheoThoiGian) {
        List<Showtime> daLoc = locSuatTrung(danhSachSuat);
        Map<String, String> tenRapTheoMa = khoRap.findAll().stream()
                .collect(Collectors.toMap(Cinema::getId, Cinema::getTenRap, (a, b) -> a));
        Map<String, String> tenPhimTheoMa = khoPhim.findAll().stream()
                .collect(Collectors.toMap(Movie::getId, Movie::getTitle, (a, b) -> a));
        LocalDateTime bayGio = LocalDateTime.now();
        return daLoc.stream()
                .sorted(giamDanTheoThoiGian
                        ? (a, b) -> b.getThoiGianBatDau().compareTo(a.getThoiGianBatDau())
                        : (a, b) -> a.getThoiGianBatDau().compareTo(b.getThoiGianBatDau()))
                .map(suat -> ShowtimeResponseDto.builder()
                        .id(suat.getId())
                        .movieId(suat.getMovieId())
                        .movieTitle(tenPhimTheoMa.getOrDefault(suat.getMovieId(), "Phim"))
                        .cinemaId(suat.getCinemaId())
                        .cinemaName(tenRapTheoMa.getOrDefault(suat.getCinemaId(), "Rạp chiếu"))
                        .roomId(suat.getRoomId())
                        .startTime(suat.getStartTime())
                        .endTime(suat.getEndTime())
                        .price(suat.getPrice())
                        .format(suat.getFormat())
                        .expired(suat.getStartTime().isBefore(bayGio))
                        .build())
                .toList();
    }

    private Cinema.Room timPhong(Cinema rap, String maPhong) {
        if (rap.getDanhSachPhong() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong");
        }
        return rap.getDanhSachPhong().stream().filter(muc -> muc.getMaPhong().equals(maPhong)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong"));
    }

    private Cinema.Room timPhong(String maRap, String maPhong) {
        Cinema rap = khoRap.findById(maRap).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay rap"));
        return timPhong(rap, maPhong);
    }

    private List<Showtime.SeatStatus> taoTrangThaiGheTuPhong(Cinema rap, Cinema.Room phong, BigDecimal giaVeTu) {
        if (phong.getDanhSachGhe() == null || phong.getDanhSachGhe().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phong chua co so do ghe");
        }
        return ShowtimeSeatMapper.taoTrangThaiGheTuPhong(phong.getDanhSachGhe(), giaVeTu, rap);
    }

    private Showtime timSuatChieu(String id) { return khoSuatChieu.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay suat chieu")); }

    private LocalDateTime lamTronLen(LocalDateTime thoiGian, int buocPhut) {
        LocalDateTime coSo = thoiGian.withSecond(0).withNano(0);
        int du = coSo.getMinute() % buocPhut;
        if (du == 0) return coSo;
        return coSo.plusMinutes(buocPhut - du);
    }

    private List<Showtime> laySuatTheoPhongTrongKhoang(String maRap, String maPhong, LocalDate tuNgay, LocalDate denNgay) {
        if (maRap == null || maRap.isBlank() || maPhong == null || maPhong.isBlank() || tuNgay == null || denNgay == null) {
            return List.of();
        }
        LocalDateTime batDau = tuNgay.atStartOfDay();
        LocalDateTime ketThuc = denNgay.plusDays(1).atStartOfDay();
        Query truyVan = new Query(Criteria.where("maRap").is(maRap)
                .and("maPhong").is(maPhong)
                .and("thoiGianBatDau").gte(batDau).lt(ketThuc));
        truyVan.fields().include("thoiGianBatDau", "thoiGianKetThuc");
        return mongoTemplate.find(truyVan, Showtime.class);
    }

    private void kiemTraTrungLich(String maRap, String maPhong, LocalDateTime batDau, LocalDateTime ketThuc, String boQuaId) {
        if (maRap == null || maPhong == null || batDau == null || ketThuc == null) return;
        LocalDateTime tu = batDau.toLocalDate().atStartOfDay();
        LocalDateTime den = batDau.toLocalDate().plusDays(1).atStartOfDay();
        Query truyVan = new Query(Criteria.where("maRap").is(maRap)
                .and("maPhong").is(maPhong)
                .and("thoiGianBatDau").gte(tu).lt(den));
        if (boQuaId != null) truyVan.addCriteria(Criteria.where("id").ne(boQuaId));
        truyVan.fields().include("thoiGianBatDau", "thoiGianKetThuc");
        List<Showtime> suatTrongNgay = mongoTemplate.find(truyVan, Showtime.class);
        if (coTrungLich(suatTrongNgay, batDau, ketThuc, boQuaId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Phòng đã có suất chiếu trong khung giờ này");
        }
    }

    private boolean coTrungLich(List<Showtime> danhSachSuat, LocalDateTime batDau, LocalDateTime ketThuc, String boQuaId) {
        return danhSachSuat.stream()
                .filter(suat -> boQuaId == null || !boQuaId.equals(suat.getId()))
                .anyMatch(suat -> trungKhungGio(batDau, ketThuc, suat.getThoiGianBatDau(), suat.getThoiGianKetThuc()));
    }

    private boolean trungKhungGio(LocalDateTime batDauMoi, LocalDateTime ketThucMoi, LocalDateTime batDauCu, LocalDateTime ketThucCu) {
        return batDauMoi.isBefore(ketThucCu) && ketThucMoi.isAfter(batDauCu);
    }

    private String taoPromptGeminiXepLich(LocalDate ngay, Cinema rap, List<Movie> phimList,
            Map<String, List<Showtime>> suatCoSan, String dinhDang) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ban la chuyen gia xep lich rap phim. Tra ve DUY NHAT JSON hop le, khong markdown.\n");
        sb.append("Format: {\"danhSachSuat\":[{\"maPhim\":\"...\",\"maPhong\":\"...\",\"gioBatDau\":\"HH:mm\",\"lyDoToiUu\":\"...\"}]}\n");
        sb.append("Ngay: ").append(ngay).append("\n");
        sb.append("Rap: ").append(rap.getTenRap()).append(" (ma: ").append(rap.getId()).append(")\n");
        sb.append("Dinh dang: ").append(dinhDang).append("\n");
        sb.append("Quy tac: Khung 09:00-23:00. Moi suat = thoi luong phim + 20 phut don phong truoc suat tiep. ");
        sb.append("Khong trung phong. Uu tien phim SHOWING vao 18:00-21:00 (khung vang).\n");
        sb.append("Phim:\n");
        for (Movie phim : phimList) {
            sb.append("- maPhim=").append(phim.getId()).append(", ten=").append(phim.getTitle())
                    .append(", thoiLuong=").append(phim.getDuration())
                    .append(", trangThai=").append(phim.getStatus()).append("\n");
        }
        sb.append("Phong:\n");
        for (Cinema.Room phong : rap.getDanhSachPhong()) {
            sb.append("- maPhong=").append(phong.getMaPhong()).append(", ten=").append(phong.getTenPhong()).append("\n");
        }
        sb.append("Suat da co trong ngay:\n");
        for (var muc : suatCoSan.entrySet()) {
            for (Showtime suat : muc.getValue()) {
                sb.append("  phong ").append(muc.getKey()).append(" ")
                        .append(suat.getThoiGianBatDau()).append("-").append(suat.getThoiGianKetThuc()).append("\n");
            }
        }
        return sb.toString();
    }

    private List<ShowtimeAiSlotDto> docLichTuJsonGemini(String raw, LocalDate ngay, List<Movie> phimList,
            Cinema rap, String dinhDang) {
        try {
            String json = raw.trim();
            int start = json.indexOf('{');
            int end = json.lastIndexOf('}');
            if (start < 0 || end <= start) return null;
            json = json.substring(start, end + 1);
            JsonNode root = boChuyenDoiJson.readTree(json);
            JsonNode arr = root.path("danhSachSuat");
            if (!arr.isArray() || arr.isEmpty()) return null;
            Map<String, Movie> phimTheoMa = phimList.stream()
                    .collect(Collectors.toMap(Movie::getId, phim -> phim, (a, b) -> a));
            Map<String, Cinema.Room> phongTheoMa = rap.getDanhSachPhong().stream()
                    .collect(Collectors.toMap(Cinema.Room::getMaPhong, phong -> phong, (a, b) -> a));
            List<ShowtimeAiSlotDto> ketQua = new ArrayList<>();
            for (JsonNode node : arr) {
                String maPhim = node.path("maPhim").asText(null);
                String maPhong = node.path("maPhong").asText(null);
                String gioBatDau = node.path("gioBatDau").asText(null);
                if (maPhim == null || maPhong == null || gioBatDau == null) continue;
                Movie phim = phimTheoMa.get(maPhim);
                if (phim == null || !phongTheoMa.containsKey(maPhong)) continue;
                LocalTime gio = LocalTime.parse(gioBatDau);
                LocalDateTime batDau = ngay.atTime(gio);
                int thoiLuong = phim.getDuration() != null ? phim.getDuration() : 120;
                LocalDateTime ketThuc = batDau.plusMinutes(thoiLuong);
                if (ketThuc.isAfter(ngay.atTime(23, 0))) continue;
                String lyDo = node.path("lyDoToiUu").asText("");
                if (lyDo.isBlank()) lyDo = node.path("lyDo").asText("Gợi ý từ AI Gemini");
                ketQua.add(ShowtimeAiSlotDto.builder()
                        .maPhim(maPhim)
                        .maPhong(maPhong)
                        .ngay(ngay)
                        .thoiGianBatDau(batDau)
                        .thoiGianKetThuc(ketThuc)
                        .dinhDang(dinhDang)
                        .lyDoToiUu(lyDo)
                        .build());
            }
            return ketQua.isEmpty() ? null : ketQua;
        } catch (Exception ignored) {
            return null;
        }
    }

    private List<ShowtimeAiSlotDto> xeLichChieuThongMinh(LocalDate ngay, Cinema rap, List<Movie> phimList,
            Map<String, List<Showtime>> suatCoSan, String dinhDang) {
        int buoc = 15;
        LocalDateTime gioiHan = ngay.atTime(23, 0);
        List<Cinema.Room> danhSachPhong = rap.getDanhSachPhong();
        List<Movie> phimSapXep = phimList.stream()
                .sorted((a, b) -> {
                    int pa = a.getStatus() == MovieStatus.SHOWING ? 0 : 1;
                    int pb = b.getStatus() == MovieStatus.SHOWING ? 0 : 1;
                    if (pa != pb) return pa - pb;
                    return Integer.compare(
                            b.getDuration() != null ? b.getDuration() : 0,
                            a.getDuration() != null ? a.getDuration() : 0);
                })
                .toList();

        List<ShowtimeAiSlotDto> ketQua = new ArrayList<>();
        Map<String, List<Showtime>> suatTrongPhong = new HashMap<>();
        for (Cinema.Room phong : danhSachPhong) {
            suatTrongPhong.put(phong.getMaPhong(), new ArrayList<>(suatCoSan.getOrDefault(phong.getMaPhong(), List.of())));
        }

        LocalTime[] gioVang = {
                LocalTime.of(19, 30), LocalTime.of(20, 0), LocalTime.of(18, 30), LocalTime.of(19, 0)
        };
        int chiSoGioVang = 0;
        for (Movie phim : phimSapXep) {
            if (phim.getStatus() != MovieStatus.SHOWING || chiSoGioVang >= gioVang.length) break;
            LocalTime gio = gioVang[chiSoGioVang];
            LocalDateTime batDau = ngay.atTime(gio);
            int thoiLuong = phim.getDuration() != null ? phim.getDuration() : 120;
            LocalDateTime ketThuc = batDau.plusMinutes(thoiLuong);
            if (ketThuc.isAfter(gioiHan)) {
                chiSoGioVang++;
                continue;
            }
            Cinema.Room phongChon = timPhongTrong(suatTrongPhong, danhSachPhong, batDau, ketThuc);
            if (phongChon == null) continue;
            String lyDo = "Xếp suất " + String.format("%02d:%02d", gio.getHour(), gio.getMinute())
                    + " cho phim hot để tối đa doanh thu khung giờ vàng (18:00–21:00)";
            themSlotAi(ketQua, phim, phongChon, ngay, batDau, ketThuc, dinhDang, lyDo);
            suatTrongPhong.get(phongChon.getMaPhong()).add(taoSuatAo(batDau, ketThuc));
            chiSoGioVang++;
        }

        for (Cinema.Room phong : danhSachPhong) {
            LocalDateTime tiepTheo = lamTronLen(ngay.atTime(9, 0), buoc);
            List<Showtime> trongPhong = suatTrongPhong.get(phong.getMaPhong());
            int chiSoPhim = 0;
            int lanThu = 0;
            while (lanThu < phimSapXep.size() * 4) {
                Movie phim = phimSapXep.get(chiSoPhim % phimSapXep.size());
                int thoiLuong = phim.getDuration() != null ? phim.getDuration() : 120;
                LocalDateTime batDau = tiepTheo;
                LocalDateTime ketThuc = batDau.plusMinutes(thoiLuong);
                if (ketThuc.isAfter(gioiHan)) break;
                if (coTrungLich(trongPhong, batDau, ketThuc, null)) {
                    batDau = lamTronLen(batDau.plusMinutes(15), buoc);
                    ketThuc = batDau.plusMinutes(thoiLuong);
                    if (ketThuc.isAfter(gioiHan) || coTrungLich(trongPhong, batDau, ketThuc, null)) {
                        chiSoPhim++;
                        lanThu++;
                        continue;
                    }
                }
                if (daCoTrongKetQua(ketQua, phim.getId(), phong.getMaPhong(), batDau)) {
                    tiepTheo = lamTronLen(ketThuc.plusMinutes(GAP_DON_PHONG_PHUT), buoc);
                    chiSoPhim++;
                    lanThu++;
                    continue;
                }
                String lyDo = batDau.getHour() >= 18 && batDau.getHour() < 21
                        ? "Khung giờ cao điểm, phù hợp thu hút khách"
                        : "Tận dụng phòng trống, phân bổ đều các phim trong ngày";
                themSlotAi(ketQua, phim, phong, ngay, batDau, ketThuc, dinhDang, lyDo);
                trongPhong.add(taoSuatAo(batDau, ketThuc));
                tiepTheo = lamTronLen(ketThuc.plusMinutes(GAP_DON_PHONG_PHUT), buoc);
                chiSoPhim++;
                lanThu++;
            }
        }
        return ketQua;
    }

    private List<ShowtimeAiSlotDto> lamGiuAiSlot(List<ShowtimeAiSlotDto> danhSach,
            Map<String, List<Showtime>> suatCoSan, List<Movie> phimList, Cinema rap) {
        Map<String, Movie> phimTheoMa = phimList.stream()
                .collect(Collectors.toMap(Movie::getId, phim -> phim, (a, b) -> a));
        Map<String, Cinema.Room> phongTheoMa = rap.getDanhSachPhong().stream()
                .collect(Collectors.toMap(Cinema.Room::getMaPhong, phong -> phong, (a, b) -> a));
        for (ShowtimeAiSlotDto slot : danhSach) {
            Movie phim = phimTheoMa.get(slot.getMaPhim());
            if (phim != null) {
                slot.setTenPhim(phim.getTitle());
                if (slot.getThoiGianKetThuc() == null && slot.getThoiGianBatDau() != null
                        && phim.getDuration() != null) {
                    slot.setThoiGianKetThuc(slot.getThoiGianBatDau().plusMinutes(phim.getDuration()));
                }
            }
            Cinema.Room phong = phongTheoMa.get(slot.getMaPhong());
            if (phong != null) slot.setTenPhong(phong.getTenPhong());
            if (slot.getGiaVeTu() == null && slot.getThoiGianBatDau() != null) {
                slot.setGiaVeTu(slot.getThoiGianBatDau().getHour() >= 18
                        ? BigDecimal.valueOf(75000) : BigDecimal.valueOf(69000));
            }
            if (slot.getThoiGianBatDau() != null && slot.getThoiGianKetThuc() != null) {
                slot.setGioHienThi(String.format("%02d:%02d - %02d:%02d",
                        slot.getThoiGianBatDau().getHour(), slot.getThoiGianBatDau().getMinute(),
                        slot.getThoiGianKetThuc().getHour(), slot.getThoiGianKetThuc().getMinute()));
            }
            if (slot.getMaKhoa() == null && slot.getThoiGianBatDau() != null) {
                slot.setMaKhoa(slot.getThoiGianBatDau().toString() + "_" + slot.getMaPhim() + "_" + slot.getMaPhong());
            }
            List<Showtime> trongPhong = suatCoSan.getOrDefault(slot.getMaPhong(), List.of());
            slot.setTrungLich(coTrungLich(trongPhong, slot.getThoiGianBatDau(), slot.getThoiGianKetThuc(), null));
        }
        return danhSach.stream()
                .sorted((a, b) -> a.getThoiGianBatDau().compareTo(b.getThoiGianBatDau()))
                .toList();
    }

    private Cinema.Room timPhongTrong(Map<String, List<Showtime>> suatTrongPhong, List<Cinema.Room> danhSachPhong,
            LocalDateTime batDau, LocalDateTime ketThuc) {
        for (Cinema.Room phong : danhSachPhong) {
            List<Showtime> trongPhong = suatTrongPhong.get(phong.getMaPhong());
            if (!coTrungLich(trongPhong, batDau, ketThuc, null)) return phong;
        }
        return null;
    }

    private void themSlotAi(List<ShowtimeAiSlotDto> ketQua, Movie phim, Cinema.Room phong, LocalDate ngay,
            LocalDateTime batDau, LocalDateTime ketThuc, String dinhDang, String lyDo) {
        ketQua.add(ShowtimeAiSlotDto.builder()
                .maKhoa(batDau.toString() + "_" + phim.getId() + "_" + phong.getMaPhong())
                .maPhim(phim.getId())
                .tenPhim(phim.getTitle())
                .maPhong(phong.getMaPhong())
                .tenPhong(phong.getTenPhong())
                .ngay(ngay)
                .thoiGianBatDau(batDau)
                .thoiGianKetThuc(ketThuc)
                .giaVeTu(batDau.getHour() >= 18 ? BigDecimal.valueOf(75000) : BigDecimal.valueOf(69000))
                .dinhDang(dinhDang)
                .gioHienThi(String.format("%02d:%02d - %02d:%02d",
                        batDau.getHour(), batDau.getMinute(), ketThuc.getHour(), ketThuc.getMinute()))
                .lyDoToiUu(lyDo)
                .trungLich(false)
                .build());
    }

    private Showtime taoSuatAo(LocalDateTime batDau, LocalDateTime ketThuc) {
        return Showtime.builder().startTime(batDau).endTime(ketThuc).build();
    }

    private boolean daCoTrongKetQua(List<ShowtimeAiSlotDto> ketQua, String maPhim, String maPhong, LocalDateTime batDau) {
        return ketQua.stream().anyMatch(slot ->
                slot.getMaPhim().equals(maPhim) && slot.getMaPhong().equals(maPhong)
                        && slot.getThoiGianBatDau().equals(batDau));
    }
}
