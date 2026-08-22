package com.cinema.booking.service;

import com.cinema.booking.dto.*;

public interface AuthService {
    AuthResponse dangNhap(DangNhapRequest yeuCau);
    AuthResponse dangKy(DangKyRequest yeuCau);
    AuthResponse dangNhapGoogle(String token);
    AuthResponse layThongTinCaNhan(String email);
    AuthResponse capNhatProfile(String email, CapNhatProfileRequest yeuCau);
    void doiMatKhau(String email, DoiMatKhauRequest yeuCau);
}
