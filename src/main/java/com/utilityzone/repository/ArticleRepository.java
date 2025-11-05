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

    // Ordered variants: newest first by createdAt, with id as deterministic tiebreaker
    List<Article> findAllByOrderByCreatedAtDescIdDesc();
    List<Article> findByCategoryOrderByCreatedAtDescIdDesc(ArticleCategory category);
    List<Article> findByTagsContainingOrderByCreatedAtDescIdDesc(String tag);

    // Ordered variants: oldest first by createdAt, with id as deterministic tiebreaker
    List<Article> findAllByOrderByCreatedAtAscIdAsc();
    List<Article> findByCategoryOrderByCreatedAtAscIdAsc(ArticleCategory category);
    List<Article> findByTagsContainingOrderByCreatedAtAscIdAsc(String tag);
}