package com.utilityzone.service;
// Required imports (add these at top of your class file)
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import com.utilityzone.payload.request.FileConversionRequest;
import com.utilityzone.payload.response.FileConversionResponse;

import lombok.extern.slf4j.Slf4j;

import java.awt.Color;
import java.io.*;
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

private byte[] convertPdfToDocx(byte[] content) throws IOException {
        try (PDDocument pdf = PDDocument.load(new ByteArrayInputStream(content));
             ByteArrayOutputStream out = new ByteArrayOutputStream();
             XWPFDocument document = new XWPFDocument()) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(pdf);

            // Split into lines and try to preserve line breaks
            String[] lines = text.split("\r?\n");
            for (String line : lines) {
                // Only treat as table if there are at least 2 tab characters
                int tabCount = line.length() - line.replace("\t", "").length();
                if (tabCount >= 2) {
                    String[] cells = line.split("\t");
                    XWPFTable table = document.createTable(1, cells.length);
                    XWPFTableRow row = table.getRow(0);
                    for (int i = 0; i < cells.length; i++) {
                        row.getCell(i).setText(cells[i].trim());
                    }
                } else {
                    XWPFParagraph para = document.createParagraph();
                    XWPFRun run = para.createRun();
                    run.setText(line);
                }
            }

            document.write(out);
            return out.toByteArray();
        }
    }

private byte[] convertDocxToPdf(byte[] content) throws IOException {
    try (ByteArrayInputStream bis = new ByteArrayInputStream(content);
         XWPFDocument docx = new XWPFDocument(bis);
         PDDocument pdfDoc = new PDDocument();
         ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

        // Load embedded font (change file/name if needed)
        PDType0Font unicodeFont;
        try (InputStream fontStream = getClass().getResourceAsStream("/fonts/DejaVuSans.ttf")) {
            if (fontStream == null) {
                throw new IOException("Font resource not found: /fonts/DejaVuSans.ttf");
            }
            unicodeFont = PDType0Font.load(pdfDoc, fontStream, true);
        }

        // layout constants
        final float margin = 50f;
        final float defaultFontSize = 12f;
        final float leadingFactor = 1.2f;

    // create first page and content stream
    PDPage page = new PDPage(PDRectangle.A4);
    pdfDoc.addPage(page);

    State st = new State();
    st.pdfDoc = pdfDoc;
    st.page = page;
    st.font = unicodeFont;
    st.pageWidth = page.getMediaBox().getWidth();
    st.pageHeight = page.getMediaBox().getHeight();
    st.curX = margin;
    st.curY = st.pageHeight - margin;

    st.contentStream = new PDPageContentStream(pdfDoc, st.page);
    st.contentStream.setFont(st.font, defaultFontSize);
    st.contentStream.beginText();
    st.contentStream.newLineAtOffset(st.curX, st.curY);

        try {
            // process headers
            for (XWPFHeader header : docx.getHeaderList()) {
                for (XWPFParagraph p : header.getParagraphs()) {
                    processParagraph(p, st, defaultFontSize, leadingFactor, margin);
                }
            }

            // main body elements
            for (IBodyElement element : docx.getBodyElements()) {
                if (element instanceof XWPFParagraph) {
                    processParagraph((XWPFParagraph) element, st, defaultFontSize, leadingFactor, margin);
                } else if (element instanceof XWPFTable) {
                    processTable((XWPFTable) element, st, defaultFontSize, leadingFactor, margin);
                }
            }

            // process footers
            for (XWPFFooter footer : docx.getFooterList()) {
                for (XWPFParagraph p : footer.getParagraphs()) {
                    processParagraph(p, st, defaultFontSize, leadingFactor, margin);
                }
            }
        } finally {
            // Always close the last content stream before saving
            if (st.contentStream != null) {
                try { st.contentStream.endText(); } catch (IllegalStateException ignored) {}
                try { st.contentStream.close(); } catch (Exception ignored) {}
                st.contentStream = null;
            }
        }

        pdfDoc.save(baos);
        return baos.toByteArray();
    }
}


