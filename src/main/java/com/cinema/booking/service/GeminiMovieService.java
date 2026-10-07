package com.cinema.booking.service;

import com.cinema.booking.dto.DuLieuThoPhimDto;
import com.cinema.booking.dto.ThongTinPhimAiDto;
import com.cinema.booking.util.MovieMediaUrl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GeminiMovieService {
    private static final Logger nhatKy = LoggerFactory.getLogger(GeminiMovieService.class);
    private final ObjectMapper boChuyenDoiJson;
    private final MovieCrawlService dichVuCaoPhim;
    private final GeminiApiClient geminiClient;
    @Value("${gemini.enabled:false}")
    private boolean geminiBat;

    public ThongTinPhimAiDto taoThongTinPhim(String tenPhim) {
        return taoThongTinPhim(tenPhim, null);
    }

    public List<com.cinema.booking.dto.LuaChonPhimAiDto> timLuaChonPhim(String title) {
        return dichVuCaoPhim.timLuaChonPhim(title);
    }

    public ThongTinPhimAiDto taoThongTinPhim(String tenPhim, Long tmdbId) {
        if (tenPhim == null || tenPhim.isBlank())
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.BAD_REQUEST, "Vui lòng nhập tên phim.");
        String ten = tenPhim.trim();
        DuLieuThoPhimDto tho = null;
        try { tho = tmdbId == null ? dichVuCaoPhim.caoDuLieuPhim(ten) : dichVuCaoPhim.caoDuLieuPhim(ten, tmdbId); }
        catch (org.springframework.web.server.ResponseStatusException error) { throw error; }
        catch (Exception error) { nhatKy.warn("Không tra cứu được '{}': {}", ten, error.getClass().getSimpleName()); }
        ThongTinPhimAiDto result = tuDuLieuTho(tho, ten);
        boolean dungAi = false;
        if (result.getDescription() == null && geminiBat && geminiClient.coKhoaHopLe()) {
            try {
                String prompt = "Soạn thông tin cho phim «" + ten + "». Chỉ trả JSON với description (tiếng Việt), duration (phút), ageRating (P/T13/T16/T18), genre, director, actors, language. "
                        + "Không suy đoán khi không biết: để null. Không tạo URL poster hay trailer. Không thay đổi tên phim. Dữ liệu tham khảo: "
                        + boChuyenDoiJson.writeValueAsString(tho);
                String response = geminiClient.generateContent(Map.of("contents", List.of(Map.of("parts", List.of(Map.of("text", prompt))))));
                String raw = boChuyenDoiJson.readTree(response).at("/candidates/0/content/parts/0/text").asText("");
                int start = raw.indexOf('{'), end = raw.lastIndexOf('}');
                if (start < 0 || end <= start) throw new IllegalArgumentException("Invalid AI JSON");
                JsonNode node = boChuyenDoiJson.readTree(raw.substring(start, end + 1));
                result.setDescription(chon(result.getDescription(), chuoi(node, "description", "tomTat", "moTa", "summary")));
                if (result.getDuration() == null) result.setDuration(thoiLuong(node.path("duration").asInt(node.path("thoiLuongPhut").asInt(0))));
                if (result.getAgeRating() == null) result.setAgeRating(doTuoi(chuoi(node, "ageRating", "gioiHanTuoi")));
                result.setGenre(chon(result.getGenre(), chuoi(node, "genre", "genres", "theLoai")));
                result.setDirector(chon(result.getDirector(), chuoi(node, "director", "daoDien")));
                result.setActors(chon(result.getActors(), chuoi(node, "actors", "cast", "dienVien")));
                result.setLanguage(chon(result.getLanguage(), chuoi(node, "language", "ngonNgu")));
                // Media URLs only come from lookup sources, never from language-model guesses.
                dungAi = true;
            } catch (Exception error) { nhatKy.warn("Không soạn được thông tin AI '{}': {}", ten, error.getClass().getSimpleName()); }
        }
        List<String> thieu = new ArrayList<>();
        if (result.getPosterUrl() == null) thieu.add("poster");
        if (result.getTrailerUrl() == null) thieu.add("trailer");
        if (result.getDuration() == null) thieu.add("thời lượng");
        if (result.getAgeRating() == null) thieu.add("giới hạn tuổi");
        if (result.getGenre() == null) thieu.add("thể loại");
        if (result.getDirector() == null) thieu.add("đạo diễn");
        if (result.getActors() == null) thieu.add("diễn viên");
        if (result.getDescription() == null) thieu.add("mô tả");
        String warning = dungAi ? "Thông tin do AI soạn, cần kiểm tra trước khi lưu. " : "";
        if (!thieu.isEmpty()) warning += "Chưa tìm được " + String.join(", ", thieu) + "; giữ nguyên các trường này nếu đã có dữ liệu. ";
        if ((result.getPosterUrl() == null || result.getTrailerUrl() == null) && !dichVuCaoPhim.tmdbSanSang())
            warning += "Nguồn TMDB chưa được cấu hình hoặc đang tắt; cần cấu hình TMDB_API_KEY/TMDB_ENABLED để tra cứu poster và trailer.";
        result.setCanhBao(warning.isBlank() ? null : warning.trim());
        return result;
    }
    private ThongTinPhimAiDto tuDuLieuTho(DuLieuThoPhimDto tho, String ten) {
        if (tho == null) return ThongTinPhimAiDto.builder().title(ten).build();
        return ThongTinPhimAiDto.builder().title(ten).description(chuanHoa(tho.getTomTat()))
                .duration(thoiLuong(tho.getThoiLuongPhut())).ageRating(doTuoi(tho.getGioiHanTuoi()))
                .genre(chuanHoa(tho.getTheLoai())).director(chuanHoa(tho.getDaoDien()))
                .actors(chuanHoa(tho.getDienVien())).language(chuanHoa(tho.getNgonNgu()))
                .posterUrl(MovieMediaUrl.poster(tho.getPosterUrl()))
                .trailerUrl(MovieMediaUrl.trailer(tho.getTrailerUrl())).build();
    }
    public String chuanHoaTrailerUrl(String raw, String tenPhim) { return MovieMediaUrl.trailer(raw); }
    private Integer thoiLuong(Integer value) { return value != null && value > 0 && value <= 600 ? value : null; }
    private String doTuoi(String raw) {
        String value = chuanHoa(raw);
        if (value == null) return null;
        value = value.toUpperCase(Locale.ROOT).replaceFirst("^C(?=13|16|18)", "T");
        return List.of("P", "T13", "T16", "T18").contains(value) ? value : null;
    }
    private String chuanHoa(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String value = raw.trim();
        return List.of("đang cập nhật", "chưa cập nhật", "unknown", "n/a", "null").contains(value.toLowerCase(Locale.ROOT)) ? null : value;
    }
    private String chon(String first, String second) { return first == null ? second : first; }
    private String chuoi(JsonNode node, String... keys) {
        for (String key : keys) {
            JsonNode value = node.path(key);
            if (value.isArray()) {
                List<String> items = new ArrayList<>();
                for (JsonNode item : value) { String text = chuanHoa(item.asText(null)); if (text != null) items.add(text); }
                if (!items.isEmpty()) return String.join(", ", items);
            } else { String text = chuanHoa(value.asText(null)); if (text != null) return text; }
        }
        return null;
    }
}
