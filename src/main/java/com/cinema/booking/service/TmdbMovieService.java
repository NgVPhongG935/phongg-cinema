package com.cinema.booking.service;

import com.cinema.booking.dto.DuLieuThoPhimDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Lấy metadata phim từ TMDB — hỗ trợ đầy đủ thời lượng & giới hạn tuổi */
@Service
@RequiredArgsConstructor
public class TmdbMovieService {
    private static final Logger nhatKy = LoggerFactory.getLogger(TmdbMovieService.class);
    private static final String BASE = "https://api.themoviedb.org/3";
    private static final String POSTER_BASE = "https://image.tmdb.org/t/p/w500";

    private final ObjectMapper boChuyenDoiJson;

    @Value("${tmdb.api-key:}")
    private String khoaApi;

    @Value("${tmdb.enabled:false}")
    private boolean tmdbBat;

    public DuLieuThoPhimDto timPhim(String tenPhim) {
        if (!tmdbBat || khoaApi == null || khoaApi.isBlank() || tenPhim == null || tenPhim.isBlank())
            return DuLieuThoPhimDto.builder().sources(0).build();

        try {
            Long id = timIdPhim(tenPhim.trim(), "vi-VN");
            if (id == null) id = timIdPhim(tenPhim.trim(), "en-US");
            if (id == null) return DuLieuThoPhimDto.builder().sources(0).build();

            DuLieuThoPhimDto ketQua = layChiTiet(id, "vi-VN");
            if (thieuMoTa(ketQua)) {
                DuLieuThoPhimDto en = layChiTiet(id, "en-US");
                ketQua = gop(ketQua, en);
            }
            if (ketQua.getSources() > 0)
                nhatKy.info("TMDB «{}»: mo ta={}, poster={}", tenPhim,
                        ketQua.getTomTat() != null ? "co" : "khong",
                        ketQua.getPosterUrl() != null ? "co" : "khong");
            return ketQua;
        } catch (Exception loi) {
            nhatKy.warn("TMDB loi «{}»: {}", tenPhim, loi.getMessage());
            return DuLieuThoPhimDto.builder().sources(0).build();
        }
    }

    private Long timIdPhim(String tenPhim, String ngonNgu) throws Exception {
        String json = RestClient.create().get()
                .uri(BASE + "/search/movie?api_key={key}&query={q}&language={lang}&include_adult=false",
                        khoaApi, tenPhim, ngonNgu)
                .retrieve().body(String.class);
        JsonNode ketQua = boChuyenDoiJson.readTree(json).path("results");
        if (!ketQua.isArray() || ketQua.isEmpty()) return null;
        return ketQua.get(0).path("id").asLong(0);
    }

    private DuLieuThoPhimDto layChiTiet(long id, String ngonNgu) throws Exception {
        String json = RestClient.create().get()
                .uri(BASE + "/movie/{id}?api_key={key}&language={lang}&append_to_response=credits,videos,release_dates",
                        id, khoaApi, ngonNgu)
                .retrieve().body(String.class);
        JsonNode root = boChuyenDoiJson.readTree(json);
        String tenPhim = root.path("title").asText("");

        String tomTat = chuanHoa(root.path("overview").asText(null));
        String posterPath = root.path("poster_path").asText(null);
        String posterUrl = posterPath != null && !posterPath.isBlank() ? POSTER_BASE + posterPath : null;

        // Thời lượng phim (phút)
        Integer thoiLuong = root.path("runtime").asInt(0);

        List<String> theLoai = new ArrayList<>();
        for (JsonNode genre : root.path("genres")) {
            String ten = genre.path("name").asText("").trim();
            if (!ten.isBlank()) theLoai.add(ten);
        }
        String stringTheLoai = theLoai.isEmpty() ? null : String.join(", ", theLoai);

        // Giới hạn tuổi chuẩn Việt Nam (P, T13, T16, T18)
        boolean isAdult = root.path("adult").asBoolean(false);
        String gioiHanTuoi = layGioiHanTuoi(root, isAdult, stringTheLoai);

        String daoDien = null;
        for (JsonNode crew : root.path("credits").path("crew")) {
            if ("Director".equalsIgnoreCase(crew.path("job").asText(""))) {
                daoDien = chuanHoa(crew.path("name").asText(null));
                if (daoDien != null) break;
            }
        }

        List<String> dienVien = new ArrayList<>();
        for (JsonNode cast : root.path("credits").path("cast")) {
            if (dienVien.size() >= 6) break;
            String ten = cast.path("name").asText("").trim();
            if (!ten.isBlank()) dienVien.add(ten);
        }

        String trailerUrl = layTrailerYoutube(root.path("videos").path("results"), root.path("title").asText(tenPhim));

        boolean coDuLieu = tomTat != null || posterUrl != null || !theLoai.isEmpty() || daoDien != null || !dienVien.isEmpty();
        if (!coDuLieu) return DuLieuThoPhimDto.builder().sources(0).build();

        return DuLieuThoPhimDto.builder()
                .tomTat(tomTat)
                .thoiLuongPhut(thoiLuong > 0 ? thoiLuong : null)
                .gioiHanTuoi(gioiHanTuoi)
                .theLoai(stringTheLoai)
                .daoDien(daoDien)
                .dienVien(dienVien.isEmpty() ? null : String.join(", ", dienVien))
                .posterUrl(posterUrl)
                .trailerUrl(trailerUrl)
                .context(tomTat)
                .sources(1)
                .build();
    }

