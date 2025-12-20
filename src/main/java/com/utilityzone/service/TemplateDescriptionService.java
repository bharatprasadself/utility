package com.utilityzone.service;

import com.utilityzone.model.TemplateDescription;
import com.utilityzone.repository.TemplateDescriptionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TemplateDescriptionService {
    private final TemplateDescriptionRepository repository;

    public TemplateDescriptionService(TemplateDescriptionRepository repository) {
        this.repository = repository;
    }

    public Optional<TemplateDescription> findByEventTypeStyleAudience(String eventType, String style, String audience) {
        return repository.findByEventTypeAndStyleAndAudience(eventType, style, audience);
    }

    public List<TemplateDescription> findAll() {
        return repository.findAll();
    }

    public TemplateDescription save(TemplateDescription templateDescription) {
        return repository.save(templateDescription);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public Optional<TemplateDescription> findById(Long id) {
        return repository.findById(id);
    }
}
