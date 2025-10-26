package com.utilityzone.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.nio.charset.StandardCharsets;
import java.util.Properties;

@Configuration
public class MailConfig {

    private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

    @Bean
    @ConditionalOnMissingBean(JavaMailSender.class)
    public JavaMailSender javaMailSender(Environment env) {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        String host = env.getProperty("spring.mail.host");
        Integer port = env.getProperty("spring.mail.port", Integer.class);
        String username = env.getProperty("spring.mail.username");
        String password = env.getProperty("spring.mail.password");

        if (host != null && !host.isBlank()) sender.setHost(host);
        if (port != null) sender.setPort(port);
        if (username != null && !username.isBlank()) sender.setUsername(username);
        if (password != null) sender.setPassword(password);

        sender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        Properties props = sender.getJavaMailProperties();
        props.put("mail.smtp.auth", env.getProperty("spring.mail.properties.mail.smtp.auth", "true"));
        props.put("mail.smtp.starttls.enable", env.getProperty("spring.mail.properties.mail.smtp.starttls.enable", "true"));
        props.put("mail.transport.protocol", env.getProperty("spring.mail.protocol", "smtp"));
    // Fail fast on slow or unreachable SMTP
    props.put("mail.smtp.connectiontimeout", env.getProperty("spring.mail.properties.mail.smtp.connectiontimeout", "5000"));
    props.put("mail.smtp.timeout", env.getProperty("spring.mail.properties.mail.smtp.timeout", "10000"));
    props.put("mail.smtp.writetimeout", env.getProperty("spring.mail.properties.mail.smtp.writetimeout", "10000"));

        log.info("JavaMailSender configured (host={}, port={}, username set? {})",
                host, port, (username != null && !username.isBlank()));
        return sender;
    }
}
