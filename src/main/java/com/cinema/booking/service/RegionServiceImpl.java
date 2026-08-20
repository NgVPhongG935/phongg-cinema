package com.cinema.booking.service;

import com.cinema.booking.document.Region;
import com.cinema.booking.dto.RegionDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RegionServiceImpl implements RegionService {
    private final RegionRepository khoKhuVuc;
    private final CinemaRepository khoRap;

    public List<Region> layDanhSachKhuVuc() {
        return khoKhuVuc.findAllByOrderByThuTuAscTenKhuVucAsc();
    }

    public Region themKhuVuc(RegionDto dto) {
        String ten = chuanHoaTen(dto.getTenKhuVuc());
        if (khoKhuVuc.existsByTenKhuVuc(ten)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khu vuc da ton tai");
        }
        return khoKhuVuc.save(Region.builder().tenKhuVuc(ten).thuTu(dto.getThuTu()).build());
    }

    public Region capNhatKhuVuc(String id, RegionDto dto) {
        Region khuVuc = timKhuVuc(id);
        String tenMoi = chuanHoaTen(dto.getTenKhuVuc());
        khoKhuVuc.findByTenKhuVuc(tenMoi).ifPresent(trung -> {
            if (!trung.getId().equals(id)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khu vuc da ton tai");
        });
        String tenCu = khuVuc.getTenKhuVuc();
        khuVuc.setTenKhuVuc(tenMoi);
        khuVuc.setThuTu(dto.getThuTu());
        khoRap.findAll().stream().filter(rap -> tenCu.equals(rap.getKhuVuc())).forEach(rap -> {
            rap.setKhuVuc(tenMoi);
            khoRap.save(rap);
        });
        return khoKhuVuc.save(khuVuc);
    }

    public void xoaKhuVuc(String id) {
        Region khuVuc = timKhuVuc(id);
        boolean coRap = khoRap.findAll().stream().anyMatch(rap -> khuVuc.getTenKhuVuc().equals(rap.getKhuVuc()));
        if (coRap) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong the xoa khu vuc dang co rap");
        khoKhuVuc.delete(khuVuc);
    }

    private Region timKhuVuc(String id) {
        return khoKhuVuc.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay khu vuc"));
    }

    private String chuanHoaTen(String ten) {
        if (ten == null || ten.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten khu vuc khong hop le");
        return ten.trim();
    }
}
