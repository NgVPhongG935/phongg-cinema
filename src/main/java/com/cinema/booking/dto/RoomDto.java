package com.cinema.booking.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class RoomDto {
    private String maPhong;
    private String tenPhong;
    /** 2D, 3D, IMAX, 4DX */
    private String loaiPhong;
    /** MAC_DINH, VUA, TRUNG_BINH, LON, TUUY_CHINH */
    private String mauSoDoGhe;
    private List<RoomSeatDto> danhSachGhe;

    @Data
    public static class RoomSeatDto {
        private String soGhe;
        private String loaiGhe;
        private BigDecimal giaVe;
    }
}
