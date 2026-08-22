package com.cinema.booking.service;

import com.cinema.booking.config.CacheConfig;
import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Region;
import com.cinema.booking.dto.RegionDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RegionServiceImpl implements RegionService {
    private final RegionRepository khoKhuVuc;
    private final CinemaRepository khoRap;

    @Cacheable(cacheNames = CacheConfig.CACHE_REGIONS, key = "'all'")
    public List<Region> layDanhSachKhuVuc() {
        return khoKhuVuc.findAllByOrderByThuTuAscTenKhuVucAsc();
    }

    @CacheEvict(cacheNames = {CacheConfig.CACHE_REGIONS, CacheConfig.CACHE_CINEMAS}, allEntries = true)
    public Region themKhuVuc(RegionDto dto) {
        String ten = chuanHoaTen(dto.getTenKhuVuc());
        if (khoKhuVuc.existsByTenKhuVuc(ten)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khu vuc da ton tai");
        }
        return khoKhuVuc.save(Region.builder().tenKhuVuc(ten).thuTu(dto.getThuTu()).build());
    }

    @CacheEvict(cacheNames = {CacheConfig.CACHE_REGIONS, CacheConfig.CACHE_CINEMAS}, allEntries = true)
    public Region capNhatKhuVuc(String id, RegionDto dto) {
        Region khuVuc = timKhuVuc(id);
        String tenMoi = chuanHoaTen(dto.getTenKhuVuc());
        khoKhuVuc.findByTenKhuVuc(tenMoi).ifPresent(trung -> {
            if (!trung.getId().equals(id)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khu vuc da ton tai");
        });
        String tenCu = khuVuc.getTenKhuVuc();
        khuVuc.setTenKhuVuc(tenMoi);
        khuVuc.setThuTu(dto.getThuTu());
        khoRap.findAllProjected().stream().filter(rap -> tenCu.equals(rap.getKhuVuc())).forEach(rap -> {
            Cinema dayDu = khoRap.findById(rap.getId()).orElse(rap);
            dayDu.setKhuVuc(tenMoi);
            khoRap.save(dayDu);
        });
        return khoKhuVuc.save(khuVuc);
    }

    @CacheEvict(cacheNames = {CacheConfig.CACHE_REGIONS, CacheConfig.CACHE_CINEMAS}, allEntries = true)
    public void xoaKhuVuc(String id) {
        Region khuVuc = timKhuVuc(id);
        boolean coRap = khoRap.findAllProjected().stream().anyMatch(rap -> khuVuc.getTenKhuVuc().equals(rap.getKhuVuc()));
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
