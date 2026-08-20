package com.cinema.booking.dto;

import com.cinema.booking.document.LoaiCombo;
import com.cinema.booking.document.TrangThaiCombo;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ComboResponseDto {
    private String id;
    private String maCombo;
    private String tenCombo;
    private LoaiCombo loai;
    private String moTa;
    private BigDecimal giaTien;
    private String hinhAnh;
    private TrangThaiCombo trangThai;
}
