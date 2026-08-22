package com.cinema.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DangKyRequest {
    private String hoTen;
    private String fullName;
    private String email;
    private String matKhau;
    private String password;
    private String soDienThoai;
    private String phone;

    public String layHoTen() {
        if (hoTen != null && !hoTen.isBlank()) return hoTen.trim();
        if (fullName != null && !fullName.isBlank()) return fullName.trim();
        return "";
    }

    public String layMatKhau() {
        if (matKhau != null && !matKhau.isBlank()) return matKhau;
        if (password != null && !password.isBlank()) return password;
        return "";
    }

    public String laySoDienThoai() {
        if (soDienThoai != null && !soDienThoai.isBlank()) return soDienThoai.trim();
        if (phone != null && !phone.isBlank()) return phone.trim();
        return null;
    }
}
