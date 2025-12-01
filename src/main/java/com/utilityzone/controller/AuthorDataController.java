package com.utilityzone.controller;

import com.utilityzone.model.AuthorData;
import com.utilityzone.model.ContactLink;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
        if (author.isPresent()) {
            AuthorData a = author.get();
            // Ensure contacts are deserialized
            a.getContacts();
            return ResponseEntity.ok(a);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<AuthorData> saveOrUpdate(@RequestBody AuthorData authorData) {
        // Ensure contactsJson is set from contacts if present
        if (authorData.getContacts() != null) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                authorData.setContactsJson(mapper.writeValueAsString(authorData.getContacts()));
            } catch (Exception e) {
                // ignore, fallback to null
            }
        }
        AuthorData saved = authorDataService.saveOrUpdate(authorData);
        // Ensure contacts are deserialized for response
        saved.getContacts();
        return ResponseEntity.ok(saved);
    }
}
