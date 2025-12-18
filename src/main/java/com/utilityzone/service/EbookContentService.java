package com.utilityzone.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utilityzone.model.EbookContentEntity;
import com.utilityzone.payload.dto.EbookContentDto;
import com.utilityzone.repository.EbookContentRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EbookContentService {

    private final EbookContentRepository repository;
    private final ObjectMapper objectMapper;

    @Cacheable(value = "ebooks", key = "'content'")
    public Optional<EbookContentDto> getContent() {
        return repository.findAll().stream().findFirst().map(this::fromEntity);
    }

    @CacheEvict(value = "ebooks", key = "'content'", beforeInvocation = false)
    public EbookContentDto upsert(EbookContentDto dto) {
        // Sanitize: do not persist authoring-only fields in ebooks_content
        dto = sanitizeForCatalog(dto);
        EbookContentEntity entity;
        Long idVal = dto.getId();
        if (idVal != null) {
            entity = repository.findById(idVal).orElseGet(EbookContentEntity::new);
        } else {
            entity = repository.findAll().stream().findFirst().orElseGet(EbookContentEntity::new);
        }
            dto.setUpdatedAt(Instant.now());
            entity.setContentJson(toJson(dto));
            // Persist top-level status column alongside JSON
            String status = dto.getStatus() != null ? dto.getStatus() : "draft";
            entity.setStatus(status);
            entity.setUpdatedAt(dto.getUpdatedAt());
        EbookContentEntity saved = repository.save(entity);
        // reflect generated id and status back to DTO
        dto.setId(saved.getId());
        if (dto.getStatus() == null) {
            dto.setStatus(saved.getStatus());
        }
        return dto;
    }

    // Build a catalog-safe DTO: strip rich authoring fields and omit nulls
    private EbookContentDto sanitizeForCatalog(EbookContentDto src) {
        if (src == null) return new EbookContentDto();
        EbookContentDto dst = new EbookContentDto();
        dst.setId(src.getId());
        dst.setHeaderTitle(src.getHeaderTitle());
        dst.setAbout(src.getAbout());
        dst.setNewsletterEndpoint(src.getNewsletterEndpoint());
        dst.setContacts(src.getContacts());
        dst.setStatus(src.getStatus());

        java.util.List<com.utilityzone.payload.dto.EbookItemDto> books = new java.util.ArrayList<>();
        java.util.List<com.utilityzone.payload.dto.EbookItemDto> srcBooks = src.getBooks();
        if (srcBooks != null) {
            for (com.utilityzone.payload.dto.EbookItemDto b : srcBooks) {
                if (b == null) continue;
                com.utilityzone.payload.dto.EbookItemDto lite = new com.utilityzone.payload.dto.EbookItemDto();
                // storefront-safe fields only
                lite.setId(b.getId());
                lite.setTitle(b.getTitle());
                lite.setCoverUrl(b.getCoverUrl());
                lite.setStatus(b.getStatus());
                if (b.getBuyLink() != null && !b.getBuyLink().isEmpty()) {
                    lite.setBuyLink(b.getBuyLink());
                }
                if (b.getDescription() != null && !b.getDescription().isEmpty()) {
                    lite.setDescription(b.getDescription());
                }
                // skip authoring-only fields: preface, disclaimer, chapters, chapterIdeas,
                // researchNotes, dataStatsExamples, personalThoughts, questionsForNotebookLm
                books.add(lite);
            }
        }
        dst.setBooks(books);
        // updatedAt handled by caller
        return dst;
    }

    public String toJson(EbookContentDto dto) {
        try {
            // Ensure catalog JSON never contains authoring-only fields
            EbookContentDto clean = sanitizeForCatalog(dto);
            // Do not serialize nulls to avoid noisy null fields like preface:null
            com.fasterxml.jackson.databind.ObjectMapper mapper = objectMapper.copy();
            mapper.setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);
            return mapper.writeValueAsString(clean);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize ebook content", e);
        }
    }

    public EbookContentRepository getRepository() {
        return repository;
    }

    public EbookContentDto fromEntity(EbookContentEntity entity) {
        try {
            EbookContentDto dto = objectMapper.readValue(entity.getContentJson(), EbookContentDto.class);
            dto.setId(entity.getId());
            // Ensure top-level status reflects the column if missing in JSON
            if (dto.getStatus() == null) {
                dto.setStatus(entity.getStatus());
            }
            return dto;
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize ebook content", e);
        }
    }
}
