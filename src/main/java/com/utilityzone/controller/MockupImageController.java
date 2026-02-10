        
package com.utilityzone.controller;


import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.IOException;

@RestController
@RequestMapping("/api/mockup-image")
public class MockupImageController {
    @PostMapping(value = "/merge-detail-rsvp", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StreamingResponseBody> mergeDetailRsvpMockup(
        @RequestParam("master") MultipartFile masterMockupFile,
        @RequestParam("detail") MultipartFile detailFile,
        @RequestParam("rsvp") MultipartFile rsvpFile
    ) throws IOException {

        // Sizes for cards
        final int CARD_WIDTH = 560;
        final int CARD_HEIGHT = 840;
        // Output size (same as master mockup)
        BufferedImage masterMockup = ImageIO.read(masterMockupFile.getInputStream());
        int outputW = masterMockup.getWidth();
        int outputH = masterMockup.getHeight();
        BufferedImage detailImg = processCustomMockups(ImageIO.read(detailFile.getInputStream()), CARD_WIDTH, CARD_HEIGHT);
        BufferedImage rsvpImg = processCustomMockups(ImageIO.read(rsvpFile.getInputStream()), CARD_WIDTH, CARD_HEIGHT);

        int detailX = 460; // fixed pixel position from left
        int detailY = 1000; // fixed pixel position from top
        int rsvpX = 1260;   // fixed pixel position from left
        int rsvpY = 300;   // fixed pixel position from top
        
        
        BufferedImage combined = new BufferedImage(outputW, outputH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = combined.createGraphics();
        g.drawImage(masterMockup, 0, 0, null);
        g.drawImage(detailImg, detailX, detailY, null);
        g.drawImage(rsvpImg, rsvpX, rsvpY, null);
        g.dispose();

        StreamingResponseBody stream = outputStream -> {
            ImageIO.write(combined, "png", outputStream);
            combined.flush();
        };

        // Build filename as: Mockup_Template_Detail_RSVP_V1_NSL_04.png
        String baseName = "Mockup_Template_Detail_RSVP";
        String variantLabel = deriveVersionFromMockupFilename(masterMockupFile.getOriginalFilename());
        String indexLabel = extractIndexFromProductFilename(detailFile.getOriginalFilename());
        String finalName = String.format("%s_%s_%s.png", baseName, variantLabel, "NSL_" + indexLabel);
        return ResponseEntity.status(HttpStatus.OK)
            .contentType(MediaType.parseMediaType("image/png"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + finalName + "\"")
            .body(stream);
    }

        // Detail/RSVP mockup: custom size (e.g., 704x975 px)
        private BufferedImage processCustomMockups(BufferedImage product, int WIDTH, int HEIGHT) {
        int prodW = product.getWidth();
        int prodH = product.getHeight();
        // Scale to fit within placeholder, preserving aspect ratio, but do not upscale
        int targetW = Math.min(WIDTH, prodW);
        int targetH = Math.min(HEIGHT, prodH);
        double scale = Math.min((double)targetW / prodW, (double)targetH / prodH);
        targetW = (int) (prodW * scale);
        targetH = (int) (prodH * scale);
        Image scaledProduct = product.getScaledInstance(targetW, targetH, Image.SCALE_SMOOTH);
        BufferedImage productScaled = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gProd = productScaled.createGraphics();
        gProd.setComposite(AlphaComposite.Clear);
        gProd.fillRect(0, 0, targetW, targetH);
        gProd.setComposite(AlphaComposite.SrcOver);
        gProd.drawImage(scaledProduct, 0, 0, null);
        gProd.dispose();
        return productScaled;
        }
    // Print mockup: no rounded corners, just scale and return
    private BufferedImage processPrintMockup(BufferedImage product, int placeWidth, int placeHeight) {
        int prodW = product.getWidth();
        int prodH = product.getHeight();
        int targetW = Math.min(placeWidth, prodW);
        int targetH = Math.min(placeHeight, prodH);

        Image scaledProduct = product.getScaledInstance(targetW, targetH, Image.SCALE_SMOOTH);
        BufferedImage productScaled = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gProd = productScaled.createGraphics();
        gProd.setComposite(AlphaComposite.Clear);
        gProd.fillRect(0, 0, targetW, targetH);
        gProd.setComposite(AlphaComposite.SrcOver);
        gProd.drawImage(scaledProduct, 0, 0, null);
        gProd.dispose();
        return productScaled;
    }

    // Mobile mockup: apply rounded top corners
    private BufferedImage processMobileMockup(BufferedImage product, int placeWidth, int placeHeight, String version) {
        int prodW = product.getWidth();
        int prodH = product.getHeight();
        int targetW = Math.min(placeWidth, prodW);
        int targetH = Math.min(placeHeight, prodH);

        Image scaledProduct = product.getScaledInstance(targetW, targetH, Image.SCALE_SMOOTH);
        BufferedImage productScaled = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gProd = productScaled.createGraphics();
        gProd.setComposite(AlphaComposite.Clear);
        gProd.fillRect(0, 0, targetW, targetH);
        gProd.setComposite(AlphaComposite.SrcOver);
        gProd.drawImage(scaledProduct, 0, 0, null);
        gProd.dispose();

        int radius;
        if (version != null && version.equalsIgnoreCase("V3")) {
            radius = Math.min(targetW, targetH) / 12; // More pronounced arc for V3
        } else {
            radius = Math.min(targetW, targetH) / 9;
        }
        BufferedImage roundedProduct = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = roundedProduct.createGraphics();
        g2.setComposite(AlphaComposite.Clear);
        g2.fillRect(0, 0, targetW, targetH);
        g2.setComposite(AlphaComposite.SrcOver);
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        java.awt.geom.RoundRectangle2D.Double roundRect = new java.awt.geom.RoundRectangle2D.Double(
            0, 0, targetW, targetH, 2*radius, 2*radius
        );
        java.awt.geom.Area mask = new java.awt.geom.Area(roundRect);
        mask.add(new java.awt.geom.Area(new java.awt.Rectangle(0, targetH - radius, radius, radius)));
        mask.add(new java.awt.geom.Area(new java.awt.Rectangle(targetW - radius, targetH - radius, radius, radius)));
        g2.setClip(mask);
        g2.drawImage(productScaled, 0, 0, null);
        g2.dispose();
        return roundedProduct;
    }

    // Secondary mockup: placeholder logic, original behavior
        private BufferedImage processSecondaryMockup(BufferedImage product) {
            // Use fixed secondary placement dimensions
            int placeWidth = 880;
            int placeHeight = 1240;
            int prodW = product.getWidth();
            int prodH = product.getHeight();
            int targetW = Math.min(placeWidth, prodW);
            int targetH = Math.min(placeHeight, prodH);

            Image scaledProduct = product.getScaledInstance(targetW, targetH, Image.SCALE_SMOOTH);
            BufferedImage productScaled = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_ARGB);
            Graphics2D gProd = productScaled.createGraphics();
            gProd.setComposite(AlphaComposite.Clear);
            gProd.fillRect(0, 0, targetW, targetH);
            gProd.setComposite(AlphaComposite.SrcOver);
            gProd.drawImage(scaledProduct, 0, 0, null);
            gProd.dispose();

            // Tilt the image by 5 degrees without cropping
            double angle = Math.toRadians(5); // 5 degree tilt
            double sin = Math.abs(Math.sin(angle));
            double cos = Math.abs(Math.cos(angle));
            int newW = (int) Math.ceil(targetW * cos + targetH * sin);
            int newH = (int) Math.ceil(targetH * cos + targetW * sin);
            BufferedImage tilted = new BufferedImage(newW, newH, BufferedImage.TYPE_INT_ARGB);
            Graphics2D gTilt = tilted.createGraphics();
            gTilt.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            gTilt.setComposite(AlphaComposite.Clear);
            gTilt.fillRect(0, 0, newW, newH);
            gTilt.setComposite(AlphaComposite.SrcOver);
            // Center the image and rotate
            gTilt.translate((newW - targetW) / 2.0, (newH - targetH) / 2.0);
            gTilt.rotate(angle, targetW / 2.0, targetH / 2.0);
            gTilt.drawImage(productScaled, 0, 0, null);
            gTilt.dispose();
            return tilted;
        }

    @PostMapping(value = "/merge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StreamingResponseBody> mergeProductImage(
        @RequestParam("mockup") MultipartFile mockupFile,
        @RequestParam("product") MultipartFile productFile,
        @RequestParam(value = "mockupType", required = false) String mockupType,
        @RequestParam(value = "style", required = false) String style
    ) throws IOException {
        final int OUTPUT_WIDTH = 2000;
        final int OUTPUT_HEIGHT = 2000;

        // Extract mockupType from file name if not provided
        if (mockupType == null || mockupType.isBlank()) {
            String origName = mockupFile.getOriginalFilename();
            String nameLc = origName == null ? "" : origName.toLowerCase();
            if (nameLc.contains("mobile")) mockupType = "mobile";
            else if (nameLc.contains("secondary")) mockupType = "secondary";
            else if (nameLc.contains("detail")) mockupType = "detail";
            else if (nameLc.contains("rsvp")) mockupType = "rsvp";
            else mockupType = "primary";
        }

        // Use style directly for all logic (no version mapping)
        String styleValue = (style != null) ? style.toLowerCase() : "wedding";

        // Default: print mockup region
        int placeX = 485;
        int placeY = 274;
        int placeWidth = 1032;
        int placeHeight = 1452;

        // Adjust region based on style if needed
        if (mockupType != null && mockupType.equalsIgnoreCase("mobile")) {
            placeX = 650;
            placeY = 286;
            placeWidth = 709;
            placeHeight = 1300;
            if (styleValue.equals("birthday")) {
                placeX -= 413;
                placeY += 68;
                placeWidth -= 32;
                placeHeight -= 54;
            }
        } else if (mockupType != null && mockupType.equalsIgnoreCase("secondary")) {
            placeX = 514;
            placeY = 256;
            if (styleValue.equals("birthday")) {
                placeY += 10;
            }
        } else {
            if (styleValue.equals("birthday")) {
                placeX -= 282;
                placeY += 28;
                placeWidth -= 40;
                placeHeight -= 124;
            }
        }

        BufferedImage mockup = ImageIO.read(mockupFile.getInputStream());
        BufferedImage product = ImageIO.read(productFile.getInputStream());

        Image scaledMockup = mockup.getScaledInstance(OUTPUT_WIDTH, OUTPUT_HEIGHT, Image.SCALE_SMOOTH);
        BufferedImage resizedMockup = new BufferedImage(OUTPUT_WIDTH, OUTPUT_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gMockup = resizedMockup.createGraphics();
        gMockup.drawImage(scaledMockup, 0, 0, null);
        gMockup.dispose();

        BufferedImage roundedProduct;
        if (mockupType != null && mockupType.equalsIgnoreCase("mobile")) {
            // Use Vn extracted from master mockup filename for mobile rounded-corner processing
            String arcStyle = deriveVersionFromMockupFilename(mockupFile.getOriginalFilename());
            roundedProduct = processMobileMockup(product, placeWidth, placeHeight, arcStyle);
        } else if (mockupType != null && mockupType.equalsIgnoreCase("secondary")) {
            roundedProduct = processSecondaryMockup(product);
        } else if (mockupType != null && (mockupType.equalsIgnoreCase("detail") || mockupType.equalsIgnoreCase("rsvp"))) {
            roundedProduct = processCustomMockups(product, placeWidth, placeHeight);
        } else {
            roundedProduct = processPrintMockup(product, placeWidth, placeHeight);
        }

        int targetW = roundedProduct.getWidth();
        int offsetX = placeX + (placeWidth - targetW) / 2;
        int offsetY = placeY;

        BufferedImage combined = new BufferedImage(OUTPUT_WIDTH, OUTPUT_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = combined.createGraphics();
        g.drawImage(resizedMockup, 0, 0, null);
        g.drawImage(roundedProduct, offsetX, offsetY, null);
        g.dispose();

        // Explicitly flush and nullify large objects after use
        if (mockup != null) mockup.flush();
        mockup = null;
        if (product != null) product.flush();
        product = null;
        if (resizedMockup != null) resizedMockup.flush();
        resizedMockup = null;
        if (roundedProduct != null) roundedProduct.flush();
        roundedProduct = null;

        StreamingResponseBody stream = outputStream -> {
            ImageIO.write(combined, "png", outputStream);
            combined.flush();
        };

        // Build filename per convention: BaseName_{Role}_V{Variant}_{Index}.png
        String baseName = deriveBaseNameFromMockupFilename(mockupFile.getOriginalFilename());
        String roleLabel = roleLabelFromMockupType(mockupType);
        String indexLabel = extractIndexFromProductFilename(productFile.getOriginalFilename());
        String indexWithPrefix = "NSL" + indexLabel;
        String variantLabel = deriveVersionFromMockupFilename(mockupFile.getOriginalFilename());
        boolean omitRole = baseContainsRoleToken(baseName, roleLabel);
        String finalName = omitRole
            ? String.format("%s_%s_%s.png", baseName, variantLabel, indexWithPrefix)
            : String.format("%s_%s_%s_%s.png", baseName, roleLabel, variantLabel, indexWithPrefix);

        return ResponseEntity.status(HttpStatus.OK)
            .contentType(MediaType.parseMediaType("image/png"))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + finalName + "\"")
            .body(stream);
    }

    private boolean baseContainsRoleToken(String baseName, String roleLabel) {
        if (baseName == null || roleLabel == null) return false;
        String[] tokens = baseName.split("_");
        for (String t : tokens) {
            if (t.equalsIgnoreCase(roleLabel)) return true;
        }
        return false;
    }

    private String deriveVersionFromMockupFilename(String filename) {
        String fallback = "V1";
        if (filename == null || filename.isBlank()) return fallback;
        String noExt = filename.contains(".") ? filename.substring(0, filename.lastIndexOf('.')) : filename;
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?i)(V\\d+)").matcher(noExt);
        if (m.find()) return m.group(1).toUpperCase();
        return fallback;
    }

    private String roleLabelFromMockupType(String mockupType) {
        if (mockupType == null) return "Primary";
        String mt = mockupType.trim().toLowerCase();
        if (mt.equals("mobile")) return "Mobile";
        if (mt.equals("secondary")) return "Secondary";
        return "Primary";
    }

    private String sanitizeForFile(String s) {
        if (s == null) return "Mockup_Image";
        String r = s.trim().replace(' ', '_');
        r = r.replaceAll("[^A-Za-z0-9_\\-]", "");
        return r.isBlank() ? "Mockup_Image" : r;
    }

    private String deriveBaseNameFromMockupFilename(String filename) {
        if (filename == null || filename.isBlank()) return "Mockup_Image";
        String name = filename;
        // strip extension
        String noExt = name.contains(".") ? name.substring(0, name.lastIndexOf('.')) : name;
        // remove trailing _P## or _M##
        String stripped = noExt.replaceAll("_(?:[PM])\\d+$", "");
        // also remove trailing _V# to avoid duplicate version in final name
        stripped = stripped.replaceAll("_V\\d+$", "");
        if (stripped.isBlank()) stripped = noExt;
        return sanitizeForFile(stripped);
    }

    private String extractIndexFromProductFilename(String filename) {
        String fallback = "01";
        if (filename == null || filename.isBlank()) return fallback;
        String noExt = filename.contains(".") ? filename.substring(0, filename.lastIndexOf('.')) : filename;
        String digits = noExt.replaceAll("^.*?(\\d+)$", "$1");
        if (digits != null && digits.matches("\\d+")) {
            return digits.length() == 1 ? "0" + digits : digits;
        }
        return fallback;
    }
}
