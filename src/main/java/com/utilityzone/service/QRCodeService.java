package com.utilityzone.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.utilityzone.payload.request.QRCodeRequest;
import com.utilityzone.payload.response.QRCodeResponse;

import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class QRCodeService {

    public QRCodeResponse generateQRCode(QRCodeRequest request) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(
            request.getContent(),
            BarcodeFormat.QR_CODE,
            request.getWidth(),
            request.getHeight()
        );

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);

        return new QRCodeResponse(outputStream.toByteArray());
    }
}