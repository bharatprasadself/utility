package com.utilityzone.service;

import com.utilityzone.model.Article;
import com.utilityzone.model.ArticleCategory;
import com.utilityzone.repository.ArticleRepository;
import com.utilityzone.model.PublicationStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    @Cacheable(value = "articles")
    public List<Article> getAllArticles() {
        // Public list: only published articles, oldest first for deterministic chronological order
        return articleRepository.findAllByStatusOrderByCreatedAtAscIdAsc(PublicationStatus.PUBLISHED);
    }

    @Cacheable(value = "articleById", key = "#id")
    public Optional<Article> getArticleById(Long id) {
        return articleRepository.findById(id);
    }

    @Cacheable(value = "articlesByCategory", key = "#category")
    public List<Article> getArticlesByCategory(ArticleCategory category) {
        // Public list: only published in category
        return articleRepository.findByCategoryAndStatusOrderByCreatedAtAscIdAsc(category, PublicationStatus.PUBLISHED);
    }

    @Cacheable(value = "articlesByTag", key = "#tag")
    public List<Article> getArticlesByTag(String tag) {
        // Public list: only published with tag
        return articleRepository.findByTagsContainingAndStatusOrderByCreatedAtAscIdAsc(tag, PublicationStatus.PUBLISHED);
    }

    public List<Article> getDraftArticles() {
        // Admin view: all drafts, newest first for convenience
        return articleRepository.findAllByStatusOrderByCreatedAtDescIdDesc(PublicationStatus.DRAFT);
    }

    @Caching(evict = {
        @CacheEvict(value = "articles", allEntries = true),
        @CacheEvict(value = "articlesByCategory", allEntries = true),
        @CacheEvict(value = "articlesByTag", allEntries = true),
        @CacheEvict(value = "articleById", allEntries = true)
    })
    public Article createArticle(Article article) {
        return articleRepository.save(article);
    }

    @Caching(evict = {
        @CacheEvict(value = "articles", allEntries = true),
        @CacheEvict(value = "articlesByCategory", allEntries = true),
        @CacheEvict(value = "articlesByTag", allEntries = true),
        @CacheEvict(value = "articleById", allEntries = true)
    })
    public Article updateArticle(Long id, Article articleDetails) {
        Optional<Article> article = articleRepository.findById(id);
        if (article.isPresent()) {
            Article existingArticle = article.get();
            existingArticle.setTitle(articleDetails.getTitle());
            existingArticle.setDescription(articleDetails.getDescription());
            existingArticle.setContent(articleDetails.getContent());
            existingArticle.setTags(articleDetails.getTags());
            existingArticle.setReadTime(articleDetails.getReadTime());
            existingArticle.setCategory(articleDetails.getCategory());
            // Status/publish date management if provided
            if (articleDetails.getStatus() != null) {
                existingArticle.setStatus(articleDetails.getStatus());
                if (articleDetails.getStatus() == PublicationStatus.PUBLISHED && existingArticle.getPublishDate() == null) {
                    existingArticle.setPublishDate(java.time.LocalDateTime.now());
                }
                if (articleDetails.getStatus() == PublicationStatus.DRAFT) {
                    existingArticle.setPublishDate(null);
                }
            }
            // Update header/group if provided
            existingArticle.setHeader(articleDetails.getHeader());
            return articleRepository.save(existingArticle);
        }
        return null;
    }

    @Caching(evict = {
        @CacheEvict(value = "articles", allEntries = true),
        @CacheEvict(value = "articlesByCategory", allEntries = true),
        @CacheEvict(value = "articlesByTag", allEntries = true),
        @CacheEvict(value = "articleById", allEntries = true)
    })
    public void deleteArticle(Long id) {
        articleRepository.deleteById(id);
    }
}