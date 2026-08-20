package com.cinema.booking.service;

import com.cinema.booking.dto.PaymentMethodConfigDto;
import com.cinema.booking.dto.PaymentMethodConfigResponseDto;

import java.util.List;

public interface PaymentMethodConfigService {
    List<PaymentMethodConfigResponseDto> layDanhSachKichHoat();
    List<PaymentMethodConfigResponseDto> layDanhSachAdmin();
    PaymentMethodConfigResponseDto them(PaymentMethodConfigDto dto);
    PaymentMethodConfigResponseDto capNhat(String ma, PaymentMethodConfigDto dto);
    void xoa(String ma);
    PaymentMethodConfigResponseDto uploadQr(String ma, byte[] noiDung, String contentType);
    void napMacDinhNeuCan();
}
