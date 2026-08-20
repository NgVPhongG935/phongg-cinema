package com.cinema.booking.dto;

import com.cinema.booking.document.LoaiCombo;
import com.cinema.booking.document.TrangThaiCombo;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ComboDto {
    private String maCombo;
    private String tenCombo;
    private LoaiCombo loai;
    private String moTa;
    private BigDecimal giaTien;
    private String hinhAnh;
    private TrangThaiCombo trangThai;
}
