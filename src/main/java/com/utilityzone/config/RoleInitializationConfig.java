package com.utilityzone.config;

import com.utilityzone.model.Role;
import com.utilityzone.model.RoleType;
import com.utilityzone.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.annotation.Transactional;

@Configuration
public class RoleInitializationConfig {
    private static final Logger logger = LoggerFactory.getLogger(RoleInitializationConfig.class);

    @Bean
    @Order(1) // Ensure this runs early in the application startup
    CommandLineRunner initRoles(@Autowired RoleRepository roleRepository) {
        return args -> {
            logger.info("Initializing roles...");
            initializeRole(roleRepository, RoleType.ROLE_USER);
            initializeRole(roleRepository, RoleType.ROLE_ADMIN);
            logger.info("Roles initialization completed.");
        };
    }

    @Transactional
    private void initializeRole(RoleRepository roleRepository, RoleType roleType) {
        if (!roleRepository.existsByName(roleType)) {
            logger.info("Creating role: {}", roleType);
            Role role = new Role();
            role.setName(roleType);
            roleRepository.save(role);
            logger.info("Role created successfully: {}", roleType);
        } else {
            logger.debug("Role already exists: {}", roleType);
        }
    }
}