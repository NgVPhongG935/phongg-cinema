package com.cinema.booking.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Goi Gemini API voi model mac dinh gemini-1.5-flash va xoay nhieu API key khi 429/loi mang.
 */
@Component
public class GeminiApiClient {
    private static final Logger nhatKy = LoggerFactory.getLogger(GeminiApiClient.class);

    private final ObjectMapper boChuyenDoiJson;
    private final AtomicInteger chiSoKhoa = new AtomicInteger(0);
    private final List<String> danhSachKhoa = new ArrayList<>();

    @Value("${gemini.api-key:}")
    private String khoaDon;

    @Value("${gemini.api-keys:}")
    private String danhSachKhoaRaw;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelMacDinh;

    public GeminiApiClient(ObjectMapper boChuyenDoiJson) {
        this.boChuyenDoiJson = boChuyenDoiJson;
    }

    @PostConstruct
    void napDanhSachKhoa() {
        danhSachKhoa.clear();
        if (danhSachKhoaRaw != null && !danhSachKhoaRaw.isBlank()) {
            for (String muc : danhSachKhoaRaw.split(",")) {
                themKhoaNeuHopLe(muc);
            }
        }
        if (khoaDon != null && !khoaDon.isBlank()) {
            danhSachKhoa.remove(khoaDon.trim());
            danhSachKhoa.add(0, khoaDon.trim());
        }
        if (!danhSachKhoa.isEmpty()) {
            nhatKy.info("GEMINI: da nap {} API key hop le, model mac dinh: {}", danhSachKhoa.size(), modelMacDinh);
        }
    }

    public String getModelMacDinh() {
        return modelMacDinh != null && !modelMacDinh.isBlank() ? modelMacDinh : "gemini-1.5-flash";
    }

    public boolean coKhoaHopLe() {
        return !danhSachKhoa.isEmpty();
    }

    public int soLuongKhoa() {
        return danhSachKhoa.size();
    }

    public String generateContent(Map<String, Object> body) {
        return generateContent(getModelMacDinh(), body);
    }

    public String generateContent(String model, Map<String, Object> body) {
        if (danhSachKhoa.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Chua cau hinh GEMINI_API_KEYS hoac GEMINI_API_KEY.");
        }

        ResponseStatusException loiCuoi = null;
        int batDau = Math.floorMod(chiSoKhoa.get(), danhSachKhoa.size());

        for (int i = 0; i < danhSachKhoa.size(); i++) {
            int viTri = (batDau + i) % danhSachKhoa.size();
            String khoa = danhSachKhoa.get(viTri);
            try {
                String ketQua = goiVoiKhoa(model, body, khoa);
                chiSoKhoa.set(viTri);
                return ketQua;
            } catch (ResponseStatusException ngoaiLe) {
                loiCuoi = ngoaiLe;
                if (!nenXoayKey(ngoaiLe)) throw ngoaiLe;
                nhatKy.warn("GEMINI key #{} loi ({}), thu key tiep theo...", viTri + 1, rutGon(ngoaiLe.getReason(), 80));
            } catch (ResourceAccessException ngoaiLe) {
                loiCuoi = new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Khong ket noi Gemini: " + (ngoaiLe.getMessage() != null ? ngoaiLe.getMessage() : "loi mang"));
                nhatKy.warn("GEMINI key #{} loi mang, thu key tiep theo...", viTri + 1);
            }
        }

        chiSoKhoa.incrementAndGet();
        if (loiCuoi != null) throw loiCuoi;
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Gemini khong phan hoi sau khi thu tat ca API key.");
    }

    private String goiVoiKhoa(String model, Map<String, Object> body, String khoaApi) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + khoaApi;
        return RestClient.create()
                .post()
                .uri(url)
                .header("x-goog-api-key", khoaApi)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .onStatus(status -> status.is4xxClientError() || status.is5xxServerError(), (yeuCau, phanHoi) -> {
                    int statusCode = phanHoi.getStatusCode().value();
                    byte[] bytes;
                    try {
                        bytes = phanHoi.getBody().readAllBytes();
                    } catch (Exception ignored) {
                        bytes = new byte[0];
                    }
                    String loi = docLoiTuPhanHoi(bytes);
                    if (loi.isBlank()) loi = "Gemini loi HTTP " + statusCode;
                    else if (!loi.contains(String.valueOf(statusCode)))
                        loi = "HTTP " + statusCode + ": " + loi;
                    HttpStatus httpStatus = statusCode == 429 ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_GATEWAY;
                    throw new ResponseStatusException(httpStatus, loi);
                })
                .body(String.class);
    }

    private String docLoiTuPhanHoi(byte[] bytes) {
        try {
            String raw = new String(bytes);
            JsonNode err = boChuyenDoiJson.readTree(raw).path("error").path("message");
            if (!err.isMissingNode()) return err.asText();
            return raw;
        } catch (Exception ignored) {
            return "";
        }
    }

    private boolean nenXoayKey(ResponseStatusException ngoaiLe) {
        if (ngoaiLe.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) return true;
        String loi = ngoaiLe.getReason();
        if (loi == null) return true;
        String chuan = loi.toLowerCase(Locale.ROOT);
        if (chuan.contains("429") || chuan.contains("quota") || chuan.contains("rate limit")
                || chuan.contains("resource exhausted") || chuan.contains("too many requests"))
            return true;
        if (chuan.contains("timeout") || chuan.contains("timed out")
                || chuan.contains("connection") || chuan.contains("unavailable"))
            return true;
        if (chuan.contains("api key") || chuan.contains("api_key") || chuan.contains("invalid api key"))
            return true;
        return chuan.contains("permission denied") && !chuan.contains("not found");
    }

    private void themKhoaNeuHopLe(String khoa) {
        if (khoa == null) return;
        String s = khoa.trim();
        if (s.isEmpty() || danhSachKhoa.contains(s)) return;
        if (s.startsWith("AIza") || s.startsWith("AQ.")) danhSachKhoa.add(s);
    }

    private String rutGon(String text, int max) {
        if (text == null) return "";
        return text.length() <= max ? text : text.substring(0, max) + "…";
    }
}
