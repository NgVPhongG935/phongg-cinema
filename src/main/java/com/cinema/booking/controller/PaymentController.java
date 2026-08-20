package com.cinema.booking.controller;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.dto.PaymentUrlResponse;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.service.MoMoPaymentService;
import com.cinema.booking.service.TicketPaidService;
import com.cinema.booking.service.VnPayService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/payments")
public class PaymentController {
    private final TicketRepository khoVe;
    private final VnPayService dichVuVnPay;
    private final MoMoPaymentService dichVuMoMo;
    private final TicketPaidService dichVuVePaid;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @PostMapping("/vnpay/create")
    public PaymentUrlResponse taoLienKetVnpay(@RequestBody Map<String, String> yeuCau) {
        String maVe = yeuCau.get("maVe");
        if (maVe == null || maVe.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thieu maVe");
        String url = dichVuVnPay.taoUrlThanhToan(maVe.trim());
        return PaymentUrlResponse.builder().paymentUrl(url).maVe(maVe.trim()).build();
    }

    @GetMapping("/vnpay/ipn")
    public ResponseEntity<Map<String, String>> vnpayIpn(@RequestParam Map<String, String> params) {
        if (!dichVuVnPay.xacThucIpn(params))
            return ResponseEntity.badRequest().body(Map.of("RspCode", "97", "Message", "Invalid signature"));
        String maVe = dichVuVnPay.layMaVeTuIpn(params);
        Ticket ve = khoVe.findById(maVe).orElse(null);
        if (ve == null)
            return ResponseEntity.ok(Map.of("RspCode", "01", "Message", "Order not found"));
        if (!dichVuVnPay.thanhCongTuIpn(params))
            return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
        BigDecimal amount = dichVuVnPay.soTienTuIpn(params);
        if (ve.getTongTien() != null && amount.compareTo(ve.getTongTien()) != 0)
            return ResponseEntity.ok(Map.of("RspCode", "04", "Message", "Invalid amount"));
        dichVuVePaid.danhDauThanhToanThanhCong(maVe, params.get("vnp_TransactionNo"));
        return ResponseEntity.ok(Map.of("RspCode", "00", "Message", "Confirm Success"));
    }

    @GetMapping("/vnpay/return")
    public ResponseEntity<Void> vnpayReturn(@RequestParam Map<String, String> params) {
        String maVe = dichVuVnPay.layMaVeTuIpn(params);
        boolean ok = dichVuVnPay.xacThucIpn(params) && dichVuVnPay.thanhCongTuIpn(params);
        String status = ok ? "success" : "failed";
        String redirect = frontendUrl.replaceAll("/$", "") + "/payment/result?maVe=" + maVe + "&status=" + status;
        return ResponseEntity.status(HttpStatus.FOUND).location(ServletUriComponentsBuilder.fromUriString(redirect).build().toUri()).build();
    }

    @PostMapping("/momo/create")
    public PaymentUrlResponse taoLienKetMomo(@RequestBody Map<String, String> yeuCau) {
        String maVe = yeuCau.get("maVe");
        if (maVe == null || maVe.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thieu maVe");
        String url = dichVuMoMo.taoUrlThanhToan(maVe.trim());
        return PaymentUrlResponse.builder().paymentUrl(url).maVe(maVe.trim()).build();
    }

    @PostMapping("/momo/ipn")
    public ResponseEntity<Map<String, Object>> momoIpn(@RequestBody Map<String, Object> body) {
        Map<String, Object> phanHoi = new HashMap<>();
        if (!dichVuMoMo.xacThucIpn(body)) {
            phanHoi.put("resultCode", 97);
            phanHoi.put("message", "Invalid signature");
            return ResponseEntity.ok(phanHoi);
        }
        String maVe = dichVuMoMo.layMaVeTuIpn(body);
        Ticket ve = khoVe.findById(maVe).orElse(null);
        if (ve == null) {
            phanHoi.put("resultCode", 1);
            phanHoi.put("message", "Order not found");
            return ResponseEntity.ok(phanHoi);
        }
        if (dichVuMoMo.thanhCongTuIpn(body)) {
            BigDecimal amount = dichVuMoMo.soTienTuIpn(body);
            if (ve.getTongTien() != null && amount.compareTo(ve.getTongTien()) == 0)
                dichVuVePaid.danhDauThanhToanThanhCong(maVe, String.valueOf(body.get("transId")));
        }
        phanHoi.put("resultCode", 0);
        phanHoi.put("message", "Success");
        return ResponseEntity.ok(phanHoi);
    }

    @GetMapping("/momo/return")
    public ResponseEntity<Void> momoReturn(@RequestParam Map<String, String> params) {
        String maVe = params.getOrDefault("orderId", "");
        String resultCode = params.getOrDefault("resultCode", "");
        String status = "0".equals(resultCode) ? "success" : "failed";
        String redirect = frontendUrl.replaceAll("/$", "") + "/payment/result?maVe=" + maVe + "&status=" + status;
        return ResponseEntity.status(HttpStatus.FOUND).location(ServletUriComponentsBuilder.fromUriString(redirect).build().toUri()).build();
    }

    /** Giữ tương thích API cũ */
    @PostMapping("/vnpay-callback")
    public Ticket xacNhanThanhToanCu(@RequestBody com.cinema.booking.dto.PaymentCallbackRequest yeuCau) {
        if (yeuCau.isThanhCong())
            dichVuVePaid.danhDauThanhToanThanhCong(yeuCau.getMaVe(), "legacy");
        else {
            Ticket ve = khoVe.findById(yeuCau.getMaVe()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            ve.setTrangThai(com.cinema.booking.document.TicketStatus.CANCELLED);
            khoVe.save(ve);
        }
        return khoVe.findById(yeuCau.getMaVe()).orElseThrow();
    }
}
