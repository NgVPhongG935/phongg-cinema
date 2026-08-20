package com.cinema.booking.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class ApDungVoucherRequest {
    private String maCode;
    private BigDecimal tongTien;
}
