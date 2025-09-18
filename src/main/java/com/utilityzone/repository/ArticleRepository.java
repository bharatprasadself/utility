package com.utilityzone.repository;

import com.utilityzone.model.Article;
import com.utilityzone.model.ArticleCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByCategory(ArticleCategory category);
    List<Article> findByTagsContaining(String tag);
}