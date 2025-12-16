package com.utilityzone.service;

import com.utilityzone.model.Template;
import com.utilityzone.repository.TemplateRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDBorderStyleDictionary;
import org.apache.pdfbox.pdmodel.graphics.color.PDColor;
import org.apache.pdfbox.pdmodel.graphics.color.PDDeviceRGB;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Optional;

import javax.imageio.ImageIO;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;

@Service
public class TemplateService {
    private final TemplateRepository repo;
    private static final Logger log = LoggerFactory.getLogger(TemplateService.class);

    @Value("${file.upload.dir:./data/uploads}")
    private String uploadBaseDir;

    public TemplateService(TemplateRepository repo) {
        this.repo = repo;
    }

    // ---- Shared style constants for consistent layout ----
    private static final float MARGIN = 36f;           // page margins
    private static final float GAP = 12f;              // default vertical gap
    private static final float HEAD_LG = 24f;          // large heading size
    private static final float HEAD_MD = 20f;          // medium heading size
    private static final float BODY = 13f;             // body text size
    private static final float LINE_BODY = 16f;        // line height for body text
    private static final float BUTTON_H = 28f;         // button height

    public List<Template> list() { return repo.findAll(); }
    @Transactional
    public Template create(@NonNull Template t) {
        if (t.getTitle() == null || t.getTitle().isBlank()) {
            t.setTitle(getNextDefaultTitle());
        }
        t.setStatus("draft"); // Always set to draft on create
        Template saved = repo.save(t);
        repo.flush(); // Ensure commit is visible to all connections (important for H2)
        return saved;
    }
    public Optional<Template> findById(@NonNull Long id) { return repo.findById(id); }

    @SuppressWarnings("null")
    public Template update(@NonNull Long id, @NonNull Template changes) {
        Template existing = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Template not found: " + id));
        if (changes.getTitle() != null) existing.setTitle(changes.getTitle());
        if (changes.getCanvaUseCopyUrl() != null) existing.setCanvaUseCopyUrl(changes.getCanvaUseCopyUrl());
        if (changes.getMobileCanvaUseCopyUrl() != null) existing.setMobileCanvaUseCopyUrl(changes.getMobileCanvaUseCopyUrl());
        if (changes.getMockupUrl() != null) existing.setMockupUrl(changes.getMockupUrl());
        if (changes.getEtsyListingUrl() != null) existing.setEtsyListingUrl(changes.getEtsyListingUrl());
        if (changes.getSecondaryMockupUrl() != null) existing.setSecondaryMockupUrl(changes.getSecondaryMockupUrl());
        if (changes.getMobileMockupUrl() != null) existing.setMobileMockupUrl(changes.getMobileMockupUrl());
        if (changes.getPublicDescription() != null) existing.setPublicDescription(changes.getPublicDescription());
        // buyerPdfUrl is managed by generation endpoint; keep as-is unless explicitly provided
        if (changes.getBuyerPdfUrl() != null) existing.setBuyerPdfUrl(changes.getBuyerPdfUrl());
        // allow updating persisted preferred buyer PDF type
        if (changes.getBuyerPdfType() != null) existing.setBuyerPdfType(changes.getBuyerPdfType());
        existing.setStatus("draft"); // Always set to draft on update from this page
        Template saved = repo.save(existing);
        return saved;
    }

    public void delete(@NonNull Long id) {
        repo.findById(id).ifPresent(t -> {
            // Try to delete generated PDF file to avoid orphan files
            try {
                Path pdf = getPdfPathFor(t);
                if (Files.exists(pdf)) Files.delete(pdf);
            } catch (IOException ignored) {}

            // Try to delete stored mockup files if urls point to our storage
            try {
                deleteMockupByUrl(t.getMockupUrl());
                deleteMockupByUrl(t.getSecondaryMockupUrl());
                deleteMockupByUrl(t.getMobileMockupUrl());
            } catch (IOException ignored) {}
            repo.deleteById(id);
        });
    }

    public String getNextDefaultTitle() {
        final String prefix = "NextStepLabs_Digital_Template_";
        int dbMax = 0;
        try {
            dbMax = repo.findMaxNumericSuffixForPrefix(prefix);
        } catch (Exception ignored) {}

        int scanMax = 0;
        try {
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(java.util.regex.Pattern.quote(prefix) + "(\\d+)$");
            for (Template t : repo.findAll()) {
                String title = t.getTitle();
                if (title == null) continue;
                java.util.regex.Matcher m = p.matcher(title);
                if (m.find()) {
                    try {
                        int n = Integer.parseInt(m.group(1));
                        if (n > scanMax) scanMax = n;
                    } catch (NumberFormatException ignored2) {}
                }
            }
        } catch (Exception ignored) {}

        int next = Math.max(Math.max(0, dbMax), scanMax) + 1;
        // Use 3-digit zero padding (e.g., 001, 002, 003)
        return String.format(prefix + "%03d", next);
    }

