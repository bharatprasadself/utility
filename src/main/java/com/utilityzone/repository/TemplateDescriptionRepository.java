package com.utilityzone.repository;

import com.utilityzone.model.TemplateDescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TemplateDescriptionRepository extends JpaRepository<TemplateDescription, Long> {
    Optional<TemplateDescription> findByEventTypeAndStyleAndAudience(String eventType, String style, String audience);
}
