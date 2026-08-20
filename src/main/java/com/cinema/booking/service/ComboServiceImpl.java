package com.cinema.booking.service;

import com.cinema.booking.document.Combo;
import com.cinema.booking.document.LoaiCombo;
import com.cinema.booking.document.TrangThaiCombo;
import com.cinema.booking.dto.ComboDto;
import com.cinema.booking.dto.ComboResponseDto;
import com.cinema.booking.repository.ComboRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ComboServiceImpl implements ComboService {
    private final ComboRepository khoCombo;

    @Override
    public List<ComboResponseDto> layDanhSach(boolean layTatCa) {
        List<Combo> danhSach = layTatCa ? khoCombo.findAll() : khoCombo.findByTrangThai(TrangThaiCombo.HOAT_DONG);
        return danhSach.stream()
                .sorted(Comparator.comparing(Combo::getTenCombo, String.CASE_INSENSITIVE_ORDER))
                .map(this::chuyenDoi)
                .toList();
    }

    @Override
    public ComboResponseDto them(ComboDto dto) {
        kiemTraDto(dto);
        String maCombo = chuanHoaMaCombo(dto.getMaCombo(), dto.getTenCombo());
        if (khoCombo.existsByMaComboIgnoreCase(maCombo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma combo da ton tai");
        }
        Combo combo = Combo.builder()
                .maCombo(maCombo)
                .tenCombo(dto.getTenCombo().trim())
                .loai(dto.getLoai())
                .moTa(dto.getMoTa() != null ? dto.getMoTa().trim() : null)
                .giaTien(dto.getGiaTien())
                .hinhAnh(dto.getHinhAnh() != null ? dto.getHinhAnh().trim() : null)
                .trangThai(dto.getTrangThai() != null ? dto.getTrangThai() : TrangThaiCombo.HOAT_DONG)
                .build();
        return chuyenDoi(khoCombo.save(combo));
    }

    @Override
    public ComboResponseDto capNhat(String id, ComboDto dto) {
        Combo combo = timCombo(id);
        kiemTraDto(dto);
        String maCombo = chuanHoaMaCombo(dto.getMaCombo(), dto.getTenCombo());
        if (!maCombo.equalsIgnoreCase(combo.getMaCombo()) && khoCombo.existsByMaComboIgnoreCase(maCombo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma combo da ton tai");
        }
        combo.setMaCombo(maCombo);
        combo.setTenCombo(dto.getTenCombo().trim());
        combo.setLoai(dto.getLoai());
        combo.setMoTa(dto.getMoTa() != null ? dto.getMoTa().trim() : null);
        combo.setGiaTien(dto.getGiaTien());
        combo.setHinhAnh(dto.getHinhAnh() != null ? dto.getHinhAnh().trim() : null);
        combo.setTrangThai(dto.getTrangThai() != null ? dto.getTrangThai() : TrangThaiCombo.HOAT_DONG);
        return chuyenDoi(khoCombo.save(combo));
    }

    @Override
    public void xoa(String id) {
        if (!khoCombo.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay combo");
        }
        khoCombo.deleteById(id);
    }

    private Combo timCombo(String id) {
        return khoCombo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay combo"));
    }

    private void kiemTraDto(ComboDto dto) {
        if (dto.getTenCombo() == null || dto.getTenCombo().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten combo khong hop le");
        }
        if (dto.getLoai() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loai combo khong hop le");
        }
        if (dto.getGiaTien() == null || dto.getGiaTien().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gia tien khong hop le");
        }
    }

    private String chuanHoaMaCombo(String maCombo, String tenCombo) {
        if (maCombo != null && !maCombo.isBlank()) {
            return maCombo.trim().toUpperCase(Locale.ROOT).replaceAll("\\s+", "_");
        }
        String tuTen = tenCombo.trim().toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9\\s]", "")
                .replaceAll("\\s+", "_");
        return tuTen.isBlank() ? "COMBO" : tuTen;
    }

    private ComboResponseDto chuyenDoi(Combo combo) {
        return ComboResponseDto.builder()
                .id(combo.getId())
                .maCombo(combo.getMaCombo())
                .tenCombo(combo.getTenCombo())
                .loai(combo.getLoai())
                .moTa(combo.getMoTa())
                .giaTien(combo.getGiaTien())
                .hinhAnh(combo.getHinhAnh())
                .trangThai(combo.getTrangThai())
                .build();
    }
}
