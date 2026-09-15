package com.cinema.booking.controller;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.springframework.boot.availability.ApplicationAvailability;
import org.springframework.boot.availability.ReadinessState;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {
    private final ApplicationAvailability availability;
    private final MongoTemplate mongoTemplate;

    @GetMapping
    public ResponseEntity<Map<String, String>> health() {
        boolean ready = availability.getReadinessState() == ReadinessState.ACCEPTING_TRAFFIC;
        return ResponseEntity.status(ready ? 200 : 503)
                .body(Map.of("status", ready ? "UP" : "STARTING"));
    }

    @GetMapping("/database")
    public ResponseEntity<Map<String, String>> database() {
        try {
            mongoTemplate.executeCommand(new Document("ping", 1));
            return ResponseEntity.ok(Map.of("status", "UP"));
        } catch (Exception failure) {
            return ResponseEntity.status(503).body(Map.of("status", "DOWN"));
        }
    }
}
