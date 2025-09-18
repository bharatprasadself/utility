package com.utilityzone.payload.request;

import jakarta.validation.constraints.NotBlank;

public class QRCodeRequest {
    @NotBlank(message = "Content for QR code is required")
    private String content;

    private int width = 300;  // default width
    private int height = 300; // default height

    // Getters and Setters
    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }
}