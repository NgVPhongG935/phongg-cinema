package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder(toBuilder = true)
public class AuthResponse {
    private String token;
    private String id;
    private String email;
    private String hoTen;
    private String soDienThoai;
    private String role;
}
