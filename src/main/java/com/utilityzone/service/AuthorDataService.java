package com.utilityzone.service;

import com.utilityzone.model.AuthorData;
import com.utilityzone.repository.AuthorDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthorDataService {
    @Autowired
    private AuthorDataRepository authorDataRepository;

    public AuthorData saveOrUpdate(AuthorData authorData) {
        return authorDataRepository.save(authorData);
    }

    public Optional<AuthorData> getAuthorData(Long id) {
        return authorDataRepository.findById(id);
    }

    public Optional<AuthorData> getFirstAuthor() {
        return authorDataRepository.findAll().stream().findFirst();
    }
}
