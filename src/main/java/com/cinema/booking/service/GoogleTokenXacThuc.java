package com.cinema.booking.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GoogleTokenXacThuc {
    private final String clientId;
    private final RestClient restClient = RestClient.create();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GoogleTokenXacThuc(@Value("${google.client-id}") String clientId) {
        this.clientId = clientId;
    }

    public record ThongTinGoogle(String email, String hoTen, String anhDaiDien) {}

    public ThongTinGoogle xacThucToken(String idToken) {
        if (idToken == null || idToken.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Token Google không hợp lệ");
        try {
            String phanHoi = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={token}", idToken)
                    .retrieve()
                    .body(String.class);
            JsonNode duLieu = objectMapper.readTree(phanHoi);
            if (duLieu.has("error"))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token Google không hợp lệ");
            String aud = duLieu.path("aud").asText("");
            if (!clientId.equals(aud))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token Google không hợp lệ");
            String email = duLieu.path("email").asText("");
            if (email.isBlank())
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Không lấy được email từ Google");
            if (!"true".equals(duLieu.path("email_verified").asText()))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email Google chưa được xác minh");
            String hoTen = duLieu.path("name").asText(email);
            String anhDaiDien = duLieu.has("picture") ? duLieu.path("picture").asText(null) : null;
            return new ThongTinGoogle(email, hoTen, anhDaiDien);
        } catch (ResponseStatusException ngoaiLe) {
            throw ngoaiLe;
        } catch (Exception ngoaiLe) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token Google không hợp lệ");
        }
    }
}
