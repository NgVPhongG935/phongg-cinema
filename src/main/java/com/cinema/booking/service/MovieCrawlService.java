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

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/** SearXNG tim link + Scrapling cao du lieu phim */
@Service
@RequiredArgsConstructor
public class MovieCrawlService {
    private static final Logger nhatKy = LoggerFactory.getLogger(MovieCrawlService.class);

    private final ObjectMapper boChuyenDoiJson;
    private final TmdbMovieService dichVuTmdb;

    @Value("${app.movie-ai.enabled:false}")
    private boolean movieAiBat;

    @Value("${app.movie-ai.searxng-url:http://127.0.0.1:8888}")
    private String searxngUrl;

    @Value("${app.movie-ai.python:python}")
    private String lenhPython;

    public DuLieuThoPhimDto caoDuLieuPhim(String tenPhim) {
        if (tenPhim == null || tenPhim.isBlank())
            return DuLieuThoPhimDto.builder().sources(0).build();

        DuLieuThoPhimDto ketQua = DuLieuThoPhimDto.builder().sources(0).build();

        // TMDB — poster, cast, mô tả (không cần Gemini)
        ketQua = mergeTho(ketQua, dichVuTmdb.timPhim(tenPhim.trim()));

        // Wikipedia — bổ sung mô tả tiếng Việt
        ketQua = boSungTuWikipedia(tenPhim.trim(), ketQua);

        if (searxngSanSang()) {
            if (movieAiBat) ketQua = mergeTho(ketQua, chayScriptPython(tenPhim.trim()));
            ketQua = boSungTuSnippetSearxng(tenPhim.trim(), ketQua);
        }

        if (thieuMoTa(ketQua))
            ketQua = boSungTuWikipedia(tenPhim.trim(), ketQua);

        if (ketQua.getSources() > 0)
            nhatKy.info("Tim phim «{}»: {} nguon, mo ta={}", tenPhim,
                    ketQua.getSources(), ketQua.getTomTat() != null ? "co" : "khong");

        return ketQua;
    }

    private DuLieuThoPhimDto mergeTho(DuLieuThoPhimDto cu, DuLieuThoPhimDto them) {
        if (them == null || them.getSources() == 0) return cu;
        return DuLieuThoPhimDto.builder()
                .tomTat(chonChuoi(cu.getTomTat(), them.getTomTat()))
                .thoiLuongPhut(chonSo(cu.getThoiLuongPhut(), them.getThoiLuongPhut()))
                .gioiHanTuoi(chonChuoi(cu.getGioiHanTuoi(), them.getGioiHanTuoi()))
                .theLoai(chonChuoi(cu.getTheLoai(), them.getTheLoai()))
                .daoDien(chonChuoi(cu.getDaoDien(), them.getDaoDien()))
                .dienVien(chonChuoi(cu.getDienVien(), them.getDienVien()))
                .posterUrl(chonChuoi(cu.getPosterUrl(), them.getPosterUrl()))
                .trailerUrl(chonChuoi(cu.getTrailerUrl(), them.getTrailerUrl()))
                .context(chonChuoi(cu.getContext(), them.getContext()))
                .sources(Math.max(cu.getSources(), them.getSources()))
                .build();
    }

    private String chonChuoi(String a, String b) {
        if (a != null && !a.isBlank()) return a;
        return b;
    }

    private Integer chonSo(Integer a, Integer b) {
        if (a != null && a > 0) return a;
        return (b != null && b > 0) ? b : null;
    }

    private boolean thieuMoTa(DuLieuThoPhimDto dto) {
        if (dto == null) return true;
        return (dto.getTomTat() == null || dto.getTomTat().isBlank())
                && (dto.getContext() == null || dto.getContext().isBlank());
    }

