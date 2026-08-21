package com.cinema.booking.controller;

import com.cinema.booking.document.Movie;
import com.cinema.booking.document.Person;
import com.cinema.booking.dto.PersonAiResponseDto;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.PersonRepository;
import com.cinema.booking.service.GeminiApiClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class PersonAdminController {

    private final PersonRepository personRepository;
    private final MovieRepository movieRepository;
    private final GeminiApiClient geminiClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.enabled:false}")
    private boolean geminiBat;

    @GetMapping({"/admin/persons", "/persons"})
    public ResponseEntity<List<Person>> getAllPersons(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String roleType
    ) {
        List<Person> list = personRepository.findAll();
        List<Person> filtered = list.stream()
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
        return ResponseEntity.ok(filtered);
    }

    @GetMapping({"/admin/persons/{id}", "/persons/{id}"})
    public ResponseEntity<Person> getPersonById(@PathVariable String id) {
        Person person = personRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + id));
        return ResponseEntity.ok(person);
    }

    @GetMapping({"/admin/persons/{id}/movies", "/persons/{id}/movies"})
    public ResponseEntity<List<Movie>> getMoviesByPerson(@PathVariable String id) {
        String targetName = id;
        Optional<Person> pOpt = personRepository.findById(id);
        if (pOpt.isPresent() && pOpt.get().getName() != null) {
            targetName = pOpt.get().getName();
        }

        final String q = targetName.trim().toLowerCase();
        List<Movie> movies = movieRepository.findAll().stream()
                .filter(m -> {
                    boolean laDienVien = m.getActors() != null && m.getActors().stream()
                            .anyMatch(a -> a != null && (a.equalsIgnoreCase(q) || a.toLowerCase().contains(q)));
                    boolean laDaoDien = m.getDirector() != null && (m.getDirector().equalsIgnoreCase(q) || m.getDirector().toLowerCase().contains(q));
                    return laDienVien || laDaoDien;
                })
                .toList();
        return ResponseEntity.ok(movies);
    }

    @PostMapping({"/admin/persons", "/persons"})
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Person> createPerson(@RequestBody Person person) {
        if (person.getName() == null || person.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên nghệ sĩ không được để trống.");
        }
        if (person.getRoleType() == null || person.getRoleType().isBlank()) {
            person.setRoleType("ACTOR");
        }
        if (person.getAvatarUrl() == null || person.getAvatarUrl().isBlank()) {
            person.setAvatarUrl("https://ui-avatars.com/api/?name=" + person.getName().replace(" ", "+") + "&background=8b5cf6&color=fff&size=256");
        }
        Person saved = personRepository.save(person);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping({"/admin/persons/{id}", "/persons/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<Person> updatePerson(@PathVariable String id, @RequestBody Person person) {
        Person existing = personRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ với ID: " + id));

        if (person.getName() != null && !person.getName().isBlank()) {
            existing.setName(person.getName().trim());
        }
        if (person.getBirthDate() != null) {
            existing.setBirthDate(person.getBirthDate().trim());
        }
        if (person.getRoleType() != null && !person.getRoleType().isBlank()) {
            existing.setRoleType(person.getRoleType().trim().toUpperCase());
        }
        if (person.getAvatarUrl() != null && !person.getAvatarUrl().isBlank()) {
            existing.setAvatarUrl(person.getAvatarUrl().trim());
        }
        if (person.getBio() != null) {
            existing.setBio(person.getBio().trim());
        }

        Person updated = personRepository.save(existing);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping({"/admin/persons/{id}", "/persons/{id}"})
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deletePerson(@PathVariable String id) {
        if (!personRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nghệ sĩ để xóa.");
        }
        personRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa nghệ sĩ thành công!"));
    }

    @PostMapping({"/admin/persons/ai-fill", "/admin/persons/ai-generate", "/persons/ai-fill"})
    public ResponseEntity<PersonAiResponseDto> generatePersonInfo(@RequestParam String name) {
        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên nghệ sĩ không được để trống.");
        }

        String ten = name.trim();

        // 1. Thử gọi Gemini AI nếu có key
        if (geminiBat && geminiClient.coKhoaHopLe()) {
            try {
                String prompt = "Tra cứu thông tin nghệ sĩ/diễn viên/đạo diễn: " + ten + ". "
                        + "Trả về DUY NHẤT 1 chuỗi JSON hợp lệ (không bọc markdown, không thêm bất kỳ văn bản giải thích nào) theo format sau:\n"
                        + "{\n"
                        + "  \"name\": \"" + ten + "\",\n"
                        + "  \"birthDate\": \"YYYY-MM-DD (năm-tháng-ngày sinh chuẩn, ví dụ 1976-10-23)\",\n"
                        + "  \"roleType\": \"ACTOR hoặc DIRECTOR hoặc BOTH\",\n"
                        + "  \"avatarUrl\": \"link ảnh đại diện nếu có\",\n"
                        + "  \"bio\": \"Tóm tắt 1 câu tiểu sử súc tích bằng tiếng Việt\"\n"
                        + "}";

                Map<String, Object> body = Map.of(
                        "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                        "generationConfig", Map.of("temperature", 0.2, "maxOutputTokens", 400)
                );

                String rawResponse = geminiClient.generateContent(body);
                String jsonText = extractJson(rawResponse);

                if (jsonText != null && !jsonText.isBlank()) {
                    JsonNode node = objectMapper.readTree(jsonText);
                    String aiName = node.has("name") && !node.get("name").asText().isBlank() ? node.get("name").asText(ten) : ten;
                    String aiBirthDate = node.has("birthDate") ? node.get("birthDate").asText("") : "";
                    String aiRoleType = node.has("roleType") ? node.get("roleType").asText("ACTOR") : "ACTOR";
                    String aiAvatarUrl = node.has("avatarUrl") && !node.get("avatarUrl").asText().isBlank()
                            ? node.get("avatarUrl").asText()
                            : "https://ui-avatars.com/api/?name=" + ten.replace(" ", "+") + "&background=8b5cf6&color=fff&size=256";
                    String aiBio = node.has("bio") ? node.get("bio").asText("") : "";

                    return ResponseEntity.ok(PersonAiResponseDto.builder()
                            .name(aiName)
                            .birthDate(aiBirthDate)
                            .roleType(aiRoleType.toUpperCase())
                            .avatarUrl(aiAvatarUrl)
                            .bio(aiBio)
                            .build());
                }
            } catch (Exception e) {
                log.warn("Gemini tra cứu thông tin nghệ sĩ '{}' lỗi: {}", ten, e.getMessage());
            }
        }

        // 2. Fallback an toàn nếu AI offline
        return ResponseEntity.ok(PersonAiResponseDto.builder()
                .name(ten)
                .birthDate("")
                .roleType("ACTOR")
                .avatarUrl("https://ui-avatars.com/api/?name=" + ten.replace(" ", "+") + "&background=8b5cf6&color=fff&size=256")
                .bio(ten + " là một nghệ sĩ tài năng với nhiều tác phẩm điện ảnh xuất sắc.")
                .build());
    }

    private String extractJson(String raw) {
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
