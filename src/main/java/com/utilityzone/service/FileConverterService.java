package com.utilityzone.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;
import com.utilityzone.payload.request.FileConversionRequest;
import com.utilityzone.payload.response.FileConversionResponse;
import lombok.extern.slf4j.Slf4j;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;


@Slf4j
@Service
public class FileConverterService {

    public FileConversionResponse convertFile(FileConversionRequest request) throws IOException {
        if (request.getFileContent() == null || request.getFileContent().length == 0) {
            throw new IllegalArgumentException("No file content provided");
        }

        String sourceFormat = request.getSourceFormat().toLowerCase();
        String targetFormat = request.getTargetFormat().toLowerCase();
        byte[] content = request.getFileContent();
        String fileName = request.getFileName();

        byte[] convertedContent;
        String contentType;

        if ("docx".equals(sourceFormat) && "pdf".equals(targetFormat)) {
            convertedContent = convertDocxToPdf(content);
            contentType = "application/pdf";
        } else if ("pdf".equals(sourceFormat) && "docx".equals(targetFormat)) {
            convertedContent = convertPdfToDocx(content);
            contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
            throw new UnsupportedOperationException("Unsupported conversion: " + sourceFormat + " to " + targetFormat);
        }

        String outputFileName = fileName.substring(0, fileName.lastIndexOf(".")) + "." + targetFormat;

        return FileConversionResponse.builder()
                .convertedFile(convertedContent)
                .contentType(contentType)
                .fileName(outputFileName)
                .format(targetFormat)
                .build();
    }

