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
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
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
    public ResponseEntity<StreamingResponseBody> getMasterMockup(@PathVariable("filename") String filename) {
        if (filename == null || filename.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        logger.info("getMasterMockup called with filename: {}", filename);
        logger.info("masterDirConfig: {}", masterDirConfig);
        try {
            // First try in the root
            Path base = Paths.get(masterDirConfig);
            Path file = base.resolve(filename).normalize();
            if (!Files.exists(file) || !Files.isRegularFile(file)) {
                // Fallback: search in immediate subdirectories (style folders)
                File baseDir = base.toFile();
                File[] children = baseDir.listFiles();
                if (children != null) {
                    for (File child : children) {
                        if (child.isDirectory()) {
                            Path candidate = child.toPath().resolve(filename).normalize();
                            if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                                String contentType = Files.probeContentType(candidate);
                                StreamingResponseBody srb = os -> {
                                    Files.copy(candidate, os);
                                };
                                return ResponseEntity.ok()
                                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                                    .body(srb);
                            }
                        }
                    }
                }
                logger.warn("File not found across styles: {}", filename);
                return ResponseEntity.notFound().build();
            }
            String contentType = Files.probeContentType(file);
            StreamingResponseBody srb = os -> {
                Files.copy(file, os);
            };
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(srb);
        } catch (MalformedURLException e) {
            logger.error("MalformedURLException for file: {}", filename, e);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Exception in getMasterMockup for file: {}", filename, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/api/master-mockups/{style}/{filename}")
    public ResponseEntity<StreamingResponseBody> getMasterMockupByStyle(@PathVariable("style") String style, @PathVariable("filename") String filename) {
        if (filename == null || filename.isBlank()) {
            return ResponseEntity.notFound().build();
        }
        String normalized = normalizeStyle(style);
        try {
            Path file = Paths.get(masterDirConfig).resolve(normalized).resolve(filename).normalize();
            if (!Files.exists(file) || !Files.isRegularFile(file)) {
                return ResponseEntity.notFound().build();
            }
            String contentType = Files.probeContentType(file);
            StreamingResponseBody srb = os -> {
                Files.copy(file, os);
            };
            return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType != null ? contentType : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(srb);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @RequestMapping(value = "/api/master-mockups", method = RequestMethod.GET, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, List<String>>> listMasterMockups(@RequestParam(value = "style", required = false) String style) {
        File baseDir = new File(masterDirConfig);
        Map<String, List<String>> result = new HashMap<>();
        result.put("primary", new ArrayList<>());
        result.put("mobile", new ArrayList<>());

        if (!baseDir.exists() || !baseDir.isDirectory()) {
            return ResponseEntity.ok(result);
        }

        // If style specified, only scan that subfolder; else scan root + all style folders
        if (style != null && !style.isBlank()) {
            String normalized = normalizeStyle(style);
            File styleDir = new File(baseDir, normalized);
            if (styleDir.exists() && styleDir.isDirectory()) {
                File[] files = styleDir.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile()) {
                            String name = f.getName().toLowerCase();
                            if (name.contains("mobile")) {
                                result.get("mobile").add(f.getName());
                            } else {
                                result.get("primary").add(f.getName());
                            }
                        }
                    }
                }
            }
        } else {
            File[] children = baseDir.listFiles();
            if (children != null) {
                for (File child : children) {
                    if (child.isFile()) {
                        String name = child.getName().toLowerCase();
                        if (name.contains("mobile")) {
                            result.get("mobile").add(child.getName());
                        } else {
                            result.get("primary").add(child.getName());
                        }
                    } else if (child.isDirectory()) {
                        File[] inner = child.listFiles();
                        if (inner != null) {
                            for (File f : inner) {
                                if (f.isFile()) {
                                    String name = f.getName().toLowerCase();
                                    if (name.contains("mobile")) {
                                        result.get("mobile").add(f.getName());
                                    } else {
                                        result.get("primary").add(f.getName());
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping(value = "/api/mockup-upload/master", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> uploadMasterMockup(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mockupType", required = false) String mockupType,
            @RequestParam(value = "style", required = false) String style) {
        try {
            String original = file.getOriginalFilename();
            String cleaned = StringUtils.cleanPath(original != null ? original : "mockup");
            String normalizedStyle = normalizeStyle(style);
            Path base = Paths.get(masterDirConfig);
            Path dir = base.resolve(normalizedStyle);
            if (!Files.exists(dir)) Files.createDirectories(dir);
            Path target = dir.resolve(cleaned);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok("Uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to upload: " + e.getMessage());
        }
    }

    private String normalizeStyle(String style) {
        if (style == null) return "wedding";
        String s = style.trim().toLowerCase();
        switch (s) {
            case "birthday": return "birthday";
            case "anniversary": return "anniversary";
            case "wedding":
            default: return "wedding";
        }
    }
}
