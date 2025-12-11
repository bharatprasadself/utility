package com.utilityzone.payload.dto;

import lombok.Data;
import java.time.Instant;
import java.util.List;

@Data
public class EbookContentDto {
    private Long id; // database row id
    private String headerTitle;
    private List<EbookItemDto> books;
    private String status; // overall content status ('published' or 'draft')
    private String about;
    private boolean newsletterEnabled = true;
    private String newsletterEndpoint;
    private List<ContactLinkDto> contacts;
    private Instant updatedAt;

}
