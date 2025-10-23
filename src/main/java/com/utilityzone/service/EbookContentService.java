package com.utilityzone.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utilityzone.model.EbookContentEntity;
import com.utilityzone.payload.dto.EbookContentDto;
import com.utilityzone.repository.EbookContentRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EbookContentService {

    private final EbookContentRepository repository;
    private final ObjectMapper objectMapper;

    public Optional<EbookContentDto> getContent() {
        return repository.findAll().stream().findFirst().map(this::fromEntity);
    }

    public EbookContentDto upsert(EbookContentDto dto) {
        EbookContentEntity entity = repository.findAll().stream().findFirst().orElseGet(EbookContentEntity::new);
        dto.setUpdatedAt(Instant.now());
        entity.setContentJson(toJson(dto));
        entity.setUpdatedAt(dto.getUpdatedAt());
        repository.save(entity);
        return dto;
    }

    private String toJson(EbookContentDto dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize ebook content", e);
        }
    }

    private EbookContentDto fromEntity(EbookContentEntity entity) {
        try {
            return objectMapper.readValue(entity.getContentJson(), EbookContentDto.class);
        } catch (Exception e) {
            throw new RuntimeException("Failed to deserialize ebook content", e);
        }
    }
}
