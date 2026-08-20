package com.cinema.booking.service;

import com.cinema.booking.dto.CapNhatTrangThaiNguoiDungRequest;
import com.cinema.booking.dto.CapNhatRapNhanVienRequest;
import com.cinema.booking.dto.DatLaiMatKhauNhanVienRequest;
import com.cinema.booking.dto.StaffResponseDto;
import com.cinema.booking.dto.TaoNhanVienRequest;

import java.util.List;

public interface StaffService {
    List<StaffResponseDto> layDanhSach();
    StaffResponseDto them(TaoNhanVienRequest yeuCau);
    StaffResponseDto capNhatRap(String id, CapNhatRapNhanVienRequest yeuCau);
    void datLaiMatKhau(String id, DatLaiMatKhauNhanVienRequest yeuCau);
    StaffResponseDto capNhatTrangThai(String id, CapNhatTrangThaiNguoiDungRequest yeuCau);
}
