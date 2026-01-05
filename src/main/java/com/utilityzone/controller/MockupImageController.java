package com.utilityzone.controller;


import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api/mockup-image")
public class MockupImageController {
        // Secondary mockup: placeholder logic, can be customized
        private BufferedImage processSecondaryMockup(BufferedImage product) {
            // Use default print mockup region
            
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

    @PostMapping(value = "/merge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<StreamingResponseBody> mergeProductImage(
        @RequestParam("mockup") MultipartFile mockupFile,
        @RequestParam("product") MultipartFile productFile,
        @RequestParam(value = "mockupType", required = false) String mockupType,
        @RequestParam(value = "version", required = false) String version
    ) throws IOException {
        final int OUTPUT_WIDTH = 2000;
        final int OUTPUT_HEIGHT = 2000;

        // Default: print mockup region
        int placeX = 485;
        int placeY = 274;
        int placeWidth = 1032;
        int placeHeight = 1452;

        // Example: adjust region based on version if needed
        if (mockupType != null && mockupType.equalsIgnoreCase("mobile")) {
            placeX = 650;
            placeY = 286;
            placeWidth = 709;
            placeHeight = 1300;
            if (version != null && version.equalsIgnoreCase("V2")) {
                placeX -= 413;
                placeY += 68;
                placeWidth -= 32;
                placeHeight -= 54;
            }
        } else if (mockupType != null && mockupType.equalsIgnoreCase("secondary")) {
            placeX = 514;
            placeY = 256;
            if (version != null && version.equalsIgnoreCase("V2")) {
                placeY += 10;
            }
        } else {
            if (version != null && version.equalsIgnoreCase("V2")) {
                placeX -= 280;
                placeY += 30;
                placeWidth -= 42;
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
            roundedProduct = processMobileMockup(product, placeWidth, placeHeight, version);
        } else if (mockupType != null && mockupType.equalsIgnoreCase("secondary")) {
            roundedProduct = processSecondaryMockup(product);
        } else {
            roundedProduct = processPrintMockup(product, placeWidth, placeHeight);
        }

        int targetW = roundedProduct.getWidth();
        int targetH = roundedProduct.getHeight();
        int offsetX = placeX + (placeWidth - targetW) / 2;
        int offsetY = placeY;

        BufferedImage combined = new BufferedImage(OUTPUT_WIDTH, OUTPUT_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = combined.createGraphics();
        g.drawImage(resizedMockup, 0, 0, null);
        g.drawImage(roundedProduct, offsetX, offsetY, null);
        g.dispose();

        // Explicitly nullify large objects after use
        mockup = null;
        product = null;
        scaledMockup = null;
        resizedMockup = null;
        roundedProduct = null;

        StreamingResponseBody stream = outputStream -> {
            ImageIO.write(combined, "png", outputStream);
            // Explicitly nullify combined after streaming
            combined.flush();
        };

        return ResponseEntity.status(HttpStatus.OK)
            .contentType(MediaType.IMAGE_PNG)
            .body(stream);
    }
}
