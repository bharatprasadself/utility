package com.utilityzone.service.impl;

import com.utilityzone.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("dev")
public class LoggingEmailService implements EmailService {
    private static final Logger log = LoggerFactory.getLogger(LoggingEmailService.class);

    @Override
    public void sendPasswordReset(String email, String rawToken) {
        // In production, integrate with SMTP or a provider like SendGrid/SES.
        log.info("[EMAIL] Sending password reset to {} with token: {}", email, rawToken);
    }
}
