package com.utilityzone.repository;

import com.utilityzone.model.Article;
import com.utilityzone.model.ArticleCategory;
import com.utilityzone.model.PublicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

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

    // Status-filtered variants for published listings and drafts
    List<Article> findAllByStatusOrderByCreatedAtAscIdAsc(PublicationStatus status);
    List<Article> findByCategoryAndStatusOrderByCreatedAtAscIdAsc(ArticleCategory category, PublicationStatus status);
    List<Article> findByTagsContainingAndStatusOrderByCreatedAtAscIdAsc(String tag, PublicationStatus status);

    List<Article> findAllByStatusOrderByCreatedAtDescIdDesc(PublicationStatus status);
    List<Article> findByCategoryAndStatusOrderByCreatedAtDescIdDesc(ArticleCategory category, PublicationStatus status);
    List<Article> findByTagsContainingAndStatusOrderByCreatedAtDescIdDesc(String tag, PublicationStatus status);

    @Modifying
    @Transactional
    @Query("update Article a set a.header = :newName where a.header = :oldName")
    int updateHeaderForName(@Param("oldName") String oldName, @Param("newName") String newName);
}