package com.cinema.booking.service;

import com.cinema.booking.document.User;
import com.cinema.booking.document.UserRole;
import com.cinema.booking.dto.*;
import com.cinema.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.stream.Stream;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserRepository khoNguoiDung;
    private final PasswordEncoder boMaHoaMatKhau;

    @Override
    public Page<UserResponseDto> layDanhSach(String tuKhoa, String vaiTro, String trangThai, Pageable phanTrang) {
        Stream<User> luong = khoNguoiDung.findAll().stream();
        if (tuKhoa != null && !tuKhoa.isBlank()) {
            String khoa = tuKhoa.trim().toLowerCase(Locale.ROOT);
            luong = luong.filter(nguoiDung -> khopTuKhoa(nguoiDung, khoa));
        }
        if (vaiTro != null && !vaiTro.isBlank()) {
            UserRole vaiTroLoc = UserRole.valueOf(vaiTro.trim().toUpperCase(Locale.ROOT));
            luong = luong.filter(nguoiDung -> nguoiDung.getVaiTro() == vaiTroLoc);
        }
        if (trangThai != null && !trangThai.isBlank()) {
            if ("LOCKED".equalsIgnoreCase(trangThai)) {
                luong = luong.filter(UserServiceImpl::daBiKhoa);
            } else if ("ACTIVE".equalsIgnoreCase(trangThai)) {
                luong = luong.filter(nguoiDung -> !daBiKhoa(nguoiDung));
            }
        }
        List<UserResponseDto> danhSach = luong
                .sorted((a, b) -> String.valueOf(a.getHoTen()).compareToIgnoreCase(String.valueOf(b.getHoTen())))
                .map(this::chuyenDoi)
                .toList();
        int batDau = (int) phanTrang.getOffset();
        int ketThuc = Math.min(batDau + phanTrang.getPageSize(), danhSach.size());
        List<UserResponseDto> trang = batDau >= danhSach.size() ? List.of() : danhSach.subList(batDau, ketThuc);
        return new PageImpl<>(trang, phanTrang, danhSach.size());
    }

    @Override
    public UserResponseDto layChiTiet(String id) {
        return chuyenDoi(timNguoiDung(id));
    }

    @Override
    public UserResponseDto taoNguoiDung(TaoNguoiDungRequest yeuCau) {
        if (yeuCau == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu tạo người dùng không hợp lệ");
        }
        String email = yeuCau.getEmail() != null ? yeuCau.getEmail().trim().toLowerCase(Locale.ROOT) : "";
        if (email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email không được để trống");
        }
        if (khoNguoiDung.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email này đã được sử dụng");
        }

        String phone = yeuCau.getSoDienThoai() != null ? yeuCau.getSoDienThoai().trim() : null;
        if (phone != null && !phone.isBlank()) {
            if (khoNguoiDung.findBySoDienThoai(phone).isPresent()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại này đã được sử dụng");
            }
        }

        String matKhau = yeuCau.getMatKhau();
        if (matKhau == null || matKhau.length() < 6) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu phải có ít nhất 6 ký tự");
        }

        String hoTen = yeuCau.getHoTen() != null && !yeuCau.getHoTen().isBlank()
                ? yeuCau.getHoTen().trim()
                : "Người dùng mới";

        User nguoiDungMoi = User.builder()
                .email(email)
                .hoTen(hoTen)
                .soDienThoai(phone)
                .matKhau(boMaHoaMatKhau.encode(matKhau))
                .vaiTro(yeuCau.getVaiTro() != null ? yeuCau.getVaiTro() : UserRole.CUSTOMER)
                .biKhoa(false)
                .build();

        User daLuu = khoNguoiDung.save(nguoiDungMoi);
        log.info("Admin đã tạo người dùng mới thành công: {} (ID: {})", daLuu.getEmail(), daLuu.getId());
        return chuyenDoi(daLuu);
    }

    @Override
    public UserResponseDto capNhatNguoiDung(String id, CapNhatNguoiDungRequest yeuCau) {
        if (yeuCau == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Dữ liệu cập nhật không hợp lệ");
        }
        User nguoiDung = timNguoiDung(id);

        if (yeuCau.getHoTen() != null && !yeuCau.getHoTen().isBlank()) {
            nguoiDung.setHoTen(yeuCau.getHoTen().trim());
        }

        if (yeuCau.getSoDienThoai() != null) {
            String phone = yeuCau.getSoDienThoai().trim();
            if (!phone.isBlank() && !phone.equals(nguoiDung.getSoDienThoai())) {
                if (khoNguoiDung.findBySoDienThoai(phone).isPresent()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại này đã được sử dụng");
                }
            }
            nguoiDung.setSoDienThoai(phone.isBlank() ? null : phone);
        }

        if (yeuCau.getVaiTro() != null) {
            nguoiDung.setVaiTro(yeuCau.getVaiTro());
        }

        if (yeuCau.getMatKhau() != null && !yeuCau.getMatKhau().isBlank()) {
            if (yeuCau.getMatKhau().length() < 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải có ít nhất 6 ký tự");
            }
            nguoiDung.setMatKhau(boMaHoaMatKhau.encode(yeuCau.getMatKhau()));
        }

        User daLuu = khoNguoiDung.save(nguoiDung);
        log.info("Admin đã cập nhật thông tin người dùng: {} (ID: {})", daLuu.getEmail(), daLuu.getId());
        return chuyenDoi(daLuu);
    }

    @Override
    public void xoaNguoiDung(String id) {
        User nguoiDung = timNguoiDung(id);
        khoNguoiDung.delete(nguoiDung);
        log.info("Admin đã xóa người dùng: {} (ID: {})", nguoiDung.getEmail(), nguoiDung.getId());
    }

    @Override
    public UserResponseDto capNhatVaiTro(String id, CapNhatVaiTroNguoiDungRequest yeuCau) {
        if (yeuCau == null || yeuCau.getVaiTro() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vai trò không hợp lệ");
        User nguoiDung = timNguoiDung(id);
        nguoiDung.setVaiTro(yeuCau.getVaiTro());
        return chuyenDoi(khoNguoiDung.save(nguoiDung));
    }

    @Override
    public UserResponseDto capNhatTrangThai(String id, CapNhatTrangThaiNguoiDungRequest yeuCau) {
        if (yeuCau == null || yeuCau.getBiKhoa() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trạng thái không hợp lệ");
        User nguoiDung = timNguoiDung(id);
        nguoiDung.setBiKhoa(yeuCau.getBiKhoa());
        return chuyenDoi(khoNguoiDung.save(nguoiDung));
    }

    private User timNguoiDung(String id) {
        return khoNguoiDung.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"));
    }

    private boolean khopTuKhoa(User nguoiDung, String khoa) {
        return chua(nguoiDung.getHoTen(), khoa)
                || chua(nguoiDung.getEmail(), khoa)
                || chua(nguoiDung.getSoDienThoai(), khoa);
    }

    private boolean chua(String giaTri, String khoa) {
        return giaTri != null && giaTri.toLowerCase(Locale.ROOT).contains(khoa);
    }

    private static boolean daBiKhoa(User nguoiDung) {
        return Boolean.TRUE.equals(nguoiDung.getBiKhoa());
    }

    private UserResponseDto chuyenDoi(User nguoiDung) {
        return UserResponseDto.builder()
                .id(nguoiDung.getId())
                .email(nguoiDung.getEmail())
                .hoTen(nguoiDung.getHoTen())
                .soDienThoai(nguoiDung.getSoDienThoai())
                .vaiTro(nguoiDung.getVaiTro())
                .biKhoa(daBiKhoa(nguoiDung))
                .build();
    }
}

