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


    // Return only the master template (with placeholders)
    @GetMapping
    public ResponseEntity<List<TemplateDescription>> listAll() {
        List<TemplateDescription> all = service.findAll();
        if (all.size() > 0) {
            // Return the raw master template (with {{region}})
            return ResponseEntity.ok(List.of(all.get(0)));
        }
        return ResponseEntity.ok(List.of());
    }

    @GetMapping("/search")
    public ResponseEntity<TemplateDescription> getByCombination(@RequestParam String eventType,
                                                               @RequestParam String style,
                                                               @RequestParam String audience) {
        return service.findByEventTypeStyleAudience(eventType, style, audience)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TemplateDescription create(@RequestBody TemplateDescription templateDescription) {
        return service.save(templateDescription);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TemplateDescription> update(@PathVariable Long id, @RequestBody TemplateDescription updated) {
        return service.findById(id)
                .map(existing -> {
                    existing.setEventType(updated.getEventType());
                    existing.setStyle(updated.getStyle());
                    existing.setAudience(updated.getAudience());
                    existing.setTemplateBody(updated.getTemplateBody());
                    return ResponseEntity.ok(service.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
