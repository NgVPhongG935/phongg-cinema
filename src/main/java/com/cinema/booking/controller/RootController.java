package com.cinema.booking.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/** Thông tin ngắn gọn khi mở trực tiếp domain backend trên trình duyệt. */
@RestController
public class RootController {

    @GetMapping({"/", "/api", "/api/v1"})
    public Map<String, Object> root() {
        return Map.of(
                "service", "PhongG Cinema API",
                "status", "UP",
                "health", "/api/v1/health",
                "movies", "/api/v1/movies",
                "timestamp", Instant.now().toString());
    }
}
