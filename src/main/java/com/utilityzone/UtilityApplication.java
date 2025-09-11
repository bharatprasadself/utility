package com.utilityzone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication(scanBasePackages = "com.utilityzone")
@EnableJpaRepositories(basePackages = "com.utilityzone.repository")
@EntityScan(basePackages = "com.utilityzone.model")
@EnableTransactionManagement
public class UtilityApplication {

    public static void main(String[] args) {
        SpringApplication.run(UtilityApplication.class, args);
    }
}
