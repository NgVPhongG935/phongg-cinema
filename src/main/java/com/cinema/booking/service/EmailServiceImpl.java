package com.cinema.booking.service;

import com.cinema.booking.document.Ticket;
import com.cinema.booking.document.User;
import com.cinema.booking.repository.TicketRepository;
import com.cinema.booking.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final TicketRepository khoVe;
    private final UserRepository khoNguoiDung;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:windphongg935@gmail.com}")
    private String fromEmail;

    @Override
    public void guiXacNhanVeNeuCan(String maVe) {
        Ticket ve = khoVe.findById(maVe).orElse(null);
        if (ve != null && ve.getEmailSentAt() == null) {
            guiEmailVe(maVe);
        }
    }

    @Override
    public void guiEmailVe(String maVe) {
        Ticket ve = khoVe.findById(maVe).orElse(null);
        if (ve == null) {
            log.warn("Không tìm thấy vé {} để gửi email", maVe);
            return;
        }

        String emailKhach = null;
        String tenKhach = "Quý khách";
        if (ve.getUserId() != null && !ve.getUserId().isBlank()) {
            User user = khoNguoiDung.findById(ve.getUserId()).orElse(null);
            if (user != null) {
                emailKhach = user.getEmail();
                if (user.getHoTen() != null && !user.getHoTen().isBlank()) {
                    tenKhach = user.getHoTen();
                }
            }
        }

        if (emailKhach == null || emailKhach.isBlank()) {
            log.info("Vé {} không tìm thấy email người dùng để gửi email vé", maVe);
            return;
        }

        log.info("Gửi email vé xem phim {} tới email: {}", maVe, emailKhach);
        if (mailSender == null) {
            log.info("JavaMailSender chưa cấu hình SMTP, ghi log xác nhận vé.");
            ve.setEmailSentAt(LocalDateTime.now());
            khoVe.save(ve);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderAddress = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "windphongg935@gmail.com";
            helper.setFrom(senderAddress, "PhongG Cinema - Vé Điện Tử");
            helper.setTo(emailKhach.trim());
            helper.setSubject("Xác nhận đặt vé thành công - Mã vé: " + maVe);
            helper.setReplyTo(senderAddress);

            List<String> danhSachGhe = ve.getSelectedSeats() != null ? ve.getSelectedSeats() : List.of();
            String htmlContent = "<div style=\"font-family: Arial, sans-serif; background-color: #0b0813; color: #fff; padding: 25px; border-radius: 16px;\">"
                    + "<h2 style=\"color: #d946ef;\">🎬 PHONGG CINEMA - VÉ ĐIỆN TỬ</h2>"
                    + "<p>Xin chào <strong>" + tenKhach + "</strong>,</p>"
                    + "<p>Mã vé: <strong>" + maVe + "</strong></p>"
                    + "<p>Danh sách ghế: <strong>" + String.join(", ", danhSachGhe) + "</strong></p>"
                    + "<p>Tổng tiền: <strong>" + ve.getTotalAmount() + " VNĐ</strong></p>"
                    + "<p>Cảm ơn bạn đã lựa chọn PhongG Cinema!</p>"
                    + "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            ve.setEmailSentAt(LocalDateTime.now());
            khoVe.save(ve);
            log.info("Đã gửi email vé {} thành công tới {}", maVe, emailKhach);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email vé: {}", e.getMessage());
        }
    }
}
