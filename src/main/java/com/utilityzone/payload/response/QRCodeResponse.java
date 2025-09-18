package com.utilityzone.payload.response;

public class QRCodeResponse {
    private byte[] qrCodeImage;
    private String format = "PNG";

    public QRCodeResponse(byte[] qrCodeImage) {
        this.qrCodeImage = qrCodeImage;
    }

    // Getters and Setters
    public byte[] getQrCodeImage() {
        return qrCodeImage;
    }

    public void setQrCodeImage(byte[] qrCodeImage) {
        this.qrCodeImage = qrCodeImage;
    }

    public String getFormat() {
        return format;
    }

    public void setFormat(String format) {
        this.format = format;
    }
}