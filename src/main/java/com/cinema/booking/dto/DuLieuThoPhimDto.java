package com.cinema.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DuLieuThoPhimDto {
    private String tenPhim;
    private Integer thoiLuongPhut;
    private String gioiHanTuoi;
    private String theLoai;
    private String daoDien;
    private String dienVien;
    private String ngonNgu;
    private String posterUrl;
    private String trailerUrl;
    private String tomTat;
    private String context;
    private int sources;
}