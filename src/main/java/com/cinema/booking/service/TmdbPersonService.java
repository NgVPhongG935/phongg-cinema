package com.cinema.booking.service;

import com.cinema.booking.dto.PersonAiResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TmdbPersonService {

    private static final String TMDB_BASE = "https://api.themoviedb.org/3";
    private static final String TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/h632";

    private final ObjectMapper objectMapper;

    @Value("${tmdb.api-key:b8a6c91a6b00242537db0d1281c89d53}")
    private String apiKey;

    @Value("${tmdb.enabled:true}")
    private boolean tmdbEnabled;

    /**
     * Tra cứu thông tin diễn viên / đạo diễn qua TMDb API
     * @param artistName Tên nghệ sĩ
     * @return PersonAiResponseDto hoặc null nếu không tìm thấy
     */
    public PersonAiResponseDto lookupPerson(String artistName) {
        if (artistName == null || artistName.isBlank()) {
            return null;
        }

        String effectiveKey = apiKey != null ? apiKey.trim() : "";
        if (effectiveKey.isBlank()) {
            return null;
        }

        String name = artistName.trim();

        try {
            // 1. Tìm kiếm person trên TMDb
            JsonNode personNode = searchPerson(name, effectiveKey, "vi-VN");
            if (personNode == null) {
                personNode = searchPerson(name, effectiveKey, "en-US");
            }
            if (personNode == null) {
                personNode = searchPerson(name, effectiveKey, null);
            }

            if (personNode == null) {
                log.info("TMDb không tìm thấy nghệ sĩ: '{}'", name);
                return null;
            }

            long personId = personNode.path("id").asLong();
            String officialName = personNode.path("name").asText(name);
            String profilePath = personNode.path("profile_path").asText(null);
            String department = personNode.path("known_for_department").asText("Acting");

            // Lấy danh sách tác phẩm nổi bật
            List<String> knownWorks = new ArrayList<>();
            JsonNode knownForArray = personNode.path("known_for");
            if (knownForArray.isArray()) {
                for (JsonNode work : knownForArray) {
                    String title = work.path("title").asText(work.path("name").asText(""));
                    if (!title.isBlank()) {
                        knownWorks.add(title);
                    }
                }
            }

            // 2. Lấy thông tin chi tiết (ngày sinh, tiểu sử, ảnh HD)
            JsonNode detailNode = getPersonDetail(personId, effectiveKey, "vi-VN");
            if (detailNode == null || detailNode.path("biography").asText("").isBlank()) {
                JsonNode enDetail = getPersonDetail(personId, effectiveKey, "en-US");
                if (enDetail != null) {
                    detailNode = enDetail;
                }
            }

            String birthDate = "";
            String bio = "";
            if (detailNode != null) {
                birthDate = detailNode.path("birthday").asText("");
                bio = detailNode.path("biography").asText("");
                if ((profilePath == null || profilePath.isBlank()) && detailNode.hasNonNull("profile_path")) {
                    profilePath = detailNode.path("profile_path").asText();
                }
                if (detailNode.hasNonNull("known_for_department")) {
                    department = detailNode.path("known_for_department").asText(department);
                }
            }

            // Xây dựng URL ảnh HD TMDb
            String avatarUrl = null;
            if (profilePath != null && !profilePath.isBlank()) {
                avatarUrl = TMDB_IMAGE_BASE + (profilePath.startsWith("/") ? profilePath : "/" + profilePath);
            } else {
                avatarUrl = "https://ui-avatars.com/api/?name=" + URLEncoder.encode(officialName, StandardCharsets.UTF_8) + "&background=8b5cf6&color=fff&size=512";
            }

            // Xác định vai trò
            String roleType = "ACTOR";
            if ("Directing".equalsIgnoreCase(department)) {
                roleType = "DIRECTOR";
            }

            // Rút gọn tiểu sử thành 1-2 câu súc tích nếu quá dài
            if (bio != null && !bio.isBlank()) {
                String cleanBio = bio.replaceAll("(?i)Description above from the Wikipedia.*", "").trim();
                String[] sentences = cleanBio.split("(?<=[.!?])\\s+");
                if (sentences.length >= 2) {
                    bio = sentences[0].trim() + " " + sentences[1].trim();
                } else if (sentences.length == 1) {
                    bio = sentences[0].trim();
                }
            }

            // Nếu bio vẫn trống, tạo tóm tắt từ tác phẩm nổi bật
            if (bio == null || bio.isBlank()) {
                if (!knownWorks.isEmpty()) {
                    String roleName = "DIRECTOR".equals(roleType) ? "đạo diễn" : "diễn viên";
                    bio = officialName + " là một " + roleName + " tài năng, được khán giả biết đến qua các tác phẩm nổi bật: "
                            + String.join(", ", knownWorks) + ".";
                } else {
                    bio = officialName + " là một nghệ sĩ điện ảnh tài năng với nhiều tác phẩm xuất sắc.";
                }
            }

            log.info("TMDb tìm thấy nghệ sĩ '{}': avatar={}, birthDate={}", officialName, avatarUrl, birthDate);

            return PersonAiResponseDto.builder()
                    .name(officialName)
                    .birthDate(birthDate)
                    .roleType(roleType)
                    .avatarUrl(avatarUrl)
                    .bio(bio)
                    .build();

        } catch (Exception e) {
            log.warn("Lỗi tra cứu TMDb cho nghệ sĩ '{}': {}", name, e.getMessage());
            return null;
        }
    }

    private JsonNode searchPerson(String query, String key, String language) {
        try {
            String encodedQuery = URLEncoder.encode(query, StandardCharsets.UTF_8);
            String url = TMDB_BASE + "/search/person?api_key=" + key + "&query=" + encodedQuery;
            if (language != null && !language.isBlank()) {
                url += "&language=" + language;
            }

            String json = RestClient.create().get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            if (json == null || json.isBlank()) return null;
            JsonNode root = objectMapper.readTree(json);
            JsonNode results = root.path("results");
            if (results.isArray() && !results.isEmpty()) {
                return results.get(0);
            }
        } catch (Exception ignored) { }
        return null;
    }

    private JsonNode getPersonDetail(long personId, String key, String language) {
        try {
            String url = TMDB_BASE + "/person/" + personId + "?api_key=" + key;
            if (language != null && !language.isBlank()) {
                url += "&language=" + language;
            }

            String json = RestClient.create().get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            if (json == null || json.isBlank()) return null;
            return objectMapper.readTree(json);
        } catch (Exception ignored) { }
        return null;
    }
}
