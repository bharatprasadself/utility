package com.utilityzone.config;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {
    // Rely on Spring Boot auto-configuration for Caffeine CacheManager.
    // Caffeine is on the classpath; configuration is supplied via properties.
}
