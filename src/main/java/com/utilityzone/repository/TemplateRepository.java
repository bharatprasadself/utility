package com.utilityzone.repository;

import com.utilityzone.model.Template;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TemplateRepository extends JpaRepository<Template, Long> {
        org.springframework.data.domain.Page<Template> findByStatusIgnoreCase(String status, org.springframework.data.domain.Pageable pageable);
    @Query(value = "select coalesce(max((substring(title from '\\\\d+$'))::int), 0) from canva_templates where title like (:prefix || '%')", nativeQuery = true)
    int findMaxNumericSuffixForPrefix(@Param("prefix") String prefix);
}
