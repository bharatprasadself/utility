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

    // Fixed region for product image placement (example values)
    private static final int PLACE_X = 485;
    private static final int PLACE_Y = 274;
    private static final int PLACE_WIDTH = 1032;
    private static final int PLACE_HEIGHT = 1452;

    @PostMapping(value = "/merge", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> mergeProductImage(
            @RequestParam("mockup") MultipartFile mockupFile,
            @RequestParam("product") MultipartFile productFile
    ) throws IOException {
        final int OUTPUT_WIDTH = 2000;
        final int OUTPUT_HEIGHT = 2000;

        BufferedImage mockup = ImageIO.read(mockupFile.getInputStream());
        BufferedImage product = ImageIO.read(productFile.getInputStream());

        // Resize mockup to 2000x2000 if needed
        Image scaledMockup = mockup.getScaledInstance(OUTPUT_WIDTH, OUTPUT_HEIGHT, Image.SCALE_SMOOTH);
        BufferedImage resizedMockup = new BufferedImage(OUTPUT_WIDTH, OUTPUT_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D gMockup = resizedMockup.createGraphics();
        gMockup.drawImage(scaledMockup, 0, 0, null);
        gMockup.dispose();

        // Resize product image to fit the fixed region
        Image scaledProduct = product.getScaledInstance(PLACE_WIDTH, PLACE_HEIGHT, Image.SCALE_SMOOTH);
        BufferedImage combined = new BufferedImage(OUTPUT_WIDTH, OUTPUT_HEIGHT, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = combined.createGraphics();
        g.drawImage(resizedMockup, 0, 0, null);
        g.drawImage(scaledProduct, PLACE_X, PLACE_Y, null);
        g.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(combined, "png", baos);
        byte[] imageBytes = baos.toByteArray();

        return ResponseEntity.status(HttpStatus.OK)
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes);
    }
}
