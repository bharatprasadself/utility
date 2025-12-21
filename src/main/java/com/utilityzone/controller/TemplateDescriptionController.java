package com.utilityzone.controller;

import com.utilityzone.model.TemplateDescription;
import com.utilityzone.service.TemplateDescriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/template-descriptions")
public class TemplateDescriptionController {
    private final TemplateDescriptionService service;

    public TemplateDescriptionController(TemplateDescriptionService service) {
        this.service = service;
    }

    // Get the single master template
    @GetMapping("/master")
    public ResponseEntity<TemplateDescription> getMasterTemplate() {
        List<TemplateDescription> all = service.findAll();
        if (!all.isEmpty()) {
            return ResponseEntity.ok(all.get(0));
        }
        return ResponseEntity.notFound().build();
    }

    // Update the master template (body and title)
    @PutMapping("/master")
    public ResponseEntity<TemplateDescription> updateMasterTemplate(@RequestBody TemplateDescription updated) {
        List<TemplateDescription> all = service.findAll();
        if (!all.isEmpty()) {
            TemplateDescription existing = all.get(0);
            existing.setTemplateBody(updated.getTemplateBody());
            existing.setTemplateTitle(updated.getTemplateTitle());
            return ResponseEntity.ok(service.save(existing));
        } else {
            // If no template exists, create one
            TemplateDescription created = service.save(updated);
            return ResponseEntity.ok(created);
        }
    }
}
