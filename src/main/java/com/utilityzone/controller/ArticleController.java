package com.utilityzone.controller;

import com.utilityzone.model.Article;
import com.utilityzone.model.ArticleCategory;
import com.utilityzone.model.PublicationStatus;
import com.utilityzone.service.ArticleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    @Autowired
    private ArticleService articleService;

    @Autowired
    private CacheManager cacheManager;

    private static final Logger log = LoggerFactory.getLogger(ArticleController.class);

    @GetMapping
    public List<Article> getAllArticles() {
        Cache cache = cacheManager.getCache("articles");
        if (cache != null) {
            Object cached = cache.get(SimpleKey.EMPTY);
            if (cached != null) {
                log.info("Cache HIT: articles[all]");
            } else {
                log.info("Cache MISS: articles[all]");
            }
        }
        return articleService.getAllArticles();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Article> getArticleById(@PathVariable Long id) {
        Cache cache = cacheManager.getCache("articleById");
        if (cache != null) {
            Object cached = cache.get(id);
            if (cached != null) {
                log.info("Cache HIT: articleById[id={}]", id);
            } else {
                log.info("Cache MISS: articleById[id={}]", id);
            }
        }
        return articleService.getArticleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public List<Article> getArticlesByCategory(@PathVariable ArticleCategory category) {
        Cache cache = cacheManager.getCache("articlesByCategory");
        if (cache != null) {
            Object cached = cache.get(category);
            if (cached != null) {
                log.info("Cache HIT: articlesByCategory[{}]", category);
            } else {
                log.info("Cache MISS: articlesByCategory[{}]", category);
            }
        }
        log.info("Fetching articles for category param: {}", category);
        List<Article> result = articleService.getArticlesByCategory(category);
        log.info("Returning {} published articles for {}", (result != null ? result.size() : 0), category);
        return result;
    }

    @GetMapping("/tag/{tag}")
    public List<Article> getArticlesByTag(@PathVariable String tag) {
        Cache cache = cacheManager.getCache("articlesByTag");
        if (cache != null) {
            Object cached = cache.get(tag);
            if (cached != null) {
                log.info("Cache HIT: articlesByTag[tag={}]", tag);
            } else {
                log.info("Cache MISS: articlesByTag[tag={}]", tag);
            }
        }
        return articleService.getArticlesByTag(tag);
    }

    @GetMapping("/groups")
    public ResponseEntity<java.util.List<String>> getArticleGroups() {
        return ResponseEntity.ok(articleService.getGroupOrder());
    }

    @PostMapping("/groups/reorder")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> reorderArticleGroups(@RequestBody java.util.List<String> orderedGroupNames) {
        articleService.reorderGroups(orderedGroupNames);
        return ResponseEntity.ok().build();
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public Article createArticle(@RequestBody Article article) {
        // default to PUBLISHED unless explicitly DRAFT
        if (article.getStatus() == null) {
            article.setStatus(PublicationStatus.PUBLISHED);
        }
        if (article.getStatus() == PublicationStatus.PUBLISHED && article.getPublishDate() == null) {
            article.setPublishDate(LocalDateTime.now());
        }
        if (article.getStatus() == PublicationStatus.DRAFT) {
            article.setPublishDate(null);
        }
        return articleService.createArticle(article);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Article> updateArticle(@PathVariable Long id, @RequestBody Article articleDetails) {
        Article updatedArticle = articleService.updateArticle(id, articleDetails);
        if (updatedArticle == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedArticle);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/drafts")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<List<Article>> getDraftArticles() {
        return ResponseEntity.ok(articleService.getDraftArticles());
    }
}