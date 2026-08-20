package com.cinema.booking.service;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.TicketStatus;
import com.cinema.booking.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TicketPaidService {
    private static final Logger nhatKy = LoggerFactory.getLogger(TicketPaidService.class);
    private final TicketRepository khoVe;
    private final EmailService dichVuEmail;

    /** Đánh dấu PAID idempotent; gửi email nếu chưa gửi. */
    public boolean danhDauThanhToanThanhCong(String maVe, String maThamChieu) {
        Ticket ve = khoVe.findById(maVe).orElse(null);
        if (ve == null) return false;
        if (ve.getTrangThai() == TicketStatus.PAID) {
            dichVuEmail.guiXacNhanVeNeuCan(maVe);
            return true;
        }
        if (ve.getTrangThai() != TicketStatus.PENDING && ve.getTrangThai() != TicketStatus.CHO_XAC_NHAN) return false;
        ve.setTrangThai(TicketStatus.PAID);
        ve.setMaQrCode(com.cinema.booking.util.MaVeQrUtil.taoMaQr(maVe));
        if (maThamChieu != null && !maThamChieu.isBlank()) ve.setPaymentGatewayRef(maThamChieu);
        khoVe.save(ve);
        nhatKy.info("Ve {} chuyen sang PAID (ref={})", maVe, maThamChieu);
        dichVuEmail.guiXacNhanVeNeuCan(maVe);
        return true;
    }
}
