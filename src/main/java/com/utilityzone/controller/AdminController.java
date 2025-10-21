package com.utilityzone.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ROLE_ADMIN')")
public class AdminController {

    @GetMapping("/debug/export-db")
    public void exportDb(HttpServletResponse response) throws SQLException, IOException {
        Path tempDir = Files.createTempDirectory("db_export");
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        Path backupFile = tempDir.resolve("utilitydb_backup_" + timestamp + ".sql");
        
        try {
            // Create SQL backup
            try (Connection conn = DriverManager.getConnection("jdbc:h2:file:./data/utilitydb", "sa", "");
                 Statement st = conn.createStatement()) {
                st.execute("SCRIPT DROP TO '" + backupFile.toString() + "' CHARSET 'UTF-8'");
            }
            
            // Set response headers
            response.setContentType("text/plain");
            response.setHeader("Content-Disposition", 
                             "attachment; filename=utilitydb_backup_" + timestamp + ".sql");
            
            // Copy file to response
            Files.copy(backupFile, response.getOutputStream());
            
        } finally {
            // Clean up temporary files
            Files.deleteIfExists(backupFile);
            Files.deleteIfExists(tempDir);
        }
    }
}