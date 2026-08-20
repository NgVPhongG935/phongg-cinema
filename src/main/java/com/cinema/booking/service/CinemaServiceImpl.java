package com.cinema.booking.service;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Region;
import com.cinema.booking.document.Cinema.Room;
import com.cinema.booking.document.Cinema.Seat;
import com.cinema.booking.document.Showtime;
import com.cinema.booking.dto.CinemaDto;
import com.cinema.booking.dto.RoomDto;
import com.cinema.booking.dto.RoomSeatLayoutDto;
import com.cinema.booking.repository.CinemaRepository;
import com.cinema.booking.repository.RegionRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.util.CinemaSeatTemplates;
import com.cinema.booking.util.ShowtimeSeatMapper;
import com.cinema.booking.util.TinhGiaVeUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CinemaServiceImpl implements CinemaService {
    static final String KHU_VUC_CHUA_PHAN = "Chưa phân khu vực";
    public static final int SO_PHONG_MAC_DINH = 10;
    private final CinemaRepository khoRap;
    private final RegionRepository khoKhuVuc;
    private final ShowtimeRepository khoSuatChieu;
    private final TicketRepository khoVe;

    public List<String> layDanhSachKhuVuc() {
        Stream<String> tuDatabase = khoKhuVuc.findAllByOrderByThuTuAscTenKhuVucAsc().stream().map(Region::getTenKhuVuc);
        boolean coRapChuaPhan = khoRap.findAll().stream().anyMatch(rap -> rap.getKhuVuc() == null || rap.getKhuVuc().isBlank());
        Stream<String> ketQua = coRapChuaPhan ? Stream.concat(tuDatabase, Stream.of(KHU_VUC_CHUA_PHAN)) : tuDatabase;
        return ketQua.distinct().sorted(Comparator.naturalOrder()).toList();
    }

    public List<Cinema> layDanhSachRap(String khuVuc) {
        if (khuVuc == null || khuVuc.isBlank()) return khoRap.findAll();
        if (KHU_VUC_CHUA_PHAN.equals(khuVuc)) {
            return khoRap.findAll().stream()
                    .filter(rap -> rap.getKhuVuc() == null || rap.getKhuVuc().isBlank())
                    .toList();
        }
        return khoRap.findByKhuVuc(khuVuc);
    }

    public Cinema layChiTietRap(String id) {
        return khoRap.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay rap"));
    }

    public Cinema themRapMoi(CinemaDto dto) {
        return khoRap.save(Cinema.builder()
                .khuVuc(chuanHoaKhuVuc(dto.getKhuVuc()))
                .tenRap(dto.getTenRap())
                .diaChi(dto.getDiaChi())
                .viDo(dto.getViDo())
                .kinhDo(dto.getKinhDo())
                .phanTramGheVip(dto.getPhanTramGheVip() != null ? dto.getPhanTramGheVip() : TinhGiaVeUtil.MAC_DINH_PHAN_TRAM_VIP)
                .phanTramGheCouple(dto.getPhanTramGheCouple() != null ? dto.getPhanTramGheCouple() : TinhGiaVeUtil.MAC_DINH_PHAN_TRAM_COUPLE)
                .danhSachPhong(damBaoPhongCoGhe(dto.getDanhSachPhong()))
                .build());
    }

    public Cinema capNhatRap(String id, CinemaDto dto) {
        Cinema rap = layChiTietRap(id);
        if (dto.getKhuVuc() != null) rap.setKhuVuc(chuanHoaKhuVuc(dto.getKhuVuc()));
        if (dto.getTenRap() != null && !dto.getTenRap().isBlank()) rap.setTenRap(dto.getTenRap().trim());
        if (dto.getDiaChi() != null && !dto.getDiaChi().isBlank()) rap.setDiaChi(dto.getDiaChi().trim());
        if (dto.getViDo() != null) rap.setViDo(dto.getViDo());
        if (dto.getKinhDo() != null) rap.setKinhDo(dto.getKinhDo());
        if (dto.getPhanTramGheVip() != null) rap.setPhanTramGheVip(dto.getPhanTramGheVip());
        if (dto.getPhanTramGheCouple() != null) rap.setPhanTramGheCouple(dto.getPhanTramGheCouple());
        Cinema rapLuu = khoRap.save(rap);
        dongBoPhuThuSuatChieuTheoRap(rapLuu);
        return rapLuu;
    }

    public List<Room> layDanhSachPhong(String maRap) {
        Cinema rap = layChiTietRap(maRap);
        if (rap.getDanhSachPhong() == null) return List.of();
        return rap.getDanhSachPhong().stream()
                .sorted(Comparator.comparing(Room::getMaPhong))
                .toList();
    }

    public Room themPhong(String maRap, RoomDto dto) {
        if (dto.getMaPhong() == null || dto.getMaPhong().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma phong khong hop le");
        }
        if (dto.getTenPhong() == null || dto.getTenPhong().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ten phong khong hop le");
        }
        Cinema rap = layChiTietRap(maRap);
        List<Room> danhSachPhong = rap.getDanhSachPhong() != null ? new ArrayList<>(rap.getDanhSachPhong()) : new ArrayList<>();
        String maPhong = dto.getMaPhong().trim().toUpperCase();
        if (danhSachPhong.stream().anyMatch(phong -> phong.getMaPhong().equalsIgnoreCase(maPhong))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ma phong da ton tai trong rap nay");
        }
        Room phongMoi = Room.builder()
                .maPhong(maPhong)
                .tenPhong(dto.getTenPhong().trim())
                .loaiPhong(dto.getLoaiPhong() != null ? dto.getLoaiPhong().trim().toUpperCase() : "2D")
                .danhSachGhe(layDanhSachGheKhiThemPhong(dto))
                .build();
        danhSachPhong.add(phongMoi);
        rap.setDanhSachPhong(danhSachPhong);
        khoRap.save(rap);
        return phongMoi;
    }

    public Room capNhatPhong(String maRap, String maPhong, RoomDto dto) {
        Cinema rap = layChiTietRap(maRap);
        Room phong = timPhongTrongRap(rap, maPhong);
        if (dto.getTenPhong() != null && !dto.getTenPhong().isBlank()) {
            phong.setTenPhong(dto.getTenPhong().trim());
        }
        if (dto.getLoaiPhong() != null && !dto.getLoaiPhong().isBlank()) {
            phong.setLoaiPhong(dto.getLoaiPhong().trim().toUpperCase());
        }
        khoRap.save(rap);
        return phong;
    }

    private List<Seat> layDanhSachGheKhiThemPhong(RoomDto dto) {
        if (dto.getDanhSachGhe() != null && !dto.getDanhSachGhe().isEmpty()) {
            return chuanHoaDanhSachGhe(dto.getDanhSachGhe().stream()
                    .map(muc -> new Seat(muc.getSoGhe(), muc.getLoaiGhe(), muc.getGiaVe()))
                    .toList());
        }
        return chuanHoaDanhSachGhe(CinemaSeatTemplates.layMauTheoMa(dto.getMauSoDoGhe()));
    }

    public void xoaPhong(String maRap, String maPhong) {
        Cinema rap = layChiTietRap(maRap);
        List<Room> danhSachPhong = rap.getDanhSachPhong();
        if (danhSachPhong == null || danhSachPhong.size() <= 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rap phai co it nhat mot phong");
        }
        if (khoSuatChieu.existsByMaRapAndMaPhong(maRap, maPhong)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Khong the xoa phong da co suat chieu");
        }
        boolean daXoa = danhSachPhong.removeIf(phong -> phong.getMaPhong().equals(maPhong));
        if (!daXoa) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong");
        }
        khoRap.save(rap);
    }

    public RoomSeatLayoutDto laySoDoGhePhong(String maRap, String maPhong) {
        Cinema rap = layChiTietRap(maRap);
        Room phong = timPhongTrongRap(rap, maPhong);
        List<Seat> danhSachGhe = phong.getDanhSachGhe() != null ? phong.getDanhSachGhe() : List.of();
        return RoomSeatLayoutDto.builder()
                .tenRap(rap.getTenRap())
                .tenPhong(phong.getTenPhong())
                .maPhong(phong.getMaPhong())
                .danhSachGhe(danhSachGhe)
                .coTheSua(!phongCoVeDaDat(maRap, maPhong))
                .soSuatChieuTuongLai(demSuatChieuTuongLai(maRap, maPhong))
                .build();
    }

    public RoomSeatLayoutDto capNhatSoDoGhePhong(String maRap, String maPhong, List<Seat> danhSachGhe) {
        if (phongCoVeDaDat(maRap, maPhong)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phong da co ve dat, khong the sua so do ghe");
        }
        if (danhSachGhe == null || danhSachGhe.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "So do ghe khong duoc de trong");
        }
        Cinema rap = layChiTietRap(maRap);
        Room phong = timPhongTrongRap(rap, maPhong);
        phong.setDanhSachGhe(chuanHoaDanhSachGhe(danhSachGhe));
        khoRap.save(rap);
        int soSuatDaDongBo = dongBoTrangThaiGheSuatChieuTuongLai(maRap, maPhong, phong.getDanhSachGhe());
        RoomSeatLayoutDto ketQua = laySoDoGhePhong(maRap, maPhong);
        ketQua.setSoSuatDaDongBo(soSuatDaDongBo);
        return ketQua;
    }

    private int demSuatChieuTuongLai(String maRap, String maPhong) {
        LocalDateTime bayGio = LocalDateTime.now();
        return (int) khoSuatChieu.findByMaRapAndMaPhong(maRap, maPhong).stream()
                .filter(suat -> suat.getThoiGianBatDau() != null && !suat.getThoiGianBatDau().isBefore(bayGio))
                .count();
    }

    private int dongBoTrangThaiGheSuatChieuTuongLai(String maRap, String maPhong, List<Seat> danhSachGheMoi) {
        Cinema rap = layChiTietRap(maRap);
        LocalDateTime bayGio = LocalDateTime.now();
        int soCapNhat = 0;
        for (Showtime suat : khoSuatChieu.findByMaRapAndMaPhong(maRap, maPhong)) {
            if (suat.getThoiGianBatDau() == null || suat.getThoiGianBatDau().isBefore(bayGio)) continue;
            List<Showtime.SeatStatus> mauMoi = ShowtimeSeatMapper.taoTrangThaiGheTuPhong(danhSachGheMoi, suat.getGiaVeTu(), rap);
            suat.setTrangThaiGhe(ShowtimeSeatMapper.gopTrangThaiGhe(suat.getTrangThaiGhe(), mauMoi));
            khoSuatChieu.save(suat);
            soCapNhat++;
        }
        return soCapNhat;
    }

    private void dongBoPhuThuSuatChieuTheoRap(Cinema rap) {
        for (Showtime suat : khoSuatChieu.findByMaRap(rap.getId())) {
            if (suat.getGiaVeTu() == null || suat.getTrangThaiGhe() == null) continue;
            TinhGiaVeUtil.capNhatPhuThuGhe(suat, rap);
            khoSuatChieu.save(suat);
        }
    }

    private boolean phongCoVeDaDat(String maRap, String maPhong) {
        List<String> maSuat = khoSuatChieu.findByMaRapAndMaPhong(maRap, maPhong).stream().map(Showtime::getId).toList();
        if (maSuat.isEmpty()) return false;
        return khoVe.existsByMaSuatChieuIn(maSuat);
    }

    private List<Seat> chuanHoaDanhSachGhe(List<Seat> danhSachGhe) {
        return danhSachGhe.stream()
                .filter(ghe -> ghe.getSoGhe() != null && !ghe.getSoGhe().isBlank())
                .filter(ghe -> ghe.getLoaiGhe() != null && !ghe.getLoaiGhe().isBlank())
                .map(ghe -> new Seat(ghe.getSoGhe().trim().toUpperCase(), ghe.getLoaiGhe().trim().toUpperCase(),
                        ghe.getGiaVe() != null ? ghe.getGiaVe() : tinhGiaGhe(ghe.getLoaiGhe())))
                .toList();
    }

    private java.math.BigDecimal tinhGiaGhe(String loaiGhe) {
        java.math.BigDecimal giaCoBan = java.math.BigDecimal.valueOf(90000);
        return switch (loaiGhe.toUpperCase()) {
            case "VIP" -> giaCoBan.add(java.math.BigDecimal.valueOf(20000));
            case "COUPLE" -> giaCoBan.add(java.math.BigDecimal.valueOf(80000));
            default -> giaCoBan;
        };
    }

    private Room timPhongTrongRap(Cinema rap, String maPhong) {
        if (rap.getDanhSachPhong() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong");
        }
        return rap.getDanhSachPhong().stream()
                .filter(phong -> phong.getMaPhong().equals(maPhong))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay phong"));
    }

    private String chuanHoaKhuVuc(String khuVuc) {
        if (khuVuc == null || khuVuc.isBlank()) return KHU_VUC_CHUA_PHAN;
        return khuVuc.trim();
    }

    private List<Room> damBaoPhongCoGhe(List<Room> danhSachPhong) {
        if (danhSachPhong == null || danhSachPhong.isEmpty()) {
            return taoMuoiPhongMacDinh();
        }
        danhSachPhong.forEach(phong -> {
            if (phong.getDanhSachGhe() == null || phong.getDanhSachGhe().isEmpty()) {
                phong.setDanhSachGhe(CinemaSeatTemplates.taoMauTieuChuan());
            }
        });
        return danhSachPhong;
    }

    public static List<Room> taoMuoiPhongMacDinh() {
        List<Room> ketQua = new ArrayList<>();
        for (int i = 1; i <= SO_PHONG_MAC_DINH; i++) {
            ketQua.add(taoPhongDayDu(String.format("P%02d", i), String.format("Phòng %02d", i)));
        }
        return ketQua;
    }

    public static Room taoPhongDayDu(String maPhong, String tenPhong) {
        return Room.builder().maPhong(maPhong).tenPhong(tenPhong).danhSachGhe(CinemaSeatTemplates.taoMauTieuChuan()).build();
    }

    public static List<Cinema.Seat> taoGheMacDinh() {
        return CinemaSeatTemplates.taoMauCoBan();
    }
}
