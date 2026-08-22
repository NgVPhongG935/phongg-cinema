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

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository khoNguoiDung;
    private final PasswordEncoder boMaHoaMatKhau;
    private final JwtUtil congCuJwt;
    private final GoogleTokenXacThuc xacThucGoogle;

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
        String email = yeuCau.getEmail() != null ? yeuCau.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : "";
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        String hoTen = yeuCau.layHoTen();
        if (hoTen.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Họ và tên không được để trống");
        }
        String matKhau = yeuCau.layMatKhau();
        if (matKhau.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự");
        }
        if (khoNguoiDung.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được sử dụng");
        }
        String soDienThoai = yeuCau.laySoDienThoai();
        if (soDienThoai != null && khoNguoiDung.existsBySoDienThoai(soDienThoai)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại này đã được sử dụng");
        }

        User nguoiDungMoi = User.builder()
                .email(email)
                .matKhau(boMaHoaMatKhau.encode(matKhau))
                .hoTen(hoTen)
                .soDienThoai(soDienThoai)
                .vaiTro(UserRole.CUSTOMER)
                .biKhoa(false)
                .build();
        User daLuu = khoNguoiDung.save(nguoiDungMoi);
        log.info("Đăng ký tài khoản thành công cho: {} (ID: {})", daLuu.getEmail(), daLuu.getId());
        return taoPhanHoi(daLuu);
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
