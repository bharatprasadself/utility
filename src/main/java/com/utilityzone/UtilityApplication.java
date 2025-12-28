package com.utilityzone;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.Bean;
import org.springframework.core.env.Environment;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication(scanBasePackages = "com.utilityzone")
@EnableJpaRepositories(basePackages = "com.utilityzone.repository")
@EntityScan(basePackages = "com.utilityzone.model")
@EnableTransactionManagement
public class UtilityApplication {
    private static final Logger logger = LoggerFactory.getLogger(UtilityApplication.class);

    public static void main(String[] args) {
        logger.info("=== UtilityApplication started: test log to verify file logging ===");
        SpringApplication.run(UtilityApplication.class, args);
    }
    
    @Bean
    public CommandLineRunner databaseInfoLogger(Environment env, 
            @Value("${utility.database.type:postgresql}") String dbType) {
        return args -> {
            String[] activeProfiles = env.getActiveProfiles();
            String profiles = String.join(", ", activeProfiles.length > 0 ? activeProfiles : new String[]{"default"});
            
            logger.info("----------------------------------------");
            logger.info("  Utility Application Started");
            logger.info("  Active profiles: {}", profiles);
            logger.info("  Database type: {}", dbType);
            logger.info("----------------------------------------");
        };
    }
}
