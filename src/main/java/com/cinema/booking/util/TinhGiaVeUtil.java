package com.cinema.booking.util;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.Showtime;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

public final class TinhGiaVeUtil {
    public static final int MAC_DINH_PHAN_TRAM_VIP = 25;
    public static final int MAC_DINH_PHAN_TRAM_COUPLE = 80;

    private TinhGiaVeUtil() {}

    public static int layPhanTramVip(Cinema rap) {
        return rap != null && rap.getPhanTramGheVip() != null ? rap.getPhanTramGheVip() : MAC_DINH_PHAN_TRAM_VIP;
    }

    public static int layPhanTramCouple(Cinema rap) {
        return rap != null && rap.getPhanTramGheCouple() != null ? rap.getPhanTramGheCouple() : MAC_DINH_PHAN_TRAM_COUPLE;
    }

    public static BigDecimal lamTronNghin(BigDecimal gia) {
        if (gia == null) return BigDecimal.ZERO;
        long v = gia.setScale(0, RoundingMode.HALF_UP).longValue();
        long tron = Math.round(v / 1000.0) * 1000L;
        return BigDecimal.valueOf(tron);
    }

    public static int tinhPhuThu(BigDecimal giaVeTu, String loaiGhe, Cinema rap) {
        if (giaVeTu == null || giaVeTu.signum() <= 0) return 0;
        String loai = loaiGhe == null ? "STANDARD" : loaiGhe.toUpperCase();
        BigDecimal gia = switch (loai) {
            case "VIP" -> giaVeTu.multiply(BigDecimal.valueOf(100 + layPhanTramVip(rap)))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            case "COUPLE" -> giaVeTu.multiply(BigDecimal.valueOf(100 + layPhanTramCouple(rap)))
                    .divide(BigDecimal.valueOf(100), 0, RoundingMode.HALF_UP);
            default -> giaVeTu;
        };
        return lamTronNghin(gia).subtract(lamTronNghin(giaVeTu)).intValue();
    }

    public static BigDecimal tinhGiaGhe(BigDecimal giaVeTu, String loaiGhe, Cinema rap) {
        if (giaVeTu == null) return BigDecimal.ZERO;
        return lamTronNghin(giaVeTu.add(BigDecimal.valueOf(tinhPhuThu(giaVeTu, loaiGhe, rap))));
    }

    public static BigDecimal tinhTienGhe(Showtime suat, Cinema rap, List<String> danhSachSoGhe) {
        if (suat == null || suat.getGiaVeTu() == null || suat.getGiaVeTu().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Gia ve suat chieu khong hop le");
        }
        if (danhSachSoGhe == null || danhSachSoGhe.isEmpty()) return BigDecimal.ZERO;
        BigDecimal tong = BigDecimal.ZERO;
        for (String soGhe : danhSachSoGhe) {
            Showtime.SeatStatus ghe = suat.getTrangThaiGhe().stream()
                    .filter(muc -> soGhe.equals(muc.getSoGhe()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ghe khong ton tai: " + soGhe));
            tong = tong.add(tinhGiaGhe(suat.getGiaVeTu(), ghe.getLoaiGhe(), rap));
        }
        return tong;
    }

    public static void capNhatPhuThuGhe(Showtime suat, Cinema rap) {
        if (suat.getTrangThaiGhe() == null || suat.getGiaVeTu() == null) return;
        suat.getTrangThaiGhe().forEach(ghe ->
                ghe.setPhuThu(tinhPhuThu(suat.getGiaVeTu(), ghe.getLoaiGhe(), rap)));
    }
}
