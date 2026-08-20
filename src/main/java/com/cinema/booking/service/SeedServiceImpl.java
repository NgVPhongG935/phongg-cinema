package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Cinema.Room;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.dto.SeedResultDto;
import com.cinema.booking.dto.ShowtimeAutoSeedRequestDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SeedServiceImpl implements SeedService {
    private final CinemaRepository khoRap;
    private final ShowtimeRepository khoSuatChieu;
    private final ShowtimeService dichVuSuatChieu;
    private final MongoTemplate mongoTemplate;

    public SeedResultDto napPhongVaSuatChieu() {
        int soRapCapNhat = 0;
        int soPhongThem = 0;

        for (Cinema rap : khoRap.findAll()) {
            int phongTruoc = rap.getDanhSachPhong() != null ? rap.getDanhSachPhong().size() : 0;
            List<Room> phongHienTai = rap.getDanhSachPhong() != null ? new ArrayList<>(rap.getDanhSachPhong()) : new ArrayList<>();

            if (phongHienTai.isEmpty()) {
                rap.setDanhSachPhong(CinemaServiceImpl.taoMuoiPhongMacDinh());
                khoRap.save(rap);
                soRapCapNhat++;
                soPhongThem += CinemaServiceImpl.SO_PHONG_MAC_DINH;
                continue;
            }

            Set<String> maDaCo = new HashSet<>();
            phongHienTai.forEach(phong -> {
                if (phong.getMaPhong() != null) maDaCo.add(phong.getMaPhong());
            });

            for (int i = 1; i <= CinemaServiceImpl.SO_PHONG_MAC_DINH; i++) {
                String maPhong = String.format("P%02d", i);
                if (!maDaCo.contains(maPhong)) {
                    phongHienTai.add(CinemaServiceImpl.taoPhongDayDu(maPhong, String.format("Phòng %02d", i)));
                    maDaCo.add(maPhong);
                }
            }

            phongHienTai.forEach(phong -> {
                if (phong.getDanhSachGhe() == null || phong.getDanhSachGhe().isEmpty()) {
                    phong.setDanhSachGhe(CinemaServiceImpl.taoGheMacDinh());
                }
            });

            rap.setDanhSachPhong(phongHienTai);
            khoRap.save(rap);
            if (phongHienTai.size() > phongTruoc) {
                soRapCapNhat++;
                soPhongThem += phongHienTai.size() - phongTruoc;
            }
        }

        long soSuatCu = khoSuatChieu.count();
        if (soSuatCu > 0) mongoTemplate.remove(new Query(), Showtime.class);

        ShowtimeAutoSeedRequestDto yeuCau = new ShowtimeAutoSeedRequestDto();
        yeuCau.setChiPhimChuaCoSuat(false);
        var ketQua = dichVuSuatChieu.taoSuatChieuTuDong(yeuCau);

        return SeedResultDto.builder()
                .soRapCapNhat(soRapCapNhat)
                .soPhongThem(soPhongThem)
                .soSuatDaXoa(soSuatCu)
                .soSuatThem(ketQua.getSoSuat())
                .soPhim(ketQua.getSoPhim())
                .build();
    }
}
