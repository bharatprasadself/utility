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
import org.springframework.stereotype.Service;

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

    public List<CanvaTemplate> list() { return repo.findAll(); }
    public CanvaTemplate create(CanvaTemplate t) { return repo.save(t); }
    public Optional<CanvaTemplate> findById(Long id) { return repo.findById(id); }

    public CanvaTemplate update(Long id, CanvaTemplate changes) {
        CanvaTemplate existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CanvaTemplate not found: " + id));
        if (changes.getTitle() != null) existing.setTitle(changes.getTitle());
        if (changes.getCanvaUseCopyUrl() != null) existing.setCanvaUseCopyUrl(changes.getCanvaUseCopyUrl());
        if (changes.getMockupUrl() != null) existing.setMockupUrl(changes.getMockupUrl());
        if (changes.getEtsyListingUrl() != null) existing.setEtsyListingUrl(changes.getEtsyListingUrl());
        // buyerPdfUrl is managed by generation endpoint; keep as-is unless explicitly provided
        if (changes.getBuyerPdfUrl() != null) existing.setBuyerPdfUrl(changes.getBuyerPdfUrl());
        return repo.save(existing);
    }

    public void delete(Long id) {
        repo.findById(id).ifPresent(t -> {
            // Try to delete generated PDF file to avoid orphan files
            try {
                Path pdf = getPdfPathFor(t);
                if (Files.exists(pdf)) Files.delete(pdf);
            } catch (IOException ignored) {}

            // Try to delete stored mockup file if mockupUrl points to our storage
            try {
                String url = t.getMockupUrl();
                if (url != null && !url.isBlank()) {
                    String fileName = url.substring(url.lastIndexOf('/') + 1);
                    // Basic safety: disallow path traversal and separators
                    if (!fileName.contains("..") && !fileName.contains("/") && !fileName.contains("\\")) {
                        Path mockup = getMockupDir().resolve(fileName);
                        if (Files.exists(mockup)) Files.delete(mockup);
                    }
                }
            } catch (IOException ignored) {}
            repo.deleteById(id);
        });
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

    public MediaType detectMediaType(Path path) {
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

    public CanvaTemplate generateBuyerPdf(Long id) throws IOException {
        CanvaTemplate t = repo.findById(id).orElseThrow(() -> new IllegalArgumentException("CanvaTemplate not found: " + id));
        Path pdfPath = getPdfPathFor(t);

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            PDRectangle mediaBox = page.getMediaBox();
            float pageWidth = mediaBox.getWidth();
            float pageHeight = mediaBox.getHeight();
            float margin = 50f;

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // Optional: draw shop logo (top-right)
                Path logoFile = getBrandingLogoFileIfExists();
                if (logoFile != null) {
                    try {
                        BufferedImage logoImg = ImageIO.read(logoFile.toFile());
                        if (logoImg != null) {
                            float targetW = 120f; // px in user space units
                            float scale = targetW / logoImg.getWidth();
                            float targetH = logoImg.getHeight() * scale;
                            PDImageXObject logo = LosslessFactory.createFromImage(doc, logoImg);
                            float logoX = pageWidth - margin - targetW;
                            float logoY = pageHeight - margin - targetH;
                            cs.drawImage(logo, logoX, logoY, targetW, targetH);
                        }
                    } catch (Exception ignore) { /* If logo missing or unreadable, skip */ }
                }

                float y = pageHeight - margin - 20f; // start near top
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_BOLD, 20);
                cs.newLineAtOffset(50, y);
                cs.showText("Thank you for your purchase!");
                cs.endText();

                y -= 40;
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 12);
                cs.newLineAtOffset(50, y);
                cs.showText("Title: " + (t.getTitle() != null ? t.getTitle() : ""));
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA, 12);
                cs.newLineAtOffset(50, y);
                cs.showText("Canva link (Use a copy):");
                cs.endText();

                y -= 20;
                cs.beginText();
                cs.setFont(PDType1Font.COURIER, 11);
                float linkX = margin;
                float linkY = y;
                cs.newLineAtOffset(linkX, linkY);
                String link = t.getCanvaUseCopyUrl() != null ? t.getCanvaUseCopyUrl() : "not provided";
                cs.showText(link);
                cs.endText();

                // Make the URL clickable if it looks valid
                if (t.getCanvaUseCopyUrl() != null && t.getCanvaUseCopyUrl().startsWith("http")) {
                    float fontSize = 11f;
                    float linkWidth = (PDType1Font.COURIER.getStringWidth(link) / 1000f) * fontSize;
                    float linkHeight = 14f;
                    PDAnnotationLink linkAnnot = new PDAnnotationLink();
                    PDRectangle rect = new PDRectangle(linkX, linkY - 2f, linkWidth, linkHeight);
                    linkAnnot.setRectangle(rect);
                    PDBorderStyleDictionary border = new PDBorderStyleDictionary();
                    border.setStyle(PDBorderStyleDictionary.STYLE_UNDERLINE);
                    border.setWidth(0.75f);
                    linkAnnot.setBorderStyle(border);
                    PDActionURI action = new PDActionURI();
                    action.setURI(t.getCanvaUseCopyUrl());
                    linkAnnot.setAction(action);
                    page.getAnnotations().add(linkAnnot);
                }

                y -= 60;
                cs.beginText();
                cs.setFont(PDType1Font.HELVETICA_OBLIQUE, 10);
                cs.newLineAtOffset(50, y);
                cs.showText("Instructions: Open the link above and choose 'Use this template' to create your copy.");
                cs.endText();

                // Draw QR code on the right if URL is present
                if (t.getCanvaUseCopyUrl() != null && t.getCanvaUseCopyUrl().startsWith("http")) {
                    try {
                        BufferedImage qr = createQrCodeImage(t.getCanvaUseCopyUrl(), 160);
                        if (qr != null) {
                            PDImageXObject qrImg = LosslessFactory.createFromImage(doc, qr);
                            float qrSize = 140f;
                            float qrX = pageWidth - margin - qrSize;
                            float qrY = y - qrSize - 10f; // below the instruction line
                            cs.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

                            // Caption
                            cs.beginText();
                            cs.setFont(PDType1Font.HELVETICA, 10);
                            cs.newLineAtOffset(qrX, qrY - 14f);
                            cs.showText("Scan to open the template");
                            cs.endText();
                        }
                    } catch (Exception ignore) { /* non-fatal */ }
                }
            }
            Files.createDirectories(pdfPath.getParent());
            doc.save(pdfPath.toFile());
        }

        t.setBuyerPdfUrl("/api/canva-templates/pdfs/" + t.getId() + ".pdf");
        return repo.save(t);
    }

    private BufferedImage createQrCodeImage(String content, int size) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size);
            return MatrixToImageWriter.toBufferedImage(matrix);
        } catch (WriterException e) {
            return null;
        }
    }
}
