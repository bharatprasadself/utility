package com.utilityzone.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class FileConversionRequest {
    @NotNull(message = "Source file content is required")
    private byte[] fileContent;

    @NotBlank(message = "Source file type is required")
    private String sourceFormat;

    @NotBlank(message = "Target file type is required")
    private String targetFormat;

    @NotBlank(message = "File name is required")
    private String fileName;

    // Getters and Setters
    public byte[] getFileContent() {
        return fileContent;
    }

    public void setFileContent(byte[] fileContent) {
        this.fileContent = fileContent;
    }

    public String getSourceFormat() {
        return sourceFormat;
    }

    public void setSourceFormat(String sourceFormat) {
        this.sourceFormat = sourceFormat;
    }

    public String getTargetFormat() {
        return targetFormat;
    }

    public void setTargetFormat(String targetFormat) {
        this.targetFormat = targetFormat;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}