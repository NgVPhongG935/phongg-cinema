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
@Document(collection = "payment_method_configs")
public class PaymentMethodConfig {
    @Id
    private String ma;
    private String ten;
    private String moTa;
    private String mau;
    private String soTaiKhoan;
    private String soDienThoai;
    private String tenTaiKhoan;
    private String chiNhanh;
    private String anhQrUrl;
    private Boolean kichHoat;
    private Integer thuTu;
    /** MANUAL = chuyển khoản/QR, GATEWAY = VNPay/MoMo cổng */
    private String loaiCong;
}
