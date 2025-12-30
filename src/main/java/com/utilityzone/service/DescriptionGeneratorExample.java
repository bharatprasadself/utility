package com.utilityzone.service;

import com.utilityzone.payload.dto.DescriptionInputDto;
import java.util.Arrays;

public class DescriptionGeneratorExample {
    public static void main(String[] args) {
        DescriptionInputDto input = new DescriptionInputDto();
        input.setEventType(DescriptionInputDto.EventType.WEDDING);
        input.setStyle(DescriptionInputDto.Style.FLORAL);
        input.setAudience(DescriptionInputDto.Audience.ALL);
        input.setSizesIncluded(Arrays.asList(
            DescriptionInputDto.Size.MOBILE_1080x1920,
            DescriptionInputDto.Size.PRINT_5x7
        ));
        input.setEditingLevel(DescriptionInputDto.EditingLevel.TEXT_AND_ELEMENTS);
        input.setPlatform(DescriptionInputDto.Platform.ETSY);
        input.setLanguage(DescriptionInputDto.Language.EN);

        DescriptionGeneratorService service = new DescriptionGeneratorService();
        String description = service.generate(input);
        System.out.println(description);
    }
}
