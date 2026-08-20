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

    @Value("${spring.mail.username:phonghsg935@gmail.com}")
    private String fromEmail;

    @Override
    public void guiEmailOtp(String toEmail, String hoTen, String otp) {
        String tenNguoiDung = (hoTen != null && !hoTen.isBlank()) ? hoTen.trim() : "Quý khách";
        log.info("========== MÃ OTP XÁC THỰC ĐĂNG KÝ ==========");
        log.info("Email nhận: {}", toEmail);
        log.info("Họ tên: {}", tenNguoiDung);
        log.info("Mã OTP: [ {} ] (Hiệu lực: 5 phút)", otp);
        log.info("=============================================");

        if (mailSender == null) {
            log.error("❌ JavaMailSender chưa được cấu hình SMTP. Vui lòng cấu hình MAIL_USERNAME và MAIL_PASSWORD trong mail.local.cmd!");
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Hệ thống gửi mail chưa được cấu hình. Vui lòng kiểm tra file mail.local.cmd (cần Google App Password 16 ký tự)."
            );
        }

        try {
            log.info("Dang gui OTP {} den email: {}", otp, toEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderAddress = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "phonghsg935@gmail.com";
            helper.setFrom(senderAddress, "PhongG Cinema - Xác Thực Tài Khoản");
            helper.setTo(toEmail.trim());
            helper.setSubject("Mã xác thực đăng ký tài khoản PhongG Cinema");
            helper.setReplyTo(senderAddress);

            String plainText = "Kính chào quý khách " + tenNguoiDung + ",\n\n"
                    + "Cảm ơn bạn đã đăng ký tài khoản tại PhongG Cinema - Trải Nghiệm Điện Ảnh Đỉnh Cao.\n\n"
                    + "Mã xác thực (OTP) của bạn là: " + otp + "\n\n"
                    + "Mã OTP này có hiệu lực trong vòng 05 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai.\n\n"
                    + "Trân trọng,\nPhongG Cinema Support Team\nHotline: 1900 6868";

            String htmlContent = buildOtpEmailTemplate(tenNguoiDung, otp);

            // Gửi cả bản text thuần và bản HTML giúp hạ thấp điểm đánh giá Spam
            helper.setText(plainText, htmlContent);
            mailSender.send(message);
            log.info("Đã gửi email OTP thành công tới: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ LỖI GỬI EMAIL QUA SMTP: {} | Chi tiết: {}", e.getMessage(), e.getClass().getName(), e);
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "Không thể gửi email OTP (" + e.getMessage() + "). Lưu ý: Gmail yêu cầu 'Mật khẩu ứng dụng' (App Password 16 ký tự) trong mail.local.cmd thay vì mật khẩu Gmail thông thường."
            );
        }
    }

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        guiEmailOtp(toEmail, "Quý khách", otp);
    }

    @Override
    public void sendOtpEmail(String toEmail, String hoTen, String otp) {
        guiEmailOtp(toEmail, hoTen, otp);
    }

    private String buildOtpEmailTemplate(String tenNguoiDung, String otp) {
        return "<!DOCTYPE html>"
                + "<html lang=\"vi\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>Mã xác thực đăng ký tài khoản PhongG Cinema</title>"
                + "</head>"
                + "<body style=\"margin: 0; padding: 0; background-color: #06040a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;\">"
                + "<table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: #06040a; padding: 30px 10px;\">"
                + "<tr>"
                + "<td align=\"center\">"
                + "<table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"max-width: 540px; background-color: #0f0a1c; border-radius: 16px; border: 1px solid #2d1b4e; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.7);\">"
                + "<!-- Header Banner -->"
                + "<tr>"
                + "<td style=\"background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #c026d3 100%); padding: 32px 24px; text-align: center;\">"
                + "<h1 style=\"margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;\">🎬 PHONGG CINEMA</h1>"
                + "<p style=\"margin: 6px 0 0 0; color: #e9d5ff; font-size: 14px; font-weight: 500; letter-spacing: 0.5px;\">Trải Nghiệm Điện Ảnh Đỉnh Cao</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Content Body -->"
                + "<tr>"
                + "<td style=\"padding: 32px 28px; color: #f1f5f9;\">"
                + "<p style=\"margin: 0 0 16px 0; font-size: 16px; color: #f8fafc;\">Kính chào quý khách <strong style=\"color: #e879f9;\">" + tenNguoiDung + "</strong>,</p>"
                + "<p style=\"margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;\">"
                + "Cảm ơn bạn đã lựa chọn đăng ký tài khoản tại <strong>PhongG Cinema</strong>. Để bảo mật tài khoản và hoàn tất quá trình xác thực, vui lòng sử dụng mã OTP dưới đây:"
                + "</p>"
                + "<!-- OTP Code Box -->"
                + "<table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"margin: 24px 0;\">"
                + "<tr>"
                + "<td align=\"center\" style=\"background-color: #1a102f; border: 2px dashed #9333ea; border-radius: 12px; padding: 22px 16px;\">"
                + "<div style=\"font-size: 12px; font-weight: 700; color: #c084fc; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;\">MÃ XÁC THỰC (OTP)</div>"
                + "<div style=\"font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 15px rgba(192, 38, 211, 0.6); font-family: 'Courier New', Courier, monospace;\">"
                + otp
                + "</div>"
                + "<div style=\"font-size: 13px; color: #fbbf24; margin-top: 10px; font-weight: 500;\">⏱ Có hiệu lực trong vòng <strong>05 phút</strong></div>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "<!-- Security Alert -->"
                + "<table role=\"presentation\" border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: rgba(239, 68, 68, 0.08); border-left: 4px solid #ef4444; border-radius: 6px; margin: 20px 0;\">"
                + "<tr>"
                + "<td style=\"padding: 12px 16px; color: #fca5a5; font-size: 13px; line-height: 1.5;\">"
                + "<strong>Lưu ý bảo mật:</strong> Mã OTP này có hiệu lực trong vòng 05 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai dưới mọi hình thức (kể cả nhân viên rạp)."
                + "</td>"
                + "</tr>"
                + "</table>"
                + "<p style=\"margin: 20px 0 0 0; font-size: 13px; line-height: 1.5; color: #94a3b8;\">"
                + "Nếu bạn không yêu cầu đăng ký tài khoản trên PhongG Cinema, vui lòng bỏ qua email này một cách an toàn."
                + "</p>"
                + "</td>"
                + "</tr>"
                + "<!-- Footer -->"
                + "<tr>"
                + "<td style=\"background-color: #08050e; border-top: 1px solid #1f1435; padding: 22px 24px; text-align: center;\">"
                + "<p style=\"margin: 0 0 6px 0; color: #94a3b8; font-size: 12px; font-weight: 600;\">PhongG Cinema - Hệ Thống Rạp Chiếu Phim Hiện Đại</p>"
                + "<p style=\"margin: 0 0 6px 0; color: #64748b; font-size: 12px;\">Hotline hỗ trợ: <strong style=\"color: #c084fc;\">1900 6868</strong> | Email: <a href=\"mailto:support@phonggcinema.vn\" style=\"color: #c084fc; text-decoration: none;\">support@phonggcinema.vn</a></p>"
                + "<p style=\"margin: 8px 0 0 0; color: #475569; font-size: 11px;\">© 2026 PhongG Cinema. Tất cả các quyền được bảo lưu.</p>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</td>"
                + "</tr>"
                + "</table>"
                + "</body>"
                + "</html>";
    }

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

            String senderAddress = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "phonghsg935@gmail.com";
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
