package com.cinema.booking.config;

import com.cinema.booking.service.GeminiApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.Map;

/** Log trạng thái Gemini khi khởi động */
@Component
public class GeminiStartupLogger implements ApplicationRunner {
    private static final Logger nhatKy = LoggerFactory.getLogger(GeminiStartupLogger.class);

    private final GeminiApiClient geminiClient;

    @Value("${gemini.enabled:false}")
    private boolean geminiBat;

    public GeminiStartupLogger(GeminiApiClient geminiClient) {
        this.geminiClient = geminiClient;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!geminiBat) {
            nhatKy.warn("GEMINI: TAT (GEMINI_ENABLED=false). AI soan noi dung phim se khong chay.");
            return;
        }
        if (!geminiClient.coKhoaHopLe()) {
            nhatKy.warn("GEMINI: BAT nhung chua co API key — dat GEMINI_API_KEYS hoac GEMINI_API_KEY trong gemini.local.cmd.");
            return;
        }
        nhatKy.info("GEMINI: BAT — {} key, model {}", geminiClient.soLuongKhoa(), geminiClient.getModelMacDinh());
        thuModelKhoiDong();
    }

    private void thuModelKhoiDong() {
        try {
            String phanHoi = geminiClient.generateContent(Map.of(
                    "contents", java.util.List.of(Map.of("parts", java.util.List.of(Map.of("text", "ok"))))
            ));
            boolean ok = phanHoi != null && phanHoi.contains("candidates");
            nhatKy.info("GEMINI probe {}: {}", geminiClient.getModelMacDinh(), ok ? "OK" : "empty");
        } catch (Exception ngoaiLe) {
            String loi = ngoaiLe.getMessage() != null ? ngoaiLe.getMessage() : ngoaiLe.getClass().getSimpleName();
            nhatKy.warn("GEMINI probe {} FAIL: {}", geminiClient.getModelMacDinh(),
                    loi.length() > 120 ? loi.substring(0, 120) : loi);
        }
    }
}