    private void deleteMockupByUrl(String url) throws IOException {
        if (url == null || url.isBlank()) return;
        String fileName = url.substring(url.lastIndexOf('/') + 1);
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) return;
        Path mockup = getMockupDir().resolve(fileName);
        if (Files.exists(mockup)) Files.delete(mockup);
    }

    public Path getBaseDir() throws IOException {
        Path p = Paths.get(uploadBaseDir == null || uploadBaseDir.isBlank() ? "./data/uploads" : uploadBaseDir);
        if (!Files.exists(p)) Files.createDirectories(p);
        try { log.info("[Templates] uploadBaseDir={} resolvedAbsolute={}", uploadBaseDir, p.toAbsolutePath()); } catch (Exception ignored) {}
        return p;
    }

    public Path getMockupDir() throws IOException {
        Path p = getBaseDir().resolve("canva-templates").resolve("mockups");
        if (!Files.exists(p)) Files.createDirectories(p);
        try { log.info("[Templates] mockupDir={}", p.toAbsolutePath()); } catch (Exception ignored) {}
        return p;
    }

    public Path getPdfDir() throws IOException {
        Path p = getBaseDir().resolve("canva-templates").resolve("pdfs");
        if (!Files.exists(p)) Files.createDirectories(p);
        try { log.info("[Templates] pdfDir={}", p.toAbsolutePath()); } catch (Exception ignored) {}
        return p;
    }

    public Path getBrandingDir() throws IOException {
        Path brandDir = getBaseDir().resolve("branding");
        if (!Files.exists(brandDir)) Files.createDirectories(brandDir);
        return brandDir;
    }

    /**
     * Optional shop logo path (user-provided). We look for PNG/JPG in
     * ./data/uploads/branding/shop-logo.(png|jpg|jpeg)
     */
    public Path getBrandingLogoFileIfExists() throws IOException {
        Path brandDir = getBrandingDir();
        Path png = brandDir.resolve("shop-logo.png");
        if (Files.exists(png)) return png;
        Path jpg = brandDir.resolve("shop-logo.jpg");
        if (Files.exists(jpg)) return jpg;
        Path jpeg = brandDir.resolve("shop-logo.jpeg");
        if (Files.exists(jpeg)) return jpeg;
        return null;
    }

    public Path getPdfPathFor(Template t) {
        try {
            return getPdfDir().resolve("buyer-template-" + t.getId() + ".pdf");
        } catch (IOException e) {
            // Fallback to current dir
            return Paths.get("buyer-template-" + t.getId() + ".pdf");
        }
    }

    public MediaType detectMediaType(@NonNull Path path) {
        try {
            String probe = Files.probeContentType(path);
            if (probe != null) return MediaType.parseMediaType(probe);
        } catch (IOException ignored) {}
        String fn = path.getFileName().toString().toLowerCase();
        if (fn.endsWith(".png")) return MediaType.IMAGE_PNG;
        if (fn.endsWith(".jpg") || fn.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        if (fn.endsWith(".gif")) return MediaType.IMAGE_GIF;
        return MediaType.APPLICATION_OCTET_STREAM;
    }

    public Template generateBuyerPdf(@NonNull Long id, String pdfType) throws IOException {
        Template t = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + id));
        Path pdfPath = getPdfPathFor(t);

        // Parse pdfType string to enum (default to PRINT_MOBILE if null/invalid)
        com.utilityzone.model.PdfType type;
        try {
            type = com.utilityzone.model.PdfType.valueOf(pdfType.toUpperCase().replace('-', '_'));
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid pdfType: " + pdfType);
        }
        try { log.info("[BuyerPDF] Generating id={} type={}", id, type); } catch (Exception ignore) {}
        // Persist the chosen type as the preferred buyer PDF type
        t.setBuyerPdfType(type.name());

        try (PDDocument doc = new PDDocument()) {
            // Load logo if present
            PDImageXObject logo = null;
            Path logoFile = getBrandingLogoFileIfExists();
            if (logoFile != null && Files.exists(logoFile)) {
                BufferedImage logoImg = ImageIO.read(logoFile.toFile());
                if (logoImg != null) logo = LosslessFactory.createFromImage(doc, logoImg);
            }
            // Load mockups
            PDImageXObject mockup = loadImageByUrl(doc, t.getMockupUrl());
            PDImageXObject secondaryMockup = loadImageByUrl(doc, t.getSecondaryMockupUrl());
            PDImageXObject mobileMockup = loadImageByUrl(doc, t.getMobileMockupUrl());
            try { log.info("[BuyerPDF] images: main={}, secondary={}, mobile={}", t.getMockupUrl(), t.getSecondaryMockupUrl(), t.getMobileMockupUrl()); } catch (Exception ignore) {}
            // Safety: only allow secondary mockup for Print & Mobile and Print Only
            if (type != com.utilityzone.model.PdfType.PRINT_MOBILE && type != com.utilityzone.model.PdfType.PRINT_ONLY) {
                secondaryMockup = null;
            }

            // Page 1
            PDPage p1 = new PDPage();
            doc.addPage(p1);
            PDRectangle mb1 = p1.getMediaBox();
            float pageW = mb1.getWidth(), pageH = mb1.getHeight();
            try (PDPageContentStream cs = new PDPageContentStream(doc, p1)) {
                if (logo != null) {
                    float maxLogoW = 100f, maxLogoH = 70f;
                    float logoAspect = (float) logo.getWidth() / logo.getHeight();
                    float lw = Math.min(maxLogoW, maxLogoH * logoAspect);
                    float lh = lw / logoAspect;
                    float logoX = pageW - MARGIN - lw;
                    float logoY = pageH - MARGIN - lh - 10f;
                    cs.drawImage(logo, logoX, logoY, lw, lh);
                }
                float y = pageH - MARGIN - 50f;
                String mainHeading = "Thank you for your purchase!";
                float headingX = (pageW - (PDType1Font.HELVETICA_BOLD.getStringWidth(mainHeading) / 1000f * HEAD_LG)) / 2f;
                drawText(cs, mainHeading, headingX, y, PDType1Font.HELVETICA_BOLD, HEAD_LG);
                float lineY1 = y - HEAD_LG - 6f;
                drawDivider(cs, MARGIN, lineY1, pageW - MARGIN * 2);
                y = lineY1 - GAP * 4;
                String title = nonNull(getPublicDescription(t, type));
                if (!title.isEmpty()) {
                    // Wrap title to page width and center each line. Limit to 2 lines with ellipsis.
                    float maxTitleWidth = pageW - MARGIN * 2;
                    // Increase line height for better readability on wrapped title
                    float titleLineHeight = HEAD_MD + 8f; // more gap between lines
                    y = drawWrappedCentered(cs, title, pageW / 2f, y, maxTitleWidth, PDType1Font.HELVETICA_BOLD, HEAD_MD, titleLineHeight, 2);
                    y -= GAP * 2;
                }
                float mockupW = Math.min(400f, pageW - MARGIN * 2);
                float mockupH = 280f;
                float mockupX = (pageW - mockupW) / 2f;
                float mockupY = pageH * 0.35f;
                drawImageOrPlaceholder(cs, mockup, mockupX, mockupY, mockupW, mockupH, "Main mockup");

                // Example: use pdfType to control PDF content (expand as needed)
                if (type == com.utilityzone.model.PdfType.PRINT_MOBILE || type == com.utilityzone.model.PdfType.WEDDING_SET) {
                    // Add mobile mockup or extra content for these types
                    // ...
                }
                if (type == com.utilityzone.model.PdfType.WEDDING_SET) {
                    // Add secondary mockup or extra content for wedding set
                    // ...
                }
                float includeStartY = mockupY - 36f; // more space below mockup for better look
                if (includeStartY > MARGIN + 100f) { // ensure space above footer
                    // Left-align to the primary mockup's left edge (do not go beyond it)
                    float leftEdge = Math.max(MARGIN, mockupX);
                    drawText(cs, "What's Included:", leftEdge, includeStartY, PDType1Font.HELVETICA_BOLD, 15f);
                    float afterHeaderY = includeStartY - (GAP + 6f);
                    String[] itemsPg1 = new String[]{
                            "Fully editable Canva templates",
                            "Customize text, colors, fonts & images",
                            "Download in multiple formats (PDF/PNG/JPG)",
                            "Step-by-step usage guide"
                    };
                    // Left-aligned bullets starting at the mockup's left edge
                    float cy = afterHeaderY;
                    for (String it : itemsPg1) {
                        drawText(cs, "* " + it, leftEdge, cy, PDType1Font.HELVETICA, BODY);
                        cy -= 18f; // slightly larger line height for readability
                    }
                }
                // Footer: divider + centered text
                drawFooterCentered(cs, mb1, "Digital template package");
            }

            // Page 2
            PDPage p2 = new PDPage();
            doc.addPage(p2);
            PDRectangle mb2 = p2.getMediaBox();
            try (PDPageContentStream cs = new PDPageContentStream(doc, p2)) {
                float y = mb2.getHeight() - MARGIN - GAP;
                // Track the Y position of the most recent 'Scan to open' label so tips can align horizontally
                float lastQrLabelY = Float.NaN;
                
                // Main heading - centered for better visual impact
                String mainHeading = "Access Your Templates";
                float headingX = (mb2.getWidth() - (PDType1Font.HELVETICA_BOLD.getStringWidth(mainHeading) / 1000f * HEAD_MD)) / 2f;
                drawText(cs, mainHeading, headingX, y, PDType1Font.HELVETICA_BOLD, HEAD_MD);
                // Divider under heading
                float lineY2 = y - HEAD_MD - 6f;
                drawDivider(cs, MARGIN, lineY2, mb2.getWidth() - MARGIN * 2);
                y = lineY2 - GAP * 4; // extra spacing below divider
                
                // Two-column layout with better proportions
                float qrAreaW = 140f;
                float rightX = mb2.getWidth() - MARGIN - qrAreaW;
                float leftW = rightX - MARGIN - GAP * 2;

                // Print version section - better aligned
                drawText(cs, "Print Invitation (5 x 7 in)", MARGIN, y, PDType1Font.HELVETICA_BOLD, 16f);
                y -= 25f; // Increased spacing for better readability
                
                String printLink = t.getCanvaUseCopyUrl();
                float btnW = Math.min(280f, leftW);
                float btnY = y - BUTTON_H - 8f; // More spacing above button
                
                if (printLink != null && printLink.startsWith("http")) {
                    drawButtonWithLink(doc, p2, cs, MARGIN, btnY, btnW, BUTTON_H, "Edit Print Template", printLink);
                    
                    // QR code with better positioning and alignment
                    float qrLabelX1 = 0f; float qrLabelDefaultY1 = 0f; boolean qrDrawn1 = false;
                    try {
                        BufferedImage qr = createQrCodeImage(printLink, 200);
                        if (qr != null) {
                            PDImageXObject qrImg = LosslessFactory.createFromImage(doc, qr);
                            float qrSize = 100f;
                            float qrX = rightX + (qrAreaW - qrSize) / 2f;
                            float qrY = btnY + (BUTTON_H - qrSize) / 2f + 15f; // Better vertical alignment
                            cs.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                            // Make the QR area itself clickable (helps mobile viewers)
                            PDAnnotationLink qrLink = new PDAnnotationLink();
                            PDRectangle qrRect = new PDRectangle(qrX, qrY, qrSize, qrSize);
                            qrLink.setRectangle(qrRect);
                            PDBorderStyleDictionary qrBorder = new PDBorderStyleDictionary();
                            qrBorder.setWidth(0f);
                            qrLink.setBorderStyle(qrBorder);
                            qrLink.setColor(new PDColor(new float[]{25/255f, 118/255f, 210/255f}, PDDeviceRGB.INSTANCE));
                            qrLink.setHighlightMode(PDAnnotationLink.HIGHLIGHT_MODE_OUTLINE);
                            PDActionURI qrAction = new PDActionURI();
                            qrAction.setURI(printLink);
                            qrLink.setAction(qrAction);
                            p2.getAnnotations().add(qrLink);

                            // Defer QR label until after URL wrapping to avoid overlap
                            String qrLabel = "Scan to open";
                            qrLabelX1 = qrX + (qrSize - (PDType1Font.HELVETICA.getStringWidth(qrLabel) / 1000f * 9f)) / 2f;
                            qrLabelDefaultY1 = qrY - 15f;
                            qrDrawn1 = true;
                        }
                    } catch (Exception ignore) {}

                    // Invisible link row below the button (keep annotation only for clean layout)
                    float urlStartY = btnY - 12f;
                    cs.setNonStrokingColor(Color.BLACK);
                    // clickable annotation spanning the whole left column for easier tapping/clicking
                    PDAnnotationLink urlAnnot = new PDAnnotationLink();
                    PDRectangle urlRect = new PDRectangle(MARGIN - 2f, urlStartY - 2f, leftW + 4f, 16f);
                    urlAnnot.setRectangle(urlRect);
                    PDBorderStyleDictionary urlBorder = new PDBorderStyleDictionary();
                    urlBorder.setWidth(0f);
                    urlAnnot.setBorderStyle(urlBorder);
                    urlAnnot.setColor(new PDColor(new float[]{25/255f, 118/255f, 210/255f}, PDDeviceRGB.INSTANCE));
                    urlAnnot.setHighlightMode(PDAnnotationLink.HIGHLIGHT_MODE_OUTLINE);
                    PDActionURI urlAction = new PDActionURI();
                    urlAction.setURI(printLink);
                    urlAnnot.setAction(urlAction);
                    p2.getAnnotations().add(urlAnnot);

                    // Now draw the QR label below whichever is lower: QR default label Y or wrapped URL block end
                    if (qrDrawn1) {
                        float qrLabelY = Math.min(qrLabelDefaultY1, (urlStartY - 12f) - 6f);
                        drawText(cs, "Scan to open", qrLabelX1, qrLabelY, PDType1Font.HELVETICA, 9f);
                        lastQrLabelY = qrLabelY;
                    }

                    // Advance y below the wrapped URL for cleaner spacing
                    y = (urlStartY - 12f) - GAP * 2;
                } else {
                    drawButton(cs, MARGIN, btnY, btnW, BUTTON_H, "Print template (link needed)");
                }

                // If no link rendered, continue from button position
                if (printLink == null || !printLink.startsWith("http")) {
                    y = btnY - GAP * 3; // space between sections when URL not shown
                }

                // Type-specific sections after Print: keep flows isolated by type
                switch (type) {
                    case PRINT_ONLY:
                        // No mobile; allow secondary preview if provided
                        break;
                    case PRINT_MOBILE:
                        // Will render Mobile section below; no RSVP/Detail/Secondary
                        break;
                    case WEDDING_SET:
                        // RSVP
                        y -= 20f;
                        drawText(cs, "RSVP Card", MARGIN, y, PDType1Font.HELVETICA_BOLD, 16f);
                        y -= 25f;
                        String rsvpLink = t.getRsvpCanvaUseCopyUrl();
                        float rsvpBtnY = y - BUTTON_H - 8f;
                        if (rsvpLink != null && rsvpLink.startsWith("http")) {
                            drawButtonWithLink(doc, p2, cs, MARGIN, rsvpBtnY, btnW, BUTTON_H, "Edit RSVP Template", rsvpLink);
                            try {
                                BufferedImage qr = createQrCodeImage(rsvpLink, 200);
                                if (qr != null) {
                                    PDImageXObject qrImg = LosslessFactory.createFromImage(doc, qr);
                                    float qrSize = 100f;
                                    float qrX = rightX + (qrAreaW - qrSize) / 2f;
                                    float qrY = rsvpBtnY + (BUTTON_H - qrSize) / 2f + 15f;
                                    cs.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
                                    PDAnnotationLink qrLink = new PDAnnotationLink();
                                    PDRectangle qrRect = new PDRectangle(qrX, qrY, qrSize, qrSize);
                                    qrLink.setRectangle(qrRect);
                                    PDBorderStyleDictionary qrBorder = new PDBorderStyleDictionary();
                                    qrBorder.setWidth(0f);
                                    qrLink.setBorderStyle(qrBorder);
                                    qrLink.setColor(new PDColor(new float[]{25/255f, 118/255f, 210/255f}, PDDeviceRGB.INSTANCE));
                                    qrLink.setHighlightMode(PDAnnotationLink.HIGHLIGHT_MODE_OUTLINE);
                                    PDActionURI qrAction = new PDActionURI();
                                    qrAction.setURI(rsvpLink);
                                    qrLink.setAction(qrAction);
                                    p2.getAnnotations().add(qrLink);
                                    String qrLabel = "Scan to open";
                                    float qrLabelX = qrX + (qrSize - (PDType1Font.HELVETICA.getStringWidth(qrLabel) / 1000f * 9f)) / 2f;
                                    float qrLabelY = qrY - 15f;
                                    drawText(cs, qrLabel, qrLabelX, qrLabelY, PDType1Font.HELVETICA, 9f);
                                }
                            } catch (Exception ignore) {}
                            y = rsvpBtnY - GAP * 2;
                        } else {
                            drawButton(cs, MARGIN, rsvpBtnY, btnW, BUTTON_H, "RSVP template (link needed)");
                            y = rsvpBtnY - GAP * 2;
                        }

                        // Detail Card
                        drawText(cs, "Detail Card", MARGIN, y, PDType1Font.HELVETICA_BOLD, 16f);
                        y -= 25f;
                        String detailLink = t.getDetailCardCanvaUseCopyUrl();
                        float detailBtnY = y - BUTTON_H - 8f;
                        if (detailLink != null && detailLink.startsWith("http")) {
                            drawButtonWithLink(doc, p2, cs, MARGIN, detailBtnY, btnW, BUTTON_H, "Edit Detail Card Template", detailLink);
                            try {
                                BufferedImage qr = createQrCodeImage(detailLink, 200);
                                if (qr != null) {
                                    PDImageXObject qrImg = LosslessFactory.createFromImage(doc, qr);
                                    float qrSize = 100f;
                                    float qrX = rightX + (qrAreaW - qrSize) / 2f;
                                    float qrY = detailBtnY + (BUTTON_H - qrSize) / 2f + 15f;
                                    cs.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
                                    PDAnnotationLink qrLink = new PDAnnotationLink();
                                    PDRectangle qrRect = new PDRectangle(qrX, qrY, qrSize, qrSize);
                                    qrLink.setRectangle(qrRect);
                                    PDBorderStyleDictionary qrBorder = new PDBorderStyleDictionary();
                                    qrBorder.setWidth(0f);
                                    qrLink.setBorderStyle(qrBorder);
                                    qrLink.setColor(new PDColor(new float[]{25/255f, 118/255f, 210/255f}, PDDeviceRGB.INSTANCE));
                                    qrLink.setHighlightMode(PDAnnotationLink.HIGHLIGHT_MODE_OUTLINE);
                                    PDActionURI qrAction = new PDActionURI();
                                    qrAction.setURI(detailLink);
                                    qrLink.setAction(qrAction);
                                    p2.getAnnotations().add(qrLink);
                                    String qrLabel = "Scan to open";
                                    float qrLabelX = qrX + (qrSize - (PDType1Font.HELVETICA.getStringWidth(qrLabel) / 1000f * 9f)) / 2f;
                                    float qrLabelY = qrY - 15f;
                                    drawText(cs, qrLabel, qrLabelX, qrLabelY, PDType1Font.HELVETICA, 9f);
                                }
                            } catch (Exception ignore) {}
                            y = detailBtnY - GAP * 2;
                        } else {
                            drawButton(cs, MARGIN, detailBtnY, btnW, BUTTON_H, "Detail card template (link needed)");
                            y = detailBtnY - GAP * 2;
                        }
                        // Fallthrough to render mobile section for Wedding Set below
                        break;
                }

                // Mobile version section (only for PRINT_MOBILE and WEDDING_SET)
                if (type == com.utilityzone.model.PdfType.PRINT_MOBILE || type == com.utilityzone.model.PdfType.WEDDING_SET) {
                    drawText(cs, "Mobile Invitation (1080 x 1920 px)", MARGIN, y, PDType1Font.HELVETICA_BOLD, 16f);
                    y -= 20f;
                    String mobileLink = t.getMobileCanvaUseCopyUrl();
                    float mBtnY = y - BUTTON_H - 6f;
                    if (mobileLink != null && mobileLink.startsWith("http")) {
                        drawButtonWithLink(doc, p2, cs, MARGIN, mBtnY, btnW, BUTTON_H, "Edit Mobile Template", mobileLink);
                        // Add a QR for the mobile link as well
                        float qrLabelX2 = 0f; float qrLabelDefaultY2 = 0f; boolean qrDrawn2 = false;
                        try {
                            BufferedImage qr = createQrCodeImage(mobileLink, 200);
                            if (qr != null) {
                                PDImageXObject qrImg = LosslessFactory.createFromImage(doc, qr);
                                float qrSize = 100f;
                                float qrX = rightX + (qrAreaW - qrSize) / 2f;
                                float qrY = mBtnY + (BUTTON_H - qrSize) / 2f + 15f; // align similarly to print section
                                cs.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
                                PDAnnotationLink qrLink = new PDAnnotationLink();
                                PDRectangle qrRect = new PDRectangle(qrX, qrY, qrSize, qrSize);
                                qrLink.setRectangle(qrRect);
                                PDBorderStyleDictionary qrBorder = new PDBorderStyleDictionary();
                                qrBorder.setWidth(0f);
                                qrLink.setBorderStyle(qrBorder);
                                qrLink.setColor(new PDColor(new float[]{25/255f, 118/255f, 210/255f}, PDDeviceRGB.INSTANCE));
                                qrLink.setHighlightMode(PDAnnotationLink.HIGHLIGHT_MODE_OUTLINE);
                                PDActionURI qrAction = new PDActionURI();
                                qrAction.setURI(mobileLink);
                                qrLink.setAction(qrAction);
                                p2.getAnnotations().add(qrLink);
                                String qrLabel = "Scan to open";
                                qrLabelX2 = qrX + (qrSize - (PDType1Font.HELVETICA.getStringWidth(qrLabel) / 1000f * 9f)) / 2f;
                                qrLabelDefaultY2 = qrY - 15f;
                                qrDrawn2 = true;
                            }
                        } catch (Exception ignore) {}
                        // Invisible link row under the mobile button (annotation only, no visible label)
                        float urlStartY2 = mBtnY - 12f;
                        cs.setNonStrokingColor(Color.BLACK);
                        PDAnnotationLink urlAnnot2 = new PDAnnotationLink();
                        PDRectangle urlRect2 = new PDRectangle(MARGIN - 2f, urlStartY2 - 2f, leftW + 4f, 16f);
                        urlAnnot2.setRectangle(urlRect2);
                        PDBorderStyleDictionary urlBorder2 = new PDBorderStyleDictionary();
                        urlBorder2.setWidth(0f);
                        urlAnnot2.setBorderStyle(urlBorder2);
                        urlAnnot2.setColor(new PDColor(new float[]{25/255f, 118/255f, 210/255f}, PDDeviceRGB.INSTANCE));
                        urlAnnot2.setHighlightMode(PDAnnotationLink.HIGHLIGHT_MODE_OUTLINE);
                        PDActionURI urlAction2 = new PDActionURI();
                        urlAction2.setURI(mobileLink);
                        urlAnnot2.setAction(urlAction2);
                        p2.getAnnotations().add(urlAnnot2);

                        // Draw the QR label after wrapping to prevent visual overlap with URL lines
                        if (qrDrawn2) {
                            float qrLabelY2 = Math.min(qrLabelDefaultY2, (urlStartY2 - 12f) - 6f);
                            drawText(cs, "Scan to open", qrLabelX2, qrLabelY2, PDType1Font.HELVETICA, 9f);
                            lastQrLabelY = qrLabelY2;
                        }

                        // On page 2, only Wedding Set shows a mobile preview; Print+Mobile uses secondary mockup below instead.
                        if (type == com.utilityzone.model.PdfType.WEDDING_SET) {
                            if (mobileMockup != null) {
                                float previewW = Math.min(380f, mb2.getWidth() - MARGIN * 2);
                                float previewH = 260f;
                                float previewX = (mb2.getWidth() - previewW) / 2f;
                                float previewY = Math.min((urlStartY2 - 16f), mBtnY) - previewH - 20f;
                                if (previewY > MARGIN + 80f) {
                                    drawImageOrPlaceholder(cs, mobileMockup, previewX, previewY, previewW, previewH, "Mobile Preview");
                                    y = previewY - GAP * 2;
                                } else {
                                    float fallbackTipY = Math.min((urlStartY2 - 12f), mBtnY) - 16f;
                                    float tipY = Float.isNaN(lastQrLabelY) ? fallbackTipY : lastQrLabelY;
                                    String tip = "Tip: If links don't open, use Adobe Acrobat Reader or scan the QR.";
                                    drawText(cs, tip, MARGIN, tipY, PDType1Font.HELVETICA_BOLD, 11f);
                                    y = tipY - GAP * 2;
                                }
                            } else {
                                float fallbackTipY = Math.min((urlStartY2 - 12f), mBtnY) - 16f;
                                float tipY = Float.isNaN(lastQrLabelY) ? fallbackTipY : lastQrLabelY;
                                String tip = "Tip: If links don't open, use Adobe Acrobat Reader or scan the QR.";
                                drawText(cs, tip, MARGIN, tipY, PDType1Font.HELVETICA_BOLD, 11f);
                                y = tipY - GAP * 2;
                            }
                        } else {
                            // PRINT_MOBILE: do not render mobile preview on page 2; leave space for secondary below
                            float fallbackTipY = Math.min((urlStartY2 - 12f), mBtnY) - 16f;
                            float tipY = Float.isNaN(lastQrLabelY) ? fallbackTipY : lastQrLabelY;
                            String tip = "Tip: If links don't open, use Adobe Acrobat Reader or scan the QR.";
                            drawText(cs, tip, MARGIN, tipY, PDType1Font.HELVETICA_BOLD, 11f);
                            y = tipY - GAP * 2;
                        }
                    } else {
                        drawButton(cs, MARGIN, mBtnY, btnW, BUTTON_H, "Mobile template (link needed)");
                        y = mBtnY - GAP * 2; // fallback spacing when URL not shown
                    }
                }
                // Viewer compatibility tip for PRINT_ONLY at similar relative position
                if (type == com.utilityzone.model.PdfType.PRINT_ONLY) {
                    // Align tip horizontally with the last QR label if available
                    float fallbackTipY = y - 16f;
                    float tipY = Float.isNaN(lastQrLabelY) ? fallbackTipY : lastQrLabelY;
                    String tip = "Tip: If links don't open, use Adobe Acrobat Reader or scan the QR.";
                    drawText(cs, tip, MARGIN, tipY, PDType1Font.HELVETICA_BOLD, 11f);
                    y = tipY - GAP * 2;
                }
                // Secondary mockup preview: for Print & Mobile and Print Only on page 2
                if ((type == com.utilityzone.model.PdfType.PRINT_MOBILE || type == com.utilityzone.model.PdfType.PRINT_ONLY) && secondaryMockup != null) {
                    // Place the secondary preview even when space is tighter; avoid overlap with footer
                    float secW = Math.min(400f, pageW - MARGIN * 2);
                    float secH = 280f;
                    float secX = (mb2.getWidth() - secW) / 2f;
                    float targetY = y - secH - 20f;
                    // Ensure it doesn't dip into the footer area; lift if necessary
                    float minY = MARGIN + 80f;
                    float secY = Math.max(minY, targetY);
                    drawImageOrPlaceholder(cs, secondaryMockup, secX, secY, secW, secH, "Secondary Preview");
                    y = secY - GAP * 2;
                }
                // Footer: divider + centered text
                drawFooterCentered(cs, mb2, "Digital template package");
            }

            // Page 3
            PDPage p3 = new PDPage();
            doc.addPage(p3);
            PDRectangle mb3 = p3.getMediaBox();
            try (PDPageContentStream cs = new PDPageContentStream(doc, p3)) {
                float y = mb3.getHeight() - MARGIN - GAP;
                drawText(cs, "How to Customize Your Template", MARGIN, y, PDType1Font.HELVETICA_BOLD, HEAD_MD);
                float lineY3 = y - HEAD_MD - 6f;
                drawDivider(cs, MARGIN, lineY3, mb3.getWidth() - MARGIN * 2);
                y = lineY3 - GAP * 4; // extra spacing below divider
                
                // Single column layout with mobile mockup after steps
                float contentW = mb3.getWidth() - MARGIN * 2;
                
                String[] steps = new String[]{
                        "Click the Canva link and select 'Use this template'",
                        "Customize text, colors, and fonts to match your style",
                        "Upload your own images via the Uploads section",
                        "Download your design: Share -> Download -> choose format"
                };
                
                // Inline numbered steps: number box and text share baseline
                float stepY = y;
                final float boxSize = 24f; // square box for number
                for (int i = 0; i < steps.length; i++) {
                    float baselineY = stepY; // text baseline
                    float boxX = MARGIN;     // left edge for number box
                    float boxY = baselineY - (boxSize * 0.75f); // shift so box vertically centers on text
                    cs.setNonStrokingColor(new Color(25, 118, 210));
                    cs.addRect(boxX, boxY, boxSize, boxSize);
                    cs.fill();
                    // Number inside box centered
                    cs.setNonStrokingColor(Color.WHITE);
                    float numOffsetX = 9f; // empirically center for Helvetica 12
                    float numOffsetY = 6f; // baseline offset inside box
                    drawText(cs, String.valueOf(i + 1), boxX + numOffsetX, baselineY - numOffsetY, PDType1Font.HELVETICA_BOLD, 12f);
                    // Step text inline to the right
                    cs.setNonStrokingColor(Color.BLACK);
                    float textX = boxX + boxSize + 12f; // space after number box
                    drawText(cs, steps[i], textX, baselineY, PDType1Font.HELVETICA, BODY);
                    // Advance to next line
                    stepY -= LINE_BODY + GAP;
                }
                
                // Mobile mockup - centered below steps with some spacing
                // Only show mobile mockup if not PRINT_ONLY
                if (type != com.utilityzone.model.PdfType.PRINT_ONLY) {
                    stepY -= GAP;
                    float mobileW = Math.min(400f, contentW);
                    float mobileH = 280f;
                    float mobileX = (mb3.getWidth() - mobileW) / 2f; // Center horizontally
                    float mobileY = stepY - mobileH - 20f;
                    // Only show mobile mockup if there's enough space
                    if (mobileY > MARGIN + 50f) {
                        if (mobileMockup != null) {
                            drawImageOrPlaceholder(cs, mobileMockup, mobileX, mobileY, mobileW, mobileH, "");
                        } else {
                            drawPlaceholder(cs, mobileX, mobileY, mobileW, mobileH, "Mobile mockup");
                        }
                        // Label for mobile mockup
                        drawText(cs, "Mobile Preview", mobileX, mobileY - 15f, PDType1Font.HELVETICA_OBLIQUE, 10f);
                    }
                }
                // Footer: divider + centered text
                drawFooterCentered(cs, mb3, "Digital template package");
            }

            // Page 4
            PDPage p4 = new PDPage();
            doc.addPage(p4);
            PDRectangle mb4 = p4.getMediaBox();
            try (PDPageContentStream cs = new PDPageContentStream(doc, p4)) {
                float y = mb4.getHeight() - MARGIN - GAP;
                
                // Main heading - centered for better visual impact
                String mainHeading = "License & Support Information";
                float headingX = (mb4.getWidth() - (PDType1Font.HELVETICA_BOLD.getStringWidth(mainHeading) / 1000f * HEAD_MD)) / 2f;
                drawText(cs, mainHeading, headingX, y, PDType1Font.HELVETICA_BOLD, HEAD_MD);
                float lineY4 = y - HEAD_MD - 6f;
                drawDivider(cs, MARGIN, lineY4, mb4.getWidth() - MARGIN * 2);
                y = lineY4 - GAP * 4; // extra spacing below divider
                
                // License section with better formatting and indentation
                drawText(cs, "License Terms:", MARGIN, y, PDType1Font.HELVETICA_BOLD, 15f);
                y -= 25f; // Increased spacing
                y = drawWrapped(cs,
                        "Personal Use License: You may use this template for your personal projects, events, and non-commercial purposes. " +
                        "Resale, redistribution, or sharing of the template files is strictly prohibited.",
                        MARGIN + 15f, y, mb4.getWidth() - MARGIN*2 - 15f, PDType1Font.HELVETICA, BODY, LINE_BODY);
                y -= GAP * 3; // More spacing between sections
                
                // Support section with better formatting
                drawText(cs, "Support & Help:", MARGIN, y, PDType1Font.HELVETICA_BOLD, 15f);
                y -= 25f;
                y = drawWrapped(cs,
                        "Need assistance? We're here to help! Contact us through your order message or reach out via email. " +
                        "We typically respond within 24 hours.",
                        MARGIN + 15f, y, mb4.getWidth() - MARGIN*2 - 15f, PDType1Font.HELVETICA, BODY, LINE_BODY);
                y -= GAP * 3;
                
                // Tips section with improved alignment
                drawText(cs, "Quick Tips:", MARGIN, y, PDType1Font.HELVETICA_BOLD, 15f);
                y -= 25f;
                String[] tips = {
                        "Save your work frequently in Canva",
                        "Export in high quality for best results",
                        "Check print settings before ordering"
                };
                y = drawBullets(cs, tips, MARGIN + 15f, y, PDType1Font.HELVETICA, BODY, 18f);
                y -= GAP * 3;
                
                // Thank you message - properly centered
                String thankYou = "Thank you for choosing our templates!";
                float thankYouX = (mb4.getWidth() - (PDType1Font.HELVETICA_BOLD.getStringWidth(thankYou) / 1000f * 16f)) / 2f;
                drawText(cs, thankYou, thankYouX, y, PDType1Font.HELVETICA_BOLD, 16f);
                
                // Footer text (always present on page 4)
                drawFooterCentered(cs, mb4, "Digital template package");

                // Powered by + Logo block positioned ABOVE the footer divider
                if (logo != null) {
                    float maxLogoW = 140f, maxLogoH = 80f;
                    float logoAspect = (float) logo.getWidth() / logo.getHeight();
                    float lw = Math.min(maxLogoW, maxLogoH * logoAspect);
                    float lh = lw / logoAspect;
                    float logoX = mb4.getWidth() - MARGIN - lw;
                    // Ensure logo sits fully above the footer divider (which is at MARGIN + 30)
                    float logoY = MARGIN + 40f;
                    cs.drawImage(logo, logoX, logoY, lw, lh);
                    String brandText = "Powered by";
                    float brandFontSize = 16f;
                    float textWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(brandText) / 1000f * brandFontSize;
                    float brandX = logoX - textWidth - 25f;
                    float brandY = logoY + lh/2f - (brandFontSize/2f) + 2f;
                    drawText(cs, brandText, brandX, brandY, PDType1Font.HELVETICA_BOLD, brandFontSize);
                } else {
                    // No logo: show a placeholder brand block above the footer divider
                    drawPlaceholder(cs, mb4.getWidth() - MARGIN - 140f, MARGIN + 40f, 140f, 80f, "Your brand");
                }
            }
            Files.createDirectories(pdfPath.getParent());
            doc.save(pdfPath.toFile());
        }
        t.setBuyerPdfUrl("/api/canva-templates/pdfs/" + t.getId() + ".pdf");
        return repo.save(t);
    }

    // Derive a human-friendly public description for templates (avoid technical IDs)
    public String getPublicDescription(Template t, com.utilityzone.model.PdfType type) {
        // If custom wording is provided, prefer it everywhere (storefront + PDF)
        if (t.getPublicDescription() != null && !t.getPublicDescription().isBlank()) {
            return t.getPublicDescription().trim();
        }
        String base = "NextStepsLab digital invite";
        boolean hasRsvp = t.getRsvpCanvaUseCopyUrl() != null && t.getRsvpCanvaUseCopyUrl().startsWith("http");
        boolean hasDetail = t.getDetailCardCanvaUseCopyUrl() != null && t.getDetailCardCanvaUseCopyUrl().startsWith("http");
        boolean hasPrint = t.getCanvaUseCopyUrl() != null && t.getCanvaUseCopyUrl().startsWith("http");
        boolean hasMobile = t.getMobileCanvaUseCopyUrl() != null && t.getMobileCanvaUseCopyUrl().startsWith("http");

        // Prefer explicit pdf type when provided
        if (type == com.utilityzone.model.PdfType.WEDDING_SET) {
            return base + " (Full Wedding Set)";
        }
        if (type == com.utilityzone.model.PdfType.PRINT_MOBILE) {
            return base + " (Mobile + Print)";
        }
        if (type == com.utilityzone.model.PdfType.PRINT_ONLY) {
            return base + " (Only Print)";
        }

        // Fallback heuristics based on available links
        if (hasRsvp || hasDetail) return base + " (Full Wedding Set)";
        if (hasPrint && hasMobile) return base + " (Mobile + Print)";
        if (hasMobile && !hasPrint) return base + " (Only Mobile)";
        if (hasPrint && !hasMobile) return base + " (Only Print)";
        return base;
    }
    private BufferedImage createQrCodeImage(@NonNull String content, int size) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size);
            return MatrixToImageWriter.toBufferedImage(matrix);
        } catch (WriterException e) {
            return null;
        }
    }

    // ---------- Helpers for drawing ----------
    private void drawText(PDPageContentStream cs, String text, float x, float y, PDType1Font font, float size) throws IOException {
        // Sanitize unsupported glyphs for Type1 fonts (Helvetica cannot encode certain Unicode)
        String safe = text
                .replace("\u2192", "->")
                .replace("\u2013", "-")
                .replace("\u2014", "-")
                .replace("\u2022", "*") // replace bullet with asterisk
                .replace("×", "x") // replace multiplication sign
                .replace("→", "->"); // replace any remaining arrows
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(safe);
        cs.endText();
    }

    private void drawCenteredText(PDPageContentStream cs, String text, float centerX, float y, PDType1Font font, float size) throws IOException {
        // use same sanitization as drawText to keep width/enocding consistent
        String safe = text
                .replace("\u2192", "->")
                .replace("\u2013", "-")
                .replace("\u2014", "-")
                .replace("\u2022", "*")
                .replace("×", "x")
                .replace("→", "->");
        float w = font.getStringWidth(safe) / 1000f * size;
        float x = centerX - w / 2f;
        cs.beginText();
        cs.setFont(font, size);
        cs.newLineAtOffset(x, y);
        cs.showText(safe);
        cs.endText();
    }

    /**
     * Wrap text within maxWidth and center each line. Returns the Y position after drawing (top of next line area).
     * Can limit lines and append ellipsis if exceeded.
     */
    private float drawWrappedCentered(PDPageContentStream cs, String text, float centerX, float topY,
                                      float maxWidth, PDType1Font font, float size, float lineHeight,
                                      int maxLines) throws IOException {
        // Sanitize like drawText
        String safe = text
                .replace("\u2192", "->")
                .replace("\u2013", "-")
                .replace("\u2014", "-")
                .replace("\u2022", "*")
                .replace("×", "x")
                .replace("→", "->");
        String[] words = safe.split(" ");
        java.util.List<String> lines = new java.util.ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String w : words) {
            String candidate = current.length() == 0 ? w : current + " " + w;
            float width = font.getStringWidth(candidate) / 1000f * size;
            if (width <= maxWidth) {
                current = new StringBuilder(candidate);
            } else {
                if (current.length() > 0) {
                    lines.add(current.toString());
                    current = new StringBuilder(w);
                } else {
                    // Single long word: hard cut
                    int i = w.length();
                    while (i > 0) {
                        String chunk = w.substring(0, i);
                        if (font.getStringWidth(chunk) / 1000f * size <= maxWidth) {
                            lines.add(chunk);
                            String rest = w.substring(i);
                            current = new StringBuilder(rest);
                            break;
                        }
                        i--;
                    }
                }
            }
        }
        if (current.length() > 0) lines.add(current.toString());
        // Truncate lines if exceeding maxLines and add ellipsis to last line
        if (maxLines > 0 && lines.size() > maxLines) {
            java.util.List<String> limited = lines.subList(0, maxLines);
            String last = limited.get(limited.size() - 1);
            String ellipsis = last + "...";
            // Ensure ellipsis fits
            while (font.getStringWidth(ellipsis) / 1000f * size > maxWidth && ellipsis.length() > 3) {
                ellipsis = ellipsis.substring(0, ellipsis.length() - 4) + "...";
            }
            limited.set(limited.size() - 1, ellipsis);
            lines = limited;
        }
        float y = topY;
        for (String line : lines) {
            float w = font.getStringWidth(line) / 1000f * size;
            float x = centerX - w / 2f;
            cs.beginText();
            cs.setFont(font, size);
            cs.newLineAtOffset(x, y);
            cs.showText(line);
            cs.endText();
            y -= lineHeight;
        }
        return y;
    }

    private void drawPlaceholder(PDPageContentStream cs, float x, float y, float w, float h, String label) throws IOException {
        cs.setNonStrokingColor(new Color(240,240,240));
        cs.addRect(x, y, w, h);
        cs.fill();
        cs.setStrokingColor(new Color(200,200,200));
        cs.addRect(x, y, w, h);
        cs.stroke();
        cs.setNonStrokingColor(Color.DARK_GRAY);
        drawText(cs, label, x + 8, y + h - 18, PDType1Font.HELVETICA_OBLIQUE, 10);
    }

    private void drawImageOrPlaceholder(PDPageContentStream cs, PDImageXObject img, float x, float y, float w, float h, String placeholderLabel) throws IOException {
        if (img != null) {
            float iw = img.getWidth();
            float ih = img.getHeight();
            float scale = Math.min(w / iw, h / ih);
            float dw = iw * scale;
            float dh = ih * scale;
            float dx = x + (w - dw) / 2f;
            float dy = y + (h - dh) / 2f;
            cs.drawImage(img, dx, dy, dw, dh);
            cs.setStrokingColor(new Color(200,200,200));
            cs.addRect(x, y, w, h);
            cs.stroke();
        } else {
            drawPlaceholder(cs, x, y, w, h, placeholderLabel);
        }
    }

    private float drawWrapped(PDPageContentStream cs, String text, float x, float topY, float maxWidth, PDType1Font font, float size, float lineHeight) throws IOException {
        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();
        float y = topY;
        for (String w : words) {
            String test = (line.length() == 0 ? w : line + " " + w);
            float testWidth = font.getStringWidth(test) / 1000f * size;
            if (testWidth > maxWidth && line.length() > 0) {
                drawText(cs, line.toString(), x, y, font, size);
                y -= lineHeight;
                line = new StringBuilder(w);
            } else {
                line = new StringBuilder(test);
            }
        }
        if (line.length() > 0) {
            drawText(cs, line.toString(), x, y, font, size);
            y -= lineHeight;
        }
        return y;
    }

    private void drawDivider(PDPageContentStream cs, float x, float y, float width) throws IOException {
        cs.setStrokingColor(new Color(210, 210, 210));
        cs.setLineWidth(1f);
        cs.moveTo(x, y);
        cs.lineTo(x + width, y);
        cs.stroke();
    }

    private void drawFooterCentered(PDPageContentStream cs, PDRectangle mb, String text) throws IOException {
        float lineY = MARGIN + 30f; // divider position above footer text
        drawDivider(cs, MARGIN, lineY, mb.getWidth() - MARGIN * 2);
        float textSize = 11f;
        float footerX = (mb.getWidth() - (PDType1Font.HELVETICA_OBLIQUE.getStringWidth(text) / 1000f * textSize)) / 2f;
        // Ensure footer text is visible regardless of previously set non-stroking color
        cs.setNonStrokingColor(Color.DARK_GRAY);
        drawText(cs, text, footerX, MARGIN + 14f, PDType1Font.HELVETICA_OBLIQUE, textSize);
    }

    private float drawBullets(PDPageContentStream cs, String[] items, float x, float startY, PDType1Font font, float size, float lineHeight) throws IOException {
        float y = startY;
        for (String it : items) {
            drawText(cs, "* "+it, x, y, font, size);
            y -= lineHeight;
        }
        return y;
    }

    // Removed unused drawNumbered helper

    private void drawButton(PDPageContentStream cs, float x, float y, float w, float h, String label) throws IOException {
        // Draw button shadow
        cs.setNonStrokingColor(new Color(0, 0, 0, 30));
        cs.addRect(x + 2, y - 2, w, h);
        cs.fill();
        
        // Draw main button
        cs.setNonStrokingColor(new Color(37, 99, 235)); // Modern blue
        cs.addRect(x, y, w, h);
        cs.fill();
        
        // Draw button border
        cs.setStrokingColor(new Color(29, 78, 216));
        cs.setLineWidth(1f);
        cs.addRect(x, y, w, h);
        cs.stroke();
        
        // Draw button text (centered)
        cs.setNonStrokingColor(Color.WHITE);
        float textY = y + h/2f - 5f;
        drawText(cs, label, x + 12, textY, PDType1Font.HELVETICA_BOLD, 12);
        // Reset text color for subsequent content on white background
        cs.setNonStrokingColor(Color.BLACK);
    }

    private void drawButtonWithLink(PDDocument doc, PDPage page, PDPageContentStream cs, float x, float y, float w, float h, String label, String url) throws IOException {
        drawButton(cs, x, y, w, h, label);
        PDAnnotationLink linkAnnot = new PDAnnotationLink();
        // Slightly expand the tap target to help on mobile
        final float pad = 2f;
        PDRectangle rect = new PDRectangle(x - pad, y - pad, w + pad * 2, h + pad * 2);
        linkAnnot.setRectangle(rect);
        // Remove visible border to avoid blue outlines around buttons
        PDBorderStyleDictionary border = new PDBorderStyleDictionary();
        border.setWidth(0f);
        linkAnnot.setBorderStyle(border);
        // No annotation color and no highlight outline
        linkAnnot.setHighlightMode(PDAnnotationLink.HIGHLIGHT_MODE_NONE);
        PDActionURI action = new PDActionURI();
        action.setURI(url);
        linkAnnot.setAction(action);
        page.getAnnotations().add(linkAnnot);
    }

    private PDImageXObject loadImageByUrl(@NonNull PDDocument doc, String url) throws IOException {
        if (url == null || url.isBlank()) return null;
        String fileName = url.substring(url.lastIndexOf('/') + 1);
        if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) return null;
        Path p = getMockupDir().resolve(fileName);
        if (!Files.exists(p)) return null;
        BufferedImage img = ImageIO.read(p.toFile());
        if (img == null) return null;
        return LosslessFactory.createFromImage(doc, img);
    }

    private String nonNull(String v) { return v == null ? "" : v; }

    public Template publish(@NonNull Long id) {
        Template t = repo.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Template not found: " + id));
        t.setStatus("published");
        return repo.save(t);
    }
}