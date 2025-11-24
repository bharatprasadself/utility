package com.utilityzone.controller;

import com.utilityzone.model.AuthorData;
import com.utilityzone.service.AuthorDataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/author")
public class AuthorDataController {
    @Autowired
    private AuthorDataService authorDataService;

    @GetMapping
    public ResponseEntity<AuthorData> getAuthor() {
        Optional<AuthorData> author = authorDataService.getFirstAuthor();
        return author.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<AuthorData> saveOrUpdate(@RequestBody AuthorData authorData) {
        AuthorData saved = authorDataService.saveOrUpdate(authorData);
        return ResponseEntity.ok(saved);
    }
}