    private String layTrailerYoutube(JsonNode danhSachVideo, String tenPhim) {
        if (!danhSachVideo.isArray()) return null;

        String trailer = null;
        String teaser = null;
        String clip = null;
        String batKy = null;

        for (JsonNode video : danhSachVideo) {
            if (!"YouTube".equalsIgnoreCase(video.path("site").asText(""))) continue;
            String key = video.path("key").asText(null);
            if (key == null || key.isBlank()) continue;
            String url = "https://www.youtube.com/watch?v=" + key;
            String type = video.path("type").asText("");
            if ("Trailer".equalsIgnoreCase(type)) {
                trailer = url;
                break;
            }
            if (teaser == null && "Teaser".equalsIgnoreCase(type)) teaser = url;
            if (clip == null && ("Clip".equalsIgnoreCase(type) || "Featurette".equalsIgnoreCase(type))) clip = url;
            if (batKy == null) batKy = url;
        }

        if (trailer != null) return trailer;
        if (teaser != null) return teaser;
        if (clip != null) return clip;
        return batKy;
    }

    private String layGioiHanTuoi(JsonNode root, boolean adult, String theLoai) {
        if (adult) return "T18";
        
        // Thử đọc certification từ release_dates của TMDB
        JsonNode releaseResults = root.path("release_dates").path("results");
        if (releaseResults.isArray()) {
            for (JsonNode res : releaseResults) {
                String iso = res.path("iso_3166_1").asText("");
                if ("VN".equalsIgnoreCase(iso) || "US".equalsIgnoreCase(iso)) {
                    for (JsonNode rd : res.path("release_dates")) {
                        String cert = rd.path("certification").asText("").trim().toUpperCase();
                        if (!cert.isBlank()) {
                            if (cert.contains("18") || cert.equals("R") || cert.equals("NC-17")) return "T18";
                            if (cert.contains("16") || cert.equals("PG-13")) return "T16";
                            if (cert.contains("13")) return "T13";
                            if (cert.equals("P") || cert.equals("G") || cert.equals("PG")) return "P";
                        }
                    }
                }
            }
        }

        // Fallback theo thể loại
        if (theLoai != null) {
            String tl = theLoai.toLowerCase();
            if (tl.contains("kinh dị") || tl.contains("horror")) return "T16";
            if (tl.contains("hành động") || tl.contains("action") || tl.contains("tội phạm")) return "T13";
        }
        return "P";
    }

    private DuLieuThoPhimDto gop(DuLieuThoPhimDto a, DuLieuThoPhimDto b) {
        if (b == null || b.getSources() == 0) return a;
        return DuLieuThoPhimDto.builder()
                .tomTat(chon(a.getTomTat(), b.getTomTat()))
                .thoiLuongPhut(a.getThoiLuongPhut() != null ? a.getThoiLuongPhut() : b.getThoiLuongPhut())
                .gioiHanTuoi(chon(a.getGioiHanTuoi(), b.getGioiHanTuoi()))
                .theLoai(chon(a.getTheLoai(), b.getTheLoai()))
                .daoDien(chon(a.getDaoDien(), b.getDaoDien()))
                .dienVien(chon(a.getDienVien(), b.getDienVien()))
                .posterUrl(chon(a.getPosterUrl(), b.getPosterUrl()))
                .trailerUrl(chon(a.getTrailerUrl(), b.getTrailerUrl()))
                .context(chon(a.getContext(), b.getContext()))
                .sources(Math.max(a.getSources(), b.getSources()))
                .build();
    }

    private String chon(String a, String b) {
        return (a != null && !a.isBlank()) ? a : b;
    }

    private boolean thieuMoTa(DuLieuThoPhimDto dto) {
        return dto == null || dto.getTomTat() == null || dto.getTomTat().isBlank();
    }

    private String chuanHoa(String giaTri) {
        return (giaTri == null || giaTri.isBlank()) ? null : giaTri.trim();
    }
}