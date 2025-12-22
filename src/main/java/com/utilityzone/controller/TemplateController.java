package com.utilityzone.controller;

import com.utilityzone.model.Template;
import com.utilityzone.service.TemplateService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import javax.imageio.ImageIO;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
public class TemplateController {
    private final TemplateService service;

    public TemplateController(TemplateService service) {
        this.service = service;
    }

    @GetMapping("/api/admin/canva-templates")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<Template> list() {
        return service.list();
    }

    // Public listing for shop (only published templates)
    @GetMapping("/api/canva-templates")
    public List<Map<String, Object>> publicList() {
        return service.list().stream()
            .filter(t -> "published".equalsIgnoreCase(t.getStatus()))
            .map(t -> {
                java.util.Map<String, Object> m = new java.util.LinkedHashMap<>();
                m.put("id", t.getId());
                // Build storefront title: use custom wording if present, always append friendly PDF type suffix
                String baseTitle = (t.getPublicDescription() != null && !t.getPublicDescription().isBlank())
                    ? t.getPublicDescription().trim()
                    : "NextStepLabs digital invite";

                // Derive type label from preferred buyerPdfType or heuristics
                String typeRaw = t.getBuyerPdfType();
                String typeLabel;
                if (typeRaw != null) {
                    // Normalize common client values like 'invite_suite' -> 'INVITE_SUITE'
                    String norm = typeRaw.trim().toUpperCase().replace('-', '_');
                    switch (norm) {
                        case "INVITE_SUITE": typeLabel = "Invite Suite"; break;
                        case "PRINT_MOBILE": typeLabel = "Mobile + Print"; break;
                        case "PRINT_ONLY": typeLabel = "Only Print"; break;
                        default: typeLabel = "Mobile + Print"; break; // default aligns with Buyer PDF common type
                    }
                } else {
                    boolean hasRsvp = t.getRsvpCanvaUseCopyUrl() != null && t.getRsvpCanvaUseCopyUrl().startsWith("http");
                    boolean hasDetail = t.getDetailCardCanvaUseCopyUrl() != null && t.getDetailCardCanvaUseCopyUrl().startsWith("http");
                    boolean hasPrint = t.getCanvaUseCopyUrl() != null && t.getCanvaUseCopyUrl().startsWith("http");
                    boolean hasMobile = t.getMobileCanvaUseCopyUrl() != null && t.getMobileCanvaUseCopyUrl().startsWith("http");
                    if (hasRsvp || hasDetail) typeLabel = "Invite Suit";
                    else if (hasPrint && hasMobile) typeLabel = "Mobile + Print";
                    else if (hasPrint && !hasMobile) typeLabel = "Only Print";
                    else typeLabel = "Mobile + Print"; // fallback
                }

                String desc = baseTitle + " (" + typeLabel + ")";
                m.put("title", desc);
                m.put("mockupUrl", t.getMockupUrl());
                m.put("etsyListingUrl", t.getEtsyListingUrl());
                return m;
            }).collect(Collectors.toList());
    }

