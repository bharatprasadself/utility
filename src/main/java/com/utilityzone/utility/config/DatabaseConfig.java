package com.utilityzone.utility.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;

/**
 * Configuration class for database selection.
 * This allows runtime switching between PostgreSQL and H2 file-based database
 * using a simple property setting.
 */
@Configuration
@Profile("!test") // Do not activate this config in test profile
public class DatabaseConfig {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${utility.database.type:postgresql}")
    private String databaseType;
    
    @Value("${spring.datasource.url:}")
    private String datasourceUrl;
    
    @Value("${spring.datasource.username:}")
    private String datasourceUsername;
    
    @Value("${spring.datasource.password:}")
    private String datasourcePassword;
    
    @Value("${spring.datasource.driver-class-name:}")
    private String driverClassName;
    
    @Value("${h2.datasource.url:jdbc:h2:file:./data/utilitydb;AUTO_SERVER=TRUE}")
    private String h2Url;
    
    @Value("${h2.datasource.username:sa}")
    private String h2Username;
    
    @Value("${h2.datasource.password:}")
    private String h2Password;

    private final Environment env;
    
    public DatabaseConfig(Environment env) {
        this.env = env;
        logger.info("DatabaseConfig created with profiles: {}", 
                String.join(", ", env.getActiveProfiles()));
    }

    /**
     * Creates the appropriate DataSource based on configuration.
     * This will check utility.database.type and create either an H2 or PostgreSQL DataSource.
     * 
     * @return Configured DataSource for the application
     */
    @Bean
    @Primary
    public DataSource dataSource() {
        // Don't override Spring Boot's auto-configuration during tests
        if (isTestEnvironment()) {
            logger.info("Test environment detected, using auto-configured DataSource");
            return createDefaultDataSource();
        }
        
        // Check if we're using H2 or PostgreSQL
        if ("h2".equalsIgnoreCase(databaseType)) {
            return createH2DataSource();
        } else {
            return createPostgresDataSource();
        }
    }
    
    private boolean isTestEnvironment() {
        // Log active profiles for debugging
        logger.info("Active profiles: {}", String.join(", ", env.getActiveProfiles()));
        
        for (String profile : env.getActiveProfiles()) {
            if (profile.contains("test")) {
                logger.info("Test profile detected: {}", profile);
                return true;
            }
        }
        
        boolean isTestContext = env.containsProperty("spring.test.context.cache");
        if (isTestContext) {
            logger.info("Test context detected via spring.test.context.cache property");
        }
        
        return isTestContext;
    }
    
    private DataSource createDefaultDataSource() {
        // This will use whatever configuration is provided by Spring Boot
        return DataSourceBuilder.create()
                .url(datasourceUrl)
                .username(datasourceUsername)
                .password(datasourcePassword)
                .driverClassName(driverClassName != null && !driverClassName.isEmpty() 
                        ? driverClassName : "org.h2.Driver")
                .build();
    }
    
    private DataSource createH2DataSource() {
        logger.info("Configuring H2 file-based database");
        logger.info("H2 URL: {}", h2Url);
        logger.info("H2 Username: {}", h2Username);
        logger.info("H2 Driver: org.h2.Driver");
        
        try {
            // Create the data directory if it doesn't exist
            if (h2Url.contains("jdbc:h2:file:./data/")) {
                java.io.File dataDir = new java.io.File("./data");
                if (!dataDir.exists()) {
                    logger.info("Creating data directory: {}", dataDir.getAbsolutePath());
                    dataDir.mkdirs();
                }
            }
            
            DataSource ds = DataSourceBuilder.create()
                    .url(h2Url)
                    .username(h2Username)
                    .password(h2Password)
                    .driverClassName("org.h2.Driver")
                    .build();
            
            // Validate connection immediately to catch any issues
            try (java.sql.Connection conn = ds.getConnection()) {
                logger.info("Successfully connected to H2 database");
            }
            
            return ds;
        } catch (Exception e) {
            logger.error("Error creating H2 DataSource: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create H2 DataSource: " + e.getMessage(), e);
        }
    }
    
    private DataSource createPostgresDataSource() {
        logger.info("Configuring PostgreSQL database");
        logger.info("PostgreSQL URL: {}", datasourceUrl);
        logger.info("PostgreSQL Username: {}", datasourceUsername);
        logger.info("PostgreSQL Driver: {}", driverClassName);
        return DataSourceBuilder.create()
                .url(datasourceUrl)
                .username(datasourceUsername)
                .password(datasourcePassword)
                .driverClassName(driverClassName)
                .build();
    }
}