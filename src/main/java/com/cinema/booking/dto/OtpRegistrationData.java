package com.cinema.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OtpRegistrationData {
    private String fullName;
    private String email;
    private String passwordEncoded;
    private String phone;
    private String otp;
    private Instant createdAt;
    private Instant expiresAt;
}
