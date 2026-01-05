package com.utilityzone.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import java.net.MalformedURLException;
import java.io.File;
import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;

@RestController
public class MockupTemplateController {
    private static final Logger logger = LoggerFactory.getLogger(MockupTemplateController.class);

    @Value("${mockup.master.dir:data/uploads/mockup/master}")
    private String masterDirConfig;

    @GetMapping("/api/master-mockups/{filename}")
    public ResponseEntity<Resource> getMasterMockup(@PathVariable("filename") String filename) {
        logger.info("getMasterMockup called with filename: {}", filename);
        logger.info("masterDirConfig: {}", masterDirConfig);
        try {
            Path file = Paths.get(masterDirConfig).resolve(filename).normalize();
            logger.info("[DEBUG] Looking for file: {} Exists: {}", file.toAbsolutePath(), Files.exists(file));
            Resource resource = new UrlResource(file.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                logger.warn("File not found or unreadable: {}", file.toAbsolutePath());
                return ResponseEntity.notFound().build();
            }
            String contentType = Files.probeContentType(file);
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            logger.error("MalformedURLException for file: {}", filename, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Exception in getMasterMockup for file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @RequestMapping(value = "/api/master-mockups", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, List<String>>> listMasterMockups() {
        File baseDir = new File(masterDirConfig);
        Map<String, List<String>> result = new HashMap<>();
        result.put("primary", new ArrayList<>());
        result.put("mobile", new ArrayList<>());
        if (baseDir.exists() && baseDir.isDirectory()) {
            for (File file : Objects.requireNonNull(baseDir.listFiles())) {
                if (file.isFile()) {
                    String name = file.getName().toLowerCase();
                    if (name.contains("mobile")) {
                        result.get("mobile").add(file.getName());
                    } else {
                        result.get("primary").add(file.getName());
                    }
                }
            }
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/api/mockup-upload/master", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadMasterMockup(@RequestParam("file") MultipartFile file, @RequestParam(value = "mockupType", required = false) String mockupType) {
        try {
            String original = file.getOriginalFilename();
            String cleaned = StringUtils.cleanPath(original != null ? original : "mockup");
            Path dir = Paths.get("data/uploads/mockup/master");
            if (!Files.exists(dir)) Files.createDirectories(dir);
            // Save with original cleaned name only
            Path target = dir.resolve(cleaned);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok("Uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload: " + e.getMessage());
        }
    }
}
