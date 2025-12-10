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
        EbookContentEntity entity;
        if (dto.getId() != null) {
            entity = repository.findById(dto.getId()).orElseGet(EbookContentEntity::new);
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

    public String toJson(EbookContentDto dto) {
        try {
            return objectMapper.writeValueAsString(dto);
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
