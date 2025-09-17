package com.utilityzone.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
@Validated
@Configuration
@EnableConfigurationProperties
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    
    @NotBlank(message = "JWT secret cannot be empty")
    private String secret;
    
    @Positive(message = "JWT expiration must be positive")
    private long expiration;
}