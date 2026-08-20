package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentUrlResponse {
    private String paymentUrl;
    private String maVe;
}
