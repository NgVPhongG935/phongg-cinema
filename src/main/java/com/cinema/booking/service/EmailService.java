package com.cinema.booking.service;

public interface EmailService {
    void guiEmailOtp(String toEmail, String hoTen, String otp);
    void sendOtpEmail(String toEmail, String otp);
    void sendOtpEmail(String toEmail, String hoTen, String otp);
    void guiXacNhanVeNeuCan(String maVe);
    void guiEmailVe(String maVe);
}
