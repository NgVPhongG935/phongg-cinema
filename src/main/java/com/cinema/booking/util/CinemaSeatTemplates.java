package com.cinema.booking.util;

import com.cinema.booking.document.Cinema;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class CinemaSeatTemplates {
    private static final BigDecimal GIA_CO_BAN = BigDecimal.valueOf(90000);
    private static final BigDecimal PHU_THU_VIP = BigDecimal.valueOf(20000);
    private static final BigDecimal PHU_THU_DOI = BigDecimal.valueOf(80000);

    private CinemaSeatTemplates() {}

    public static List<Cinema.Seat> layMauTheoMa(String maMau) {
        if (maMau == null || maMau.isBlank()) return taoMauTieuChuan();
        return switch (maMau.trim().toUpperCase()) {
            case "VUA" -> taoMauVua();
            case "TRUNG_BINH" -> taoMauTrungBinh();
            case "LON" -> taoMauLon();
            case "TUUY_CHINH" -> taoMauCoBan();
            case "MAC_DINH" -> taoMauTieuChuan();
            default -> taoMauTieuChuan();
        };
    }

    /** Mẫu cơ bản ~50 ghế */
    public static List<Cinema.Seat> taoMauCoBan() {
        List<Cinema.Seat> danhSachGhe = new ArrayList<>();
        for (char hang = 'A'; hang <= 'E'; hang++) {
            for (int so = 1; so <= 10; so++) {
                danhSachGhe.add(ghe(hang + String.valueOf(so), "STANDARD"));
            }
        }
        return danhSachGhe;
    }

    /** Mẫu vừa: 80 ghế A–H, 10 ghế/hàng */
    public static List<Cinema.Seat> taoMauVua() {
        List<Cinema.Seat> danhSachGhe = new ArrayList<>();
        for (char hang = 'A'; hang <= 'H'; hang++) {
            for (int so = 1; so <= 10; so++) {
                danhSachGhe.add(ghe(hang + String.valueOf(so), "STANDARD"));
            }
        }
        return danhSachGhe;
    }

    /** Mẫu trung bình: 140 ghế A–J, 14 ghế/hàng */
    public static List<Cinema.Seat> taoMauTrungBinh() {
        List<Cinema.Seat> danhSachGhe = new ArrayList<>();
        for (char hang = 'A'; hang <= 'J'; hang++) {
            for (int so = 1; so <= 14; so++) {
                danhSachGhe.add(ghe(hang + String.valueOf(so), "STANDARD"));
            }
        }
        return danhSachGhe;
    }

    /** Mẫu lớn: 216 ghế A–L, 18 ghế/hàng — VIP giữa, ghế đôi hàng L */
    public static List<Cinema.Seat> taoMauLon() {
        List<Cinema.Seat> danhSachGhe = new ArrayList<>();
        for (char hang = 'A'; hang <= 'K'; hang++) {
            for (int so = 1; so <= 18; so++) {
                boolean laVip = hang >= 'D' && hang <= 'K' && so >= 5 && so <= 14;
                danhSachGhe.add(ghe(hang + String.valueOf(so), laVip ? "VIP" : "STANDARD"));
            }
        }
        for (int so = 1; so <= 18; so += 2) {
            danhSachGhe.add(ghe("L" + so, "COUPLE"));
            danhSachGhe.add(ghe("L" + (so + 1), "COUPLE"));
        }
        return danhSachGhe;
    }

    public static List<Cinema.Seat> taoMauTieuChuan() {
        List<Cinema.Seat> danhSachGhe = new ArrayList<>();
        for (char hangGhe = 'A'; hangGhe <= 'C'; hangGhe++) {
            for (int soThuTu = 1; soThuTu <= 20; soThuTu++) {
                danhSachGhe.add(ghe(hangGhe + String.valueOf(soThuTu), "STANDARD"));
            }
        }
        for (char hangGhe = 'D'; hangGhe <= 'K'; hangGhe++) {
            for (int soThuTu = 1; soThuTu <= 20; soThuTu++) {
                boolean laGheVip = soThuTu >= 4 && soThuTu <= 17;
                danhSachGhe.add(ghe(hangGhe + String.valueOf(soThuTu), laGheVip ? "VIP" : "STANDARD"));
            }
        }
        for (int soThuTu = 1; soThuTu <= 16; soThuTu += 2) {
            danhSachGhe.add(ghe("L" + soThuTu, "COUPLE"));
            danhSachGhe.add(ghe("L" + (soThuTu + 1), "COUPLE"));
        }
        return danhSachGhe;
    }

    private static Cinema.Seat ghe(String soGhe, String loaiGhe) {
        BigDecimal gia = GIA_CO_BAN;
        if ("VIP".equals(loaiGhe)) gia = GIA_CO_BAN.add(PHU_THU_VIP);
        if ("COUPLE".equals(loaiGhe)) gia = GIA_CO_BAN.add(PHU_THU_DOI);
        return new Cinema.Seat(soGhe, loaiGhe, gia);
    }
}
