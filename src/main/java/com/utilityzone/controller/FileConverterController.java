package com.utilityzone.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.utilityzone.payload.request.FileConversionRequest;
import com.utilityzone.payload.response.FileConversionResponse;
import com.utilityzone.service.FileConverterService;

import jakarta.validation.Valid;
import java.io.IOException;

@RestController
@RequestMapping("/api/converter")
public class FileConverterController {

    @Autowired
    private FileConverterService fileConverterService;

    @PostMapping(value = "/convert")
    public ResponseEntity<?> convertFile(@RequestParam("file") MultipartFile file,
                                       @RequestParam("sourceFormat") String sourceFormat,
                                       @RequestParam("targetFormat") String targetFormat) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please select a file to convert");
        }
        
        if (file.getSize() > 10 * 1024 * 1024) { // 10MB in bytes
            return ResponseEntity.badRequest().body("File size exceeds maximum limit of 10MB");
        }

        // Validate formats
        sourceFormat = sourceFormat.toLowerCase();
        targetFormat = targetFormat.toLowerCase();
        
        // Get original filename without extension
        String originalFilename = file.getOriginalFilename();
        String baseFilename = originalFilename != null ? 
            originalFilename.replaceFirst("[.][^.]+$", "") : 
            "converted";

        try {
            FileConversionRequest request = new FileConversionRequest();
            request.setFileContent(file.getBytes());
            request.setFileName(file.getOriginalFilename());
            request.setSourceFormat(sourceFormat);
            request.setTargetFormat(targetFormat);

            FileConversionResponse response = fileConverterService.convertFile(request);

            String outputFilename = baseFilename + "." + targetFormat;
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + outputFilename + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(response.getConvertedFile());

        } catch (IOException e) {
            return ResponseEntity.badRequest().body("Error converting file: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/supported-formats")
    public ResponseEntity<?> getSupportedFormats() {
        return ResponseEntity.ok()
            .body(new String[][] {
                {"docx", "pdf"},
                {"pdf", "docx"}
            });
    }
}