package com.cinema.booking.dto;

import lombok.Data;

@Data
public class PaymentCallbackRequest {
    private String maVe;
    private boolean thanhCong;
}
