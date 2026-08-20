package com.cinema.booking.dto;

import com.cinema.booking.document.Cinema.Seat;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class RoomSeatLayoutDto {
    private String tenRap;
    private String tenPhong;
    private String maPhong;
    private List<Seat> danhSachGhe;
    private boolean coTheSua;
    private int soSuatChieuTuongLai;
    private int soSuatDaDongBo;
}
