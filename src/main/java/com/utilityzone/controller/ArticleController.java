package com.utilityzone.controller;

import com.utilityzone.model.Article;
import com.utilityzone.model.ArticleCategory;
import com.utilityzone.service.ArticleService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.interceptor.SimpleKey;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
        return articleService.getArticlesByCategory(category);
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

    @PostMapping
    public Article createArticle(@RequestBody Article article) {
        return articleService.createArticle(article);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Article> updateArticle(@PathVariable Long id, @RequestBody Article articleDetails) {
        Article updatedArticle = articleService.updateArticle(id, articleDetails);
        if (updatedArticle == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedArticle);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return ResponseEntity.ok().build();
    }
}