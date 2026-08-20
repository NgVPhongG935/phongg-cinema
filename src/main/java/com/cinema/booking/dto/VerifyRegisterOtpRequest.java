package com.cinema.booking.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyRegisterOtpRequest {
    @JsonAlias({"email"})
    private String email;

    @JsonAlias({"otp", "maOtp", "code"})
    private String otp;
}
