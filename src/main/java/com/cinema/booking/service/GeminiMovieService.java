package com.cinema.booking.service;

import com.cinema.booking.dto.DuLieuThoPhimDto;
import com.cinema.booking.dto.ThongTinPhimAiDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class GeminiMovieService {
    private static final Logger nhatKy = LoggerFactory.getLogger(GeminiMovieService.class);

    private static final Pattern YOUTUBE_ID_PATTERN = Pattern.compile("(?:youtu\\.be/|youtube\\.com/(?:watch\\?.*?v=|embed/|shorts/|v/))([a-zA-Z0-9_-]{11})");

    private static final Map<String, String> TRAILER_PHO_BIEN = Map.ofEntries(
            Map.entry("deadpool & wolverine", "https://www.youtube.com/watch?v=73_1biulkYk"),
            Map.entry("deadpool and wolverine", "https://www.youtube.com/watch?v=73_1biulkYk"),
            Map.entry("deadpool", "https://www.youtube.com/watch?v=73_1biulkYk"),
            Map.entry("inside out 2", "https://www.youtube.com/watch?v=LEjhY15eCx0"),
            Map.entry("nhung manh ghep cam xuc 2", "https://www.youtube.com/watch?v=LEjhY15eCx0"),
            Map.entry("despicable me 4", "https://www.youtube.com/watch?v=qQlr9-rF32A"),
            Map.entry("ke trom mat trang 4", "https://www.youtube.com/watch?v=qQlr9-rF32A"),
            Map.entry("dune: part two", "https://www.youtube.com/watch?v=Way9Dexny3w"),
            Map.entry("dune 2", "https://www.youtube.com/watch?v=Way9Dexny3w"),
            Map.entry("moana 2", "https://www.youtube.com/watch?v=hDZ7y8RP5HE"),
            Map.entry("furiosa: a mad max saga", "https://www.youtube.com/watch?v=XJMuhwVlca4"),
            Map.entry("furiosa", "https://www.youtube.com/watch?v=XJMuhwVlca4"),
            Map.entry("godzilla x kong: the new empire", "https://www.youtube.com/watch?v=lV1OOlGwExM"),
            Map.entry("oppenheimer", "https://www.youtube.com/watch?v=uYPbbksJxIg"),
            Map.entry("avatar: the way of water", "https://www.youtube.com/watch?v=d9MyW72ELq0"),
            Map.entry("kung fu panda 4", "https://www.youtube.com/watch?v=_inKs4eeHiI")
    );

    private final ObjectMapper boChuyenDoiJson;
    private final MovieCrawlService dichVuCaoPhim;
    private final GeminiApiClient geminiClient;

    @Value("${gemini.enabled:false}")
    private boolean geminiBat;

    public ThongTinPhimAiDto taoThongTinPhim(String tenPhim) {
        if (tenPhim == null || tenPhim.isBlank())
            tenPhim = "Phim Mới";

        String ten = tenPhim.trim();
        DuLieuThoPhimDto duLieuTho = null;
        try {
            duLieuTho = dichVuCaoPhim.caoDuLieuPhim(ten);
        } catch (Exception e) {
            nhatKy.warn("Không cào được dữ liệu web cho phim '{}': {}", ten, e.getMessage());
        }

        ThongTinPhimAiDto tuWeb = tuDuLieuTho(duLieuTho, ten);
        boolean coMoTaWeb = tuWeb.getDescription() != null && !tuWeb.getDescription().isBlank();

        // 1. Web-first: có mô tả từ Wikipedia/TMDB -> trả ngay
        if (coMoTaWeb) {
            if (tuWeb.getTrailerUrl() == null || tuWeb.getTrailerUrl().isBlank()) {
                tuWeb.setTrailerUrl(timTrailerPhoBien(ten));
            }
            tuWeb.setCanhBao("Đã lấy thông tin từ TMDB/Wikipedia.");
            return tuWeb;
        }

        // 2. Thử gọi Gemini AI nếu được kích hoạt và có key hợp lệ
        if (geminiBat && geminiClient.coKhoaHopLe()) {
            try {
                String raw = goiGemini(taoPrompt(ten, duLieuTho));
                ThongTinPhimAiDto ketQua = docJsonPhim(raw, duLieuTho, ten, null);
                if (ketQua.getDescription() == null || ketQua.getDescription().isBlank()) {
                    String tomTatBoSung = goiTomTatNgan(ten, duLieuTho);
                    if (tomTatBoSung != null && !tomTatBoSung.isBlank()) {
                        ketQua.setDescription(tomTatBoSung);
                    }
                }
                if (ketQua.getTrailerUrl() == null || ketQua.getTrailerUrl().isBlank()) {
                    ketQua.setTrailerUrl(timTrailerPhoBien(ten));
                }
                if (ketQua.getDescription() != null && !ketQua.getDescription().isBlank()) {
                    return ketQua;
                }
            } catch (Exception ngoaiLe) {
                nhatKy.warn("Gemini không phản hồi hoặc hết quota cho phim '{}': {}. Chuyển sang dữ liệu tự động.",
                        ten, ngoaiLe.getMessage());
            }
        }

        // 3. Fallback an toàn: Trả về DTO hoàn chỉnh, không bao giờ để sập exception ra Controller
        return taoFallbackMacDinh(ten, duLieuTho, tuWeb);
    }

    private ThongTinPhimAiDto taoFallbackMacDinh(String ten, DuLieuThoPhimDto tho, ThongTinPhimAiDto tuWeb) {
        String description = (tuWeb != null && tuWeb.getDescription() != null && !tuWeb.getDescription().isBlank())
                ? tuWeb.getDescription()
                : (tho != null && tho.getTomTat() != null && !tho.getTomTat().isBlank()
                    ? tho.getTomTat()
                    : "Bộ phim điện ảnh đặc sắc «" + ten + "» với cốt truyện lôi cuốn, kỹ xảo hiện đại và dàn diễn viên tài năng mang lại trải nghiệm mãn nhãn.");

        Integer duration = (tuWeb != null && tuWeb.getDuration() != null && tuWeb.getDuration() > 0)
                ? tuWeb.getDuration()
                : (tho != null && tho.getThoiLuongPhut() != null && tho.getThoiLuongPhut() > 0
                    ? tho.getThoiLuongPhut() : 120);

        String ageRating = (tuWeb != null && tuWeb.getAgeRating() != null && !tuWeb.getAgeRating().isBlank())
                ? tuWeb.getAgeRating()
                : (tho != null && tho.getGioiHanTuoi() != null && !tho.getGioiHanTuoi().isBlank()
                    ? tho.getGioiHanTuoi() : "C16");

        String genre = (tuWeb != null && tuWeb.getGenre() != null && !tuWeb.getGenre().isBlank())
                ? tuWeb.getGenre()
                : (tho != null && tho.getTheLoai() != null && !tho.getTheLoai().isBlank()
                    ? tho.getTheLoai() : "Hành Động, Phiêu Lưu");

        String director = (tuWeb != null && tuWeb.getDirector() != null && !tuWeb.getDirector().isBlank())
                ? tuWeb.getDirector()
                : (tho != null && tho.getDaoDien() != null && !tho.getDaoDien().isBlank()
                    ? tho.getDaoDien() : "Đang cập nhật");

        String actors = (tuWeb != null && tuWeb.getActors() != null && !tuWeb.getActors().isBlank())
                ? tuWeb.getActors()
                : (tho != null && tho.getDienVien() != null && !tho.getDienVien().isBlank()
                    ? tho.getDienVien() : "Đang cập nhật");

        String posterUrl = (tuWeb != null && tuWeb.getPosterUrl() != null && !tuWeb.getPosterUrl().isBlank())
                ? tuWeb.getPosterUrl()
                : (tho != null && tho.getPosterUrl() != null && !tho.getPosterUrl().isBlank()
                    ? tho.getPosterUrl() : "https://picsum.photos/seed/cinema" + Math.abs(ten.hashCode() % 900 + 100) + "/300/450");

        String trailerUrl = (tuWeb != null && tuWeb.getTrailerUrl() != null && !tuWeb.getTrailerUrl().isBlank())
                ? tuWeb.getTrailerUrl()
                : timTrailerPhoBien(ten);

        if (trailerUrl == null || trailerUrl.isBlank()) {
            trailerUrl = "https://www.youtube.com/results?search_query=" + ten.replace(" ", "+") + "+trailer";
        }

        return ThongTinPhimAiDto.builder()
                .title(ten)
                .description(description)
                .duration(duration)
                .ageRating(ageRating)
                .genre(genre)
                .director(director)
                .actors(actors)
                .posterUrl(posterUrl)
                .trailerUrl(trailerUrl)
                .canhBao("Dữ liệu tự động điền. Bạn có thể xem lại hoặc chỉnh sửa trước khi lưu.")
                .build();
    }

    private String taoPrompt(String tenPhim, DuLieuThoPhimDto tho) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là chuyên gia thông tin điện ảnh. Hãy phân tích và tạo dữ liệu chuẩn xác cho bộ phim: «").append(tenPhim).append("».\n\n");
        sb.append("QUY TẮC BẮT BUỘC:\n");
        sb.append("1. Chỉ trả về DUY NHẤT một chuỗi JSON hợp lệ, KHÔNG bọc trong markdown ```json, KHÔNG thêm bất kỳ giải thích nào.\n");
        sb.append("2. Yêu cầu nghiêm ngặt cho 'trailerUrl': BẮT BUỘC trả về đúng Link Trailer chính thức (Official Trailer) trên YouTube dạng 'https://www.youtube.com/watch?v={YOUTUBE_VIDEO_ID}' hoặc trailerId 11 ký tự. TUYỆT ĐỐI KHÔNG trả về link search (results?search_query=...), link rác hoặc link chế bậy.\n");
        sb.append("3. Mô tả (description): Tóm tắt nội dung kịch bản phim từ 2-4 câu tiếng Việt hấp dẫn.\n");
        sb.append("4. Thể loại (genre), Đạo diễn (director), Diễn viên (actors): Chuỗi phân tách bởi dấu phẩy.\n");
        sb.append("5. Thời lượng (duration): Số nguyên phút.\n\n");

        sb.append("MẪU THAM KHẢO TRAILER CHUẨN (FEW-SHOT EXAMPLES):\n");
        sb.append("- Deadpool & Wolverine -> \"https://www.youtube.com/watch?v=73_1biulkYk\"\n");
        sb.append("- Inside Out 2 -> \"https://www.youtube.com/watch?v=LEjhY15eCx0\"\n");
        sb.append("- Despicable Me 4 -> \"https://www.youtube.com/watch?v=qQlr9-rF32A\"\n");
        sb.append("- Dune: Part Two -> \"https://www.youtube.com/watch?v=Way9Dexny3w\"\n");
        sb.append("- Moana 2 -> \"https://www.youtube.com/watch?v=hDZ7y8RP5HE\"\n");
        sb.append("- Furiosa: A Mad Max Saga -> \"https://www.youtube.com/watch?v=XJMuhwVlca4\"\n\n");

        if (tho != null && coDuLieuTho(tho)) {
            sb.append("DỮ LIỆU TÌM KIẾM THAM KHẢO:\n");
            ghiNeuCo(sb, "Tóm tắt", tho.getTomTat());
            if (tho.getThoiLuongPhut() != null && tho.getThoiLuongPhut() > 0)
                sb.append("Thời lượng: ").append(tho.getThoiLuongPhut()).append(" phút\n");
            ghiNeuCo(sb, "Giới hạn tuổi", tho.getGioiHanTuoi());
            ghiNeuCo(sb, "Thể loại", tho.getTheLoai());
            ghiNeuCo(sb, "Đạo diễn", tho.getDaoDien());
            ghiNeuCo(sb, "Diễn viên", tho.getDienVien());
            ghiNeuCo(sb, "Poster", tho.getPosterUrl());
            ghiNeuCo(sb, "Trailer", tho.getTrailerUrl());
            if (tho.getContext() != null && !tho.getContext().isBlank())
                sb.append("Ngữ cảnh: ").append(tho.getContext()).append("\n");
            sb.append("\n");
        }

        sb.append("CẤU TRÚC JSON ĐẦU RA YÊU CẦU:\n");
        sb.append("{\n");
        sb.append("  \"title\": \"").append(tenPhim).append("\",\n");
        sb.append("  \"director\": \"Đạo diễn\",\n");
        sb.append("  \"actors\": \"Dàn diễn viên\",\n");
        sb.append("  \"genre\": \"Thể loại\",\n");
        sb.append("  \"duration\": 120,\n");
        sb.append("  \"description\": \"Tóm tắt kịch bản\",\n");
        sb.append("  \"posterUrl\": \"https://image.tmdb.org/t/p/w500/...\",\n");
        sb.append("  \"trailerUrl\": \"https://www.youtube.com/watch?v=73_1biulkYk\"\n");
        sb.append("}");

        return sb.toString();
    }

    private boolean coDuLieuTho(DuLieuThoPhimDto tho) {
        if (tho == null) return false;
        return tho.getTomTat() != null || tho.getPosterUrl() != null || tho.getTrailerUrl() != null
                || tho.getContext() != null;
    }

    private void ghiNeuCo(StringBuilder sb, String ten, String giaTri) {
        if (giaTri != null && !giaTri.isBlank())
            sb.append(ten).append(": ").append(giaTri.trim()).append("\n");
    }

    private String goiGemini(String prompt) {
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))
        );
        try {
            return trichXuatVanBan(geminiClient.generateContent(body));
        } catch (ResponseStatusException ngoaiLe) {
            nhatKy.warn("Gemini loi: {}", rutGon(ngoaiLe.getReason(), 120));
            throw new ResponseStatusException(ngoaiLe.getStatusCode(),
                    chuyenLoiGeminiThanhThongBao(ngoaiLe.getReason()));
        }
    }

    private String goiTomTatNgan(String tenPhim, DuLieuThoPhimDto tho) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("Ten phim: «").append(tenPhim).append("».\n");
        if (tho != null && coDuLieuTho(tho)) {
            prompt.append("Thong tin tim kiem (viet lai tom tat, khong copy nguyen):\n");
            if (tho.getTomTat() != null && !tho.getTomTat().isBlank())
                prompt.append(tho.getTomTat().trim()).append("\n");
            if (tho.getContext() != null && !tho.getContext().isBlank()
                    && !tho.getContext().equals(tho.getTomTat()))
                prompt.append(tho.getContext().trim()).append("\n");
            prompt.append("\nViet tom tat noi dung phim 2-4 cau tieng Viet. Chi tra van ban, khong JSON.");
        } else {
            prompt.append("Viet tom tat phim 2-4 cau tieng Viet. Chi tra van ban, khong JSON.");
        }
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt.toString()))))
        );
        try {
            return trichXuatVanBan(geminiClient.generateContent(body));
        } catch (ResponseStatusException ignored) {
            return null;
        }
    }

    private String trichXuatVanBan(String phanHoi) {
        try {
            JsonNode noiDung = boChuyenDoiJson.readTree(phanHoi).at("/candidates/0/content/parts/0/text");
            if (noiDung.isMissingNode()) {
                JsonNode loi = boChuyenDoiJson.readTree(phanHoi).path("error").path("message");
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        loi.isMissingNode() ? "Gemini khong tra ve noi dung" : loi.asText());
            }
            return noiDung.asText().trim();
        } catch (ResponseStatusException ngoaiLe) {
            throw ngoaiLe;
        } catch (Exception ngoaiLe) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Phan hoi Gemini khong hop le");
        }
    }

    private String chuyenLoiGeminiThanhThongBao(String loi) {
        if (loi == null || loi.isBlank())
            return "Gemini không phản hồi. Kiểm tra quota tại Google AI Studio hoặc thử lại sau 2–5 phút.";
        String chuan = loi.toLowerCase(Locale.ROOT);
        if (chuan.contains("quota") || chuan.contains("rate limit") || chuan.contains("429")
                || chuan.contains("resource exhausted") || chuan.contains("too many requests"))
            return "Gemini hết quota miễn phí (lỗi 429). Hệ thống đã thử xoay API key — đợi 2–5 phút hoặc thêm key mới.";
        if (chuan.contains("access_token_type_unsupported") || chuan.contains("invalid authentication"))
            return "Key Gemini (AQ.) không được API chấp nhận. Tạo key mới tại Google AI Studio hoặc thử lại sau.";
        if (chuan.contains("not found") && chuan.contains("model"))
            return "Không gọi được Gemini (model không khả dụng hoặc hết quota). Thử lại sau 2–5 phút.";
        return rutGon(loi, 220);
    }

    private ThongTinPhimAiDto tuDuLieuTho(DuLieuThoPhimDto tho, String tenPhim) {
        if (tho == null) return ThongTinPhimAiDto.builder().title(tenPhim).build();
        String tomTat = chuanHoaChuoi(tho.getTomTat());
        if (tomTat == null && tho.getContext() != null)
            tomTat = rutGon(tho.getContext(), 900);
        return ThongTinPhimAiDto.builder()
                .title(tenPhim)
                .description(tomTat)
                .duration(tho.getThoiLuongPhut())
                .ageRating(chuanHoaChuoi(tho.getGioiHanTuoi()))
                .genre(chuanHoaChuoi(tho.getTheLoai()))
                .director(chuanHoaChuoi(tho.getDaoDien()))
                .actors(chuanHoaChuoi(tho.getDienVien()))
                .posterUrl(chuanHoaChuoi(tho.getPosterUrl()))
                .trailerUrl(chuanHoaTrailerUrl(tho.getTrailerUrl(), tenPhim))
                .build();
    }

    private boolean coNoiDung(ThongTinPhimAiDto dto) {
        return dto.getDescription() != null || dto.getPosterUrl() != null || dto.getTrailerUrl() != null
                || dto.getDirector() != null || dto.getActors() != null || dto.getGenre() != null
                || dto.getDuration() != null || dto.getAgeRating() != null;
    }

    private String rutGon(String text, int max) {
        if (text == null || text.isBlank()) return null;
        String s = text.trim();
        if (s.length() <= max) return s;
        return s.substring(0, max).trim() + "…";
    }

    private ThongTinPhimAiDto docJsonPhim(String raw, DuLieuThoPhimDto tho, String tenPhim, String canhBao) {
        if (raw == null || raw.isBlank()) {
            ThongTinPhimAiDto ketQua = tuDuLieuTho(tho, tenPhim);
            if (canhBao != null) ketQua.setCanhBao(canhBao);
            return ketQua;
        }
        try {
            String json = raw.trim();
            int start = json.indexOf('{');
            int end = json.lastIndexOf('}');
            if (start < 0 || end <= start)
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI khong tra ve JSON hop le");
            json = json.substring(start, end + 1);
            JsonNode node = boChuyenDoiJson.readTree(json);

            String title = chonChuoi(node, "title", tenPhim);
            String trailerRaw = chonChuoi(node, "trailerUrl", tho != null ? tho.getTrailerUrl() : null);

            ThongTinPhimAiDto ketQua = ThongTinPhimAiDto.builder()
                    .title(title)
                    .description(chonTomTat(node, tho))
                    .duration(chonThoiLuong(node, tho))
                    .ageRating(chonChuoi(node, "gioiHanTuoi", tho != null ? tho.getGioiHanTuoi() : "P"))
                    .genre(chonTheLoai(node, tho))
                    .director(chonChuoi(node, "director", chonChuoi(node, "daoDien", tho != null ? tho.getDaoDien() : null)))
                    .actors(chonDienVien(node, tho))
                    .posterUrl(chonChuoi(node, "posterUrl", tho != null ? tho.getPosterUrl() : null))
                    .trailerUrl(chuanHoaTrailerUrl(trailerRaw, tenPhim))
                    .canhBao(canhBao)
                    .build();

            if (ketQua.getDescription() == null && tho != null && tho.getTomTat() != null)
                ketQua.setDescription(chuanHoaChuoi(tho.getTomTat()));
            return ketQua;
        } catch (ResponseStatusException ngoaiLe) {
            throw ngoaiLe;
        } catch (Exception ngoaiLe) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Khong parse duoc JSON tu AI");
        }
    }

    private String chonTheLoai(JsonNode node, DuLieuThoPhimDto tho) {
        for (String truong : List.of("genre", "theLoai", "genres")) {
            JsonNode fn = node.path(truong);
            if (fn.isArray()) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode item : fn) {
                    String t = item.asText(null);
                    if (t != null && !t.isBlank()) {
                        if (sb.length() > 0) sb.append(", ");
                        sb.append(t.trim());
                    }
                }
                if (sb.length() > 0) return sb.toString();
            } else {
                String v = chuanHoaChuoi(fn.asText(null));
                if (v != null) return v;
            }
        }
        return tho != null ? chuanHoaChuoi(tho.getTheLoai()) : null;
    }

    private String chonTomTat(JsonNode node, DuLieuThoPhimDto tho) {
        for (String truong : List.of("description", "tomTat", "moTa", "summary", "tom_tat")) {
            String v = chuanHoaChuoi(node.path(truong).asText(null));
            if (v != null) return v;
        }
        return tho != null ? chuanHoaChuoi(tho.getTomTat()) : null;
    }

    private String chonChuoi(JsonNode node, String truong, String fallback) {
        String tuAi = chuanHoaChuoi(node.path(truong).asText(null));
        if (tuAi != null) return tuAi;
        return chuanHoaChuoi(fallback);
    }

    private Integer chonThoiLuong(JsonNode node, DuLieuThoPhimDto tho) {
        for (String truong : List.of("duration", "thoiLuongPhut", "thoiLuong", "runtime")) {
            int v = node.path(truong).asInt(0);
            if (v > 0) return v;
        }
        return tho != null && tho.getThoiLuongPhut() != null && tho.getThoiLuongPhut() > 0
                ? tho.getThoiLuongPhut() : null;
    }

    private String chonDienVien(JsonNode node, DuLieuThoPhimDto tho) {
        String tuAi = chuanHoaDienVien(node);
        if (tuAi != null) return tuAi;
        return tho != null ? chuanHoaChuoi(tho.getDienVien()) : null;
    }

    private String chuanHoaDienVien(JsonNode node) {
        for (String truong : List.of("actors", "dienVien", "cast")) {
            JsonNode arr = node.path(truong);
            if (arr.isArray()) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode muc : arr) {
                    String ten = muc.asText(null);
                    if (ten != null && !ten.isBlank()) {
                        if (sb.length() > 0) sb.append(", ");
                        sb.append(ten.trim());
                    }
                }
                if (sb.length() > 0) return sb.toString();
            } else {
                String v = chuanHoaChuoi(arr.asText(null));
                if (v != null) return v;
            }
        }
        return null;
    }

    public String chuanHoaTrailerUrl(String raw, String tenPhim) {
        if (raw != null && !raw.isBlank()) {
            String s = raw.trim();
            // Bỏ qua các link search results
            if (!s.contains("results?") && !s.contains("search_query=")) {
                Matcher matcher = YOUTUBE_ID_PATTERN.matcher(s);
                if (matcher.find()) {
                    return "https://www.youtube.com/watch?v=" + matcher.group(1);
                }
                if (s.matches("^[a-zA-Z0-9_-]{11}$")) {
                    return "https://www.youtube.com/watch?v=" + s;
                }
            }
        }
        return timTrailerPhoBien(tenPhim);
    }

    public String timTrailerPhoBien(String tenPhim) {
        if (tenPhim == null || tenPhim.isBlank()) return null;
        String key = tenPhim.trim().toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String> entry : TRAILER_PHO_BIEN.entrySet()) {
            if (key.contains(entry.getKey()) || entry.getKey().contains(key)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private String chuanHoaChuoi(String giaTri) {
        if (giaTri == null) return null;
        String s = giaTri.trim();
        return s.isEmpty() ? null : s;
    }
}
