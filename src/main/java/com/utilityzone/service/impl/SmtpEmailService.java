package com.utilityzone.service.impl;

import com.utilityzone.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile({"prod","prod-h2"})
public class SmtpEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${spring.mail.username:}")
    private String smtpUser;

    @Value("${app.mail.reply-to:}")
    private String replyTo;

    @Value("${app.reset.base-url}")
    private String resetBaseUrl;

    public SmtpEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        String link = resetBaseUrl + "/reset-password?token=" + rawToken;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        if (smtpUser != null && !smtpUser.isBlank() && from != null && !from.equalsIgnoreCase(smtpUser)) {
            log.info("Email 'from' ({}) differs from SMTP username ({}). Ensure your provider allows this alias.", from, smtpUser);
        }
        if (replyTo != null && !replyTo.isBlank()) {
            message.setReplyTo(replyTo);
        }
        message.setSubject("Password Reset Instructions");
        message.setText("We received a password reset request.\n\n" +
                "Reset Link: " + link + "\n\n" +
                "If you did not request this change, you can ignore this email.");
        try {
            mailSender.send(message);
            log.info("Password reset email sent to {}", email);
        } catch (Exception ex) {
            // Log full stack trace for diagnostics (authentication failures, networking, etc.)
            log.warn("Failed sending password reset email to {}", email, ex);
        }
    }
}