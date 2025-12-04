package com.utilityzone.service;

import com.utilityzone.model.AuthorData;
import com.utilityzone.repository.AuthorDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthorDataService {
    @Autowired
    private AuthorDataRepository authorDataRepository;

    public AuthorData saveOrUpdate(AuthorData authorData) {
        LocalDateTime now = LocalDateTime.now();

        // Try to find an existing row by name if provided
        Optional<AuthorData> byName = (authorData.getName() != null && !authorData.getName().isBlank())
                ? authorDataRepository.findByName(authorData.getName())
                : Optional.empty();

        if (byName.isPresent()) {
            // Update existing row with same name
            AuthorData existing = byName.get();
            authorData.setId(existing.getId());
            if (authorData.getCreatedAt() == null) authorData.setCreatedAt(existing.getCreatedAt());
        } else if (authorData.getId() == null) {
            // If no match by name and no id, update the first row if it exists
            authorDataRepository.findTopByOrderByIdAsc().ifPresent(existing -> {
                authorData.setId(existing.getId());
                if (authorData.getCreatedAt() == null) authorData.setCreatedAt(existing.getCreatedAt());
            });
        }

        if (authorData.getCreatedAt() == null) {
            authorData.setCreatedAt(now);
        }
        authorData.setUpdatedAt(now);

        return authorDataRepository.save(authorData);
    }

    public Optional<AuthorData> getAuthorData(Long id) {
        return authorDataRepository.findById(id);
    }

    public Optional<AuthorData> getFirstAuthor() {
        return authorDataRepository.findAll().stream().findFirst();
    }
}
