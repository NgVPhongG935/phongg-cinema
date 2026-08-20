package com.cinema.booking.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ShowtimeAiGenerateRequestDto {
    private List<String> danhSachMaPhim;
    private String maRap;
    private LocalDate ngayChieu;
    private String dinhDang;
}
