package com.utilityzone.controller;


import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.utilityzone.service.FileConverterService;
import com.utilityzone.payload.request.FileConversionRequest;
import com.utilityzone.payload.response.FileConversionResponse;
import com.utilityzone.exception.EmptyFileException;
import com.utilityzone.exception.InvalidFileFormatException;
import com.utilityzone.validation.ValidFileFormat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.Arrays;
import java.util.List;
import java.util.Map;



import java.io.IOException;

@Slf4j
@Validated
@RestController
@RequestMapping("/api/converter")
@RequiredArgsConstructor
public class FileConverterController {

    private final FileConverterService fileConverterService;

    @PostMapping(value = "/convert", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<byte[]> convertFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sourceFormat") @ValidFileFormat(allowedFormats = {"docx", "pdf"}, message = "Source format must be either 'docx' or 'pdf'") String sourceFormat,
            @RequestParam("targetFormat") @ValidFileFormat(allowedFormats = {"docx", "pdf"}, message = "Target format must be either 'docx' or 'pdf'") String targetFormat) throws IOException {
        log.info("Received conversion request - Source: {}, Target: {}, File name: {}, File size: {}",
                   sourceFormat, targetFormat, file.getOriginalFilename(), file.getSize());

        if (file.isEmpty()) {
            throw new EmptyFileException("The uploaded file is empty");
        }

        if (!isFormatSupported(sourceFormat, targetFormat)) {
            throw new InvalidFileFormatException(
                String.format("Conversion from %s to %s is not supported", sourceFormat, targetFormat)
            );
        }

        FileConversionRequest request = new FileConversionRequest();
        request.setFileContent(file.getBytes());
        request.setSourceFormat(sourceFormat);
        request.setTargetFormat(targetFormat);
        request.setFileName(file.getOriginalFilename());

        FileConversionResponse response = fileConverterService.convertFile(request);
        byte[] convertedFile = response.getConvertedFile();
        
        String outputFileName = getOutputFileName(file.getOriginalFilename(), targetFormat);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDisposition(ContentDisposition.builder("attachment")
                .filename(outputFileName)
                .build());
        
        log.info("File conversion successful. Output size: {} bytes", convertedFile.length);
        return new ResponseEntity<>(convertedFile, headers, HttpStatus.OK);
    }

    private String getOutputFileName(String originalFilename, String targetFormat) {
        if (originalFilename == null || originalFilename.isEmpty()) {
            return "converted." + targetFormat.toLowerCase();
        }
        
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            return originalFilename.substring(0, dotIndex) + "." + targetFormat.toLowerCase();
        }
        
        return originalFilename + "." + targetFormat.toLowerCase();
    }

    private boolean isFormatSupported(String sourceFormat, String targetFormat) {
        return (sourceFormat.equalsIgnoreCase("docx") && targetFormat.equalsIgnoreCase("pdf")) ||
               (sourceFormat.equalsIgnoreCase("pdf") && targetFormat.equalsIgnoreCase("docx"));
    }

    @GetMapping(value = "/supported-formats", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> getSupportedFormats() {
        List<Map<String, Object>> formats = Arrays.asList(
            Map.of(
                "sourceFormat", "docx",
                "targetFormats", List.of("pdf")
            ),
            Map.of(
                "sourceFormat", "pdf",
                "targetFormats", List.of("docx")
            )
        );
        
        Map<String, Object> response = Map.of(
            "supportedFormats", formats
        );
            
        return ResponseEntity.ok().body(response);
    }
}