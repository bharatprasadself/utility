package com.utilityzone.service;

import com.utilityzone.payload.dto.DescriptionInputDto;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.StringJoiner;

public class DescriptionGeneratorService {
    private static final Map<DescriptionInputDto.EventType, String> BASE_HEADLINES = new HashMap<>() {{
        put(DescriptionInputDto.EventType.WEDDING, "Editable Wedding Invitation Template – Instant Download");
        put(DescriptionInputDto.EventType.RECEPTION, "Editable Reception Invitation Template – Instant Download");
        put(DescriptionInputDto.EventType.BIRTHDAY, "Editable Birthday Invitation Template – Instant Download");
    }};

    public String generate(DescriptionInputDto input) {
        String headline = BASE_HEADLINES.getOrDefault(input.getEventType(), "Editable Invitation Template – Instant Download");
        String styleStr = capitalize(input.getStyle().name());
        String eventStr = capitalize(input.getEventType().name());
        String audienceStr = capitalize(input.getAudience().name());
        StringJoiner sizes = new StringJoiner(", ");
        for (DescriptionInputDto.Size s : input.getSizesIncluded()) {
            sizes.add(formatSize(s));
        }
        String editing = input.getEditingLevel() == DescriptionInputDto.EditingLevel.TEXT_ONLY ? "Edit text only" : "Edit text and design elements";

        // SEO keywords
        String keywords = String.format("%s, %s, %s invitation, %s style, printable, instant download", eventStr, styleStr, eventStr.toLowerCase(), styleStr.toLowerCase());

        // Intro paragraph with keywords
        String intro = String.format("Create a memorable %s with this %s %s invitation template. Perfect for %s, this printable design is easy to edit and download instantly.",
                eventStr.toLowerCase(), styleStr.toLowerCase(), eventStr.toLowerCase(), audienceStr.toLowerCase());

        // WHAT YOU WILL RECEIVE
        String whatYouGet = String.format("• Digital %s invitation template\n• Sizes included: %s\n• Access via Canva (free account)", eventStr.toLowerCase(), sizes);

        // EDITING DETAILS
        String editingDetails = String.format("%s in Canva. No software needed. Edit on desktop or mobile.", editing);

        // HOW IT WORKS
        String howItWorks = "1. Purchase & download PDF with link\n2. Open in Canva\n3. Edit & personalize\n4. Download & print/share";

        // Combine all parts
        return String.format("%s\n\n%s\n\n%s\n%s\n\n%s\n\nKeywords: %s",
                headline, intro, whatYouGet, editingDetails, howItWorks, keywords);
    }

    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }

    private String formatSize(DescriptionInputDto.Size size) {
        switch (size) {
            case MOBILE_1080x1920: return "Mobile (1080x1920)";
            case PRINT_5x7: return "Print (5x7)";
            default: return size.name();
        }
    }
}
