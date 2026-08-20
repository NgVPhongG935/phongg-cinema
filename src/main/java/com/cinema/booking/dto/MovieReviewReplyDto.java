package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MovieReviewReplyDto {
    private String id;
    private String maDanhGia;
    private String maNguoiDung;
    private String hoTen;
    private String noiDung;
    private LocalDateTime ngayTao;
}
