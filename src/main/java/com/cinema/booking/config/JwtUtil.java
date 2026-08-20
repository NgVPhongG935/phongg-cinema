package com.cinema.booking.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Component
public class JwtUtil {
    private final byte[] khoaBiMat;
    private final long thoiGianHetHanMs;

    public JwtUtil(@Value("${jwt.secret}") String chuoiBiMat, @Value("${jwt.thoiGianHetHanMs}") long thoiGianHetHanMs) {
        this.khoaBiMat = chuoiBiMat.getBytes(StandardCharsets.UTF_8);
        this.thoiGianHetHanMs = thoiGianHetHanMs;
    }

    public String taoToken(String id, String email, String role) {
        long hetHan = System.currentTimeMillis() + thoiGianHetHanMs;
        String header = maHoaBase64Url("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String payload = maHoaBase64Url(String.format("{\"sub\":\"%s\",\"id\":\"%s\",\"email\":\"%s\",\"role\":\"%s\",\"exp\":%d}", email, id, email, role, hetHan));
        String chuKy = maHoaBase64Url(hmacSha256(header + "." + payload));
        return header + "." + payload + "." + chuKy;
    }

    private String maHoaBase64Url(String noiDung) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(noiDung.getBytes(StandardCharsets.UTF_8));
    }

    private String maHoaBase64Url(byte[] duLieu) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(duLieu);
    }

    private byte[] hmacSha256(String noiDung) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(khoaBiMat, "HmacSHA256"));
            return mac.doFinal(noiDung.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ngoaiLe) {
            throw new IllegalStateException("Khong the tao chu ky JWT", ngoaiLe);
        }
    }
}
