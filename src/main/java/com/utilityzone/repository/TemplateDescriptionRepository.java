package com.utilityzone.repository;

import com.utilityzone.model.TemplateDescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface TemplateDescriptionRepository extends JpaRepository<TemplateDescription, Long> {
    // No custom queries needed: only a single master template is supported
}
