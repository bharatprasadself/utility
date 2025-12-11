package com.utilityzone.controller;

import com.utilityzone.payload.dto.EbookItemDto;
import com.utilityzone.service.EbookService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ebooks/items")
@RequiredArgsConstructor
public class EbooksController {
    private final EbookService ebookService;

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<EbookItemDto>> list() {
        return ResponseEntity.ok(ebookService.listAll().stream().map(ebookService::fromEntity).toList());
    }

    @GetMapping("/published")
    public ResponseEntity<List<EbookItemDto>> listPublished() {
        return ResponseEntity.ok(ebookService.listPublishedDto());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<EbookItemDto> get(@PathVariable("id") Long id) {
        return ebookService.get(id)
                .map(ebookService::fromEntity)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<EbookItemDto> create(@RequestBody EbookItemDto book) {
        var saved = ebookService.create(book);
        return ResponseEntity.ok(ebookService.fromEntity(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<EbookItemDto> update(@PathVariable("id") Long id, @RequestBody EbookItemDto book) {
        var saved = ebookService.update(id, book);
        return ResponseEntity.ok(ebookService.fromEntity(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        ebookService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
