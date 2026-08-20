package com.cinema.booking.service;

import com.cinema.booking.dto.PaymentConfigDto;
import com.cinema.booking.dto.PaymentConfigResponseDto;

public interface PaymentConfigService {
  PaymentConfigResponseDto layCauHinh();
  PaymentConfigResponseDto luuCauHinh(PaymentConfigDto dto);
  PaymentConfigResponseDto uploadQrBank(byte[] noiDung, String contentType);
  PaymentConfigResponseDto xoaQrBank();
  PaymentConfigResponseDto uploadQrMoMo(byte[] noiDung, String contentType);
  PaymentConfigResponseDto xoaQrMoMo();
  String layVnpayTmnCode();
  String layVnpayHashSecret();
  boolean vnpayKichHoat();
  void napMacDinhNeuCan();
}
