package com.cinema.booking.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentConfigResponseDto {
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
  /** true neu secret da luu nhung khong tra ve day du */
  private Boolean vnpayHashSecretDaCauHinh;
}
