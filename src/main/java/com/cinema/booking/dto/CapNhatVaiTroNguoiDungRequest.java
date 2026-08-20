package com.cinema.booking.dto;

import com.cinema.booking.document.UserRole;
import lombok.Data;

@Data
public class CapNhatVaiTroNguoiDungRequest {
    private UserRole vaiTro;
}
