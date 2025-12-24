package com.utilityzone.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequestMapping("/api/mockup-image")
public class MockupImageController {

    @PostMapping(value = "/merge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
        public ResponseEntity<byte[]> mergeProductImage(
            @RequestParam("mockup") MultipartFile mockupFile,
            @RequestParam("product") MultipartFile productFile,
            @RequestParam(value = "mockupType", required = false) String mockupType
        ) throws IOException {
        final int OUTPUT_WIDTH = 2000;
        final int OUTPUT_HEIGHT = 2000;

        // Default: print mockup region
        int placeX = 485;
        int placeY = 274;
        int placeWidth = 1032;
        int placeHeight = 1452;

        // If mobile, use different region (example values, adjust as needed)
        if (mockupType != null && mockupType.equalsIgnoreCase("mobile")) {
            placeX = 650;
            placeY = 284;
            placeWidth = 710;
            placeHeight = 1300;
        }

        BufferedImage mockup = ImageIO.read(mockupFile.getInputStream());
        BufferedImage product = ImageIO.read(productFile.getInputStream());

        // Resize mockup to 2000x2000 if needed
        Image scaledMockup = mockup.getScaledInstance(OUTPUT_WIDTH, OUTPUT_HEIGHT, Image.SCALE_SMOOTH);
        BufferedImage resizedMockup = new BufferedImage(OUTPUT_WIDTH, OUTPUT_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gMockup = resizedMockup.createGraphics();
        gMockup.drawImage(scaledMockup, 0, 0, null);
        gMockup.dispose();


        // Scale product image to fit region, no aspect ratio enforced
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

        // Align product image to top of region
        int offsetX = placeX + (placeWidth - targetW) / 2;
        int offsetY = placeY;

        // Create mask: round only the top left and top right corners
        int radius = Math.min(targetW, targetH) / 8; // Average corners for top rounding
        BufferedImage roundedProduct = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2 = roundedProduct.createGraphics();
        g2.setComposite(AlphaComposite.Clear);
        g2.fillRect(0, 0, targetW, targetH);
        g2.setComposite(AlphaComposite.SrcOver);
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        // Use RoundRectangle2D for top corners only
        java.awt.geom.RoundRectangle2D.Double roundRect = new java.awt.geom.RoundRectangle2D.Double(
            0, 0, targetW, targetH, 2*radius, 2*radius
        );
        // To round only the top corners, overlay rectangles to cover the bottom corners
        java.awt.geom.Area mask = new java.awt.geom.Area(roundRect);
        mask.add(new java.awt.geom.Area(new java.awt.Rectangle(0, targetH - radius, radius, radius)));
        mask.add(new java.awt.geom.Area(new java.awt.Rectangle(targetW - radius, targetH - radius, radius, radius)));
        g2.setClip(mask);
        g2.drawImage(productScaled, 0, 0, null);
        g2.dispose();

        BufferedImage combined = new BufferedImage(OUTPUT_WIDTH, OUTPUT_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = combined.createGraphics();
        g.drawImage(resizedMockup, 0, 0, null);
        g.drawImage(roundedProduct, offsetX, offsetY, null);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(combined, "png", baos);
        byte[] imageBytes = baos.toByteArray();

        return ResponseEntity.status(HttpStatus.OK)
            .contentType(MediaType.IMAGE_PNG)
            .body(imageBytes);
        }
}
