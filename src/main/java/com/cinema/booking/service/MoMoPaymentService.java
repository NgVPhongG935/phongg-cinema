package com.cinema.booking.service;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.util.ChuKyThanhToanUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MoMoPaymentService {
    private final TicketRepository khoVe;
    private final RestClient restClient = RestClient.create();

    @Value("${payment.momo.partner-code:}")
    private String partnerCode;

    @Value("${payment.momo.access-key:}")
    private String accessKey;

    @Value("${payment.momo.secret-key:}")
    private String secretKey;

    @Value("${payment.momo.endpoint}")
    private String endpoint;

    @Value("${payment.momo.return-url}")
    private String returnUrl;

    @Value("${payment.momo.notify-url}")
    private String notifyUrl;

    public String taoUrlThanhToan(String maVe) {
        if (partnerCode == null || partnerCode.isBlank() || secretKey == null || secretKey.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "MoMo chua duoc cau hinh");
        Ticket ve = khoVe.findById(maVe).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Khong tim thay ve"));
        if (ve.getTrangThai() != TicketStatus.PENDING)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ve khong o trang thai cho thanh toan");

        String requestId = UUID.randomUUID().toString();
        String orderId = ve.getId();
        long amount = ve.getTongTien().longValue();
        String orderInfo = "Thanh toan ve PhongG Cinema";
        String extraData = "";
        String requestType = "captureWallet";

        String rawHash = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&ipnUrl=" + notifyUrl
                + "&orderId=" + orderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + partnerCode
                + "&redirectUrl=" + returnUrl
                + "&requestId=" + requestId
                + "&requestType=" + requestType;
        String signature = ChuKyThanhToanUtil.hexHmacSha256(secretKey, rawHash);

        Map<String, Object> body = new HashMap<>();
        body.put("partnerCode", partnerCode);
        body.put("partnerName", "PhongG Cinema");
        body.put("storeId", "PhongG");
        body.put("requestId", requestId);
        body.put("amount", amount);
        body.put("orderId", orderId);
        body.put("orderInfo", orderInfo);
        body.put("redirectUrl", returnUrl);
        body.put("ipnUrl", notifyUrl);
        body.put("lang", "vi");
        body.put("extraData", extraData);
        body.put("requestType", requestType);
        body.put("signature", signature);

        @SuppressWarnings("unchecked")
        Map<String, Object> phanHoi = restClient.post()
                .uri(endpoint)
                .header("Content-Type", "application/json")
                .body(body)
                .retrieve()
                .body(Map.class);

        if (phanHoi == null || phanHoi.get("payUrl") == null)
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "MoMo khong tra payUrl");
        return phanHoi.get("payUrl").toString();
    }

    public boolean xacThucIpn(Map<String, Object> body) {
        if (body == null || body.get("signature") == null) return false;
        String signature = body.get("signature").toString();
        long amount = ((Number) body.getOrDefault("amount", 0)).longValue();
        String extraData = body.getOrDefault("extraData", "").toString();
        String message = body.getOrDefault("message", "").toString();
        String orderIdStr = body.getOrDefault("orderId", "").toString();
        String orderInfo = body.getOrDefault("orderInfo", "").toString();
        String orderType = body.getOrDefault("orderType", "").toString();
        String partnerCodeVal = body.getOrDefault("partnerCode", "").toString();
        String requestId = body.getOrDefault("requestId", "").toString();
        String responseTime = body.getOrDefault("responseTime", "").toString();
        String resultCode = body.getOrDefault("resultCode", "").toString();
        String transId = body.getOrDefault("transId", "").toString();

        String rawHash = "accessKey=" + accessKey
                + "&amount=" + amount
                + "&extraData=" + extraData
                + "&message=" + message
                + "&orderId=" + orderIdStr
                + "&orderInfo=" + orderInfo
                + "&orderType=" + orderType
                + "&partnerCode=" + partnerCodeVal
                + "&payType=" + body.getOrDefault("payType", "")
                + "&requestId=" + requestId
                + "&responseTime=" + responseTime
                + "&resultCode=" + resultCode
                + "&transId=" + transId;
        String calculated = ChuKyThanhToanUtil.hexHmacSha256(secretKey, rawHash);
        return signature.equals(calculated);
    }

    public boolean thanhCongTuIpn(Map<String, Object> body) {
        return body != null && "0".equals(String.valueOf(body.get("resultCode")));
    }

    public String layMaVeTuIpn(Map<String, Object> body) {
        return body != null ? String.valueOf(body.get("orderId")) : null;
    }

    public BigDecimal soTienTuIpn(Map<String, Object> body) {
        if (body == null || body.get("amount") == null) return BigDecimal.ZERO;
        return BigDecimal.valueOf(((Number) body.get("amount")).longValue());
    }
}
