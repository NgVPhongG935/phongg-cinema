package com.cinema.booking.document;

public enum PaymentMethod {
    CHUYEN_KHOAN_MB,
    /** @deprecated Giữ cho vé cũ trong DB */
    CHUYEN_KHOAN_VCB,
    /** @deprecated Giữ cho vé cũ trong DB */
    CHUYEN_KHOAN_BIDV,
  /** Chuyển khoản / quét QR MoMo thủ công */
    MOMO,
    VNPAY,
    MOMO_GATEWAY
}
