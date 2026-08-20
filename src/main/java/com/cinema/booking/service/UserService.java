package com.cinema.booking.service;

import com.cinema.booking.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    Page<UserResponseDto> layDanhSach(String tuKhoa, String vaiTro, String trangThai, Pageable phanTrang);

    UserResponseDto layChiTiet(String id);

    UserResponseDto taoNguoiDung(TaoNguoiDungRequest yeuCau);

    UserResponseDto capNhatNguoiDung(String id, CapNhatNguoiDungRequest yeuCau);

    void xoaNguoiDung(String id);

    UserResponseDto capNhatVaiTro(String id, CapNhatVaiTroNguoiDungRequest yeuCau);

    UserResponseDto capNhatTrangThai(String id, CapNhatTrangThaiNguoiDungRequest yeuCau);
}
