package com.utilityzone.controller;

import com.utilityzone.model.Template;
import com.utilityzone.service.TemplateService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class TemplateController {
    private static final Logger logger = LoggerFactory.getLogger(TemplateController.class);
    private final TemplateService service;

    @Value("${mockup.master.dir:data/uploads/mockup/master}")
    private String masterDirConfig;

    public TemplateController(TemplateService service) {
        this.service = service;
    }

    @GetMapping("/api/admin/canva-templates")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<Template> list() {
        // Default to first page, size 100 for admin listing
        return service.list(0, 100);
    }

    // Public listing for shop (only published templates)
    @GetMapping("/api/canva-templates")
    public List<Map<String, Object>> publicList() {
        // Default to first page, size 100 for public listing
        return service.list(0, 100).stream()
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
                    boolean hasThanks = t.getThankYouCardCanvaUseCopyUrl() != null && t.getThankYouCardCanvaUseCopyUrl().startsWith("http");
                    boolean hasPrint = t.getCanvaUseCopyUrl() != null && t.getCanvaUseCopyUrl().startsWith("http");
                    boolean hasMobile = t.getMobileCanvaUseCopyUrl() != null && t.getMobileCanvaUseCopyUrl().startsWith("http");
                    if (hasRsvp || hasDetail || hasThanks) typeLabel = "Invite Suite";
                    else if (hasPrint && hasMobile) typeLabel = "Mobile + Print";
                    else if (hasPrint && !hasMobile) typeLabel = "Only Print";
                    else typeLabel = "Mobile + Print"; // fallback
                }

                String desc = baseTitle + " (" + typeLabel + ")";
                m.put("title", desc);
                m.put("mockupUrl", t.getMockupUrl());
                m.put("secondaryMockupUrl", t.getSecondaryMockupUrl());
                m.put("mobileMockupUrl", t.getMobileMockupUrl());
                m.put("etsyListingUrl", t.getEtsyListingUrl());
                return m;
            }).collect(Collectors.toList());
    }

    @PostMapping("/api/admin/canva-templates")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Template create(@RequestBody Template req) {
        Template ct = new Template();
        ct.setTitle(req.getTitle() == null ? null : req.getTitle().trim());
        ct.setCanvaUseCopyUrl(req.getCanvaUseCopyUrl() == null ? null : req.getCanvaUseCopyUrl().trim());
        ct.setMobileCanvaUseCopyUrl(req.getMobileCanvaUseCopyUrl() == null ? null : req.getMobileCanvaUseCopyUrl().trim());
        ct.setMockupUrl(req.getMockupUrl() == null ? null : req.getMockupUrl().trim());
        ct.setEtsyListingUrl(req.getEtsyListingUrl() == null ? null : req.getEtsyListingUrl().trim());
        ct.setSecondaryMockupUrl(req.getSecondaryMockupUrl() == null ? null : req.getSecondaryMockupUrl().trim());
        ct.setMobileMockupUrl(req.getMobileMockupUrl() == null ? null : req.getMobileMockupUrl().trim());
        ct.setRsvpCanvaUseCopyUrl(req.getRsvpCanvaUseCopyUrl() == null ? null : req.getRsvpCanvaUseCopyUrl().trim());
        ct.setDetailCardCanvaUseCopyUrl(req.getDetailCardCanvaUseCopyUrl() == null ? null : req.getDetailCardCanvaUseCopyUrl().trim());
        ct.setThankYouCardCanvaUseCopyUrl(req.getThankYouCardCanvaUseCopyUrl() == null ? null : req.getThankYouCardCanvaUseCopyUrl().trim());
        ct.setPublicDescription(req.getPublicDescription() == null ? null : req.getPublicDescription().trim());
        // Persist preferred buyer PDF type if provided
        if (req.getBuyerPdfType() != null) {
            ct.setBuyerPdfType(req.getBuyerPdfType().trim());
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
        changes.setTitle(req.getTitle() == null ? null : req.getTitle().trim());
        changes.setCanvaUseCopyUrl(req.getCanvaUseCopyUrl() == null ? null : req.getCanvaUseCopyUrl().trim());
        changes.setMobileCanvaUseCopyUrl(req.getMobileCanvaUseCopyUrl() == null ? null : req.getMobileCanvaUseCopyUrl().trim());
        changes.setMockupUrl(req.getMockupUrl() == null ? null : req.getMockupUrl().trim());
        changes.setEtsyListingUrl(req.getEtsyListingUrl() == null ? null : req.getEtsyListingUrl().trim());
        changes.setSecondaryMockupUrl(req.getSecondaryMockupUrl() == null ? null : req.getSecondaryMockupUrl().trim());
        changes.setMobileMockupUrl(req.getMobileMockupUrl() == null ? null : req.getMobileMockupUrl().trim());
        changes.setRsvpCanvaUseCopyUrl(req.getRsvpCanvaUseCopyUrl() == null ? null : req.getRsvpCanvaUseCopyUrl().trim());
        changes.setDetailCardCanvaUseCopyUrl(req.getDetailCardCanvaUseCopyUrl() == null ? null : req.getDetailCardCanvaUseCopyUrl().trim());
        changes.setThankYouCardCanvaUseCopyUrl(req.getThankYouCardCanvaUseCopyUrl() == null ? null : req.getThankYouCardCanvaUseCopyUrl().trim());
        changes.setPublicDescription(req.getPublicDescription() == null ? null : req.getPublicDescription().trim());
        // do not touch buyerPdfUrl unless provided explicitly
        if (req.getBuyerPdfUrl() != null) changes.setBuyerPdfUrl(req.getBuyerPdfUrl().trim());
        // allow updating persisted preferred buyer PDF type
        if (req.getBuyerPdfType() != null) changes.setBuyerPdfType(req.getBuyerPdfType().trim());
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
    public ResponseEntity<Map<String, String>> uploadMockup(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "baseName", required = false) String baseName,
            @RequestParam(value = "role", required = false) String role,
            @RequestParam(value = "variant", required = false) String variant,
            @RequestParam(value = "index", required = false) String index
    ) throws IOException {
        logger.info("Upload mockup called. File name: {}, size: {} bytes", file.getOriginalFilename(), file.getSize());
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }

        // Defaults per convention
        String original = file.getOriginalFilename();
        String cleanedOriginal = StringUtils.cleanPath(original != null ? original : "mockup");
        String ext = cleanedOriginal.contains(".") ? cleanedOriginal.substring(cleanedOriginal.lastIndexOf('.')) : "";

        String safeBase;
        if (baseName != null && !baseName.isBlank()) {
            safeBase = sanitizeForFile(baseName);
        } else {
            // Try to derive base name from master mockups directory
            safeBase = sanitizeForFile(deriveBaseNameFromMaster(role));
        }
        String safeRole = sanitizeForFile(role != null && !role.isBlank() ? role : "Primary");
        String safeVariant = sanitizeForFile(variant != null && !variant.isBlank() ? variant : "V1");
        String idx = index;
        if (idx == null || idx.isBlank()) {
            // Try to extract trailing digits from original file name before extension
            String namePart = cleanedOriginal.replace(ext, "");
            String digits = namePart.replaceAll("^.*?(\\d+)$", "$1");
            if (digits != null && digits.matches("\\d+")) {
                idx = digits;
            } else {
                idx = "01"; // default index
            }
        }
        // Normalize index to at least 2 digits
        String safeIndex = idx.length() == 1 ? "0" + idx : idx;

        String storedName = String.format("%s_%s_%s_%s%s", safeBase, safeRole, safeVariant, safeIndex, ext);

        // Ensure uniqueness: if a file with same name exists, append a short UUID suffix
        Path target = service.getMockupDir().resolve(storedName);
        if (Files.exists(target)) {
            String uniqueSuffix = UUID.randomUUID().toString().substring(0, 8);
            storedName = String.format("%s_%s_%s_%s_%s%s", safeBase, safeRole, safeVariant, safeIndex, uniqueSuffix, ext);
            target = service.getMockupDir().resolve(storedName);
        }

        Files.copy(file.getInputStream(), target);
        String publicUrl = "/api/canva-templates/mockups/" + storedName;
        return ResponseEntity.ok(Map.of("url", publicUrl));
    }

    private String sanitizeForFile(String s) {
        if (s == null) return "";
        // Replace spaces with underscores and keep only [A-Za-z0-9_-]
        String r = s.trim().replace(' ', '_');
        r = r.replaceAll("[^A-Za-z0-9_\\-]", "");
        return r;
    }

    private String deriveBaseNameFromMaster(String role) {
        // Default fallback
        String fallback = "Mockup_Image";
        try {
            Path dir = Paths.get(masterDirConfig);
            if (!Files.exists(dir) || !Files.isDirectory(dir)) {
                return fallback;
            }
            // Determine preferred suffix based on role
            String desiredSuffix = null;
            if (role != null) {
                String r = role.toLowerCase();
                if (r.contains("mobile")) desiredSuffix = "_M"; // mobile
                else if (r.contains("primary") || r.contains("main") || r.contains("desktop")) desiredSuffix = "_P"; // primary
            }
            // Scan files to find a candidate
            try (var stream = Files.list(dir)) {
                List<Path> files = stream.filter(Files::isRegularFile).collect(Collectors.toList());
                // Prefer matching suffix; else take first valid file
                Path candidate = null;
                for (Path p : files) {
                    String name = p.getFileName().toString();
                    String base = stripSuffixAndExt(name);
                    if (base != null) {
                        if (desiredSuffix != null) {
                            if (name.contains(desiredSuffix)) { candidate = p; break; }
                        } else {
                            candidate = p; // first valid
                        }
                    }
                }
                if (candidate == null && !files.isEmpty()) {
                    candidate = files.get(0);
                }
                if (candidate != null) {
                    String name = candidate.getFileName().toString();
                    String base = stripSuffixAndExt(name);
                    if (base != null && !base.isBlank()) return base;
                }
            }
        } catch (Exception ignored) {}
        return fallback;
    }

    private String stripSuffixAndExt(String fileName) {
        // Remove extension
        String noExt = fileName.contains(".") ? fileName.substring(0, fileName.lastIndexOf('.')) : fileName;
        // Expect pattern like Something_P01 or Something_M01; strip trailing _[PM]\d+
        String stripped = noExt.replaceAll("_(?:[PM])\\d+$", "");
        if (!stripped.equals(noExt)) return stripped;
        // Fallback: if contains 'mobile' or 'primary' words, try removing them
        String alt = noExt.replaceAll("(?i)_mobile$", "").replaceAll("(?i)_primary$", "");
        return alt;
    }

    @GetMapping("/api/canva-templates/mockups/{file}")
    public ResponseEntity<StreamingResponseBody> getMockup(@PathVariable("file") String fileName,
                                            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) throws IOException {
        Path path = service.getMockupDir().resolve(fileName);
        if (!Files.exists(path)) {
            // Generate and return a lightweight placeholder instead of 404
            byte[] png = generatePlaceholder("Image unavailable", 1200, 800);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .header("Cache-Control", "public, max-age=300")
                    .body(outputStream -> outputStream.write(png));
        }
        String eTag = "\"" + fileName + '-' + Files.size(path) + "\"";
        if (ifNoneMatch != null && ifNoneMatch.equals(eTag)) {
            return ResponseEntity.status(304)
                    .header("Cache-Control", "public, max-age=86400, immutable")
                    .eTag(eTag)
                    .build();
        }
        MediaType mt = service.detectMediaType(path);
        StreamingResponseBody stream = outputStream -> {
            try (java.io.InputStream in = Files.newInputStream(path)) {
                byte[] buffer = new byte[8192];
                int len;
                while ((len = in.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, len);
                }
            }
        };
        return ResponseEntity.ok()
                .contentType(mt)
                .header("Cache-Control", "public, max-age=86400, immutable")
                .eTag(eTag)
                .body(stream);
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
            @RequestParam(value = "pdfType") String pdfType,
            @RequestParam(value = "includeAgeInstructions", required = false, defaultValue = "false") boolean includeAgeInstructions
    ) throws IOException {
        Template updated = service.generateBuyerPdf(templateId, pdfType, includeAgeInstructions);
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