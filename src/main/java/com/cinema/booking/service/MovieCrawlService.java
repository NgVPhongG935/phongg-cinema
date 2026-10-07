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
import java.nio.file.Files;
import java.util.concurrent.TimeUnit;
import com.cinema.booking.util.MovieMediaUrl;

/** SearXNG tim link + Scrapling cao du lieu phim */
@Service
@RequiredArgsConstructor
public class MovieCrawlService {
    private static final Logger nhatKy = LoggerFactory.getLogger(MovieCrawlService.class);

    private final ObjectMapper boChuyenDoiJson;
    private final TmdbMovieService dichVuTmdb;
    private final RestClient movieMetadataClient;

    @Value("${app.movie-ai.enabled:false}")
    private boolean movieAiBat;

    @Value("${app.movie-ai.searxng-url:http://127.0.0.1:8888}")
    private String searxngUrl;

    @Value("${app.movie-ai.python:python}")
    private String lenhPython;

    public boolean tmdbSanSang() {
        return dichVuTmdb.sanSang();
    }

    public java.util.List<com.cinema.booking.dto.LuaChonPhimAiDto> timLuaChonPhim(String title) {
        try {
            var options = dichVuTmdb.timLuaChonPhim(title);
            if (!options.isEmpty()) return options;
        } catch (org.springframework.web.server.ResponseStatusException error) {
            if (error.getStatusCode().value() < 500) throw error;
        }
        if (title == null || title.isBlank()) return java.util.List.of();
        try {
            String search = movieMetadataClient.get().uri("https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&format=json&srlimit=10", title.trim() + " film").retrieve().body(String.class);
            java.util.List<String> titles = new java.util.ArrayList<>();
            for (JsonNode item : boChuyenDoiJson.readTree(search).path("query").path("search")) {
                String name = item.path("title").asText("");
                if (chuanHoaTenWiki(name).contains(chuanHoaTenWiki(title))) titles.add(name);
            }
            if (titles.isEmpty()) return java.util.List.of();
            String raw = movieMetadataClient.get().uri("https://en.wikipedia.org/w/api.php?action=query&prop=pageterms|pageimages&wbptterms=description&piprop=original&pilicense=any&titles={titles}&format=json", String.join("|", titles)).retrieve().body(String.class);
            java.util.List<com.cinema.booking.dto.LuaChonPhimAiDto> options = new java.util.ArrayList<>();
            for (JsonNode page : boChuyenDoiJson.readTree(raw).path("query").path("pages")) {
                String description = page.path("terms").path("description").path(0).asText("").toLowerCase(java.util.Locale.ROOT);
                if (!description.matches(".*\\bfilm\\b.*") || description.contains("series") || description.contains("franchise") || description.contains("soundtrack") || description.contains("video game")) continue;
                long id = page.path("pageid").asLong(0);
                if (id <= 0) continue;
                String name = page.path("title").asText("").replaceFirst("(?i)\\s*\\((?:\\d{4} film|film)\\)\\s*$", "");
                var year = java.util.regex.Pattern.compile("\\b(?:19|20)\\d{2}\\b").matcher(description);
                options.add(new com.cinema.booking.dto.LuaChonPhimAiDto(id, name, name, year.find() ? year.group() : "", MovieMediaUrl.poster(page.path("original").path("source").asText(null)), "wikipedia"));
            }
            options.sort(java.util.Comparator.comparing(com.cinema.booking.dto.LuaChonPhimAiDto::year));
            return options;
        } catch (Exception error) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_GATEWAY, "Không kết nối được cả nguồn chính và nguồn dự phòng. Vui lòng thử lại.");
        }
    }

    public DuLieuThoPhimDto caoDuLieuPhim(String tenPhim) {
        return caoDuLieuPhim(tenPhim, null);
    }

    public DuLieuThoPhimDto caoDuLieuPhim(String tenPhim, Long tmdbId) {
        if (tenPhim == null || tenPhim.isBlank())
            return DuLieuThoPhimDto.builder().sources(0).build();

        DuLieuThoPhimDto ketQua = DuLieuThoPhimDto.builder().sources(0).build();

        // TMDB — poster, cast, mô tả (không cần Gemini)
        try {
            ketQua = mergeTho(ketQua, tmdbId == null ? dichVuTmdb.timPhim(tenPhim.trim()) : dichVuTmdb.timPhimTheoId(tmdbId));
        } catch (org.springframework.web.server.ResponseStatusException error) {
            if (error.getStatusCode().value() < 500) throw error;
            nhatKy.warn("TMDB chưa phản hồi cho phim '{}'; thử Wikipedia.", tenPhim);
        }

        // Wikipedia can also provide the film's infobox poster when TMDB is unavailable.
        if (thieuMoTa(ketQua) || MovieMediaUrl.poster(ketQua.getPosterUrl()) == null)
            ketQua = boSungTuWikipedia(tenPhim.trim(), ketQua);

        if ((movieAiBat || thieuMoTa(ketQua)) && searxngSanSang()) {
            if (movieAiBat) ketQua = mergeTho(ketQua, chayScriptPython(tenPhim.trim()));
            ketQua = boSungTuSnippetSearxng(tenPhim.trim(), ketQua);
        }

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
                .ngonNgu(chonChuoi(cu.getNgonNgu(), them.getNgonNgu()))
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
        Path outputFile = null;
        Process tienTrinh = null;
        try {
            outputFile = Files.createTempFile("cinema-movie-crawl-", ".log");
            ProcessBuilder pb = new ProcessBuilder(lenhPython, script.toString(), tenPhim);
            pb.redirectErrorStream(true);
            pb.redirectOutput(outputFile.toFile());
            pb.environment().put("SEARXNG_URL", searxngUrl);
            Path vendorScrapling = Path.of("vendor", "scrapling").toAbsolutePath();
            if (vendorScrapling.toFile().exists()) {
                String pathCu = pb.environment().getOrDefault("PYTHONPATH", "");
                String pathMoi = vendorScrapling.toString()
                        + (pathCu.isBlank() ? "" : File.pathSeparator + pathCu);
                pb.environment().put("PYTHONPATH", pathMoi);
            }
            tienTrinh = pb.start();
            boolean ok = tienTrinh.waitFor(120, TimeUnit.SECONDS);
            if (!ok) {
                tienTrinh.destroyForcibly();
                nhatKy.warn("Script cao phim timeout");
                return DuLieuThoPhimDto.builder().sources(0).build();
            }
            String output = Files.readString(outputFile, StandardCharsets.UTF_8);
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
        } catch (InterruptedException loi) {
            Thread.currentThread().interrupt();
            return DuLieuThoPhimDto.builder().sources(0).build();
        } catch (Exception loi) {
            nhatKy.warn("MovieCrawl script loi: {}", loi.getMessage());
            return DuLieuThoPhimDto.builder().sources(0).build();
        } finally {
            if (tienTrinh != null && tienTrinh.isAlive()) tienTrinh.destroyForcibly();
            if (outputFile != null) {
                try { Files.deleteIfExists(outputFile); }
                catch (java.io.IOException ignored) { }
            }
        }
    }

    /** Snippet SearXNG — khong can Scrapling, dung khi script loi hoac MOVIE_AI tat */
    private DuLieuThoPhimDto boSungTuSnippetSearxng(String tenPhim, DuLieuThoPhimDto cu) {
        if (cu.getTomTat() != null && !cu.getTomTat().isBlank()) return cu;
        try {
            String json = movieMetadataClient.get()
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
                    .ngonNgu(cu.getNgonNgu())
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
        DuLieuThoPhimDto wiki = timWikipedia(tenPhim, "vi", " phim");
        if (wiki == null || wiki.getPosterUrl() == null || wiki.getThoiLuongPhut() == null
                || wiki.getDaoDien() == null || wiki.getDienVien() == null || wiki.getNgonNgu() == null) {
            DuLieuThoPhimDto english = timWikipedia(tenPhim, "en", " film");
            if (wiki == null) wiki = english;
            else if (english != null) wiki = mergeTho(wiki, english);
        }
        return wiki == null ? cu : mergeTho(cu, wiki);
    }

    private DuLieuThoPhimDto timWikipedia(String tenPhim, String ngonNgu, String hauToTim) {
        try {
            String jsonTim = movieMetadataClient.get()
                    .uri("https://{lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&format=json&srlimit=5",
                            ngonNgu, tenPhim + hauToTim)
                    .retrieve().body(String.class);
            JsonNode ketQuaTim = boChuyenDoiJson.readTree(jsonTim).path("query").path("search");
            if (!ketQuaTim.isArray() || ketQuaTim.isEmpty()) {
                jsonTim = movieMetadataClient.get()
                        .uri("https://{lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch={q}&format=json&srlimit=5",
                                ngonNgu, tenPhim)
                        .retrieve().body(String.class);
                ketQuaTim = boChuyenDoiJson.readTree(jsonTim).path("query").path("search");
            }
            if (!ketQuaTim.isArray() || ketQuaTim.isEmpty()) return null;

            String tieuDe = null;
            for (JsonNode candidate : ketQuaTim) {
                String title = candidate.path("title").asText("");
                String base = title.replaceFirst("(?i)\\s*\\((?:\\d{4}(?: film| phim)?|film|phim(?: \\d{4})?)\\)\\s*$", "");
                if (chuanHoaTenWiki(base).equals(chuanHoaTenWiki(tenPhim.replaceFirst("\\s*\\(\\d{4}\\)\\s*$", "")))) {
                    tieuDe = title;
                    break;
                }
            }
            if (tieuDe == null || tieuDe.isBlank()) return null;

            String jsonTrich = movieMetadataClient.get()
                    .uri("https://{lang}.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|pageterms|revisions&exintro=1&explaintext=1&piprop=original&pilicense=any&wbptterms=description&rvprop=content&rvslots=main&titles={title}&format=json",
                            ngonNgu, tieuDe)
                    .retrieve().body(String.class);
            JsonNode trang = boChuyenDoiJson.readTree(jsonTrich).path("query").path("pages");
            String trich = "";
            String poster = null;
            String wikiText = "";
            for (JsonNode muc : trang) {
                String extract = muc.path("extract").asText("").trim();
                String description = muc.path("terms").path("description").path(0).asText("");
                String topic = (description.isBlank() ? extract.substring(0, Math.min(300, extract.length())) : description).toLowerCase(java.util.Locale.ROOT);
                boolean film = topic.matches("(?s).*\\bfilm\\b.*") || topic.contains("bộ phim") || topic.contains("phim điện ảnh");
                if (!film || topic.contains("film director") || topic.contains("comic book") || topic.contains("television series") || topic.contains("soundtrack") || topic.contains("video game") || topic.contains("franchise")) continue;
                trich = extract;
                wikiText = muc.path("revisions").path(0).path("slots").path("main").path("*").asText("");
                String original = MovieMediaUrl.poster(muc.path("original").path("source").asText(null));
                if (original != null && java.net.URI.create(original).getHost().equalsIgnoreCase("upload.wikimedia.org")) poster = original;
                if (!trich.isBlank() || poster != null) break;
            }
            if (trich.isBlank() && poster == null) return null;
            nhatKy.debug("Wikipedia {}: «{}»", ngonNgu, tieuDe);
            String runtime = truongWiki(wikiText, "runtime");
            var minutes = java.util.regex.Pattern.compile("^(\\d{1,3})\\s*(?:minutes?|phút)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(runtime);
            Integer duration = minutes.find() ? Integer.valueOf(minutes.group(1)) : null;
            String intro = trich.substring(0, Math.min(240, trich.length())).toLowerCase(java.util.Locale.ROOT);
            java.util.List<String> genres = new java.util.ArrayList<>();
            if (intro.contains("animated") || intro.contains("hoạt hình")) genres.add("Hoạt hình");
            if (intro.contains("fantasy") || intro.contains("kỳ ảo")) genres.add("Giả tưởng");
            if (intro.contains("superhero") || intro.contains("siêu anh hùng")) genres.add("Siêu anh hùng");
            if (intro.contains("science fiction") || intro.contains("science-fiction") || intro.contains("khoa học viễn tưởng")) genres.add("Khoa học viễn tưởng");
            if (intro.contains("comedy") || intro.contains("phim hài")) genres.add("Hài");
            if (intro.contains("action") || intro.contains("hành động")) genres.add("Hành động");
            String genre = genres.isEmpty() ? null : String.join(", ", genres);
            String language = truongWiki(wikiText, "language");
            if (language.equalsIgnoreCase("English")) language = "Tiếng Anh";
            String trailer = timTrailerPixar(tieuDe, truongWiki(wikiText, "production_companies"));
            return DuLieuThoPhimDto.builder().tomTat(trich.isBlank() ? null : rutGon(trich, 2000))
                    .thoiLuongPhut(duration).daoDien(chuanHoa(truongWiki(wikiText, "director")))
                    .dienVien(chuanHoa(truongWiki(wikiText, "starring")))
                    .ngonNgu(chuanHoa(language)).theLoai(genre)
                    .posterUrl(poster).trailerUrl(trailer).sources(1).build();
        } catch (Exception loi) {
            nhatKy.debug("Wikipedia {} loi: {}", ngonNgu, loi.getMessage());
            return null;
        }
    }

    private String chuanHoaTenWiki(String value) {
        return java.text.Normalizer.normalize(value, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "")
                .toLowerCase(java.util.Locale.ROOT).replace('đ', 'd').replaceFirst("^(the|an|a)\\s+", "").replaceAll("[^\\p{L}\\p{N}]", "");
    }

    private String truongWiki(String text, String field) {
        var match = java.util.regex.Pattern.compile("(?ms)^\\|\\s*" + field + "\\s*=\\s*(.*?)(?=^\\|\\s*\\w+\\s*=|^}}|\\z)").matcher(text);
        if (!match.find()) return "";
        String value = match.group(1).replaceAll("(?is)<ref\\b[^>]*?/>|<ref\\b[^>]*>.*?</ref>", "")
                .replaceAll("\\[\\[(?:[^\\]|]+\\|)?([^\\]]+)\\]\\]", "$1")
                .replaceAll("\\{\\{[^|{}]+\\|", "").replace("}}", "")
                .replaceAll("(?m)^\\s*\\*\\s*", "").replaceAll("<[^>]+>", "")
                .replaceAll("'{2,}", "").trim();
        return java.util.Arrays.stream(value.split("[\\n|]+"))
                .map(String::trim).filter(part -> !part.isBlank()).limit(10).collect(java.util.stream.Collectors.joining(", "));
    }

    private String timTrailerPixar(String title, String production) {
        if (!production.toLowerCase(java.util.Locale.ROOT).contains("pixar")) return null;
        String slug = java.text.Normalizer.normalize(title.replaceFirst("\\s*\\([^)]*\\)\\s*$", ""), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "").toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        if (slug.isBlank()) return null;
        try {
            String html = movieMetadataClient.get().uri("https://www.pixar.com/{slug}", slug).retrieve().body(String.class);
            var matcher = java.util.regex.Pattern.compile("(?:youtube(?:-nocookie)?\\.com/(?:embed/|watch\\?v=)|youtu\\.be/)([a-zA-Z0-9_-]{11})").matcher(html);
            java.util.Set<String> checked = new java.util.LinkedHashSet<>();
            while (matcher.find() && checked.size() < 4) {
                String id = matcher.group(1);
                if (!checked.add(id)) continue;
                String videoUrl = MovieMediaUrl.trailer(id);
                try {
                    String raw = movieMetadataClient.get().uri("https://www.youtube.com/oembed?url={url}&format=json", videoUrl).retrieve().body(String.class);
                    JsonNode video = boChuyenDoiJson.readTree(raw);
                    String name = video.path("title").asText("");
                    String publisher = video.path("author_name").asText("").toLowerCase(java.util.Locale.ROOT);
                    String lower = name.toLowerCase(java.util.Locale.ROOT);
                    if (java.util.List.of("pixar", "disney", "disney•pixar", "walt disney studios").contains(publisher)
                            && chuanHoaTenWiki(name).contains(chuanHoaTenWiki(title)) && lower.contains("trailer") && !lower.contains("teaser"))
                        return videoUrl;
                } catch (Exception ignored) { /* An unavailable video must not discard the movie metadata. */ }
            }
        } catch (Exception error) {
            nhatKy.debug("Không lấy được trailer từ trang Pixar cho '{}': {}", title, error.getClass().getSimpleName());
        }
        return null;
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
        if (searxngUrl == null || searxngUrl.isBlank()) return false;
        try {
            movieMetadataClient.get()
                    .uri(searxngUrl + "/search?q=test&format=json")
                    .retrieve().toBodilessEntity();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
