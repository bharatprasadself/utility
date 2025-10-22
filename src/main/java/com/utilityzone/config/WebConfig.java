package com.utilityzone.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(@NonNull CorsRegistry registry) {
        String env = System.getenv("SPRING_PROFILES_ACTIVE");
        boolean isProduction = "prod".equals(env);

        if (isProduction) {
            registry.addMapping("/api/**")
                    .allowedOrigins(
                        "https://utilityzone.in",
                        "https://www.utilityzone.in"
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .exposedHeaders("Authorization")
                    .allowCredentials(true)
                    .maxAge(3600L);
        } else {
            registry.addMapping("/api/**")
                    .allowedOrigins("http://localhost:5173")  // Vite development server
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .exposedHeaders("Authorization")
                    .allowCredentials(true)
                    .maxAge(3600L);
        }
    }
}
