package com.utilityzone.payload.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class EbookItemDto {
    private String id;
    private String title;
    private String coverUrl;
    private String status; // 'published' or 'draft'

    // Full per-book content (stored in ebooks.book_json)
    private String preface;
    private String disclaimer;
    private List<ChapterDto> chapters;

    // Research & ideation fields
    private String chapterIdeas;
    private String researchNotes;
    private String dataStatsExamples;
    private String personalThoughts;
    private List<String> questionsForNotebookLm;
}
