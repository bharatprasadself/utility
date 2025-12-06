package com.utilityzone.payload.dto;

import lombok.Data;

@Data
public class EbookItemDto {
    private String id;
    private String title;
    private String coverUrl;
    private String buyLink;
    private String description;
    private String status; // 'published' or 'draft'
}
