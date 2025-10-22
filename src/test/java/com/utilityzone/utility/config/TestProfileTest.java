package com.utilityzone.utility.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test to verify that our test profile is being applied correctly
 */
@SpringBootTest
@ActiveProfiles("test")
public class TestProfileTest {

    @Autowired
    private Environment environment;
    
    @Value("${utility.database.type:unknown}")
    private String databaseType;
    
    @Value("${spring.datasource.url:unknown}")
    private String datasourceUrl;
    
    @Autowired(required = false)
    private DatabaseConfig databaseConfig;

    @Test
    void testProfileIsActive() {
        boolean testProfileActive = false;
        for (String profile : environment.getActiveProfiles()) {
            System.out.println("Active profile: " + profile);
            if ("test".equals(profile)) {
                testProfileActive = true;
            }
        }
        
        assertTrue(testProfileActive, "Test profile should be active");
    }
    
    @Test
    void testDatabaseConfigShouldNotBePresent() {
        // In test profile, our custom DatabaseConfig should not be created
        assertEquals(null, databaseConfig, 
                "DatabaseConfig should not be present in test profile");
    }
    
    @Test
    void testDatabaseProperties() {
        System.out.println("Database type: " + databaseType);
        System.out.println("Datasource URL: " + datasourceUrl);
        
        assertEquals("h2", databaseType, "Database type should be h2 in test profile");
        assertTrue(datasourceUrl.contains("mem:testdb"), 
                "Datasource URL should be in-memory H2 in test profile");
    }
}