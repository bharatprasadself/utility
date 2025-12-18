package com.utilityzone.service;

import com.utilityzone.model.EbookCoverEntity;
import com.utilityzone.repository.EbookCoverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EbookCoverService {

    private final EbookCoverRepository repository;

    @Cacheable(value = "ebookCoverById", key = "#id")
    public Optional<EbookCoverEntity> findById(Long id) {
        return repository.findById(id);
    }

    @Cacheable(value = "ebookCoverByHash", key = "#hash")
    public Optional<EbookCoverEntity> findByHash(String hash) {
        return repository.findByContentHash(hash);
    }

    // If we save a new cover (or replace), clear cache so subsequent fetch uses fresh bytes
    @CacheEvict(value = "ebookCoverById", allEntries = true, beforeInvocation = false)
    public EbookCoverEntity save(EbookCoverEntity entity) {
        return repository.save(entity);
    }
}
