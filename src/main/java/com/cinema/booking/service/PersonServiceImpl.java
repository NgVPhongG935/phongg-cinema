package com.cinema.booking.service;

import com.cinema.booking.document.Movie;
import com.cinema.booking.document.Person;
import com.cinema.booking.dto.PersonAiResponseDto;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.PersonRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class PersonServiceImpl implements PersonService {

    private final PersonRepository khoPerson;
    private final MovieRepository khoPhim;
    private final GeminiApiClient geminiClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.enabled:false}")
    private boolean geminiBat;

    @Override
    public List<Person> layTatCa(String search, String roleType) {
        List<Person> tatCa = khoPerson.findAll();

        return tatCa.stream()
                .filter(p -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.trim().toLowerCase();
                    return (p.getName() != null && p.getName().toLowerCase().contains(q))
                            || (p.getBio() != null && p.getBio().toLowerCase().contains(q));
                })
                .filter(p -> {
                    if (roleType == null || roleType.isBlank() || "ALL".equalsIgnoreCase(roleType)) return true;
                    return roleType.equalsIgnoreCase(p.getRoleType()) || "BOTH".equalsIgnoreCase(p.getRoleType());
                })
                .toList();
    }

    @Override
    public Person timTheoId(String id) {
        return khoPerson.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + id));
    }

    @Override
    public Person taoMoi(Person person) {
        if (person.getName() == null || person.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên nghệ sĩ không được để trống.");
        }
        if (person.getRoleType() == null || person.getRoleType().isBlank()) {
            person.setRoleType("ACTOR");
        }
        if (person.getAvatarUrl() == null || person.getAvatarUrl().isBlank()) {
            person.setAvatarUrl("https://ui-avatars.com/api/?name=" + person.getName().replace(" ", "+") + "&background=8b5cf6&color=fff&size=256");
        }
        return khoPerson.save(person);
    }

    @Override
    public Person capNhat(String id, Person person) {
        Person tonTai = timTheoId(id);
        if (person.getName() != null && !person.getName().isBlank()) {
            tonTai.setName(person.getName());
        }
        if (person.getBirthDate() != null) {
            tonTai.setBirthDate(person.getBirthDate());
        }
        if (person.getRoleType() != null && !person.getRoleType().isBlank()) {
            tonTai.setRoleType(person.getRoleType());
        }
        if (person.getAvatarUrl() != null && !person.getAvatarUrl().isBlank()) {
            tonTai.setAvatarUrl(person.getAvatarUrl());
        }
        if (person.getBio() != null) {
            tonTai.setBio(person.getBio());
        }
        return khoPerson.save(tonTai);
    }

    @Override
    public void xoa(String id) {
        if (!khoPerson.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ để xóa.");
        }
        khoPerson.deleteById(id);
    }

    @Override
    public List<Movie> timPhimTheoPerson(String personIdOrName) {
        String tenNgheSi = personIdOrName;
        Optional<Person> pOpt = khoPerson.findById(personIdOrName);
        if (pOpt.isPresent() && pOpt.get().getName() != null) {
            tenNgheSi = pOpt.get().getName();
        }

        final String q = tenNgheSi.trim().toLowerCase();

        return khoPhim.findAll().stream()
                .filter(m -> {
                    boolean laDienVien = m.getActors() != null && m.getActors().stream()
                            .anyMatch(a -> a != null && (a.equalsIgnoreCase(q) || a.toLowerCase().contains(q)));
                    boolean laDaoDien = m.getDirector() != null && (m.getDirector().equalsIgnoreCase(q) || m.getDirector().toLowerCase().contains(q));
                    return laDienVien || laDaoDien;
                })
                .toList();
    }

    @Override
    public PersonAiResponseDto tuDongDienThongTinAi(String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vui lòng nhập tên nghệ sĩ cần tra cứu.");
        }

        String ten = name.trim();

        // 1. Thử gọi Gemini AI nếu có cấu hình
        if (geminiBat && geminiClient.coKhoaHopLe()) {
            try {
                String prompt = "Bạn là trợ lý điện ảnh. Hãy tra cứu và tóm tắt thông tin ngắn gọn về nghệ sĩ/diễn viên/đạo diễn có tên: '" + ten + "'. "
                        + "Trả về DUY NHẤT 1 chuỗi JSON hợp lệ với cấu trúc sau (không bọc markdown, không thêm bất kỳ văn bản giải thích nào):\n"
                        + "{\n"
                        + "  \"name\": \"" + ten + "\",\n"
                        + "  \"birthDate\": \"YYYY-MM-DD\",\n"
                        + "  \"roleType\": \"ACTOR hoặc DIRECTOR hoặc BOTH\",\n"
                        + "  \"avatarUrl\": \"link ảnh đại diện nếu biết hoặc để trống\",\n"
                        + "  \"bio\": \"Tóm tắt 1-2 câu ngắn gọn về sự nghiệp và tác phẩm nổi bật của nghệ sĩ bằng tiếng Việt.\"\n"
                        + "}";

                Map<String, Object> body = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 500)
                );

                String rawResponse = geminiClient.generateContent(body);
                String jsonText = trichXuatJson(rawResponse);

                if (jsonText != null && !jsonText.isBlank()) {
                    JsonNode node = objectMapper.readTree(jsonText);
                    String aiName = node.has("name") ? node.get("name").asText(ten) : ten;
                    String aiBirthDate = node.has("birthDate") ? node.get("birthDate").asText("") : "";
                    String aiRoleType = node.has("roleType") ? node.get("roleType").asText("ACTOR") : "ACTOR";
                    String aiAvatarUrl = node.has("avatarUrl") && !node.get("avatarUrl").asText().isBlank()
                            ? node.get("avatarUrl").asText()
                            : "https://ui-avatars.com/api/?name=" + ten.replace(" ", "+") + "&background=8b5cf6&color=fff&size=256";
                    String aiBio = node.has("bio") ? node.get("bio").asText("") : "";

                    return PersonAiResponseDto.builder()
                            .name(aiName)
                            .birthDate(aiBirthDate)
                            .roleType(aiRoleType.toUpperCase())
                            .avatarUrl(aiAvatarUrl)
                            .bio(aiBio)
                            .build();
                }
            } catch (Exception e) {
                log.warn("Gemini tra cứu thông tin nghệ sĩ '{}' thất bại: {}", ten, e.getMessage());
            }
        }

        // 2. Fallback mặc định nếu chưa bật AI
        return PersonAiResponseDto.builder()
                .name(ten)
                .birthDate("")
                .roleType("ACTOR")
                .avatarUrl("https://ui-avatars.com/api/?name=" + ten.replace(" ", "+") + "&background=8b5cf6&color=fff&size=256")
                .bio(ten + " là nghệ sĩ điện ảnh tài năng với nhiều đóng góp trong các tác phẩm nổi tiếng.")
                .build();
    }

    private String trichXuatJson(String raw) {
        if (raw == null) return null;
        try {
            JsonNode root = objectMapper.readTree(raw);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            String text = textNode.asText("");
            if (text.contains("```json")) {
                text = text.substring(text.indexOf("```json") + 7);
                if (text.contains("```")) text = text.substring(0, text.indexOf("```"));
            } else if (text.contains("```")) {
                text = text.substring(text.indexOf("```") + 3);
                if (text.contains("```")) text = text.substring(0, text.indexOf("```"));
            }
            return text.trim();
        } catch (Exception e) {
            Pattern pattern = Pattern.compile("\\{.*\\}", Pattern.DOTALL);
            Matcher matcher = pattern.matcher(raw);
            if (matcher.find()) {
                return matcher.group(0);
            }
            return null;
        }
    }
}
