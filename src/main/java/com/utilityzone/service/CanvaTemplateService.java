package com.utilityzone.service;

import com.utilityzone.model.CanvaTemplate;
import com.utilityzone.repository.CanvaTemplateRepository;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;

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
public class CanvaTemplateService {
    private final CanvaTemplateRepository repo;

    @Value("${file.upload.dir:./data/uploads}")
    private String uploadBaseDir;

    public CanvaTemplateService(CanvaTemplateRepository repo) {
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

    public List<CanvaTemplate> list() { return repo.findAll(); }
    public CanvaTemplate create(@NonNull CanvaTemplate t) {
        if (t.getTitle() == null || t.getTitle().isBlank()) {
            t.setTitle(getNextDefaultTitle());
        }
        return repo.save(t);
    }
    public Optional<CanvaTemplate> findById(@NonNull Long id) { return repo.findById(id); }

    @SuppressWarnings("null")
    public CanvaTemplate update(@NonNull Long id, @NonNull CanvaTemplate changes) {
        CanvaTemplate existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CanvaTemplate not found: " + id));
        if (changes.getTitle() != null) existing.setTitle(changes.getTitle());
    if (changes.getCanvaUseCopyUrl() != null) existing.setCanvaUseCopyUrl(changes.getCanvaUseCopyUrl());
    if (changes.getMobileCanvaUseCopyUrl() != null) existing.setMobileCanvaUseCopyUrl(changes.getMobileCanvaUseCopyUrl());
        if (changes.getMockupUrl() != null) existing.setMockupUrl(changes.getMockupUrl());
        if (changes.getEtsyListingUrl() != null) existing.setEtsyListingUrl(changes.getEtsyListingUrl());
        if (changes.getSecondaryMockupUrl() != null) existing.setSecondaryMockupUrl(changes.getSecondaryMockupUrl());
        if (changes.getMobileMockupUrl() != null) existing.setMobileMockupUrl(changes.getMobileMockupUrl());
        // buyerPdfUrl is managed by generation endpoint; keep as-is unless explicitly provided
        if (changes.getBuyerPdfUrl() != null) existing.setBuyerPdfUrl(changes.getBuyerPdfUrl());
        CanvaTemplate saved = repo.save(existing);
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
        int max = 0;
        try {
            max = repo.findMaxNumericSuffixForPrefix(prefix);
        } catch (Exception ignored) {}
        int next = Math.max(0, max) + 1;
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
        return p;
    }

    public Path getMockupDir() throws IOException {
        Path p = getBaseDir().resolve("canva-templates").resolve("mockups");
        if (!Files.exists(p)) Files.createDirectories(p);
        return p;
    }

    public Path getPdfDir() throws IOException {
        Path p = getBaseDir().resolve("canva-templates").resolve("pdfs");
        if (!Files.exists(p)) Files.createDirectories(p);
        return p;
    }

    /**
     * Optional shop logo path (user-provided). We look for PNG/JPG in
     * ./data/uploads/branding/shop-logo.(png|jpg|jpeg)
     */
    public Path getBrandingLogoFileIfExists() throws IOException {
        Path brandDir = getBaseDir().resolve("branding");
        // no need to create, we only read if present
        Path png = brandDir.resolve("shop-logo.png");
        if (Files.exists(png)) return png;
        Path jpg = brandDir.resolve("shop-logo.jpg");
        if (Files.exists(jpg)) return jpg;
        Path jpeg = brandDir.resolve("shop-logo.jpeg");
        if (Files.exists(jpeg)) return jpeg;
        return null;
    }

    public Path getPdfPathFor(CanvaTemplate t) {
        try {
            return getPdfDir().resolve("buyer-" + t.getId() + ".pdf");
        } catch (IOException e) {
            // Fallback to current dir
            return Paths.get("buyer-" + t.getId() + ".pdf");
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

    public CanvaTemplate generateBuyerPdf(@NonNull Long id) throws IOException {
        CanvaTemplate t = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CanvaTemplate not found: " + id));
        Path pdfPath = getPdfPathFor(t);

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
                String title = nonNull(t.getTitle());
                if (!title.isEmpty()) {
                    float titleX = (pageW - (PDType1Font.HELVETICA_BOLD.getStringWidth(title) / 1000f * HEAD_MD)) / 2f;
                    drawText(cs, title, titleX, y, PDType1Font.HELVETICA_BOLD, HEAD_MD);
                    y -= HEAD_MD + GAP * 2;
                }
                float mockupW = Math.min(400f, pageW - MARGIN * 2);
                float mockupH = 280f;
                float mockupX = (pageW - mockupW) / 2f;
                float mockupY = pageH * 0.35f;
                drawImageOrPlaceholder(cs, mockup, mockupX, mockupY, mockupW, mockupH, "Main mockup");
                // Footer: divider + centered text
                drawFooterCentered(cs, mb1, "Digital template package");
            }

            // Page 2
            PDPage p2 = new PDPage();
            doc.addPage(p2);
            PDRectangle mb2 = p2.getMediaBox();
            try (PDPageContentStream cs = new PDPageContentStream(doc, p2)) {
                float y = mb2.getHeight() - MARGIN - GAP;
                
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
                    try {
                        BufferedImage qr = createQrCodeImage(printLink, 200);
                        if (qr != null) {
                            PDImageXObject qrImg = LosslessFactory.createFromImage(doc, qr);
                            float qrSize = 100f;
                            float qrX = rightX + (qrAreaW - qrSize) / 2f;
                            float qrY = btnY + (BUTTON_H - qrSize) / 2f + 15f; // Better vertical alignment
                            cs.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
                            // Centered QR label
                            String qrLabel = "Scan to open";
                            float qrLabelX = qrX + (qrSize - (PDType1Font.HELVETICA.getStringWidth(qrLabel) / 1000f * 9f)) / 2f;
                            drawText(cs, qrLabel, qrLabelX, qrY - 15f, PDType1Font.HELVETICA, 9f);
                        }
                    } catch (Exception ignore) {}
                } else {
                    drawButton(cs, MARGIN, btnY, btnW, BUTTON_H, "Print template (link needed)");
                }
                
                y = btnY - GAP * 3; // More space between sections

                // Mobile version section
                drawText(cs, "Mobile Invitation (1080 x 1920 px)", MARGIN, y, PDType1Font.HELVETICA_BOLD, 16f);
                y -= 20f;
                String mobileLink = t.getMobileCanvaUseCopyUrl();
                float mBtnY = y - BUTTON_H - 6f;
                
                if (mobileLink != null && mobileLink.startsWith("http")) {
                    drawButtonWithLink(doc, p2, cs, MARGIN, mBtnY, btnW, BUTTON_H, "Edit Mobile Template", mobileLink);
                } else {
                    drawButton(cs, MARGIN, mBtnY, btnW, BUTTON_H, "Mobile template (link needed)");
                }
                
                y = mBtnY - GAP * 2;
                
                // What's included section
                drawText(cs, "What's Included:", MARGIN, y, PDType1Font.HELVETICA_BOLD, 15f);
                y -= GAP;
                String[] items = new String[]{
                        "Fully editable Canva templates",
                        "Customize text, colors, fonts & images", 
                        "Download in multiple formats (PDF/PNG/JPG)",
                        "Step-by-step usage guide"
                };
                y = drawBullets(cs, items, MARGIN, y, PDType1Font.HELVETICA, BODY, 16f);

                // Secondary mockup - same size as primary mockup
                if (y > MARGIN + 300f) {
                    float secW = Math.min(400f, pageW - MARGIN * 2); // Same width as primary
                    float secH = 280f; // Same height as primary
                    float secX = (mb2.getWidth() - secW) / 2f; // Center horizontally like primary
                    float secY = y - secH - 15f;
                    drawImageOrPlaceholder(cs, (secondaryMockup != null ? secondaryMockup : mockup), secX, secY, secW, secH, "Preview");
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
                
                // Footer with enlarged logo + branding
                if (logo != null) {
                    float maxLogoW = 140f, maxLogoH = 80f;
                    float logoAspect = (float) logo.getWidth() / logo.getHeight();
                    float lw = Math.min(maxLogoW, maxLogoH * logoAspect);
                    float lh = lw / logoAspect;
                    float logoX = mb4.getWidth() - MARGIN - lw;
                    float logoY = MARGIN + 25f;
                    cs.drawImage(logo, logoX, logoY, lw, lh);
                    String brandText = "Powered by";
                    float brandFontSize = 16f;
                    float textWidth = PDType1Font.HELVETICA_BOLD.getStringWidth(brandText) / 1000f * brandFontSize;
                    float brandX = logoX - textWidth - 25f;
                    float brandY = logoY + lh/2f - (brandFontSize/2f) + 2f;
                    drawText(cs, brandText, brandX, brandY, PDType1Font.HELVETICA_BOLD, brandFontSize);
                    // Divider above footer content (over the logo area)
                    float footerDividerY = logoY + lh + 12f;
                    drawDivider(cs, MARGIN, footerDividerY, mb4.getWidth() - MARGIN * 2);
                } else {
                    // No logo: standard footer with divider + placeholder on right
                    drawFooterCentered(cs, mb4, "Digital template package");
                    drawPlaceholder(cs, mb4.getWidth() - MARGIN - 140f, MARGIN + 25f, 140f, 80f, "Your brand");
                }
            }
            Files.createDirectories(pdfPath.getParent());
            doc.save(pdfPath.toFile());
        }
        t.setBuyerPdfUrl("/api/canva-templates/pdfs/" + t.getId() + ".pdf");
        return repo.save(t);
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
    }

    private void drawButtonWithLink(PDDocument doc, PDPage page, PDPageContentStream cs, float x, float y, float w, float h, String label, String url) throws IOException {
        drawButton(cs, x, y, w, h, label);
        PDAnnotationLink linkAnnot = new PDAnnotationLink();
        PDRectangle rect = new PDRectangle(x, y, w, h);
        linkAnnot.setRectangle(rect);
        PDBorderStyleDictionary border = new PDBorderStyleDictionary();
        border.setWidth(0f);
        linkAnnot.setBorderStyle(border);
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
}
