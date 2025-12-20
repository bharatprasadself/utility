package com.utilityzone.etsy;

import java.util.Arrays;

public class DescriptionGeneratorExample {
    public static void main(String[] args) {
        DescriptionInput input = new DescriptionInput();
        input.setEventType(DescriptionInput.EventType.WEDDING);
        input.setStyle(DescriptionInput.Style.FLORAL);
        input.setAudience(DescriptionInput.Audience.ALL);
        input.setSizesIncluded(Arrays.asList(
            DescriptionInput.Size.MOBILE_1080x1920,
            DescriptionInput.Size.PRINT_5x7
        ));
        input.setEditingLevel(DescriptionInput.EditingLevel.TEXT_AND_ELEMENTS);
        input.setPlatform(DescriptionInput.Platform.ETSY);
        input.setLanguage(DescriptionInput.Language.EN);

        DescriptionGeneratorService service = new DescriptionGeneratorService();
        String description = service.generate(input);
        System.out.println(description);
    }
}
