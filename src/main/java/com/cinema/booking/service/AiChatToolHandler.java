package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Movie;
import com.cinema.booking.document.MovieStatus;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AiChatToolHandler {
    private static final DateTimeFormatter DINH_DANG_SUAT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.forLanguageTag("vi-VN"));
    private static final DateTimeFormatter DINH_DANG_NGAY =
            DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.forLanguageTag("vi-VN"));
    private static final int GIA_CO_BAN_THAM_CHIEU = 90000;

    private final MovieRepository khoPhim;
    private final ShowtimeRepository khoSuatChieu;
    private final CinemaRepository khoRap;
    private final ObjectMapper boChuyenDoiJson;

    public List<Map<String, Object>> layKhaiBaoTools() {
        return List.of(
                Map.of(
                        "name", "searchMovie",
                        "description", "Tim kiem phim trong he thong PhongG Cinema theo ten hoac tu khoa. "
                                + "Bat buoc goi khi khach hoi ve mot phim cu the.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "keyword", Map.of("type", "string", "description", "Ten phim hoac tu khoa tim kiem")
                                ),
                                "required", List.of("keyword")
                        )
                ),
                Map.of(
                        "name", "getShowtimes",
                        "description", "Lay danh sach suat chieu, phong chieu va gia ve theo ten phim va ngay.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "movieTitle", Map.of("type", "string", "description", "Ten phim can tra cuu suat chieu"),
                                        "date", Map.of("type", "string", "description", "Ngay chieu dinh dang dd/MM/yyyy (de trong neu khong ro ngay)")
                                ),
                                "required", List.of("movieTitle")
                        )
                ),
                Map.of(
                        "name", "getCinemaLocation",
                        "description", "Lay danh sach dia chi rap PhongG Cinema, co the loc theo khu vuc.",
                        "parameters", Map.of(
                                "type", "object",
                                "properties", Map.of(
                                        "region", Map.of("type", "string", "description", "Khu vuc / thanh pho (de trong de lay tat ca)")
                                )
                        )
                )
        );
    }

    public ObjectNode thucThiFunctionCall(String tenHam, JsonNode thamSo) {
        ObjectNode ketQua = boChuyenDoiJson.createObjectNode();
        try {
            switch (tenHam) {
                case "searchMovie" -> ketQua.set("result", boChuyenDoiJson.valueToTree(
                        searchMovie(thamSo.path("keyword").asText(""))));
                case "getShowtimes" -> ketQua.set("result", boChuyenDoiJson.valueToTree(
                        getShowtimes(thamSo.path("movieTitle").asText(""),
                                thamSo.path("date").asText(""))));
                case "getCinemaLocation" -> ketQua.set("result", boChuyenDoiJson.valueToTree(
                        getCinemaLocation(thamSo.path("region").asText(""))));
                default -> ketQua.put("error", "Ham khong ho tro: " + tenHam);
            }
        } catch (Exception ngoaiLe) {
            ketQua.put("error", ngoaiLe.getMessage() != null ? ngoaiLe.getMessage() : "Loi thuc thi tool");
        }
        return ketQua;
    }

    public Map<String, Object> searchMovie(String keyword) {
        Map<String, Object> phanHoi = new LinkedHashMap<>();
        if (keyword == null || keyword.isBlank()) {
            phanHoi.put("found", false);
            phanHoi.put("message", "Thieu tu khoa tim kiem");
            return phanHoi;
        }
        List<Movie> phimList = timPhimTheoTuKhoa(keyword, 5);
        if (phimList.isEmpty()) {
            phanHoi.put("found", false);
            phanHoi.put("keyword", keyword.trim());
            phanHoi.put("showingMovies", layTenPhimDangChieu(6));
            return phanHoi;
        }
        phanHoi.put("found", true);
        phanHoi.put("movies", phimList.stream().map(this::chuyenPhimThanhMap).toList());
        return phanHoi;
    }

    public Map<String, Object> getShowtimes(String movieTitle, String date) {
        Map<String, Object> phanHoi = new LinkedHashMap<>();
        List<Movie> phimList = timPhimTheoTuKhoa(movieTitle, 1);
        if (phimList.isEmpty()) {
            phanHoi.put("found", false);
            phanHoi.put("movieTitle", movieTitle);
            phanHoi.put("showingMovies", layTenPhimDangChieu(6));
            return phanHoi;
        }
        Movie phim = phimList.get(0);
        phanHoi.put("found", true);
        phanHoi.put("movieTitle", phim.getTitle());
        LocalDate ngay = phanTichNgay(date);
        List<Showtime> suatList = locSuatPhim(phim.getId(), ngay, 20);
        Map<String, String> tenRap = khoRap.findAll().stream()
                .collect(Collectors.toMap(Cinema::getId, Cinema::getTenRap, (a, b) -> a));
        List<Map<String, Object>> suatMap = new ArrayList<>();
        for (Showtime suat : suatList) {
            Map<String, Object> dong = new LinkedHashMap<>();
            dong.put("time", suat.getThoiGianBatDau() != null
                    ? DINH_DANG_SUAT.format(suat.getThoiGianBatDau()) : null);
            dong.put("room", suat.getMaPhong());
            dong.put("cinema", tenRap.getOrDefault(suat.getMaRap(), "Rap"));
            dong.put("priceFrom", suat.getGiaVeTu());
            suatMap.add(dong);
        }
        phanHoi.put("showtimes", suatMap);
        phanHoi.put("dateFilter", ngay != null ? DINH_DANG_NGAY.format(ngay) : "all_upcoming");
        return phanHoi;
    }

    public Map<String, Object> getCinemaLocation(String region) {
        List<Cinema> rapList = khoRap.findAll();
        if (region != null && !region.isBlank()) {
            String chuan = region.toLowerCase(Locale.ROOT);
            rapList = rapList.stream()
                    .filter(r -> (r.getKhuVuc() != null && r.getKhuVuc().toLowerCase(Locale.ROOT).contains(chuan))
                            || (r.getDiaChi() != null && r.getDiaChi().toLowerCase(Locale.ROOT).contains(chuan))
                            || (r.getTenRap() != null && r.getTenRap().toLowerCase(Locale.ROOT).contains(chuan)))
                    .toList();
        }
        Map<String, Object> phanHoi = new LinkedHashMap<>();
        phanHoi.put("count", rapList.size());
        phanHoi.put("cinemas", rapList.stream().map(r -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("name", r.getTenRap());
            m.put("address", r.getDiaChi());
            m.put("region", r.getKhuVuc());
            return m;
        }).toList());
        return phanHoi;
    }

    public List<Movie> timPhimTheoTuKhoa(String keyword, int gioiHan) {
        if (keyword == null || keyword.isBlank()) return List.of();
        String tuKhoa = keyword.trim();
        var ketQua = khoPhim.findByTenPhimContainingIgnoreCaseAndTrangThai(
                tuKhoa, MovieStatus.SHOWING, PageRequest.of(0, gioiHan));
        if (!ketQua.isEmpty()) return ketQua.getContent();
        ketQua = khoPhim.timKiemMoRongVaTrangThai(tuKhoa, MovieStatus.SHOWING, PageRequest.of(0, gioiHan));
        return ketQua.getContent();
    }

    private Map<String, Object> chuyenPhimThanhMap(Movie phim) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("title", phim.getTitle());
        m.put("genres", phim.getGenres());
        m.put("durationMinutes", phim.getDuration());
        m.put("status", phim.getStatus() != null ? phim.getStatus().name() : null);
        Showtime suatGan = locSuatPhim(phim.getId(), null, 1).stream().findFirst().orElse(null);
        m.put("basePriceFrom", suatGan != null && suatGan.getGiaVeTu() != null
                ? suatGan.getGiaVeTu() : GIA_CO_BAN_THAM_CHIEU);
        return m;
    }

    private List<String> layTenPhimDangChieu(int gioiHan) {
        return khoPhim.findByTrangThai(MovieStatus.SHOWING, PageRequest.of(0, gioiHan))
                .getContent().stream().map(Movie::getTitle).toList();
    }

    private List<Showtime> locSuatPhim(String maPhim, LocalDate ngay, int gioiHan) {
        LocalDateTime tu = LocalDateTime.now();
        return khoSuatChieu.findAll().stream()
                .filter(s -> maPhim.equals(s.getMaPhim())
                        && s.getThoiGianBatDau() != null
                        && !s.getThoiGianBatDau().isBefore(tu)
                        && (ngay == null || s.getThoiGianBatDau().toLocalDate().equals(ngay)))
                .sorted(java.util.Comparator.comparing(Showtime::getThoiGianBatDau))
                .limit(gioiHan)
                .toList();
    }

    private LocalDate phanTichNgay(String date) {
        if (date == null || date.isBlank()) return null;
        try {
            if (date.contains("/")) {
                String[] parts = date.split("/");
                int ngay = Integer.parseInt(parts[0].trim());
                int thang = Integer.parseInt(parts[1].trim());
                int nam = parts.length > 2 ? Integer.parseInt(parts[2].trim()) : LocalDate.now().getYear();
                return LocalDate.of(nam, thang, ngay);
            }
        } catch (Exception ignored) { }
        return null;
    }
}
