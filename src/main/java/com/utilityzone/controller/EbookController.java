package com.utilityzone.controller;

import com.utilityzone.payload.dto.EbookContentDto;
import com.utilityzone.payload.request.NewsletterSubscribeRequest;
import com.utilityzone.payload.request.NewsletterSendRequest;
import com.utilityzone.model.NewsletterSubscriber;
import com.utilityzone.repository.NewsletterSubscriberRepository;
import com.utilityzone.service.EbookContentService;
import com.utilityzone.service.NewsletterEmailService;
import com.utilityzone.service.NewsletterTokenService;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
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
    private final NewsletterEmailService emailService;
    private final NewsletterTokenService tokenService;
    private final CacheManager cacheManager;
    private final com.utilityzone.repository.EbookCoverRepository coverRepository;
    private static final Logger log = LoggerFactory.getLogger(EbookController.class);

    @Value("${file.upload.dir:}")
    private String uploadDir; // no longer used (covers go to DB)

    @GetMapping("/api/ebooks")
    public ResponseEntity<EbookContentDto> getContent() {
        Cache cache = cacheManager.getCache("ebooks");
        if (cache != null) {
            Object cached = cache.get("content");
            if (cached != null) {
                log.info("Cache HIT: ebooks[content]");
            } else {
                log.info("Cache MISS: ebooks[content]");
            }
        }
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
    // normalize to lower-case to avoid case-variant duplicates across databases
    email = email.toLowerCase(java.util.Locale.ROOT);

        // simple email sanity check
        if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid email format"));
        }

        // idempotent: if already subscribed, ensure active; else create
        boolean shouldSendWelcome = false;
        String status = "";
        var existing = subscriberRepository.findByEmailIgnoreCase(email);
        if (existing.isPresent()) {
            NewsletterSubscriber sub = existing.get();
            if (!sub.isActive()) {
                sub.setActive(true);
                sub.setUnsubscribedAt(null);
                subscriberRepository.save(sub);
                shouldSendWelcome = true; // reactivated
                status = "reactivated";
            } else {
                status = "already-subscribed";
            }
        } else {
            NewsletterSubscriber sub = new NewsletterSubscriber();
            sub.setEmail(email);
            subscriberRepository.save(sub);
            shouldSendWelcome = true; // new signup
            status = "subscribed";
        }
        if (shouldSendWelcome) {
            String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
            log.info("Scheduling welcome email for subscriber={} baseUri={}", email, baseUri);
            emailService.sendWelcomeAsync(email, baseUri);
        } else {
            log.info("Subscription received for existing active subscriber={}, welcome email not sent (idempotent)", email);
        }
        String message = switch (status) {
            case "reactivated" -> "Welcome back! Your subscription has been reactivated.";
            case "already-subscribed" -> "You are already subscribed.";
            default -> "Thank you for subscribing!";
        };
        return ResponseEntity.ok(Map.of(
                "success", true,
                "status", status,
                "message", message
        ));
    }

    @GetMapping("/api/ebooks/newsletter/unsubscribe")
    public ResponseEntity<String> unsubscribe(@RequestParam("token") String token) {
        try {
            String email = tokenService.parseEmailFromToken(token);
            var existing = subscriberRepository.findByEmailIgnoreCase(email);
            if (existing.isPresent()) {
                NewsletterSubscriber sub = existing.get();
                sub.setActive(false);
                sub.setUnsubscribedAt(java.time.LocalDateTime.now());
                subscriberRepository.save(sub);
            }
            return ResponseEntity.ok("You have been unsubscribed.");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body("Invalid or expired token.");
        }
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
        String mime = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

    // Store in DB
    com.utilityzone.model.EbookCoverEntity entity = new com.utilityzone.model.EbookCoverEntity();
        entity.setOriginalFilename(original);
        entity.setMimeType(mime);
        entity.setData(file.getBytes());
        var saved = coverRepository.save(entity);

        String publicUrl = "/api/ebooks/covers/" + saved.getId();
        return ResponseEntity.ok(Map.of("url", publicUrl));
    }

    @GetMapping("/api/ebooks/covers/{id}")
    public ResponseEntity<byte[]> getCover(@PathVariable("id") Long id) {
        var opt = coverRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        var entity = opt.get();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(entity.getMimeType() != null ? entity.getMimeType() : MediaType.APPLICATION_OCTET_STREAM_VALUE))
                .header("Cache-Control", "public, max-age=86400")
                .body(entity.getData());
    }

    @PostMapping("/api/admin/ebooks/newsletter/send")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> sendNewsletter(@RequestBody NewsletterSendRequest req) {
        if (req == null || !StringUtils.hasText(req.getSubject()) || !StringUtils.hasText(req.getHtmlBody())) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Subject and htmlBody are required"));
        }
        var activeSubs = subscriberRepository.findAllByActiveTrue();
        var emails = activeSubs.stream().map(NewsletterSubscriber::getEmail).toList();
        // Build base URI from current request context to generate unsubscribe links
        String baseUri = ServletUriComponentsBuilder.fromCurrentContextPath().build().toUriString();
        // fire-and-forget async send to avoid long request times
        emailService.sendToAllAsync(emails, req.getSubject().trim(), req.getHtmlBody(), baseUri);
        return ResponseEntity.accepted().body(Map.of("success", true, "recipients", emails.size()));
    }

    private EbookContentDto defaultContent() {
        EbookContentDto dto = new EbookContentDto();
        dto.setHeaderTitle("Bharat Prasad | Author");
        dto.setAbout("");
        dto.setNewsletterEndpoint("/api/ebooks/newsletter/subscribe");
        return dto;
    }
}
