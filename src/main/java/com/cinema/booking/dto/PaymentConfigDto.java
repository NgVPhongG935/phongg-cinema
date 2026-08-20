package com.cinema.booking.dto;

import lombok.Data;

@Data
public class PaymentConfigDto {
  private String nganHangVietQr;
  private String soTaiKhoanVietQr;
  private String tenChuVietQr;
  private Boolean batVietQr;
  private String qrBankUrl;
  private String soMoMo;
  private String tenChuMoMo;
  private String qrMomoUrl;
  private Boolean batMoMo;
  private String vnpayTmnCode;
  private String vnpayHashSecret;
  private Boolean batVnPay;
  private Boolean batMoMoGateway;
}