    private DuLieuThoPhimDto chayScriptPython(String tenPhim) {
        Path script = Path.of("scripts", "tim_thong_tin_phim.py").toAbsolutePath();
        if (!script.toFile().exists()) {
            nhatKy.warn("Khong tim thay script {}", script);
            return DuLieuThoPhimDto.builder().sources(0).build();
        }
        try {
            ProcessBuilder pb = new ProcessBuilder(lenhPython, script.toString(), tenPhim);
            pb.redirectErrorStream(true);
            pb.environment().put("SEARXNG_URL", searxngUrl);
            Path vendorScrapling = Path.of("vendor", "scrapling").toAbsolutePath();
            if (vendorScrapling.toFile().exists()) {
                String pathCu = pb.environment().getOrDefault("PYTHONPATH", "");
                String pathMoi = vendorScrapling.toString()
                        + (pathCu.isBlank() ? "" : File.pathSeparator + pathCu);
                pb.environment().put("PYTHONPATH", pathMoi);
            }
            Process tienTrinh = pb.start();
            String output = new String(tienTrinh.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            boolean ok = tienTrinh.waitFor(120, TimeUnit.SECONDS);
            if (!ok) {
                tienTrinh.destroyForcibly();
                nhatKy.warn("Script cao phim timeout");
                return DuLieuThoPhimDto.builder().sources(0).build();
            }
            if (tienTrinh.exitValue() != 0) {
                nhatKy.warn("Script loi: {}", output.length() > 300 ? output.substring(0, 300) : output);
                return DuLieuThoPhimDto.builder().sources(0).build();
            }
            JsonNode root = boChuyenDoiJson.readTree(output.trim());
            DuLieuThoPhimDto ketQua = docTuJson(root);
            nhatKy.info("Cao phim {}: {} nguon, poster={}, trailer={}",
                    tenPhim, ketQua.getSources(),
                    ketQua.getPosterUrl() != null ? "co" : "khong",
                    ketQua.getTrailerUrl() != null ? "co" : "khong");
            return ketQua;
        } catch (Exception loi) {
            nhatKy.warn("MovieCrawl script loi: {}", loi.getMessage());
            return DuLieuThoPhimDto.builder().sources(0).build();
        }
    }

    /** Snippet SearXNG — khong can Scrapling, dung khi script loi hoac MOVIE_AI tat */
    private DuLieuThoPhimDto boSungTuSnippetSearxng(String tenPhim, DuLieuThoPhimDto cu) {
        if (cu.getTomTat() != null && !cu.getTomTat().isBlank()) return cu;
        try {
            String json = RestClient.create().get()
                    .uri(searxngUrl + "/search?q={q}&format=json", tenPhim + " phim plot summary")
                    .retrieve().body(String.class);
            JsonNode results = boChuyenDoiJson.readTree(json).path("results");
            StringBuilder sb = new StringBuilder();
            int dem = 0;
            for (JsonNode muc : results) {
                String snippet = muc.path("content").asText("").trim();
                if (snippet.isBlank()) snippet = muc.path("title").asText("").trim();
                if (snippet.isBlank()) continue;
                if (sb.length() > 0) sb.append(" ");
                sb.append(snippet);
                dem++;
                if (dem >= 3) break;
            }
            String tomTat = rutGon(sb.toString().trim(), 900);
            if (tomTat.isBlank()) return cu;
            return DuLieuThoPhimDto.builder()
                    .tomTat(tomTat)
                    .thoiLuongPhut(cu.getThoiLuongPhut())
                    .gioiHanTuoi(cu.getGioiHanTuoi())
                    .theLoai(cu.getTheLoai())
                    .daoDien(cu.getDaoDien())
                    .dienVien(cu.getDienVien())
                    .posterUrl(cu.getPosterUrl())
                    .trailerUrl(cu.getTrailerUrl())
                    .context(cu.getContext() != null ? cu.getContext() : tomTat)
                    .sources(cu.getSources() > 0 ? cu.getSources() : dem)
                    .build();
        } catch (Exception loi) {
            nhatKy.debug("Snippet SearXNG loi: {}", loi.getMessage());
            return cu;
        }
    }

    /** Wikipedia — khong can Docker, dung lam nguon mo ta cho Gemini tong hop */
    private DuLieuThoPhimDto boSungTuWikipedia(String tenPhim, DuLieuThoPhimDto cu) {
        String tomTat = timWikipedia(tenPhim, "vi", " phim");
        if (tomTat == null) tomTat = timWikipedia(tenPhim, "en", " film");
        if (tomTat == null) return cu;

        String context = cu.getContext() != null && !cu.getContext().isBlank()
                ? cu.getContext().trim() + "\n" + tomTat
                : tomTat;
        return DuLieuThoPhimDto.builder()
                .tomTat(cu.getTomTat() != null && !cu.getTomTat().isBlank() ? cu.getTomTat() : tomTat)
                .thoiLuongPhut(cu.getThoiLuongPhut())
                .gioiHanTuoi(cu.getGioiHanTuoi())
                .theLoai(cu.getTheLoai())
                .daoDien(cu.getDaoDien())
                .dienVien(cu.getDienVien())
                .posterUrl(cu.getPosterUrl())
                .trailerUrl(cu.getTrailerUrl())
                .context(context)
                .sources(cu.getSources() > 0 ? cu.getSources() : 1)
                .build();
    }

    private String timWikipedia(String tenPhim, String ngonNgu, String hauToTim) {
        try {
            String jsonTim = RestClient.create().get()
                    .uri("https://{lang}.wikipedia.org/w/api.php?action=query&list=search&search={q}&format=json&srlimit=5",
                            ngonNgu, tenPhim + hauToTim)
                    .retrieve().body(String.class);
            JsonNode ketQuaTim = boChuyenDoiJson.readTree(jsonTim).path("query").path("search");
            if (!ketQuaTim.isArray() || ketQuaTim.isEmpty()) {
                jsonTim = RestClient.create().get()
                        .uri("https://{lang}.wikipedia.org/w/api.php?action=query&list=search&search={q}&format=json&srlimit=5",
                                ngonNgu, tenPhim)
                        .retrieve().body(String.class);
                ketQuaTim = boChuyenDoiJson.readTree(jsonTim).path("query").path("search");
            }
            if (!ketQuaTim.isArray() || ketQuaTim.isEmpty()) return null;

            String tieuDe = ketQuaTim.get(0).path("title").asText(null);
            if (tieuDe == null || tieuDe.isBlank()) return null;

            String jsonTrich = RestClient.create().get()
                    .uri("https://{lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles={title}&format=json",
                            ngonNgu, tieuDe)
                    .retrieve().body(String.class);
            JsonNode trang = boChuyenDoiJson.readTree(jsonTrich).path("query").path("pages");
            String trich = "";
            for (JsonNode muc : trang) {
                trich = muc.path("extract").asText("").trim();
                if (!trich.isBlank()) break;
            }
            if (trich.isBlank()) {
                trich = ketQuaTim.get(0).path("snippet").asText("").replaceAll("<[^>]+>", "").trim();
            }
            if (trich.isBlank()) return null;
            nhatKy.debug("Wikipedia {}: «{}»", ngonNgu, tieuDe);
            return rutGon(trich, 2000);
        } catch (Exception loi) {
            nhatKy.debug("Wikipedia {} loi: {}", ngonNgu, loi.getMessage());
            return null;
        }
    }

    private DuLieuThoPhimDto docTuJson(JsonNode root) {
        return DuLieuThoPhimDto.builder()
                .tomTat(chuanHoa(root.path("tomTat").asText(null)))
                .theLoai(chuanHoa(root.path("theLoai").asText(null)))
                .daoDien(chuanHoa(root.path("daoDien").asText(null)))
                .dienVien(chuanHoa(root.path("dienVien").asText(null)))
                .posterUrl(chuanHoa(root.path("posterUrl").asText(null)))
                .trailerUrl(chuanHoa(root.path("trailerUrl").asText(null)))
                .context(chuanHoa(root.path("context").asText(null)))
                .sources(root.path("sources").asInt(0))
                .build();
    }

    private String rutGon(String text, int max) {
        if (text.length() <= max) return text;
        return text.substring(0, max).trim() + "…";
    }

    private String chuanHoa(String giaTri) {
        if (giaTri == null || giaTri.isBlank()) return null;
        return giaTri.trim();
    }

    private boolean searxngSanSang() {
        try {
            RestClient.create().get()
                    .uri(searxngUrl + "/search?q=test&format=json")
                    .retrieve().toBodilessEntity();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
