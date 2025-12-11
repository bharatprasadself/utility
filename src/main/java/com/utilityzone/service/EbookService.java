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
        entity.setBookJson(toJson(book));
        EbookEntity saved = repository.save(entity);
        syncAggregatedCatalog();
        return saved;
    }

    public EbookEntity update(Long id, EbookItemDto book) {
        EbookEntity entity = repository.findById(id).orElseGet(EbookEntity::new);
        entity.setId(id);
        entity.setTitle(book.getTitle() != null ? book.getTitle() : entity.getTitle());
        entity.setCoverUrl(book.getCoverUrl());
        entity.setStatus(book.getStatus() != null ? book.getStatus() : entity.getStatus());
        entity.setUpdatedAt(Instant.now());
        entity.setBookJson(toJson(book));
        EbookEntity saved = repository.save(entity);
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
}
