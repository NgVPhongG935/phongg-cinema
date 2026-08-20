package com.cinema.booking.service;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.util.ChuKyThanhToanUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class VnPayService {
    private static final DateTimeFormatter VNP_DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");

    private final TicketRepository khoVe;
    private final PaymentConfigService dichVuCauHinh;

    @Value("${payment.vnpay.pay-url}")
    private String payUrl;

    @Value("${payment.vnpay.return-url}")
    private String returnUrl;

    @Value("${payment.vnpay.ipn-url}")
    private String ipnUrl;

    public String taoUrlThanhToan(String maVe) {
        String tmnCode = dichVuCauHinh.layVnpayTmnCode();
        String hashSecret = dichVuCauHinh.layVnpayHashSecret();
        if (!dichVuCauHinh.vnpayKichHoat())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "VNPay da tat");
        if (tmnCode == null || tmnCode.isBlank() || hashSecret == null || hashSecret.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "VNPay chua duoc cau hinh");
        Ticket ve = khoVe.findById(maVe).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
        if (ve.getTrangThai() != TicketStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ve khong o trang thai cho thanh toan");

        Map<String, String> params = new HashMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", tmnCode);
        params.put("vnp_Amount", String.valueOf(ve.getTongTien().multiply(BigDecimal.valueOf(100)).longValue()));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", ve.getId());
        params.put("vnp_OrderInfo", "Thanh toan ve PhongG Cinema");
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", VNP_DATE.format(LocalDateTime.now()));

        String hashData = ChuKyThanhToanUtil.chuoiThamSoSapXep(params);
        String secureHash = ChuKyThanhToanUtil.hexHmacSha512(hashSecret, hashData);
        params.put("vnp_SecureHash", secureHash);

        String query = params.entrySet().stream()
                .map(e -> urlEncode(e.getKey()) + "=" + urlEncode(e.getValue()))
                .reduce((a, b) -> a + "&" + b)
                .orElse("");
        return payUrl + (payUrl.contains("?") ? "&" : "?") + query;
    }

    public boolean xacThucIpn(Map<String, String> params) {
        String hashSecret = dichVuCauHinh.layVnpayHashSecret();
        String receivedHash = params.get("vnp_SecureHash");
        if (receivedHash == null) return false;
        Map<String, String> verify = new HashMap<>(params);
        verify.remove("vnp_SecureHash");
        String hashData = ChuKyThanhToanUtil.chuoiThamSoSapXep(verify);
        String calculated = ChuKyThanhToanUtil.hexHmacSha512(hashSecret, hashData);
        return receivedHash.equalsIgnoreCase(calculated);
    }

    public String layMaVeTuIpn(Map<String, String> params) {
        return params.get("vnp_TxnRef");
    }

    public boolean thanhCongTuIpn(Map<String, String> params) {
        return "00".equals(params.get("vnp_ResponseCode"));
    }

    public BigDecimal soTienTuIpn(Map<String, String> params) {
        String raw = params.get("vnp_Amount");
        if (raw == null) return BigDecimal.ZERO;
        return new BigDecimal(raw).divide(BigDecimal.valueOf(100));
    }

    private String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
