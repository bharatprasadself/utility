package com.utilityzone.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Get environment
        String env = System.getenv("SPRING_PROFILES_ACTIVE");
        boolean isProduction = "prod".equals(env);

        if (isProduction) {
            // Production origins
            config.addAllowedOrigin("https://utilityzone.in");
            config.addAllowedOrigin("https://www.utilityzone.in");
        } else {
            // Development origins
            config.addAllowedOrigin("http://localhost:5173"); // Vite default port
            config.addAllowedOrigin("http://localhost:3000"); // React default port
            config.addAllowedOrigin("http://localhost:8080"); // Spring Boot default port
        }
        
        // Allow credentials
        config.setAllowCredentials(true);
        
        // Allow specific methods
        config.addAllowedMethod("GET");
        config.addAllowedMethod("POST");
        config.addAllowedMethod("PUT");
        config.addAllowedMethod("DELETE");
        config.addAllowedMethod("OPTIONS");
        
        // Allow specific headers
        config.addAllowedHeader("Authorization");
        config.addAllowedHeader("Content-Type");
        config.addAllowedHeader("Accept");
        config.addAllowedHeader("Origin");
        config.addAllowedHeader("X-Requested-With");
        config.addAllowedHeader("Access-Control-Request-Method");
        config.addAllowedHeader("Access-Control-Request-Headers");
        
        // Expose headers that frontend might need
        config.addExposedHeader("Authorization");
        config.addExposedHeader("Content-Disposition");
        
        // How long the browser should cache the CORS response
        config.setMaxAge(3600L);
        
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
