package com.utilityzone.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utilityzone.model.EbookEntity;
import com.utilityzone.payload.dto.EbookContentDto;
import com.utilityzone.payload.dto.EbookItemDto;
import com.utilityzone.repository.EbookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EbookService {
    private final EbookRepository repository;
    private final ObjectMapper objectMapper;
    private final EbookContentService contentService;

    public List<EbookEntity> listAll() {
        return repository.findAll();
    }

    public List<EbookItemDto> listPublishedDto() {
        return repository.findAllByStatus("published").stream()
                .map(this::fromEntity)
                .toList();
    }

    public Optional<EbookEntity> get(Long id) {
        return repository.findById(id);
    }

    public EbookEntity create(EbookItemDto book) {
        EbookEntity entity = new EbookEntity();
        entity.setTitle(book.getTitle() != null ? book.getTitle() : "");
        entity.setCoverUrl(book.getCoverUrl());
        entity.setStatus(book.getStatus() != null ? book.getStatus() : "draft");
        entity.setUpdatedAt(Instant.now());
        // Avoid storing curated storefront fields in per-ebook JSON
        EbookItemDto authoring = new EbookItemDto();
        authoring.setId(book.getId());
        authoring.setTitle(book.getTitle());
        authoring.setCoverUrl(book.getCoverUrl());
        authoring.setStatus(book.getStatus());
        authoring.setPreface(book.getPreface());
        authoring.setDisclaimer(book.getDisclaimer());
        authoring.setChapters(book.getChapters());
        authoring.setChapterIdeas(book.getChapterIdeas());
        authoring.setResearchNotes(book.getResearchNotes());
        authoring.setDataStatsExamples(book.getDataStatsExamples());
        authoring.setPersonalThoughts(book.getPersonalThoughts());
        authoring.setQuestionsForNotebookLm(book.getQuestionsForNotebookLm());
        // Intentionally do NOT include buyLink/description in book_json
        entity.setBookJson(toJson(authoring));
        EbookEntity saved = repository.save(entity);
        syncAggregatedCatalog();
        return saved;
    }

    public EbookEntity update(Long id, EbookItemDto book) {
        java.util.Optional<EbookEntity> opt = repository.findById(id);
        boolean exists = opt.isPresent();
        EbookEntity entity = exists ? opt.get() : new EbookEntity();
        // Only update shallow storefront fields when provided
        if (book.getTitle() != null) entity.setTitle(book.getTitle());
        if (book.getCoverUrl() != null) entity.setCoverUrl(book.getCoverUrl());
        if (book.getStatus() != null) entity.setStatus(book.getStatus());
        entity.setUpdatedAt(Instant.now());

        // Merge authoring content: read existing JSON and patch only non-null fields
        EbookItemDto existing;
        try {
            existing = entity.getBookJson() != null ? objectMapper.readValue(entity.getBookJson(), EbookItemDto.class) : new EbookItemDto();
        } catch (Exception e) {
            existing = new EbookItemDto();
        }
        // Never store curated fields in book_json
        existing.setId(book.getId() != null ? book.getId() : existing.getId());
        if (book.getTitle() != null) existing.setTitle(book.getTitle());
        if (book.getCoverUrl() != null) existing.setCoverUrl(book.getCoverUrl());
        if (book.getStatus() != null) existing.setStatus(book.getStatus());
        if (book.getPreface() != null) existing.setPreface(book.getPreface());
        if (book.getDisclaimer() != null) existing.setDisclaimer(book.getDisclaimer());
        if (book.getChapters() != null) existing.setChapters(book.getChapters());
        if (book.getChapterIdeas() != null) existing.setChapterIdeas(book.getChapterIdeas());
        if (book.getResearchNotes() != null) existing.setResearchNotes(book.getResearchNotes());
        if (book.getDataStatsExamples() != null) existing.setDataStatsExamples(book.getDataStatsExamples());
        if (book.getPersonalThoughts() != null) existing.setPersonalThoughts(book.getPersonalThoughts());
        if (book.getQuestionsForNotebookLm() != null) existing.setQuestionsForNotebookLm(book.getQuestionsForNotebookLm());
        entity.setBookJson(toJson(existing));
        EbookEntity saved = repository.save(entity);
        // If curated fields were provided, patch them into ebooks_content
        if (book.getBuyLink() != null || book.getDescription() != null) {
            try {
                String targetId = String.valueOf(saved.getId());
                patchCuratedCatalogFields(targetId, book.getBuyLink(), book.getDescription());
            } catch (Exception ignored) {
                // Non-fatal
            }
        }
        syncAggregatedCatalog();
        return saved;
    }

    public void delete(Long id) {
        repository.deleteById(id);
        syncAggregatedCatalog();
    }

    public String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize book", e);
        }
    }

    public EbookItemDto fromEntity(EbookEntity entity) {
        try {
            EbookItemDto book = objectMapper.readValue(entity.getBookJson(), EbookItemDto.class);
            book.setId(entity.getId() != null ? String.valueOf(entity.getId()) : book.getId());
            if (book.getStatus() == null) book.setStatus(entity.getStatus());
            if (book.getCoverUrl() == null) book.setCoverUrl(entity.getCoverUrl());
            return book;
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize book", e);
        }
    }

    // Keep ebooks_content in sync with per-ebook rows for storefront rendering
    private void syncAggregatedCatalog() {
        try {
            // Load existing global content to preserve header/about/newsletter/contacts
            EbookContentDto base = contentService.getContent().orElseGet(EbookContentDto::new);
            java.util.Map<String, EbookItemDto> existingById = java.util.Optional.ofNullable(base.getBooks())
                    .orElse(java.util.Collections.emptyList())
                    .stream()
                    .filter(b -> b.getId() != null && !b.getId().isEmpty())
                    .collect(java.util.stream.Collectors.toMap(EbookItemDto::getId, b -> b, (a,b)->a));
            // Map all items (both draft and published) into lightweight list
            List<EbookItemDto> items = repository.findAll().stream()
                    .map(this::fromEntity)
                    .map(b -> {
                        EbookItemDto lite = new EbookItemDto();
                        lite.setId(b.getId());
                        lite.setTitle(b.getTitle());
                        lite.setCoverUrl(b.getCoverUrl());
                        lite.setStatus(b.getStatus());
                        // carry over curated fields from existing aggregated catalog if present
                        EbookItemDto prev = existingById.get(b.getId());
                        if (prev != null) {
                            lite.setBuyLink(prev.getBuyLink());
                            lite.setDescription(prev.getDescription());
                        } else {
                            // fallback to values present in per-ebook JSON if any
                            lite.setBuyLink(b.getBuyLink());
                            lite.setDescription(b.getDescription());
                        }
                        return lite;
                    })
                    .toList();

            base.setBooks(items);
            // Top-level status reflects whether any book is published
            boolean anyPublished = items.stream().anyMatch(i -> "published".equalsIgnoreCase(i.getStatus()));
            base.setStatus(anyPublished ? "published" : "draft");
            base.setUpdatedAt(Instant.now());
            contentService.upsert(base);
        } catch (Exception ignored) {
            // Non-fatal: storefront can still read directly from /items/published
        }
    }

    // Patch a single book's curated fields (buyLink/description) in ebooks_content
    private void patchCuratedCatalogFields(String bookId, String buyLink, String description) {
        EbookContentDto base = contentService.getContent().orElseGet(EbookContentDto::new);
        java.util.List<EbookItemDto> list = java.util.Optional.ofNullable(base.getBooks())
                .orElse(new java.util.ArrayList<>());
        boolean found = false;
        for (EbookItemDto b : list) {
            if (b.getId() != null && b.getId().equals(bookId)) {
                if (buyLink != null) b.setBuyLink(buyLink);
                if (description != null) b.setDescription(description);
                found = true;
                break;
            }
        }
        if (!found) {
            EbookItemDto b = new EbookItemDto();
            b.setId(bookId);
            b.setBuyLink(buyLink);
            b.setDescription(description);
            list.add(b);
        }
        base.setBooks(list);
        base.setUpdatedAt(Instant.now());
        contentService.upsert(base);
    }
}
