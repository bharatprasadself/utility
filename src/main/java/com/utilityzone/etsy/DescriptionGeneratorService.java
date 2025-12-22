package com.utilityzone.etsy;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.StringJoiner;

public class DescriptionGeneratorService {
    private static final Map<DescriptionInput.EventType, String> BASE_HEADLINES = new HashMap<>() {{
        put(DescriptionInput.EventType.WEDDING, "Editable Wedding Invitation Template – Instant Download");
        put(DescriptionInput.EventType.RECEPTION, "Editable Reception Invitation Template – Instant Download");
        put(DescriptionInput.EventType.BIRTHDAY, "Editable Birthday Invitation Template – Instant Download");
    }};

    public String generate(DescriptionInput input) {
        String headline = BASE_HEADLINES.getOrDefault(input.getEventType(), "Editable Invitation Template – Instant Download");
        String styleStr = capitalize(input.getStyle().name());
        String eventStr = capitalize(input.getEventType().name());
        String audienceStr = capitalize(input.getAudience().name());
        StringJoiner sizes = new StringJoiner(", ");
        for (DescriptionInput.Size s : input.getSizesIncluded()) {
            sizes.add(formatSize(s));
        }
        String editing = input.getEditingLevel() == DescriptionInput.EditingLevel.TEXT_ONLY ? "Edit text only" : "Edit text and design elements";

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

        // IMPORTANT NOTES
        String notes = "• This is a digital product. No physical item will be shipped.\n• Colors may vary due to monitor and printer settings.";

        // LICENSE & USAGE
        String license = "For personal use only. Not for resale or commercial use.";

        // Build description
        StringBuilder sb = new StringBuilder();
        sb.append(headline).append("\n\n");
        sb.append(intro).append("\n\n");
        sb.append("WHAT YOU WILL RECEIVE\n").append(whatYouGet).append("\n\n");
        sb.append("EDITING DETAILS\n").append(editingDetails).append("\n\n");
        sb.append("SIZES INCLUDED\n").append(sizes).append("\n\n");
        sb.append("HOW IT WORKS\n").append(howItWorks).append("\n\n");
        sb.append("IMPORTANT NOTES\n").append(notes).append("\n\n");
        sb.append("LICENSE & USAGE\n").append(license);
        return sb.toString();
    }

    private String formatSize(DescriptionInput.Size size) {
        switch (size) {
            case MOBILE_1080x1920: return "Mobile (1080x1920px)";
            case PRINT_5x7: return "Print (5x7 inch)";
            default: return size.name();
        }
    }

    private String capitalize(String s) {
        String lower = s.toLowerCase();
        return Character.toUpperCase(lower.charAt(0)) + lower.substring(1);
    }
}
