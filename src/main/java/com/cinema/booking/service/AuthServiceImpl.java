package com.cinema.booking.service;

import com.cinema.booking.config.JwtUtil;
import com.cinema.booking.document.User;
import com.cinema.booking.document.UserRole;
import com.cinema.booking.dto.*;
import com.cinema.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository khoNguoiDung;
    private final PasswordEncoder boMaHoaMatKhau;
    private final JwtUtil congCuJwt;
    private final GoogleTokenXacThuc xacThucGoogle;
    private final EmailService emailService;

    // Bộ nhớ đệm tạm thời lưu thông tin đăng ký và mã OTP (TTL: 5 phút = 300s)
    private final Map<String, OtpRegistrationData> otpCache = new ConcurrentHashMap<>();
    private final SecureRandom random = new SecureRandom();

    @Override
    public AuthResponse dangNhap(DangNhapRequest yeuCau) {
        User nguoiDung = khoNguoiDung.findByEmail(yeuCau.getEmail())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng"));
        if (nguoiDung.getMatKhau() == null || nguoiDung.getMatKhau().isBlank())
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        if (!boMaHoaMatKhau.matches(yeuCau.getMatKhau(), nguoiDung.getMatKhau()))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không đúng");
        if (Boolean.TRUE.equals(nguoiDung.getBiKhoa()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        return taoPhanHoi(nguoiDung);
    }

    @Override
    public AuthResponse dangKy(DangKyRequest yeuCau) {
        if (khoNguoiDung.findByEmail(yeuCau.getEmail()).isPresent())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email đã được sử dụng");
        User nguoiDungMoi = User.builder()
                .email(yeuCau.getEmail())
                .matKhau(boMaHoaMatKhau.encode(yeuCau.getMatKhau()))
                .hoTen(yeuCau.getHoTen())
                .vaiTro(UserRole.CUSTOMER)
                .build();
        return taoPhanHoi(khoNguoiDung.save(nguoiDungMoi));
    }

    @Override
    public Map<String, Object> registerSendOtp(RegisterSendOtpRequest yeuCau) {
        String email = yeuCau.getEmail() != null ? yeuCau.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : "";
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }

        String matKhau = yeuCau.getPassword() != null ? yeuCau.getPassword() : yeuCau.getMatKhau();
        if (matKhau == null || matKhau.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự");
        }

        String hoTen = yeuCau.getFullName() != null ? yeuCau.getFullName().trim() : yeuCau.getHoTen();
        if (hoTen == null || hoTen.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được để trống");
        }

        // 1. Kiểm tra trùng email
        if (khoNguoiDung.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác!");
        }

        // 2. Kiểm tra trùng số điện thoại (nếu có nhập)
        String phone = yeuCau.getPhone() != null ? yeuCau.getPhone().trim() : yeuCau.getSoDienThoai();
        if (phone != null && !phone.isBlank()) {
            phone = phone.trim();
            if (khoNguoiDung.existsBySoDienThoai(phone)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại này đã được sử dụng!");
            }
        }

        // Sinh mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", random.nextInt(1000000));
        Instant now = Instant.now();
        Instant expiresAt = now.plus(5, ChronoUnit.MINUTES);

        // Lưu thông tin đăng ký vào cache
        OtpRegistrationData data = OtpRegistrationData.builder()
                .email(email)
                .fullName(hoTen)
                .passwordEncoded(boMaHoaMatKhau.encode(matKhau))
                .phone(phone != null && !phone.isBlank() ? phone : null)
                .otp(otp)
                .createdAt(now)
                .expiresAt(expiresAt)
                .build();

        otpCache.put(email, data);
        log.info("Đã lưu cache OTP đăng ký cho email {}. Mã OTP: {}", email, otp);

        try {
            emailService.guiEmailOtp(email, hoTen, otp);
        } catch (Exception e) {
            log.error("❌ Không thể gửi email qua SMTP: {}. Fallback OTP cho email [{}]: [ {} ]", e.getMessage(), email, otp);
        }

        return Map.of(
                "success", true,
                "message", "Mã OTP xác thực đã được gửi đến email " + email,
                "email", email,
                "expiresInSeconds", 300
        );
    }

    @Override
    public AuthResponse verifyRegisterOtp(VerifyRegisterOtpRequest yeuCau) {
        String email = yeuCau.getEmail() != null ? yeuCau.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : "";
        String otp = yeuCau.getOtp() != null ? yeuCau.getOtp().trim() : "";

        if (email.isBlank() || otp.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email và mã OTP không được để trống");
        }

        OtpRegistrationData data = otpCache.get(email);
        if (data == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng gửi lại mã OTP mới.");
        }

        if (Instant.now().isAfter(data.getExpiresAt())) {
            otpCache.remove(email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP đã hết hạn (quá 5 phút). Vui lòng gửi lại mã OTP mới.");
        }

        if (!data.getOtp().equals(otp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã OTP không chính xác. Vui lòng kiểm tra lại.");
        }

        // Kiểm tra lại trước khi lưu để chống race condition
        if (khoNguoiDung.existsByEmail(email)) {
            otpCache.remove(email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được đăng ký tài khoản. Vui lòng đăng nhập!");
        }

        if (data.getPhone() != null && !data.getPhone().isBlank() && khoNguoiDung.existsBySoDienThoai(data.getPhone())) {
            otpCache.remove(email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại này đã được sử dụng!");
        }

        // Tạo tài khoản chính thức vào MongoDB
        User nguoiDungMoi = User.builder()
                .email(data.getEmail())
                .hoTen(data.getFullName())
                .matKhau(data.getPasswordEncoded())
                .soDienThoai(data.getPhone())
                .vaiTro(UserRole.CUSTOMER)
                .biKhoa(false)
                .build();

        try {
            User savedUser = khoNguoiDung.save(nguoiDungMoi);
            otpCache.remove(email);
            log.info("Xác thực OTP thành công! Đã tạo tài khoản cho: {}", email);
            return taoPhanHoi(savedUser);
        } catch (org.springframework.dao.DuplicateKeyException | com.mongodb.DuplicateKeyException e) {
            otpCache.remove(email);
            log.warn("Lỗi trùng lặp khóa khi lưu tài khoản {}: {}", email, e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email hoặc số điện thoại này đã được sử dụng trong hệ thống.");
        }
    }

    @Override
    public AuthResponse dangNhapGoogle(String token) {
        GoogleTokenXacThuc.ThongTinGoogle thongTin = xacThucGoogle.xacThucToken(token);
        User nguoiDung = khoNguoiDung.findByEmail(thongTin.email()).orElseGet(() -> taoNguoiDungGoogle(thongTin));
        if (Boolean.TRUE.equals(nguoiDung.getBiKhoa()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa");
        if (thongTin.anhDaiDien() != null && (nguoiDung.getAnhDaiDien() == null || nguoiDung.getAnhDaiDien().isBlank())) {
            nguoiDung.setAnhDaiDien(thongTin.anhDaiDien());
            nguoiDung = khoNguoiDung.save(nguoiDung);
        }
        return taoPhanHoi(nguoiDung);
    }

    private User taoNguoiDungGoogle(GoogleTokenXacThuc.ThongTinGoogle thongTin) {
        String matKhauNgauNhien = boMaHoaMatKhau.encode(UUID.randomUUID().toString());
        User nguoiDungMoi = User.builder()
                .email(thongTin.email())
                .matKhau(matKhauNgauNhien)
                .hoTen(thongTin.hoTen())
                .anhDaiDien(thongTin.anhDaiDien())
                .vaiTro(UserRole.CUSTOMER)
                .build();
        return khoNguoiDung.save(nguoiDungMoi);
    }

    @Override
    public AuthResponse layThongTinCaNhan(String email) {
        User nguoiDung = timNguoiDungTheoEmail(email);
        return taoPhanHoiKhongToken(nguoiDung);
    }

    @Override
    public AuthResponse capNhatProfile(String email, CapNhatProfileRequest yeuCau) {
        User nguoiDung = timNguoiDungTheoEmail(email);
        if (yeuCau.getHoTen() != null && !yeuCau.getHoTen().isBlank())
            nguoiDung.setHoTen(yeuCau.getHoTen().trim());
        if (yeuCau.getSoDienThoai() != null)
            nguoiDung.setSoDienThoai(yeuCau.getSoDienThoai().trim());
        return taoPhanHoiKhongToken(khoNguoiDung.save(nguoiDung));
    }

    @Override
    public void doiMatKhau(String email, DoiMatKhauRequest yeuCau) {
        if (yeuCau.getMatKhauMoi() == null || yeuCau.getMatKhauMoi().length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có ít nhất 6 ký tự");
        User nguoiDung = timNguoiDungTheoEmail(email);
        if (!boMaHoaMatKhau.matches(yeuCau.getMatKhauCu(), nguoiDung.getMatKhau()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng");
        nguoiDung.setMatKhau(boMaHoaMatKhau.encode(yeuCau.getMatKhauMoi()));
        khoNguoiDung.save(nguoiDung);
    }

    private User timNguoiDungTheoEmail(String email) {
        return khoNguoiDung.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private AuthResponse taoPhanHoi(User nguoiDung) {
        String token = congCuJwt.taoToken(nguoiDung.getId(), nguoiDung.getEmail(), nguoiDung.getVaiTro().name());
        return taoPhanHoiKhongToken(nguoiDung).toBuilder().token(token).build();
    }

    private AuthResponse taoPhanHoiKhongToken(User nguoiDung) {
        return AuthResponse.builder()
                .id(nguoiDung.getId())
                .email(nguoiDung.getEmail())
                .hoTen(nguoiDung.getHoTen())
                .soDienThoai(nguoiDung.getSoDienThoai())
                .role(nguoiDung.getVaiTro().name())
                .build();
    }
}