// The following helper implementations assume you add a private static inner class `State` to your service:
 private static class State {
    PDDocument pdfDoc;
    PDPage page;
    PDPageContentStream contentStream;
    float curX, curY, pageWidth, pageHeight;
    PDType0Font font;
 }

/*
 * Helper: processParagraph (actual implementation that uses State)
 */
private void processParagraph(XWPFParagraph para, State st, float defaultFontSize, float leadingFactor, float margin) throws IOException {
    List<XWPFRun> runs = para.getRuns();
    // if no runs -> blank paragraph (add spacing)
    if (runs == null || runs.isEmpty()) {
        float gap = defaultFontSize * 0.5f;
        ensureSpaceOrNewPage(st, gap, margin, defaultFontSize);
        newLine(st, gap);
        return;
    }

    for (XWPFRun run : runs) {
        String runText = extractRunText(run);
        if (runText == null) runText = "";

        // run-level font size
        int poiSize = run.getFontSize();
        float runFontSize = poiSize > 0 ? poiSize : defaultFontSize;
        float leading = runFontSize * leadingFactor;

        // run color
        Color runColor = parseColor(run.getColor());

        // split by explicit newlines
        String[] logicalLines = runText.split("\\R", -1);
        for (String logicalLine : logicalLines) {
            List<String> wrapped = wrapText(logicalLine, st.font, runFontSize, st.pageWidth - 2 * margin);
            for (String chunk : wrapped) {
                if (st.curY - leading <= margin) {
                    // new page
                    closeTextSafe(st);
                    if (st.contentStream != null) { try { st.contentStream.close(); } catch (Exception ignored) {} }
                    st.page = new PDPage(PDRectangle.A4);
                    st.pdfDoc.addPage(st.page);
                    st.pageWidth = st.page.getMediaBox().getWidth();
                    st.pageHeight = st.page.getMediaBox().getHeight();
                    st.curY = st.pageHeight - margin;

                    st.contentStream = new PDPageContentStream(st.pdfDoc, st.page);
                    st.contentStream.setFont(st.font, runFontSize);
                    st.contentStream.beginText();
                    st.contentStream.newLineAtOffset(st.curX, st.curY);
                }

                // set run-specific font size & color BEFORE writing
                st.contentStream.setFont(st.font, runFontSize);
                if (runColor != null) st.contentStream.setNonStrokingColor(runColor);
                else st.contentStream.setNonStrokingColor(Color.BLACK);

                // write chunk
                st.contentStream.showText(chunk);
                st.contentStream.newLineAtOffset(0, -leading);
                st.curY -= leading;
            }
        }

        // images in this run
        for (XWPFPicture pic : run.getEmbeddedPictures()) {
            XWPFPictureData pd = pic.getPictureData();
            if (pd == null || pd.getData() == null || pd.getData().length == 0) continue;

            // end text and draw image
            closeTextSafe(st);
            if (st.contentStream != null) { try { st.contentStream.close(); } catch (Exception ignored) {} }

            PDImageXObject pdImg = PDImageXObject.createFromByteArray(st.pdfDoc, pd.getData(), pd.getFileName());
            float availableWidth = st.pageWidth - 2 * margin;
            float imgW = pdImg.getWidth();
            float imgH = pdImg.getHeight();
            float scale = Math.min(1.0f, availableWidth / imgW);
            float drawW = imgW * scale;
            float drawH = imgH * scale;

            if (st.curY - drawH <= margin) {
                st.page = new PDPage(PDRectangle.A4);
                st.pdfDoc.addPage(st.page);
                st.pageWidth = st.page.getMediaBox().getWidth();
                st.pageHeight = st.page.getMediaBox().getHeight();
                st.curY = st.pageHeight - margin;
            }

            try (PDPageContentStream imgStream = new PDPageContentStream(st.pdfDoc, st.page, AppendMode.APPEND, true)) {
                imgStream.drawImage(pdImg, margin, st.curY - drawH, drawW, drawH);
            }

            st.curY -= (drawH + 6f);

            // resume text on same page
            st.contentStream = new PDPageContentStream(st.pdfDoc, st.page, AppendMode.APPEND, true);
            st.contentStream.setFont(st.font, defaultFontSize);
            st.contentStream.beginText();
            st.contentStream.newLineAtOffset(st.curX, st.curY);
        }
    }

    // paragraph spacing after runs
    float paraSpacing = defaultFontSize * 0.5f;
    if (st.curY - paraSpacing <= margin) {
        closeTextSafe(st);
        if (st.contentStream != null) { try { st.contentStream.close(); } catch (Exception ignored) {} }
        st.page = new PDPage(PDRectangle.A4);
        st.pdfDoc.addPage(st.page);
        st.curY = st.page.getMediaBox().getHeight() - margin;
        st.contentStream = new PDPageContentStream(st.pdfDoc, st.page);
        st.contentStream.setFont(st.font, defaultFontSize);
        st.contentStream.beginText();
        st.contentStream.newLineAtOffset(st.curX, st.curY);
    } else {
        st.contentStream.newLineAtOffset(0, -paraSpacing);
        st.curY -= paraSpacing;
    }
}

