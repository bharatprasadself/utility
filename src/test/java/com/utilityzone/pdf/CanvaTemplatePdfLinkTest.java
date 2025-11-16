package com.utilityzone.pdf;

import com.utilityzone.model.CanvaTemplate;
import com.utilityzone.repository.CanvaTemplateRepository;
import com.utilityzone.service.CanvaTemplateService;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.interactive.action.PDAction;
import org.apache.pdfbox.pdmodel.interactive.action.PDActionURI;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotation;
import org.apache.pdfbox.pdmodel.interactive.annotation.PDAnnotationLink;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@SpringBootTest
class CanvaTemplatePdfLinkTest {

    @Autowired
    private CanvaTemplateRepository repo;

    @Autowired
    private CanvaTemplateService service;

    @Test
    void page2_contains_clickable_links_for_button_and_qr() throws Exception {
        // Arrange: create a template with valid links
        String printLink = "https://example.com/canva/print";
        String mobileLink = "https://example.com/canva/mobile";

        CanvaTemplate t = new CanvaTemplate();
        t.setTitle("Test Template");
        t.setCanvaUseCopyUrl(printLink);
        t.setMobileCanvaUseCopyUrl(mobileLink);
        t = repo.save(t);

        // Act: generate the buyer PDF
        CanvaTemplate updated = service.generateBuyerPdf(Objects.requireNonNull(t.getId()));
        Path pdfPath = service.getPdfPathFor(updated);
        Assertions.assertTrue(Files.exists(pdfPath), "Generated PDF should exist: " + pdfPath);

        try (PDDocument doc = PDDocument.load(pdfPath.toFile())) {
            // Assert: page 2 (index 1) has at least two link annotations to printLink
            PDPage page2 = doc.getPage(1);
            List<PDAnnotation> annots = page2.getAnnotations();
            List<PDAnnotationLink> links = annots.stream()
                    .filter(a -> a instanceof PDAnnotationLink)
                    .map(a -> (PDAnnotationLink) a)
                    .collect(Collectors.toList());

            Assertions.assertFalse(links.isEmpty(), "Page 2 should contain link annotations");

            List<PDAnnotationLink> toPrintLink = links.stream()
                    .filter(l -> {
                        PDAction action = l.getAction();
                        if (action instanceof PDActionURI) {
                            String uri = ((PDActionURI) action).getURI();
                            return printLink.equals(uri);
                        }
                        return false;
                    })
                    .collect(Collectors.toList());

            Assertions.assertTrue(toPrintLink.size() >= 2,
                    "Expected at least two link annotations to printLink (button + QR)");

            // Basic geometry checks to approximate tappable areas
            PDRectangle mediaBox = page2.getMediaBox();
            Assertions.assertNotNull(mediaBox);

            boolean hasButtonSized = toPrintLink.stream().anyMatch(l -> {
                PDRectangle r = l.getRectangle();
                return r != null &&
                        r.getWidth() >= 200f && r.getHeight() >= 25f &&
                        r.getLowerLeftX() >= 0 && r.getLowerLeftY() >= 0 &&
                        r.getUpperRightX() <= mediaBox.getWidth() && r.getUpperRightY() <= mediaBox.getHeight();
            });

            boolean hasQrSized = toPrintLink.stream().anyMatch(l -> {
                PDRectangle r = l.getRectangle();
                return r != null &&
                        r.getWidth() >= 85f && r.getWidth() <= 120f &&
                        r.getHeight() >= 85f && r.getHeight() <= 120f &&
                        r.getLowerLeftX() >= 0 && r.getLowerLeftY() >= 0 &&
                        r.getUpperRightX() <= mediaBox.getWidth() && r.getUpperRightY() <= mediaBox.getHeight();
            });

            Assertions.assertTrue(hasButtonSized, "Expected a wide button-sized clickable area on page 2");
            Assertions.assertTrue(hasQrSized, "Expected a ~square QR-sized clickable area on page 2");

            // Optional: verify highlight mode is set to invert for visibility
            boolean anyInvert = toPrintLink.stream()
                    .anyMatch(l -> PDAnnotationLink.HIGHLIGHT_MODE_INVERT.equals(l.getHighlightMode()));
            Assertions.assertTrue(anyInvert, "At least one link should use invert highlight mode for visibility");

            // Additionally verify the mobile template button link exists and is tappable
            List<PDAnnotationLink> toMobileLink = links.stream()
                    .filter(l -> {
                        PDAction action = l.getAction();
                        if (action instanceof PDActionURI) {
                            String uri = ((PDActionURI) action).getURI();
                            return mobileLink.equals(uri);
                        }
                        return false;
                    })
                    .collect(Collectors.toList());

            Assertions.assertFalse(toMobileLink.isEmpty(),
                    "Expected at least one link annotation to mobileLink (mobile button)");

            boolean hasMobileButtonSized = toMobileLink.stream().anyMatch(l -> {
                PDRectangle r = l.getRectangle();
                return r != null &&
                        r.getWidth() >= 200f && r.getHeight() >= 25f &&
                        r.getLowerLeftX() >= 0 && r.getLowerLeftY() >= 0 &&
                        r.getUpperRightX() <= mediaBox.getWidth() && r.getUpperRightY() <= mediaBox.getHeight();
            });
            Assertions.assertTrue(hasMobileButtonSized, "Expected a wide mobile button-sized clickable area on page 2");
        }
    }
}
