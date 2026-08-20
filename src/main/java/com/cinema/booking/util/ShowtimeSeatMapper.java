package com.cinema.booking.util;

import com.cinema.booking.document.Cinema;
import com.cinema.booking.document.SeatAvailability;
import com.cinema.booking.document.Showtime;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public final class ShowtimeSeatMapper {
    private ShowtimeSeatMapper() {}

    public static List<Showtime.SeatStatus> taoTrangThaiGheTuPhong(List<Cinema.Seat> danhSachGhe, BigDecimal giaVeTu, Cinema rap) {
        if (danhSachGhe == null || danhSachGhe.isEmpty()) {
            return List.of();
        }
        return danhSachGhe.stream()
                .map(ghe -> Showtime.SeatStatus.builder()
                        .seatNumber(ghe.getSoGhe())
                        .status(SeatAvailability.AVAILABLE)
                        .seatType(ghe.getLoaiGhe())
                        .surcharge(TinhGiaVeUtil.tinhPhuThu(giaVeTu, ghe.getLoaiGhe(), rap))
                        .build())
                .toList();
    }

    public static List<Showtime.SeatStatus> gopTrangThaiGhe(List<Showtime.SeatStatus> trangThaiCu, List<Showtime.SeatStatus> mauMoi) {
        Map<String, Showtime.SeatStatus> cuTheoSoGhe = trangThaiCu == null ? Map.of()
                : trangThaiCu.stream().collect(Collectors.toMap(Showtime.SeatStatus::getSeatNumber, ghe -> ghe, (a, b) -> a));
        return mauMoi.stream().map(gheMoi -> {
            Showtime.SeatStatus cu = cuTheoSoGhe.get(gheMoi.getSeatNumber());
            if (cu == null) return gheMoi;
            return Showtime.SeatStatus.builder()
                    .seatNumber(cu.getSeatNumber())
                    .status(cu.getStatus())
                    .heldBy(cu.getHeldBy())
                    .heldExpiresAt(cu.getHeldExpiresAt())
                    .seatType(gheMoi.getSeatType())
                    .surcharge(gheMoi.getSurcharge())
                    .build();
        }).toList();
    }
}
