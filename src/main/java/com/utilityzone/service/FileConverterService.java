package com.utilityzone.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.springframework.stereotype.Service;

import com.utilityzone.payload.request.FileConversionRequest;
import com.utilityzone.payload.response.FileConversionResponse;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
public class FileConverterService {

    public FileConversionResponse convertFile(FileConversionRequest request) throws IOException {
        byte[] convertedFile;
        
        switch (request.getSourceFormat().toLowerCase()) {
            case "docx":
                if ("pdf".equals(request.getTargetFormat().toLowerCase())) {
                    convertedFile = convertDocxToPdf(request.getFileContent());
                } else {
                    throw new IllegalArgumentException("Unsupported conversion format");
                }
                break;
            case "pdf":
                if ("docx".equals(request.getTargetFormat().toLowerCase())) {
                    convertedFile = convertPdfToDocx(request.getFileContent());
                } else {
                    throw new IllegalArgumentException("Unsupported conversion format");
                }
                break;
            default:
                throw new IllegalArgumentException("Unsupported source format");
        }

        String newFileName = changeFileExtension(request.getFileName(), request.getTargetFormat());
        return new FileConversionResponse(convertedFile, newFileName, request.getTargetFormat());
    }

    private byte[] convertDocxToPdf(byte[] content) throws IOException {
        try (ByteArrayInputStream bis = new ByteArrayInputStream(content);
             XWPFDocument document = new XWPFDocument(bis);
             PDDocument pdfDocument = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            float margin = 50f;
            float yPosition;
            PDRectangle pageSize = PDRectangle.A4;
            float pageHeight = pageSize.getHeight();
            float lineHeight = 15f;
            float fontSize = 12f;
            
            PDPage currentPage = new PDPage(pageSize);
            pdfDocument.addPage(currentPage);
            PDPageContentStream contentStream = new PDPageContentStream(pdfDocument, currentPage);
            
            contentStream.beginText();
            contentStream.setFont(PDType1Font.HELVETICA, fontSize);
            yPosition = pageHeight - margin;
            contentStream.newLineAtOffset(margin, yPosition);

            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String text = paragraph.getText().trim();
                if (text.isEmpty()) {
                    yPosition -= lineHeight;
                    if (yPosition < margin) {
                        // Start new page
                        contentStream.endText();
                        contentStream.close();
                        currentPage = new PDPage(pageSize);
                        pdfDocument.addPage(currentPage);
                        contentStream = new PDPageContentStream(pdfDocument, currentPage);
                        contentStream.beginText();
                        contentStream.setFont(PDType1Font.HELVETICA, fontSize);
                        yPosition = pageHeight - margin;
                        contentStream.newLineAtOffset(margin, yPosition);
                    }
                    continue;
                }

                // Split long paragraphs into lines that fit the page width
                String[] words = text.split(" ");
                StringBuilder line = new StringBuilder();
                
                for (String word : words) {
                    if (line.length() + word.length() + 1 > 80) { // Approximate characters per line
                        contentStream.showText(line.toString());
                        yPosition -= lineHeight;
                        
                        if (yPosition < margin) {
                            // Start new page
                            contentStream.endText();
                            contentStream.close();
                            currentPage = new PDPage(pageSize);
                            pdfDocument.addPage(currentPage);
                            contentStream = new PDPageContentStream(pdfDocument, currentPage);
                            contentStream.beginText();
                            contentStream.setFont(PDType1Font.HELVETICA, fontSize);
                            yPosition = pageHeight - margin;
                            contentStream.newLineAtOffset(margin, yPosition);
                        }
                        
                        contentStream.newLineAtOffset(0f, -lineHeight);
                        line = new StringBuilder(word + " ");
                    } else {
                        line.append(word).append(" ");
                    }
                }
                
                if (line.length() > 0) {
                    contentStream.showText(line.toString().trim());
                    yPosition -= lineHeight * 1.5f;
                    
                    if (yPosition < margin) {
                        // Start new page
                        contentStream.endText();
                        contentStream.close();
                        currentPage = new PDPage(pageSize);
                        pdfDocument.addPage(currentPage);
                        contentStream = new PDPageContentStream(pdfDocument, currentPage);
                        contentStream.beginText();
                        contentStream.setFont(PDType1Font.HELVETICA, fontSize);
                        yPosition = pageHeight - margin;
                        contentStream.newLineAtOffset(margin, yPosition);
                    } else {
                        contentStream.newLineAtOffset(0f, -lineHeight * 1.5f);
                    }
                }
            }

            contentStream.endText();
            contentStream.close();
            
            pdfDocument.save(outputStream);
            return outputStream.toByteArray();
        }
    }

    public byte[] convertPdfToDocx(byte[] input) throws IOException {
        // Create a new DOCX document
        XWPFDocument document = new XWPFDocument();

        // Load the PDF
        try (PDDocument pdf = PDDocument.load(input)) {
            // Create PDF text stripper to extract text
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            // Extract text from PDF
            String pdfText = stripper.getText(pdf);
            
            // Split text into paragraphs based on double line breaks
            String[] paragraphs = pdfText.split("\\n\\s*\\n");

            // Create paragraphs in the word document
            for (String text : paragraphs) {
                if (!text.trim().isEmpty()) {
                    XWPFParagraph paragraph = document.createParagraph();
                    paragraph.setAlignment(ParagraphAlignment.LEFT);
                    
                    XWPFRun run = paragraph.createRun();
                    run.setFontFamily("Times New Roman");
                    run.setFontSize(12);
                    run.setText(text.trim());
                }
            }
        }

        // Save the DOCX to a byte array
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            document.write(out);
            return out.toByteArray();
        }
    }

    private String changeFileExtension(String fileName, String newExtension) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot != -1) {
            return fileName.substring(0, lastDot + 1) + newExtension;
        }
        return fileName + "." + newExtension;
    }
}