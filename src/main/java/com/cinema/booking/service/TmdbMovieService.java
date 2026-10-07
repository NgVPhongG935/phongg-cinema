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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.HashMap;
import java.text.Normalizer;
import com.cinema.booking.util.MovieMediaUrl;
import com.cinema.booking.dto.LuaChonPhimAiDto;

/** Lấy metadata phim từ TMDB — hỗ trợ đầy đủ thời lượng & giới hạn tuổi */
@Service
@RequiredArgsConstructor
public class TmdbMovieService {
    private static final Logger nhatKy = LoggerFactory.getLogger(TmdbMovieService.class);
    private static final String BASE = "https://api.themoviedb.org/3";
    private static final String POSTER_BASE = "https://image.tmdb.org/t/p/w500";

    private final ObjectMapper boChuyenDoiJson;
    private final RestClient movieMetadataClient;

    @Value("${tmdb.api-key:}")
    private String khoaApi;

    @Value("${tmdb.enabled:false}")
    private boolean tmdbBat;

    public boolean sanSang() {
        return tmdbBat && khoaApi != null && !khoaApi.isBlank();
    }

    public List<LuaChonPhimAiDto> timLuaChonPhim(String title) {
        if (title == null || title.isBlank()) return List.of();
        if (!sanSang()) return List.of(); // Keep Wikipedia/Gemini fallback available without TMDB.
        try {
            JsonNode results = boChuyenDoiJson.readTree(layJson("/search/movie?query={q}&language={lang}&include_adult=false", Map.of("q", title.trim(), "lang", "vi-VN"))).path("results");
            if (!results.isArray() || results.isEmpty()) results = boChuyenDoiJson.readTree(layJson("/search/movie?query={q}&language={lang}&include_adult=false", Map.of("q", title.trim(), "lang", "en-US"))).path("results");
            List<LuaChonPhimAiDto> choices = new ArrayList<>();
            for (JsonNode movie : results) {
                long id = movie.path("id").asLong(0);
                String name = movie.path("title").asText("").trim();
                if (id <= 0 || name.isEmpty()) continue;
                String release = movie.path("release_date").asText("");
                String poster = movie.path("poster_path").asText("");
                choices.add(new LuaChonPhimAiDto(id, name, movie.path("original_title").asText(name), release.length() >= 4 ? release.substring(0, 4) : "", poster.matches("/[a-zA-Z0-9._-]+\\.(jpg|png|webp)") ? POSTER_BASE + poster : null));
                if (choices.size() == 10) break;
            }
            return choices;
        } catch (org.springframework.web.client.HttpClientErrorException error) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Nguồn tra cứu phim từ chối yêu cầu (" + error.getStatusCode().value() + "). Kiểm tra TMDB_API_KEY.");
        } catch (Exception error) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                    "Không kết nối được nguồn tra cứu phim. Vui lòng thử lại.");
        }
    }

    public DuLieuThoPhimDto timPhimTheoId(long id) {
        if (id <= 0) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Mã phim tra cứu không hợp lệ.");
        if (!sanSang()) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Nguồn tra cứu phim chưa được cấu hình.");
        try {
            DuLieuThoPhimDto result = layChiTiet(id, "vi-VN");
            if (thieuMoTa(result) || result.getTrailerUrl() == null || result.getPosterUrl() == null) {
                try { result = gop(result, layChiTiet(id, "en-US")); }
                catch (Exception error) { nhatKy.warn("Không bổ sung được phim TMDB {} bằng tiếng Anh: {}", id, error.getClass().getSimpleName()); }
            }
            return result;
        } catch (Exception error) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY, "Không lấy được thông tin phim đã chọn. Vui lòng thử lại.");
        }
    }

    private String layJson(String path, Map<String, Object> params) {
        Map<String, Object> values = new HashMap<>(params);
        boolean bearer = khoaApi.trim().startsWith("eyJ");
        String uri = BASE + path;
        if (!bearer) {
            uri += (path.contains("?") ? "&" : "?") + "api_key={key}";
            values.put("key", khoaApi.trim());
        }
        var request = movieMetadataClient.get().uri(uri, values);
        if (bearer) request.header("Authorization", "Bearer " + khoaApi.trim());
        return request.retrieve().body(String.class);
    }

    public DuLieuThoPhimDto timPhim(String tenPhim) {
        if (!sanSang() || tenPhim == null || tenPhim.isBlank())
            return DuLieuThoPhimDto.builder().sources(0).build();

        try {
            Long id = timIdPhim(tenPhim.trim(), "vi-VN");
            if (id == null) id = timIdPhim(tenPhim.trim(), "en-US");
            if (id == null) return DuLieuThoPhimDto.builder().sources(0).build();

            DuLieuThoPhimDto ketQua = layChiTiet(id, "vi-VN");
            if (thieuMoTa(ketQua) || ketQua.getTrailerUrl() == null || ketQua.getPosterUrl() == null) {
                try {
                    DuLieuThoPhimDto en = layChiTiet(id, "en-US");
                    ketQua = gop(ketQua, en);
                } catch (Exception loi) {
                    nhatKy.warn("Không bổ sung được dữ liệu tiếng Anh cho phim '{}': {}", tenPhim, loi.getClass().getSimpleName());
                }
            }
            if (ketQua.getSources() > 0)
                nhatKy.info("TMDB «{}»: mo ta={}, poster={}", tenPhim,
                        ketQua.getTomTat() != null ? "co" : "khong",
                        ketQua.getPosterUrl() != null ? "co" : "khong");
            return ketQua;
        } catch (Exception loi) {
            nhatKy.warn("TMDB lỗi «{}»: {}", tenPhim, loi.getClass().getSimpleName());
            return DuLieuThoPhimDto.builder().sources(0).build();
        }
    }

    private Long timIdPhim(String tenPhim, String ngonNgu) throws Exception {
        String json = layJson("/search/movie?query={q}&language={lang}&include_adult=false", Map.of("q", tenPhim.replaceFirst("\\s*\\(\\d{4}\\)\\s*$", ""), "lang", ngonNgu));
        JsonNode ketQua = boChuyenDoiJson.readTree(json).path("results");
        if (!ketQua.isArray() || ketQua.isEmpty()) return null;
        String query = chuanHoaTen(tenPhim.replaceFirst("\\s*\\(\\d{4}\\)\\s*$", ""));
        var yearMatch = java.util.regex.Pattern.compile("\\((\\d{4})\\)\\s*$").matcher(tenPhim);
        String year = yearMatch.find() ? yearMatch.group(1) : null;
        for (JsonNode phim : ketQua) {
            if (!query.equals(chuanHoaTen(phim.path("title").asText(""))) && !query.equals(chuanHoaTen(phim.path("original_title").asText("")))) continue;
            if (year != null && !phim.path("release_date").asText("").startsWith(year)) continue;
            long id = phim.path("id").asLong(0);
            if (id > 0) return id;
        }
        return null;
    }

    private DuLieuThoPhimDto layChiTiet(long id, String ngonNgu) throws Exception {
        String json = layJson("/movie/{id}?language={lang}&append_to_response=credits,videos,release_dates", Map.of("id", id, "lang", ngonNgu));
        JsonNode root = boChuyenDoiJson.readTree(json);
        String tenPhim = root.path("title").asText("");

        String tomTat = chuanHoa(root.path("overview").asText(null));
        String posterPath = root.path("poster_path").asText(null);
        String posterUrl = posterPath != null && posterPath.matches("/[a-zA-Z0-9._-]+\\.(jpg|png|webp)") ? POSTER_BASE + posterPath : null;

        // Thời lượng phim (phút)
        Integer thoiLuong = root.path("runtime").asInt(0);

        List<String> theLoai = new ArrayList<>();
        for (JsonNode genre : root.path("genres")) {
            String ten = genre.path("name").asText("").trim();
            if (!ten.isBlank()) theLoai.add(ten);
        }
        String stringTheLoai = theLoai.isEmpty() ? null : String.join(", ", theLoai);

        // Giới hạn tuổi chuẩn Việt Nam (P, T13, T16, T18)
        String gioiHanTuoi = layGioiHanTuoi(root);

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

        String trailerUrl = layTrailerYoutube(root.path("videos").path("results"));

        boolean coDuLieu = tomTat != null || posterUrl != null || !theLoai.isEmpty() || daoDien != null || !dienVien.isEmpty() || trailerUrl != null || thoiLuong > 0;
        if (!coDuLieu) return DuLieuThoPhimDto.builder().sources(0).build();

        return DuLieuThoPhimDto.builder()
                .tenPhim(tenPhim)
                .tomTat(tomTat)
                .thoiLuongPhut(thoiLuong > 0 ? thoiLuong : null)
                .gioiHanTuoi(gioiHanTuoi)
                .theLoai(stringTheLoai)
                .daoDien(daoDien)
                .dienVien(dienVien.isEmpty() ? null : String.join(", ", dienVien))
                .ngonNgu(tenNgonNgu(root.path("original_language").asText(null)))
                .posterUrl(posterUrl)
                .trailerUrl(trailerUrl)
                .context(tomTat)
                .sources(1)
                .build();
    }

    private String layTrailerYoutube(JsonNode danhSachVideo) {
        if (!danhSachVideo.isArray()) return null;

        String trailer = null;

        for (JsonNode video : danhSachVideo) {
            if (!"YouTube".equalsIgnoreCase(video.path("site").asText(""))) continue;
            String key = video.path("key").asText(null);
            if (key == null || !key.matches("[a-zA-Z0-9_-]{11}")) continue;
            String url = MovieMediaUrl.trailer(key);
            String type = video.path("type").asText("");
            if ("Trailer".equalsIgnoreCase(type)) {
                if (video.path("official").asBoolean(false)) return url;
                if (trailer == null) trailer = url;
            }
        }

        return trailer;
    }

    private String layGioiHanTuoi(JsonNode root) {
        // Only import a published Vietnam certification. Do not guess from genres
        // or treat a foreign certification as an equivalent Vietnam rating.
        JsonNode releaseResults = root.path("release_dates").path("results");
        if (releaseResults.isArray()) {
            for (JsonNode res : releaseResults) {
                String iso = res.path("iso_3166_1").asText("");
                if ("VN".equalsIgnoreCase(iso)) {
                    for (JsonNode rd : res.path("release_dates")) {
                        String cert = rd.path("certification").asText("").trim().toUpperCase(Locale.ROOT).replaceFirst("^C(?=13|16|18)", "T");
                        if (List.of("P", "T13", "T16", "T18").contains(cert)) return cert;
                    }
                }
            }
        }

        return null;
    }

    private DuLieuThoPhimDto gop(DuLieuThoPhimDto a, DuLieuThoPhimDto b) {
        if (b == null || b.getSources() == 0) return a;
        return DuLieuThoPhimDto.builder()
                .tenPhim(chon(a.getTenPhim(), b.getTenPhim()))
                .tomTat(chon(a.getTomTat(), b.getTomTat()))
                .thoiLuongPhut(a.getThoiLuongPhut() != null ? a.getThoiLuongPhut() : b.getThoiLuongPhut())
                .gioiHanTuoi(chon(a.getGioiHanTuoi(), b.getGioiHanTuoi()))
                .theLoai(chon(a.getTheLoai(), b.getTheLoai()))
                .daoDien(chon(a.getDaoDien(), b.getDaoDien()))
                .dienVien(chon(a.getDienVien(), b.getDienVien()))
                .ngonNgu(chon(a.getNgonNgu(), b.getNgonNgu()))
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

    private String chuanHoaTen(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT).replace('đ', 'd').replaceFirst("^(the|an|a)\\s+", "").replaceAll("[^\\p{L}\\p{N}]", "");
    }

    private String tenNgonNgu(String code) {
        if (code == null || code.isBlank()) return null;
        return switch (code) {
            case "en" -> "Tiếng Anh";
            case "vi" -> "Tiếng Việt";
            case "ja" -> "Tiếng Nhật";
            case "ko" -> "Tiếng Hàn";
            case "zh" -> "Tiếng Trung";
            case "fr" -> "Tiếng Pháp";
            default -> Locale.forLanguageTag(code).getDisplayLanguage(Locale.forLanguageTag("vi"));
        };
    }
}
