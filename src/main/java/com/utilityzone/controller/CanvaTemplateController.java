package com.utilityzone.controller;

import com.utilityzone.model.CanvaTemplate;
import com.utilityzone.service.CanvaTemplateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
public class CanvaTemplateController {
    private final CanvaTemplateService service;

    public CanvaTemplateController(CanvaTemplateService service) {
        this.service = service;
    }

    @GetMapping("/api/admin/canva-templates")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<CanvaTemplate> list() {
        return service.list();
    }

    // Public listing for shop (no sensitive fields like Canva use-copy URL)
    @GetMapping("/api/canva-templates")
    public List<Map<String, Object>> publicList() {
        return service.list().stream().map(t -> {
            java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", t.getId());
            m.put("title", t.getTitle());
            m.put("mockupUrl", t.getMockupUrl());
            m.put("etsyListingUrl", t.getEtsyListingUrl());
            return m;
        }).collect(Collectors.toList());
    }

    @PostMapping("/api/admin/canva-templates")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public CanvaTemplate create(@RequestBody CanvaTemplate req) {
        CanvaTemplate ct = new CanvaTemplate();
        ct.setTitle(StringUtils.trimWhitespace(req.getTitle()));
    ct.setCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getCanvaUseCopyUrl()));
    ct.setMobileCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getMobileCanvaUseCopyUrl()));
        ct.setMockupUrl(StringUtils.trimWhitespace(req.getMockupUrl()));
        ct.setEtsyListingUrl(StringUtils.trimWhitespace(req.getEtsyListingUrl()));
        ct.setSecondaryMockupUrl(StringUtils.trimWhitespace(req.getSecondaryMockupUrl()));
        ct.setMobileMockupUrl(StringUtils.trimWhitespace(req.getMobileMockupUrl()));
        return service.create(ct);
    }

    @PutMapping("/api/admin/canva-templates/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public CanvaTemplate update(@PathVariable("id") Long id, @RequestBody CanvaTemplate req) {
        CanvaTemplate changes = new CanvaTemplate();
        changes.setTitle(StringUtils.trimWhitespace(req.getTitle()));
    changes.setCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getCanvaUseCopyUrl()));
    changes.setMobileCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getMobileCanvaUseCopyUrl()));
        changes.setMockupUrl(StringUtils.trimWhitespace(req.getMockupUrl()));
        changes.setEtsyListingUrl(StringUtils.trimWhitespace(req.getEtsyListingUrl()));
        changes.setSecondaryMockupUrl(StringUtils.trimWhitespace(req.getSecondaryMockupUrl()));
        changes.setMobileMockupUrl(StringUtils.trimWhitespace(req.getMobileMockupUrl()));
        // do not touch buyerPdfUrl unless provided explicitly
        if (req.getBuyerPdfUrl() != null) changes.setBuyerPdfUrl(StringUtils.trimWhitespace(req.getBuyerPdfUrl()));
        return service.update(id, changes);
    }

    @DeleteMapping("/api/admin/canva-templates/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/api/admin/canva-templates/upload-mockup", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, String>> uploadMockup(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }
        String original = file.getOriginalFilename();
        String cleaned = StringUtils.cleanPath(original != null ? original : "mockup");
        String ext = cleaned.contains(".") ? cleaned.substring(cleaned.lastIndexOf('.')) : "";
        String storedName = UUID.randomUUID() + ext;
        Path target = service.getMockupDir().resolve(storedName);
    Files.copy(file.getInputStream(), target);
        String publicUrl = "/api/canva-templates/mockups/" + storedName;
        return ResponseEntity.ok(Map.of("url", publicUrl));
    }

    @GetMapping("/api/canva-templates/mockups/{file}")
    public ResponseEntity<?> getMockup(@PathVariable("file") String fileName,
                                            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) throws IOException {
        Path path = service.getMockupDir().resolve(fileName);
        if (!Files.exists(path)) return ResponseEntity.notFound().build();
        String eTag = "\"" + fileName + '-' + Files.size(path) + "\"";
        if (ifNoneMatch != null && ifNoneMatch.equals(eTag)) {
            return ResponseEntity.status(304)
                    .header("Cache-Control", "public, max-age=86400, immutable")
                    .eTag(eTag)
                    .build();
        }
        byte[] bytes = Files.readAllBytes(path);
        MediaType mt = service.detectMediaType(path);
        return ResponseEntity.ok()
                .contentType(mt)
                .header("Cache-Control", "public, max-age=86400, immutable")
                .eTag(eTag)
                .body(bytes);
    }

    @PostMapping("/api/admin/canva-templates/generate-buyer-pdf")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> generateBuyerPdf(@RequestParam("templateId") Long templateId) throws IOException {
        CanvaTemplate updated = service.generateBuyerPdf(templateId);
        return ResponseEntity.ok(Map.of("success", true, "buyerPdfUrl", updated.getBuyerPdfUrl()));
    }

    @GetMapping("/api/canva-templates/pdfs/{id}.pdf")
    public ResponseEntity<?> getTemplatePdf(
            @PathVariable("id") Long id,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch
    ) throws IOException {
        return service.findById(id)
                .map(t -> {
                    Path path = service.getPdfPathFor(t);
                    if (!Files.exists(path)) return ResponseEntity.notFound().build();
                    try {
                        String eTag = "\"buyer-" + id + '-' + Files.size(path) + '-' + Files.getLastModifiedTime(path).toMillis() + "\"";
                        if (ifNoneMatch != null && ifNoneMatch.equals(eTag)) {
                            return ResponseEntity.status(304)
                                    .header("Cache-Control", "public, max-age=86400, immutable")
                                    .eTag(eTag)
                                    .build();
                        }
                        byte[] bytes = Files.readAllBytes(path);
                        return ResponseEntity.ok()
                                .contentType(MediaType.APPLICATION_PDF)
                                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=buyer-" + id + ".pdf")
                                .header("Cache-Control", "public, max-age=86400, immutable")
                                .eTag(eTag)
                                .body(bytes);
                    } catch (IOException e) {
                        return ResponseEntity.internalServerError().build();
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
