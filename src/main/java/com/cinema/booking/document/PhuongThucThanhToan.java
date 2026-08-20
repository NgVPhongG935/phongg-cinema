package com.cinema.booking.document;

/** Mã chuẩn phương thức thanh toán — lưu trên vé và nhận từ API đặt vé */
public enum PhuongThucThanhToan {
    BANK_TRANSFER,
    MOMO,
    VNPAY,
    MOMO_GATEWAY;

  /** Chuẩn hóa chuỗi từ request (mã cũ + mã mới), trả null nếu không hợp lệ */
  public static PhuongThucThanhToan chuanHoa(String raw) {
    if (raw == null || raw.isBlank()) return null;
    String ma = raw.trim().toUpperCase();
    switch (ma) {
      case "BANK_TRANSFER":
        return BANK_TRANSFER;
      case "MOMO":
        return MOMO;
      case "VNPAY":
        return VNPAY;
      case "MOMO_GATEWAY":
        return MOMO_GATEWAY;
      case "CHUYEN_KHOAN_MB", "CHUYEN_KHOAN_VCB", "CHUYEN_KHOAN_BIDV":
        return BANK_TRANSFER;
      default:
        return null;
    }
  }

  public static String tenHienThi(PhuongThucThanhToan muc) {
    if (muc == null) return "Thanh toán online";
    switch (muc) {
      case BANK_TRANSFER:
        return "Chuyển khoản MB Bank (VietQR)";
      case MOMO:
        return "Ví MoMo";
      case VNPAY:
        return "Cổng thanh toán VNPay";
      case MOMO_GATEWAY:
        return "MoMo (cổng thanh toán)";
      default:
        return muc.name();
    }
  }
}
