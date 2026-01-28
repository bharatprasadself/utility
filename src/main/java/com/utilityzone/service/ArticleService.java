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

    @Autowired
    private com.utilityzone.repository.ArticleGroupRepository articleGroupRepository;

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

    public java.util.List<String> getGroupOrder() {
        java.util.List<com.utilityzone.model.ArticleGroup> groups = articleGroupRepository.findAll(org.springframework.data.domain.Sort.by("displayOrder"));
        java.util.List<String> names = new java.util.ArrayList<>();
        for (com.utilityzone.model.ArticleGroup g : groups) names.add(g.getName());
        return names;
    }

    @org.springframework.transaction.annotation.Transactional
    public void reorderGroups(java.util.List<String> orderedNames) {
        int pos = 0;
        for (String name : orderedNames) {
            java.util.Optional<com.utilityzone.model.ArticleGroup> existing = articleGroupRepository.findByName(name);
            com.utilityzone.model.ArticleGroup g;
            if (existing.isPresent()) {
                g = existing.get();
            } else {
                g = new com.utilityzone.model.ArticleGroup(name, pos);
            }
            g.setDisplayOrder(pos);
            articleGroupRepository.save(g);
            pos++;
        }
    }

    @org.springframework.transaction.annotation.Transactional
    public void renameGroup(String oldName, String newName) {
        if (oldName == null || newName == null) return;
        oldName = oldName.trim();
        newName = newName.trim();
        if (oldName.equals(newName)) return;
        // If a group with the target name already exists, merge old into new.
        java.util.Optional<com.utilityzone.model.ArticleGroup> existingNew = articleGroupRepository.findByName(newName);
        java.util.Optional<com.utilityzone.model.ArticleGroup> existingOld = articleGroupRepository.findByName(oldName);

        if (existingNew.isPresent()) {
            // Update articles to reference the existing new group name
            articleRepository.updateHeaderForName(oldName, newName);
            // Remove the old group record if present
            existingOld.ifPresent(g -> {
                try {
                    articleGroupRepository.delete(g);
                } catch (Exception ignored) {}
            });
        } else {
            // No collision: rename the old group record if present, otherwise create a new record
            if (existingOld.isPresent()) {
                com.utilityzone.model.ArticleGroup g = existingOld.get();
                g.setName(newName);
                articleGroupRepository.save(g);
            } else {
                articleGroupRepository.save(new com.utilityzone.model.ArticleGroup(newName, 0));
            }
            // Update articles that referenced the old group name
            articleRepository.updateHeaderForName(oldName, newName);
        }
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