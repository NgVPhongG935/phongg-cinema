package com.cinema.booking.controller;

import com.cinema.booking.dto.*;
import com.cinema.booking.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService dichVuXacThuc;

    @PostMapping("/login")
    public AuthResponse dangNhap(@RequestBody DangNhapRequest yeuCau) {
        return dichVuXacThuc.dangNhap(yeuCau);
    }

    @PostMapping("/register")
    public AuthResponse dangKy(@RequestBody DangKyRequest yeuCau) {
        return dichVuXacThuc.dangKy(yeuCau);
    }

    // 1. API Gửi mã OTP xác thực đăng ký
    @PostMapping({"/register/send-otp", "/register-send-otp"})
    public Map<String, Object> registerSendOtp(@RequestBody RegisterSendOtpRequest yeuCau) {
        return dichVuXacThuc.registerSendOtp(yeuCau);
    }

    // 2. API Xác thực mã OTP và hoàn tất tạo tài khoản
    @PostMapping({"/register/verify-otp", "/verify-register-otp"})
    public AuthResponse verifyRegisterOtp(@RequestBody VerifyRegisterOtpRequest yeuCau) {
        return dichVuXacThuc.verifyRegisterOtp(yeuCau);
    }

    @PostMapping("/google")
    public AuthResponse dangNhapGoogle(@RequestBody GoogleDangNhapRequest yeuCau) {
        return dichVuXacThuc.dangNhapGoogle(yeuCau.getToken());
    }

    @GetMapping("/me")
    public AuthResponse layThongTinCaNhan(@RequestParam(required = false) String email) {
        String emailDangNhap = email != null && !email.isBlank() ? email : layEmailTuToken();
        return dichVuXacThuc.layThongTinCaNhan(emailDangNhap);
    }

    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public AuthResponse capNhatProfile(@RequestBody CapNhatProfileRequest yeuCau) {
        return dichVuXacThuc.capNhatProfile(layEmailTuToken(), yeuCau);
    }

    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public void doiMatKhau(@RequestBody DoiMatKhauRequest yeuCau) {
        dichVuXacThuc.doiMatKhau(layEmailTuToken(), yeuCau);
    }

    private String layEmailTuToken() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
        return auth.getPrincipal().toString();
    }
}
