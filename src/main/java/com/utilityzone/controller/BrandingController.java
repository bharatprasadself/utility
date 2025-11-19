package com.utilityzone.controller;

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
//Command on windows cmd
//curl -L -X POST "https://api.utilityzone.in/api/branding/logo" ^
//  -F "file=@C:/Work/Personal/My System/Ebook/Shop/Etsy/Shop Icons/logo.png;type=image/png"
@RestController
@RequestMapping("/api/branding")
public class BrandingController {

    @PostMapping(path = "/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadLogo(@RequestPart("file") @NonNull MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }

        String ctRaw = file.getContentType();
        String ct = ctRaw != null ? ctRaw.toLowerCase() : "";
        String originalNameRaw = file.getOriginalFilename();
        String originalName = originalNameRaw != null ? originalNameRaw.toLowerCase() : "";

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

        // Use local branding directory
        Path dir = Path.of("uploads/branding");
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }
        Path target = dir.resolve("shop-logo" + ext);

        // Write to a temp file using InputStream to avoid servlet container path quirks,
        // then move atomically to the final destination.
        Path temp = Files.createTempFile(dir, "logo-", ".tmp");
        try (var in = file.getInputStream()) {
            Files.copy(in, temp, StandardCopyOption.REPLACE_EXISTING);
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
        Path p = Path.of("uploads/branding/shop-logo.png");
        boolean present = Files.exists(p);
        return ResponseEntity.ok(Map.of(
                "present", present,
                "path", present ? p.toString() : null
        ));
    }
}