    private byte[] convertDocxToPdf(byte[] content) throws IOException {
    try (ByteArrayInputStream bis = new ByteArrayInputStream(content);
         XWPFDocument docx = new XWPFDocument(bis);
         PDDocument pdfDoc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

        // Load Unicode font once from resources and embed it
        PDType0Font unicodeFont;
        try (InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf")) {
            if (fontStream == null) {
                throw new IOException("Font resource not found: /fonts/DejaVuSans.ttf");
            }
            unicodeFont = PDType0Font.load(pdfDoc, fontStream, true);
        }

        final float margin = 50f;
        final float fontSize = 12f;
        final float leading = fontSize * 1.2f; // line height
        PDPage page = new PDPage(PDRectangle.A4);
        pdfDoc.addPage(page);

        float pageWidth = page.getMediaBox().getWidth();
        float pageHeight = page.getMediaBox().getHeight();
        float curX = margin;
        float curY = pageHeight - margin;

        // Create initial content stream for page and begin text
        PDPageContentStream contentStream = new PDPageContentStream(pdfDoc, page);
        contentStream.setFont(unicodeFont, fontSize);
        contentStream.beginText();
        contentStream.newLineAtOffset(curX, curY);

        for (IBodyElement element : docx.getBodyElements()) {

            if (element instanceof XWPFParagraph) {
                XWPFParagraph para = (XWPFParagraph) element;
                String paragraphText = para.getText();

                // If paragraph has text, write it with wrapping
                if (paragraphText != null && !paragraphText.isBlank()) {
                    List<String> lines = wrapText(paragraphText, unicodeFont, fontSize, pageWidth - 2 * margin);
                    for (String lineText : lines) {
                        // Check page space
                        if (curY - leading <= margin) {
                            // finish current text block and close stream
                            contentStream.endText();
                            contentStream.close();

                            // new page
                            page = new PDPage(PDRectangle.A4);
                            pdfDoc.addPage(page);
                            pageWidth = page.getMediaBox().getWidth();
                            pageHeight = page.getMediaBox().getHeight();
                            curY = pageHeight - margin;

                            contentStream = new PDPageContentStream(pdfDoc, page);
                            contentStream.setFont(unicodeFont, fontSize);
                            contentStream.beginText();
                            contentStream.newLineAtOffset(curX, curY);
                        }

                        // show text on the active text block
                        contentStream.showText(lineText);
                        contentStream.newLineAtOffset(0, -leading);
                        curY -= leading;
                    }
                } else {
                    // empty paragraph -> add a blank line (spacing)
                    if (curY - leading <= margin) {
                        contentStream.endText();
                        contentStream.close();

                        page = new PDPage(PDRectangle.A4);
                        pdfDoc.addPage(page);
                        pageWidth = page.getMediaBox().getWidth();
                        pageHeight = page.getMediaBox().getHeight();
                        curY = pageHeight - margin;

                        contentStream = new PDPageContentStream(pdfDoc, page);
                        contentStream.setFont(unicodeFont, fontSize);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(curX, curY);
                    }
                    contentStream.newLineAtOffset(0, -leading);
                    curY -= leading;
                }

                // Now check runs for embedded pictures and render them inline
                for (XWPFRun run : para.getRuns()) {
                    List<XWPFPicture> pictures = run.getEmbeddedPictures();
                    for (XWPFPicture pic : pictures) {
                        XWPFPictureData picData = pic.getPictureData();
                        if (picData != null && picData.getData() != null && picData.getData().length > 0) {
                            // End text block before drawing image
                            try {
                                contentStream.endText();
                            } catch (IllegalStateException e) {
                                // ignore if already ended
                            }
                            // Create an image object
                            PDImageXObject pdImage = PDImageXObject.createFromByteArray(pdfDoc, picData.getData(), picData.getFileName());

                            // Scale to fit page width with margin
                            float availableWidth = pageWidth - 2 * margin;
                            float imageWidth = pdImage.getWidth();
                            float imageHeight = pdImage.getHeight();
                            float scale = Math.min(1.0f, availableWidth / imageWidth);
                            float drawWidth = imageWidth * scale;
                            float drawHeight = imageHeight * scale;

                            // If not enough vertical space, start new page
                            if (curY - drawHeight <= margin) {
                                page = new PDPage(PDRectangle.A4);
                                pdfDoc.addPage(page);
                                pageWidth = page.getMediaBox().getWidth();
                                pageHeight = page.getMediaBox().getHeight();
                                curY = pageHeight - margin;
                            }

                            // Draw image using an append-mode content stream
                            try (PDPageContentStream imgStream = new PDPageContentStream(pdfDoc, page,
                                    PDPageContentStream.AppendMode.APPEND, true)) {
                                imgStream.drawImage(pdImage, margin, curY - drawHeight, drawWidth, drawHeight);
                            }

                            // Advance Y after image
                            curY -= (drawHeight + leading);

                            // Resume text on the same page: create an append-mode content stream and begin text
                            contentStream = new PDPageContentStream(pdfDoc, page, PDPageContentStream.AppendMode.APPEND, true);
                            contentStream.setFont(unicodeFont, fontSize);
                            contentStream.beginText();
                            contentStream.newLineAtOffset(curX, curY);
                        }
                    }
                }

            } else if (element instanceof XWPFTable) {
                // Simple placeholder for table handling
                if (curY - leading <= margin) {
                    contentStream.endText();
                    contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    pdfDoc.addPage(page);
                    pageWidth = page.getMediaBox().getWidth();
                    pageHeight = page.getMediaBox().getHeight();
                    curY = pageHeight - margin;

                    contentStream = new PDPageContentStream(pdfDoc, page);
                    contentStream.setFont(unicodeFont, fontSize);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(curX, curY);
                }
                contentStream.showText("[Table omitted]");
                contentStream.newLineAtOffset(0, -leading);
                curY -= leading;
            }
        }

        // End text block if still open
        try {
            contentStream.endText();
        } catch (IllegalStateException e) {
            // ignore - means it was already ended (e.g. right after an image)
        }
        contentStream.close();

        pdfDoc.save(baos);
        return baos.toByteArray();
    }
}


    private byte[] convertPdfToDocx(byte[] content) throws IOException {
        try (PDDocument pdf = PDDocument.load(new ByteArrayInputStream(content));
             ByteArrayOutputStream out = new ByteArrayOutputStream();
             XWPFDocument document = new XWPFDocument()) {
            
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(pdf);

            XWPFParagraph para = document.createParagraph();
            XWPFRun run = para.createRun();
            run.setText(text);

            document.write(out);
            return out.toByteArray();
        }
    }

    private List<String> wrapText(String text, PDFont font, float fontSize, float maxWidth) throws IOException {
    List<String> lines = new ArrayList<>();
    String[] words = text.split("\\s+");
    StringBuilder line = new StringBuilder();

    for (String word : words) {
        String tentative = line.length() == 0 ? word : line + " " + word;
        float width = font.getStringWidth(tentative) / 1000f * fontSize;
        if (width <= maxWidth) {
            if (line.length() == 0) line.append(word);
            else line.append(' ').append(word);
        } else {
            if (line.length() > 0) {
                lines.add(line.toString());
                line.setLength(0);
            }
            // If single word longer than width, put it on its own line (crude fallback)
            if (font.getStringWidth(word) / 1000f * fontSize > maxWidth) {
                lines.add(word);
            } else {
                line.append(word);
            }
        }
    }
    if (line.length() > 0) lines.add(line.toString());
    return lines;
}

}