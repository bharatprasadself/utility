package com.utilityzone.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.utilityzone.model.EbookEntity;
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
        return repository.save(entity);
    }

    public EbookEntity update(Long id, EbookItemDto book) {
        EbookEntity entity = repository.findById(id).orElseGet(EbookEntity::new);
        entity.setId(id);
        entity.setTitle(book.getTitle() != null ? book.getTitle() : entity.getTitle());
        entity.setCoverUrl(book.getCoverUrl());
        entity.setStatus(book.getStatus() != null ? book.getStatus() : entity.getStatus());
        entity.setUpdatedAt(Instant.now());
        entity.setBookJson(toJson(book));
        return repository.save(entity);
    }

    public void delete(Long id) {
        repository.deleteById(id);
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
}
