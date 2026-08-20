package com.cinema.booking.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ComboItemDto {
    private String maCombo;
    private String tenCombo;
    private Integer soLuong;
    private BigDecimal donGia;
}