    @PostMapping("/api/admin/canva-templates")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Template create(@RequestBody Template req) {
        Template ct = new Template();
        ct.setTitle(StringUtils.trimWhitespace(req.getTitle()));
    ct.setCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getCanvaUseCopyUrl()));
    ct.setMobileCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getMobileCanvaUseCopyUrl()));
        ct.setMockupUrl(StringUtils.trimWhitespace(req.getMockupUrl()));
        ct.setEtsyListingUrl(StringUtils.trimWhitespace(req.getEtsyListingUrl()));
        ct.setSecondaryMockupUrl(StringUtils.trimWhitespace(req.getSecondaryMockupUrl()));
        ct.setMobileMockupUrl(StringUtils.trimWhitespace(req.getMobileMockupUrl()));
        ct.setRsvpCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getRsvpCanvaUseCopyUrl()));
        ct.setDetailCardCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getDetailCardCanvaUseCopyUrl()));
        ct.setPublicDescription(StringUtils.trimWhitespace(req.getPublicDescription()));
        // Persist preferred buyer PDF type if provided
        if (req.getBuyerPdfType() != null) {
            ct.setBuyerPdfType(StringUtils.trimWhitespace(req.getBuyerPdfType()));
        }
        return service.create(ct);
    }

    @GetMapping("/api/admin/canva-templates/next-title")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Map<String, String> nextTitle() {
        return Map.of("title", service.getNextDefaultTitle());
    }

    @PutMapping("/api/admin/canva-templates/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Template update(@PathVariable("id") Long id, @RequestBody Template req) {
        Template changes = new Template();
        changes.setTitle(StringUtils.trimWhitespace(req.getTitle()));
    changes.setCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getCanvaUseCopyUrl()));
    changes.setMobileCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getMobileCanvaUseCopyUrl()));
        changes.setMockupUrl(StringUtils.trimWhitespace(req.getMockupUrl()));
        changes.setEtsyListingUrl(StringUtils.trimWhitespace(req.getEtsyListingUrl()));
        changes.setSecondaryMockupUrl(StringUtils.trimWhitespace(req.getSecondaryMockupUrl()));
        changes.setMobileMockupUrl(StringUtils.trimWhitespace(req.getMobileMockupUrl()));
        changes.setRsvpCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getRsvpCanvaUseCopyUrl()));
        changes.setDetailCardCanvaUseCopyUrl(StringUtils.trimWhitespace(req.getDetailCardCanvaUseCopyUrl()));
        changes.setPublicDescription(StringUtils.trimWhitespace(req.getPublicDescription()));
        // do not touch buyerPdfUrl unless provided explicitly
        if (req.getBuyerPdfUrl() != null) changes.setBuyerPdfUrl(StringUtils.trimWhitespace(req.getBuyerPdfUrl()));
        // allow updating persisted preferred buyer PDF type
        if (req.getBuyerPdfType() != null) changes.setBuyerPdfType(StringUtils.trimWhitespace(req.getBuyerPdfType()));
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
        if (!Files.exists(path)) {
            // Generate and return a lightweight placeholder instead of 404
            byte[] png = generatePlaceholder("Image unavailable", 1200, 800);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header("Cache-Control", "public, max-age=300")
                    .body(png);
        }
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

    private byte[] generatePlaceholder(String text, int width, int height) throws IOException {
        BufferedImage img = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setColor(new Color(245, 246, 248));
            g.fillRect(0, 0, width, height);
            g.setColor(new Color(200, 205, 210));
            g.drawRect(0, 0, width - 1, height - 1);
            g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
            g.setColor(new Color(120, 126, 134));
            g.setFont(new Font("Helvetica", Font.PLAIN, 28));
            String msg = text == null || text.isBlank() ? "Image unavailable" : text;
            int tw = g.getFontMetrics().stringWidth(msg);
            int th = g.getFontMetrics().getAscent();
            g.drawString(msg, (width - tw) / 2, (height + th) / 2 - 10);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }

    @PostMapping("/api/admin/canva-templates/generate-buyer-pdf")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> generateBuyerPdf(
            @RequestParam("templateId") Long templateId,
            @RequestParam(value = "pdfType") String pdfType
    ) throws IOException {
        Template updated = service.generateBuyerPdf(templateId, pdfType);
        // Echo back canonical type value for client display
        return ResponseEntity.ok(Map.of("success", true, "buyerPdfUrl", updated.getBuyerPdfUrl(), "pdfType", pdfType));
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
                                .header("Cache-Control", "no-cache, must-revalidate")
                                .header("Pragma", "no-cache")
                                .header("Expires", "0")
                                .eTag(eTag)
                                .build();
                        }
                        byte[] bytes = Files.readAllBytes(path);
                        return ResponseEntity.ok()
                            .contentType(MediaType.APPLICATION_PDF)
                            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=buyer-template-" + id + ".pdf")
                            .header("Cache-Control", "no-cache, must-revalidate")
                            .header("Pragma", "no-cache")
                            .header("Expires", "0")
                                .eTag(eTag)
                                .body(bytes);
                    } catch (IOException e) {
                        return ResponseEntity.internalServerError().build();
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Publish endpoint
    @PostMapping("/api/admin/canva-templates/{id}/publish")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Template publish(@PathVariable("id") Long id) {
        return service.publish(id);
    }

    // Diagnostic endpoint: resolved buyer PDF path and existence
    @GetMapping("/api/admin/canva-templates/diagnose/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Map<String, Object>> diagnose(@PathVariable("id") Long id) throws IOException {
        java.util.Optional<Template> opt = service.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Template t = opt.get();
        Path pdfPath = service.getPdfPathFor(t);
        boolean exists = Files.exists(pdfPath);
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("id", t.getId());
        body.put("title", t.getTitle());
        body.put("pdfPath", pdfPath.toAbsolutePath().toString());
        body.put("exists", exists);
        return ResponseEntity.ok(body);
    }
}