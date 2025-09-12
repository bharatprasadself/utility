package com.utilityzone.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:5173",  // Vite's default port
                    "http://localhost:3000",  // React's default port
                    "http://localhost:8080",  // Local Spring Boot
                    "https://utilityzone.in", // Production domain
                    "https://www.utilityzone.in" // Production www domain
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "Accept", "Origin")
                .exposedHeaders("Authorization")
                .allowCredentials(true)
                .maxAge(3600L);
    }
}
