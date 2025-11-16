package com.utilityzone.controller;

import com.utilityzone.service.CanvaTemplateService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;

@RestController
@RequestMapping("/api/branding")
public class BrandingController {

    private final CanvaTemplateService service;

    public BrandingController(CanvaTemplateService service) {
        this.service = service;
    }

    @PostMapping(path = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadLogo(@RequestPart("file") @NonNull MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }

        String ct = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        String originalName = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();

        String ext;
        if (ct.contains("png") || originalName.endsWith(".png")) {
            ext = ".png";
        } else if (ct.contains("jpeg") || ct.contains("jpg") || originalName.endsWith(".jpg") || originalName.endsWith(".jpeg")) {
            ext = ".jpg"; // normalize jpeg to .jpg
        } else {
            return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                    .body(Map.of("error", "Only PNG or JPG images are allowed"));
        }

        // Optional size guard (5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("error", "Max file size is 5MB"));
        }

        Path dir = service.getBrandingDir();
        Path target = dir.resolve("shop-logo" + ext);

        // Write to a temp file then move atomically
        Path temp = Files.createTempFile(dir, "logo-", ".tmp");
        try {
            file.transferTo(temp.toFile());
            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } finally {
            try { Files.deleteIfExists(temp); } catch (IOException ignored) {}
        }

        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "path", target.toString()
        ));
    }

    @GetMapping("/logo/status")
    public ResponseEntity<?> logoStatus() throws IOException {
        Path p = service.getBrandingLogoFileIfExists();
        boolean present = p != null && Files.exists(p);
        return ResponseEntity.ok(Map.of(
                "present", present,
                "path", present ? p.toString() : null
        ));
    }
}