////////////////////////////////////////////////////////////////////////////////
// Helper: processTable - iterate cells and process their paragraphs
////////////////////////////////////////////////////////////////////////////////
private void processTable(XWPFTable table, State st, float defaultFontSize, float leadingFactor, float margin) throws IOException {
    // Table rendering: draw borders and cell text
    float cellPadding = 4f;
    float tableWidth = st.pageWidth - 2 * margin;
    List<XWPFTableRow> rows = table.getRows();
    if (rows.isEmpty()) return;
    // Find max number of columns in any row
    int numCols = 0;
    for (XWPFTableRow row : rows) {
        if (row.getTableCells().size() > numCols) numCols = row.getTableCells().size();
    }
    if (numCols == 0) return;
    float cellWidth = tableWidth / numCols;
    float y = st.curY;
    float lineSpacing = defaultFontSize * leadingFactor;
    float rowGap = 2f;

    for (XWPFTableRow row : rows) {
        float x = margin;
        // Calculate max number of lines in any cell in this row
        int maxLines = 1;
        List<List<String>> wrappedCellLines = new ArrayList<>();
        for (int ci = 0; ci < numCols; ci++) {
            StringBuilder cellText = new StringBuilder();
            if (ci < row.getTableCells().size()) {
                XWPFTableCell cell = row.getCell(ci);
                for (XWPFParagraph p : cell.getParagraphs()) {
                    if (cellText.length() > 0) cellText.append(" ");
                    // Join all runs in the paragraph
                    List<XWPFRun> runs = p.getRuns();
                    if (runs != null && !runs.isEmpty()) {
                        for (XWPFRun run : runs) {
                            String t = extractRunText(run);
                            if (t != null && !t.isEmpty()) cellText.append(t);
                        }
                    }
                }
            }
            List<String> lines = wrapText(cellText.toString(), st.font, defaultFontSize, cellWidth - 2 * cellPadding);
            wrappedCellLines.add(lines);
            if (lines.size() > maxLines) maxLines = lines.size();
        }
        float maxRowHeight = maxLines * lineSpacing + 2 * cellPadding;
        // Page break if needed
        if (y - maxRowHeight <= margin) {
            closeTextSafe(st);
            if (st.contentStream != null) { try { st.contentStream.close(); } catch (Exception ignored) {} }
            st.page = new PDPage(PDRectangle.A4);
            st.pdfDoc.addPage(st.page);
            st.pageWidth = st.page.getMediaBox().getWidth();
            st.pageHeight = st.page.getMediaBox().getHeight();
            y = st.pageHeight - margin;
            st.curY = y;
            st.contentStream = new PDPageContentStream(st.pdfDoc, st.page);
            st.contentStream.setFont(st.font, defaultFontSize);
            st.contentStream.beginText();
            st.contentStream.newLineAtOffset(st.curX, st.curY);
        }
        // Draw each cell
        for (int ci = 0; ci < numCols; ci++) {
            // Draw cell border
            try (PDPageContentStream borderStream = new PDPageContentStream(st.pdfDoc, st.page, AppendMode.APPEND, true)) {
                borderStream.setStrokingColor(0, 0, 0);
                borderStream.addRect(x, y - maxRowHeight, cellWidth, maxRowHeight);
                borderStream.stroke();
            }
            // Write cell text with wrapping, top-aligned
            List<String> lines = wrappedCellLines.get(ci);
            float textY = y - cellPadding - defaultFontSize;
            try (PDPageContentStream textStream = new PDPageContentStream(st.pdfDoc, st.page, AppendMode.APPEND, true)) {
                textStream.setFont(st.font, defaultFontSize);
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
    // After table, reset text cursor to left margin and below the table
    st.curY = y;
    st.curX = margin;
    // Close any open text block and start a new one at the left margin
    closeTextSafe(st);
    if (st.contentStream != null) { try { st.contentStream.close(); } catch (Exception ignored) {} }
    st.contentStream = new PDPageContentStream(st.pdfDoc, st.page, AppendMode.APPEND, true);
    st.contentStream.setFont(st.font, defaultFontSize);
    st.contentStream.beginText();
    st.contentStream.newLineAtOffset(st.curX, st.curY);
}

////////////////////////////////////////////////////////////////////////////////
// Helper: extractRunText - read all CTR <t> pieces in a run
////////////////////////////////////////////////////////////////////////////////
private String extractRunText(XWPFRun run) {
    if (run == null) return "";
    StringBuilder sb = new StringBuilder();
    try {
        if (run.getCTR() != null) {
            int tCount = run.getCTR().sizeOfTArray();
            for (int i = 0; i < tCount; i++) {
                String s = run.getText(i);
                if (s != null) sb.append(s);
            }
        } else {
            String s = run.getText(0);
            if (s != null) sb.append(s);
        }
    } catch (Exception e) {
        String s = run.getText(0);
        if (s != null) sb.append(s);
    }
    return sb.toString();
}

////////////////////////////////////////////////////////////////////////////////
// Helper: parseColor - returns java.awt.Color or null if not parseable
////////////////////////////////////////////////////////////////////////////////
private Color parseColor(String hex) {
    if (hex == null) return null;
    try {
        if (hex.startsWith("#")) hex = hex.substring(1);
        int rgb = Integer.parseInt(hex, 16);
        return new Color((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
    } catch (Exception e) {
        return null;
    }
}

////////////////////////////////////////////////////////////////////////////////
// Helper: ensureSpaceOrNewPage + newLine + closeTextSafe
////////////////////////////////////////////////////////////////////////////////
private void ensureSpaceOrNewPage(State st, float needed, float margin, float defaultFontSize) throws IOException {
    if (st.curY - needed <= margin) {
        try { st.contentStream.endText(); } catch (IllegalStateException ignored) {}
        st.contentStream.close();
        st.page = new PDPage(PDRectangle.A4);
        st.pdfDoc.addPage(st.page);
        st.pageWidth = st.page.getMediaBox().getWidth();
        st.pageHeight = st.page.getMediaBox().getHeight();
        st.curY = st.pageHeight - margin;
        st.contentStream = new PDPageContentStream(st.pdfDoc, st.page);
        st.contentStream.setFont(st.font, defaultFontSize);
        st.contentStream.beginText();
        st.contentStream.newLineAtOffset(st.curX, st.curY);
    }
}

private void newLine(State st, float delta) throws IOException {
    st.contentStream.newLineAtOffset(0, -delta);
    st.curY -= delta;
}

private void closeTextSafe(State st) {
    try { st.contentStream.endText(); } catch (Exception ignored) {}
}

////////////////////////////////////////////////////////////////////////////////
// Helper: wrapText - measures width and wraps words using font metrics
////////////////////////////////////////////////////////////////////////////////
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
            // if single word larger than width, still add it as fallback
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

}
