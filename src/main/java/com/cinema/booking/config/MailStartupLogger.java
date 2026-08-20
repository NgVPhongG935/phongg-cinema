package com.cinema.booking.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Log trạng thái SMTP khi khởi động — dễ biết email vé có được gửi hay không. */
@Component
public class MailStartupLogger implements ApplicationRunner {
    private static final Logger nhatKy = LoggerFactory.getLogger(MailStartupLogger.class);

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Override
    public void run(ApplicationArguments args) {
        if (!mailEnabled) {
            nhatKy.warn("EMAIL VE: TAT (MAIL_ENABLED=false). Admin duyet ve se KHONG gui mail.");
            nhatKy.warn("         Tao mail.local.cmd tu mail.local.cmd.example de bat.");
            return;
        }
        if (mailUsername == null || mailUsername.isBlank()) {
            nhatKy.warn("EMAIL VE: MAIL_ENABLED=true nhung MAIL_USERNAME rong — khong gui duoc.");
            return;
        }
        nhatKy.info("EMAIL VE: BAT — gui toi email tai khoan khi ve chuyen PAID (Admin duyet / VNPay/MoMo). SMTP: {}", mailUsername);
    }
}
