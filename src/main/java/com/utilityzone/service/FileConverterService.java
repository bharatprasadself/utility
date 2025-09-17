package com.utilityzone.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import java.awt.Color;
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

        // load unicode font
        PDType0Font unicodeFont;
        try (InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf")) {
            if (fontStream == null) throw new IOException("Font not found: /fonts/DejaVuSans.ttf");
            unicodeFont = PDType0Font.load(pdfDoc, fontStream, true);
        }

        final float margin = 50f;
        final float defaultFontSize = 12f;
        final float leadingFactor = 1.2f;

        PDPage page = new PDPage(PDRectangle.A4);
        pdfDoc.addPage(page);

        float pageWidth = page.getMediaBox().getWidth();
        float pageHeight = page.getMediaBox().getHeight();
        float curX = margin;
        float curY = pageHeight - margin;

    PDPageContentStream contentStream = new PDPageContentStream(pdfDoc, page);
    contentStream.setFont(unicodeFont, defaultFontSize);
    contentStream.beginText();
    contentStream.newLineAtOffset(curX, curY);

        for (IBodyElement element : docx.getBodyElements()) {
            if (element instanceof XWPFParagraph) {
                XWPFParagraph para = (XWPFParagraph) element;

                List<XWPFRun> runs = para.getRuns();
                if (runs == null || runs.isEmpty()) {
                    // paragraph gap
                    float gap = defaultFontSize * 0.5f;
                    if (curY - gap <= margin) {
                        // new page
                        try { contentStream.endText(); } catch (IllegalStateException ignored) {}
                        if (contentStream != null) contentStream.close();
                        page = new PDPage(PDRectangle.A4);
                        pdfDoc.addPage(page);
                        pageWidth = page.getMediaBox().getWidth();
                        pageHeight = page.getMediaBox().getHeight();
                        curY = pageHeight - margin;
                        contentStream = new PDPageContentStream(pdfDoc, page);
                        contentStream.setFont(unicodeFont, defaultFontSize);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(curX, curY);
                    } else {
                        contentStream.newLineAtOffset(0, -gap);
                        curY -= gap;
                    }
                    continue;
                }

                for (XWPFRun run : runs) {
                    String runText = run.getText(0);
                    if (runText == null) runText = "";

                    // determine run font size (fallback to default)
                    int poiFontSize = run.getFontSize();
                    float runFontSize = (poiFontSize > 0) ? poiFontSize : defaultFontSize;
                    float leading = runFontSize * leadingFactor;

                    // determine run color
                    Color runColor = null;
                    String hex = run.getColor();
                    if (hex != null && !hex.isBlank()) {
                        try {
                            if (hex.startsWith("#")) hex = hex.substring(1);
                            int rgb = Integer.parseInt(hex, 16);
                            runColor = new Color((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
                        } catch (Exception ex) {
                            runColor = null;
                        }
                    }

                    // preserve explicit line breaks inside run
                    String[] logicalLines = runText.split("\\R", -1);
                    for (int li = 0; li < logicalLines.length; li++) {
                        String logicalLine = logicalLines[li];

                        // wrap lines according to run font size
                        List<String> wrapped = wrapText(logicalLine, unicodeFont, runFontSize, pageWidth - 2 * margin);

                        for (String lineChunk : wrapped) {
                            // ensure space on page
                            if (curY - leading <= margin) {
                                try { contentStream.endText(); } catch (IllegalStateException ignored) {}
                                if (contentStream != null) contentStream.close();
                                page = new PDPage(PDRectangle.A4);
                                pdfDoc.addPage(page);
                                pageWidth = page.getMediaBox().getWidth();
                                pageHeight = page.getMediaBox().getHeight();
                                curY = pageHeight - margin;
                                contentStream = new PDPageContentStream(pdfDoc, page);
                                contentStream.setFont(unicodeFont, runFontSize);
                                contentStream.beginText();
                                contentStream.newLineAtOffset(curX, curY);
                            }

                            // set run-specific font size & color BEFORE writing
                            contentStream.setFont(unicodeFont, runFontSize);
                            if (runColor != null) contentStream.setNonStrokingColor(runColor);
                            else contentStream.setNonStrokingColor(Color.BLACK);

                            // show text (we are in text mode)
                            contentStream.showText(lineChunk);
                            contentStream.newLineAtOffset(0, -leading);
                            curY -= leading;
                        }
                    }

                    // handle images embedded in this run (if any)
                    for (XWPFPicture pic : run.getEmbeddedPictures()) {
                        XWPFPictureData picData = pic.getPictureData();
                        if (picData == null || picData.getData() == null || picData.getData().length == 0) continue;

                        // end text block before drawing
                        try { contentStream.endText(); } catch (IllegalStateException ignored) {}

                        PDImageXObject pdImage = PDImageXObject.createFromByteArray(pdfDoc, picData.getData(), picData.getFileName());
                        float availableWidth = pageWidth - 2 * margin;
                        float imageWidth = pdImage.getWidth();
                        float imageHeight = pdImage.getHeight();
                        float scale = Math.min(1.0f, availableWidth / imageWidth);
                        float drawW = imageWidth * scale;
                        float drawH = imageHeight * scale;

                        if (curY - drawH <= margin) {
                            page = new PDPage(PDRectangle.A4);
                            pdfDoc.addPage(page);
                            pageWidth = page.getMediaBox().getWidth();
                            pageHeight = page.getMediaBox().getHeight();
                            curY = pageHeight - margin;
                        }

                        try (PDPageContentStream imgStream = new PDPageContentStream(pdfDoc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                            imgStream.drawImage(pdImage, margin, curY - drawH, drawW, drawH);
                        }
                        curY -= (drawH + 6f);
                        // resume text: close previous contentStream if open, then open new one
                        if (contentStream != null) contentStream.close();
                        contentStream = new PDPageContentStream(pdfDoc, page, PDPageContentStream.AppendMode.APPEND, true);
                        contentStream.setFont(unicodeFont, defaultFontSize);
                        contentStream.beginText();
                        contentStream.newLineAtOffset(curX, curY);
                    }
                }

                // paragraph spacing after runs
                float paraSpacing = defaultFontSize * 0.5f;
                if (curY - paraSpacing <= margin) {
                    try { contentStream.endText(); } catch (IllegalStateException ignored) {}
                    if (contentStream != null) contentStream.close();
                    page = new PDPage(PDRectangle.A4);
                    pdfDoc.addPage(page);
                    curY = page.getMediaBox().getHeight() - margin;
                    contentStream = new PDPageContentStream(pdfDoc, page);
                    contentStream.setFont(unicodeFont, defaultFontSize);
                    contentStream.beginText();
                    contentStream.newLineAtOffset(curX, curY);
                } else {
                    contentStream.newLineAtOffset(0, -paraSpacing);
                    curY -= paraSpacing;
                }

            } else if (element instanceof XWPFTable) {
                // Render the table using the helper
                try { contentStream.endText(); } catch (IllegalStateException ignored) {}
                if (contentStream != null) contentStream.close();
                float[] curYRef = new float[] { curY };
                renderTableToPdf((XWPFTable) element, pdfDoc, page, unicodeFont, defaultFontSize, margin, pageWidth, curYRef);
                curY = curYRef[0];
                // Resume text after table
                contentStream = new PDPageContentStream(pdfDoc, page, PDPageContentStream.AppendMode.APPEND, true);
                contentStream.setFont(unicodeFont, defaultFontSize);
                contentStream.beginText();
                contentStream.newLineAtOffset(curX, curY);
            }
        }

        // finalize
        if (contentStream != null) {
            try { 
                contentStream.endText(); 
            } catch (IllegalStateException ignored) {

            } finally {
                if (contentStream != null) {
                    contentStream.close();
                }
            }
        }

        // PDFBox requires all content streams (including those for images) to be closed before saving
        // All image streams are already closed in try-with-resources blocks above
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
    if (text == null || text.isEmpty()) return lines;

    String[] words = text.split("\\s+");
    StringBuilder line = new StringBuilder();
    for (String w : words) {
        String tentative = line.length() == 0 ? w : line + " " + w;
        float width = font.getStringWidth(tentative) / 1000f * fontSize;
        if (width <= maxWidth) {
            if (line.length() == 0) line.append(w);
            else line.append(' ').append(w);
        } else {
            if (line.length() > 0) {
                lines.add(line.toString());
                line.setLength(0);
            }
            // if single word is longer than maxWidth, put it alone
            if (font.getStringWidth(w) / 1000f * fontSize > maxWidth) {
                lines.add(w);
            } else {
                line.append(w);
            }
        }
    }
    if (line.length() > 0) lines.add(line.toString());
    return lines;
}

    // Helper to render a table to PDF with improved text wrapping and dynamic row height
    private void renderTableToPdf(XWPFTable table, PDDocument pdfDoc, PDPage page, PDType0Font font, float fontSize, float margin, float pageWidth, float[] curYRef) throws IOException {
        float cellPadding = 4f;
        float tableWidth = pageWidth - 2 * margin;
        int numCols = table.getRow(0).getTableCells().size();
        float cellWidth = tableWidth / numCols;
        float y = curYRef[0];
        float lineSpacing = fontSize + 2;
        float rowGap = 2f;

        for (XWPFTableRow row : table.getRows()) {
            float x = margin;
            // Calculate max number of lines in any cell in this row
            int maxLines = 1;
            List<List<String>> wrappedCellLines = new ArrayList<>();
            for (XWPFTableCell cell : row.getTableCells()) {
                String cellText = cell.getText();
                List<String> lines = wrapText(cellText != null ? cellText : "", font, fontSize, cellWidth - 2 * cellPadding);
                wrappedCellLines.add(lines);
                if (lines.size() > maxLines) maxLines = lines.size();
            }
            float maxRowHeight = maxLines * lineSpacing + 2 * cellPadding;
            // Page break if needed
            if (y - maxRowHeight <= margin) {
                page = new PDPage(PDRectangle.A4);
                pdfDoc.addPage(page);
                y = page.getMediaBox().getHeight() - margin;
            }
            // Draw each cell
            for (int ci = 0; ci < row.getTableCells().size(); ci++) {
                XWPFTableCell cell = row.getCell(ci);
                // Draw cell border
                try (PDPageContentStream borderStream = new PDPageContentStream(pdfDoc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                    borderStream.setStrokingColor(0, 0, 0);
                    borderStream.addRect(x, y - maxRowHeight, cellWidth, maxRowHeight);
                    borderStream.stroke();
                }
                // Write cell text with wrapping, top-aligned
                List<String> lines = wrappedCellLines.get(ci);
                float textY = y - cellPadding - fontSize;
                try (PDPageContentStream textStream = new PDPageContentStream(pdfDoc, page, PDPageContentStream.AppendMode.APPEND, true)) {
                    textStream.setFont(font, fontSize);
                    for (String line : lines) {
                        textStream.beginText();
                        textStream.newLineAtOffset(x + cellPadding, textY);
                        textStream.showText(line);
                        textStream.endText();
                        textY -= lineSpacing;
                    }
                }
                x += cellWidth;
            }
            y -= (maxRowHeight + rowGap);
        }
        curYRef[0] = y;
    }

}