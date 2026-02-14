**File Processing — PDFBox, Apache POI, ZXing (QR)**

- **Why it’s used:** The app generates and manipulates PDFs, reads/writes Office documents, and creates QR codes for assets.

- **Core concepts to learn:**
  - PDFBox basics: reading, writing, stamping PDFs
  - Apache POI: reading/writing Word/Excel/PowerPoint formats
  - ZXing: generating QR codes as images
  - Stream/file handling and memory considerations for large files

- **Hands-on micro-tasks:**
  1. Locate the PDF/POI-related utility classes and run a small example that loads a template and writes a page.
  2. Add a utility method that generates a QR image from a URL and embed it into an existing PDF page.
  3. Add an integration test that reads a PDF and asserts the number of pages.

- **Files to inspect:**
  - [pom.xml](pom.xml)
  - Search under `src/main/java` for PDF, POI, and ZXing usages (look for `pdfbox`, `poi`, `zxing` imports)

- **Recommended resources:**
  - PDFBox: https://pdfbox.apache.org/
  - Apache POI: https://poi.apache.org/
  - ZXing: https://github.com/zxing/zxing

- **Quick checks:**

```bash
./mvnw -DskipTests package
# run a small main class or test that exercises PDF utilities
./mvnw -Dtest=CanvaTemplatePdfLinkTest test
```
