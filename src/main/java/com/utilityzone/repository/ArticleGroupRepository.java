package com.utilityzone.repository;

import com.utilityzone.model.ArticleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ArticleGroupRepository extends JpaRepository<ArticleGroup, Long> {
    Optional<ArticleGroup> findByName(String name);
}
