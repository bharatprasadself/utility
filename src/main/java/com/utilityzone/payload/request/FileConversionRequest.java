package com.utilityzone.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FileConversionRequest {
    @NotNull(message = "File content is required")
    private byte[] fileContent;

    @NotBlank(message = "File name is required")
    private String fileName;

    @NotBlank(message = "Source file type is required")
    private String sourceFormat;

    @NotBlank(message = "Target file type is required")
    private String targetFormat;
}