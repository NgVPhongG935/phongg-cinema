package com.cinema.booking.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * Cấu hình JavaMailSender tường minh sử dụng Port 465 (SSL).
 * Tránh trường hợp Spring Boot tự động fallback về cổng 587 (bị chặn trên Cloud/Render).
 */
@Slf4j
@Configuration
public class MailConfig {

    @Value("${spring.mail.host:${MAIL_HOST:smtp.gmail.com}}")
    private String host;

    @Value("${spring.mail.port:${MAIL_PORT:465}}")
    private int port;

    @Value("${spring.mail.username:${MAIL_USERNAME:windphongg935@gmail.com}}")
    private String username;

    @Value("${spring.mail.password:${MAIL_PASSWORD:ddldrrghxzbxpvtn}}")
    private String password;

    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(host != null && !host.isBlank() ? host.trim() : "smtp.gmail.com");
        mailSender.setPort(port > 0 ? port : 465);
        if (username != null && !username.isBlank()) {
            mailSender.setUsername(username.trim());
        }
        if (password != null && !password.isBlank()) {
            mailSender.setPassword(password.trim());
        }
        mailSender.setDefaultEncoding("UTF-8");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.ssl.enable", "true");
        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtp.starttls.enable", "false");
        props.put("mail.smtp.socketFactory.port", String.valueOf(port > 0 ? port : 465));
        props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
        props.put("mail.smtp.socketFactory.fallback", "false");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        log.info("[MailConfig] Khởi tạo JavaMailSender Bean: host={}, port={}, ssl=true, username={}",
                mailSender.getHost(), mailSender.getPort(), mailSender.getUsername());
        return mailSender;
    }
}
