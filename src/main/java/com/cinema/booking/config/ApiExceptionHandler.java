package com.cinema.booking.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> xuLyLoiTrangThai(ResponseStatusException ngoaiLe) {
        HttpStatus trangThai = HttpStatus.resolve(ngoaiLe.getStatusCode().value());
        return ResponseEntity.status(ngoaiLe.getStatusCode()).body(Map.of(
                "message", ngoaiLe.getReason() != null ? ngoaiLe.getReason() : "Yêu cầu không hợp lệ",
                "status", trangThai != null ? trangThai.value() : 400
        ));
    }

    @ExceptionHandler(org.springframework.dao.DuplicateKeyException.class)
    public ResponseEntity<Map<String, Object>> xuLyLoiTrungLap(org.springframework.dao.DuplicateKeyException ngoaiLe) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "message", "Email hoặc số điện thoại này đã được đăng ký tài khoản.",
                "status", 400
        ));
    }
}
