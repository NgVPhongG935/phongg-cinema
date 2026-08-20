package com.cinema.booking.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "payment_configs")
public class PaymentConfig {
  public static final String ID_MAC_DINH = "default";

  @Id
  private String id;
  private String nganHangVietQr;
  private String soTaiKhoanVietQr;
  private String tenChuVietQr;
  private Boolean batVietQr;
  /** Anh QR MB Bank upload — neu null thi dung VietQR dong */
  private String qrBankUrl;
  private String soMoMo;
  private String tenChuMoMo;
  /** Anh QR MoMo upload */
  private String qrMomoUrl;
  /** Ten field cu — chi doc khi migrate */
  private String anhQrMoMo;
  private Boolean batMoMo;
  private String vnpayTmnCode;
  private String vnpayHashSecret;
  private Boolean batVnPay;
  /** Bat/tat MoMo gateway (MOMO_GATEWAY) — khac vi MoMo nhan tien thu cong */
  private Boolean batMoMoGateway;
}
