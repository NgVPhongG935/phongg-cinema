package com.cinema.booking.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PaymentRequest {
    private String maVe;
    private BigDecimal tongTien;
}
