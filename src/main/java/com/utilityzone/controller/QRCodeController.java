package com.utilityzone.controller;

import com.google.zxing.WriterException;
import com.utilityzone.payload.request.QRCodeRequest;
import com.utilityzone.payload.response.QRCodeResponse;
import com.utilityzone.service.QRCodeService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.io.IOException;

@RestController
@RequestMapping("/api/qrcode")
public class QRCodeController {

    @Autowired
    private QRCodeService qrCodeService;

    @PostMapping("/generate")
    public ResponseEntity<?> generateQRCode(@Valid @RequestBody QRCodeRequest request) {
        try {
            QRCodeResponse response = qrCodeService.generateQRCode(request);
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"qrcode.png\"")
                    .contentType(MediaType.IMAGE_PNG)
                    .body(response.getQrCodeImage());

        } catch (WriterException | IOException e) {
            return ResponseEntity.badRequest().body("Error generating QR code: " + e.getMessage());
        }
    }
}