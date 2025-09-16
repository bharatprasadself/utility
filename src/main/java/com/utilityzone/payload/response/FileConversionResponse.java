package com.utilityzone.payload.response;

public class FileConversionResponse {
    private byte[] convertedFile;
    private String fileName;
    private String format;

    public FileConversionResponse(byte[] convertedFile, String fileName, String format) {
        this.convertedFile = convertedFile;
        this.fileName = fileName;
        this.format = format;
    }

    // Getters and Setters
    public byte[] getConvertedFile() {
        return convertedFile;
    }

    public void setConvertedFile(byte[] convertedFile) {
        this.convertedFile = convertedFile;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }
}