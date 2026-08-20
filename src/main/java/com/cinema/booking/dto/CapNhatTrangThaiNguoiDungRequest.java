package com.cinema.booking.dto;

import lombok.Data;

@Data
public class CapNhatTrangThaiNguoiDungRequest {
    /** true = khóa tài khoản, false = mở khóa */
    private Boolean biKhoa;
}
