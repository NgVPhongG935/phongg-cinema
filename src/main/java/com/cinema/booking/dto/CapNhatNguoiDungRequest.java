package com.cinema.booking.dto;

import com.cinema.booking.document.UserRole;
import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CapNhatNguoiDungRequest {
    @JsonAlias({"fullName", "hoTen", "name"})
    private String fullName;

    @JsonAlias({"phone", "soDienThoai"})
    private String phone;

    @JsonAlias({"password", "matKhau"})
    private String password;

    @JsonAlias({"role", "vaiTro"})
    private UserRole role;

    public String getHoTen() {
        return fullName;
    }

    public String getSoDienThoai() {
        return phone;
    }

    public String getMatKhau() {
        return password;
    }

    public UserRole getVaiTro() {
        return role;
    }
}
