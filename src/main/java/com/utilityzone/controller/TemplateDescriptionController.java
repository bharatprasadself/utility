package com.utilityzone.controller;

import com.utilityzone.model.TemplateDescription;
import com.utilityzone.service.TemplateDescriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/template-descriptions")
public class TemplateDescriptionController {
    private final TemplateDescriptionService service;

    public TemplateDescriptionController(TemplateDescriptionService service) {
        this.service = service;
    }

    // List all template descriptions
    @GetMapping("")
    public List<TemplateDescription> listAll() {
        return service.findAll();
    }

    // Get a template description by ID
    @GetMapping("/{id}")
    public ResponseEntity<TemplateDescription> getById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Create a new template description
    @PostMapping("")
    public TemplateDescription create(@RequestBody TemplateDescription templateDescription) {
        return service.save(templateDescription);
    }

    // Update a template description by ID
    @PutMapping("/{id}")
    public ResponseEntity<TemplateDescription> update(@PathVariable Long id, @RequestBody TemplateDescription updated) {
        return service.findById(id)
                .map(existing -> {
                    existing.setName(updated.getName());
                    existing.setTitle(updated.getTitle());
                    existing.setDescription(updated.getDescription());
                    return ResponseEntity.ok(service.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete a template description by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.findById(id).isPresent()) {
            service.delete(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
