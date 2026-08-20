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
public class RegisterSendOtpRequest {
    @JsonAlias({"fullName", "hoTen", "name"})
    private String fullName;

    @JsonAlias({"email"})
    private String email;

    @JsonAlias({"password", "matKhau"})
    private String password;

    @JsonAlias({"phone", "soDienThoai", "phoneNumber"})
    private String phone;

    public String getHoTen() {
        return fullName;
    }

    public String getMatKhau() {
        return password;
    }

    public String getSoDienThoai() {
        return phone;
    }
}
