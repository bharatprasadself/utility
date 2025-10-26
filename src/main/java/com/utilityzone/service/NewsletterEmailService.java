package com.utilityzone.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Async;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
// Avoid using ServletUriComponentsBuilder in async threads; base URL passed from controller or config

import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class NewsletterEmailService {
    private static final Logger log = LoggerFactory.getLogger(NewsletterEmailService.class);

    private final JavaMailSender mailSender;
    private final NewsletterTokenService tokenService;

    @Value("${app.mail.from:bharat.prasad@utilityzone.in}")
    private String fromAddress;

    @Value("${app.api.base-url:https://api.utilityzone.in}")
    private String apiBaseUrl;

    public NewsletterEmailService(JavaMailSender mailSender, NewsletterTokenService tokenService) {
        this.mailSender = mailSender;
        this.tokenService = tokenService;
    }

    @Async("newsletterExecutor")
    public void sendToAllAsync(@NonNull List<String> emails, @NonNull String subject, @NonNull String htmlBody, String baseUri) {
        for (String email : emails) {
            try {
                sendOne(email, subject, htmlBody, baseUri);
            } catch (Exception ex) {
                log.warn("Failed to send newsletter to {}: {}", email, ex.getMessage());
            }
        }
    }

    private void sendOne(String toEmail, String subject, String htmlBody, String baseUri) throws Exception {
        if (fromAddress == null || fromAddress.isBlank()) {
            // Fallback to a sane default to avoid startup failures due to missing property
            fromAddress = "bharat.prasad@utilityzone.in";
        }
        String token = tokenService.generateUnsubscribeToken(toEmail);
        String resolvedBase = (baseUri != null && !baseUri.isBlank()) ? baseUri :
                (apiBaseUrl != null && !apiBaseUrl.isBlank() ? apiBaseUrl : "http://localhost:8080");
        String unsubLink = resolvedBase + "/api/ebooks/newsletter/unsubscribe?token=" + token;
        String composedHtml = htmlBody +
                "<hr style='margin-top:24px'/>" +
                "<p style='font-size:12px;color:#666'>" +
                "You are receiving this because you subscribed on utilityzone.in. " +
                "<a href='" + unsubLink + "'>Unsubscribe</a>." +
                "</p>";

        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED,
                StandardCharsets.UTF_8.name());
        helper.setFrom(fromAddress);
        helper.setTo(toEmail);
        helper.setSubject(subject);
        helper.setText(composedHtml, true);

        mailSender.send(message);
    }
}
