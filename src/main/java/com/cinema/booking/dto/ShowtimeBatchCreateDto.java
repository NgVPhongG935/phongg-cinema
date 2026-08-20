package com.cinema.booking.dto;

import lombok.Data;

import java.util.List;

@Data
public class ShowtimeBatchCreateDto {
    private String maPhim;
    private String maRap;
    private String maPhong;
    private String dinhDang;
    private List<ShowtimeSlotDto> danhSachSuat;
}
