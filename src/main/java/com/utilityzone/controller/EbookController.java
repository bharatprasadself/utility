package com.utilityzone.controller;

import com.utilityzone.payload.dto.EbookContentDto;
import com.utilityzone.payload.request.NewsletterSubscribeRequest;
import com.utilityzone.model.NewsletterSubscriber;
import com.utilityzone.repository.NewsletterSubscriberRepository;
import com.utilityzone.service.EbookContentService;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class EbookController {

    private final EbookContentService service;
    private final NewsletterSubscriberRepository subscriberRepository;

    @Value("${file.upload.dir:./data/uploads}")
    private String uploadDir;

    @GetMapping("/api/ebooks")
    public ResponseEntity<EbookContentDto> getContent() {
        return service.getContent()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(defaultContent()));
    }

    @PostMapping("/api/ebooks/newsletter/subscribe")
    public ResponseEntity<Map<String, Object>> subscribe(@RequestBody NewsletterSubscribeRequest req) {
        String email = req != null ? req.getEmail() : null;
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Email is required"));
        }
        email = email.trim();

        // simple email sanity check
        if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid email format"));
        }

        // idempotent: if already subscribed, still return success
        if (!subscriberRepository.existsByEmailIgnoreCase(email)) {
            NewsletterSubscriber sub = new NewsletterSubscriber();
            sub.setEmail(email);
            subscriberRepository.save(sub);
        }
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/api/admin/ebooks")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<EbookContentDto> upsert(@RequestBody EbookContentDto dto) {
        return ResponseEntity.ok(service.upsert(dto));
    }

    @PostMapping(value = "/api/admin/ebooks/upload-cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> uploadCover(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }
    String orig = file.getOriginalFilename();
    String original = StringUtils.cleanPath(orig != null ? orig : "cover");
        String ext = "";
        int idx = original.lastIndexOf('.')
;        if (idx > 0) ext = original.substring(idx);
        String safeName = UUID.randomUUID() + ext;

        Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(dir);
        Path target = dir.resolve(safeName);
        Files.copy(file.getInputStream(), target);

        String publicUrl = "/uploads/" + safeName;
        return ResponseEntity.ok(Map.of("url", publicUrl));
    }

    private EbookContentDto defaultContent() {
        EbookContentDto dto = new EbookContentDto();
        dto.setHeaderTitle("Bharat Prasad | Author");
        dto.setAbout("");
        dto.setNewsletterEndpoint("/api/ebooks/newsletter/subscribe");
        return dto;
    }
}
