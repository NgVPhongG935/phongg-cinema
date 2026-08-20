package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.User;
import com.cinema.booking.document.UserRole;
import com.cinema.booking.dto.CapNhatRapNhanVienRequest;
import com.cinema.booking.dto.CapNhatTrangThaiNguoiDungRequest;
import com.cinema.booking.dto.DatLaiMatKhauNhanVienRequest;
import com.cinema.booking.dto.StaffResponseDto;
import com.cinema.booking.dto.TaoNhanVienRequest;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {
    private final UserRepository khoNguoiDung;
    private final CinemaRepository khoRap;
    private final PasswordEncoder boMaHoaMatKhau;

    @Override
    public List<StaffResponseDto> layDanhSach() {
        List<User> danhSach = khoNguoiDung.findAll().stream()
                .filter(nguoi -> nguoi.getVaiTro() == UserRole.STAFF)
                .sorted(Comparator.comparing(User::getHoTen, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
        Map<String, String> tenRapTheoMa = layTenRapTheoMa(danhSach);
        return danhSach.stream().map(nguoi -> chuyenDoi(nguoi, tenRapTheoMa)).toList();
    }

    @Override
    public StaffResponseDto them(TaoNhanVienRequest yeuCau) {
        if (yeuCau == null || yeuCau.getEmail() == null || yeuCau.getEmail().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email khong hop le");
        if (yeuCau.getMatKhau() == null || yeuCau.getMatKhau().length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mat khau phai co it nhat 6 ky tu");
        if (khoNguoiDung.findByEmail(yeuCau.getEmail().trim()).isPresent())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email da duoc su dung");
        if (yeuCau.getMaRapPhuTrach() != null && !yeuCau.getMaRapPhuTrach().isBlank())
            kiemTraRap(yeuCau.getMaRapPhuTrach());
        User nhanVien = User.builder()
                .email(yeuCau.getEmail().trim())
                .matKhau(boMaHoaMatKhau.encode(yeuCau.getMatKhau()))
                .hoTen(yeuCau.getHoTen() != null ? yeuCau.getHoTen().trim() : "")
                .soDienThoai(yeuCau.getSoDienThoai() != null ? yeuCau.getSoDienThoai().trim() : null)
                .vaiTro(UserRole.STAFF)
                .biKhoa(false)
                .maRapPhuTrach(chuanHoaMaRap(yeuCau.getMaRapPhuTrach()))
                .build();
        return chuyenDoi(khoNguoiDung.save(nhanVien), layTenRapTheoMa(List.of(nhanVien)));
    }

    @Override
    public StaffResponseDto capNhatRap(String id, CapNhatRapNhanVienRequest yeuCau) {
        User nhanVien = timNhanVien(id);
        if (yeuCau == null || yeuCau.getMaRapPhuTrach() == null || yeuCau.getMaRapPhuTrach().isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma rap khong hop le");
        kiemTraRap(yeuCau.getMaRapPhuTrach());
        nhanVien.setMaRapPhuTrach(yeuCau.getMaRapPhuTrach().trim());
        return chuyenDoi(khoNguoiDung.save(nhanVien), layTenRapTheoMa(List.of(nhanVien)));
    }

    @Override
    public void datLaiMatKhau(String id, DatLaiMatKhauNhanVienRequest yeuCau) {
        if (yeuCau == null || yeuCau.getMatKhauMoi() == null || yeuCau.getMatKhauMoi().length() < 6)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mat khau moi phai co it nhat 6 ky tu");
        User nhanVien = timNhanVien(id);
        nhanVien.setMatKhau(boMaHoaMatKhau.encode(yeuCau.getMatKhauMoi()));
        khoNguoiDung.save(nhanVien);
    }

    @Override
    public StaffResponseDto capNhatTrangThai(String id, CapNhatTrangThaiNguoiDungRequest yeuCau) {
        if (yeuCau == null || yeuCau.getBiKhoa() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Trang thai khong hop le");
        User nhanVien = timNhanVien(id);
        nhanVien.setBiKhoa(yeuCau.getBiKhoa());
        return chuyenDoi(khoNguoiDung.save(nhanVien), layTenRapTheoMa(List.of(nhanVien)));
    }

    private User timNhanVien(String id) {
        User nguoi = khoNguoiDung.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay nhan vien"));
        if (nguoi.getVaiTro() != UserRole.STAFF)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong phai tai khoan nhan vien");
        return nguoi;
    }

    private void kiemTraRap(String maRap) {
        if (!khoRap.existsById(maRap.trim()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong tim thay rap");
    }

    private String chuanHoaMaRap(String maRap) {
        if (maRap == null || maRap.isBlank()) return null;
        return maRap.trim();
    }

    private Map<String, String> layTenRapTheoMa(List<User> danhSach) {
        Set<String> maRap = danhSach.stream()
                .map(User::getMaRapPhuTrach)
                .filter(Objects::nonNull)
                .filter(ma -> !ma.isBlank())
                .collect(Collectors.toSet());
        if (maRap.isEmpty()) return Map.of();
        return khoRap.findAllById(maRap).stream()
                .collect(Collectors.toMap(Cinema::getId, Cinema::getTenRap, (a, b) -> a));
    }

    private StaffResponseDto chuyenDoi(User nhanVien, Map<String, String> tenRapTheoMa) {
        String maRap = nhanVien.getMaRapPhuTrach();
        return StaffResponseDto.builder()
                .id(nhanVien.getId())
                .email(nhanVien.getEmail())
                .hoTen(nhanVien.getHoTen())
                .soDienThoai(nhanVien.getSoDienThoai())
                .biKhoa(Boolean.TRUE.equals(nhanVien.getBiKhoa()))
                .maRapPhuTrach(maRap)
                .tenRapPhuTrach(maRap != null ? tenRapTheoMa.getOrDefault(maRap, "—") : null)
                .build();
    }
}
