package com.cinema.booking.dto;

import com.cinema.booking.document.UserRole;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponseDto {
    private String id;
    private String email;
    private String hoTen;
    private String soDienThoai;
    private UserRole vaiTro;
    private Boolean biKhoa;
}
