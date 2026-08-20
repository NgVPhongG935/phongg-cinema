package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class MovieReviewDto {
    private String id;
    private String maPhim;
    private String maNguoiDung;
    private String hoTen;
    private int diem;
    private String noiDung;
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;
    private List<MovieReviewReplyDto> phanHoi;
    private int soPhanHoi;
}
