package com.utilityzone.service;

import com.utilityzone.model.Article;
import com.utilityzone.model.ArticleCategory;
import com.utilityzone.repository.ArticleRepository;
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
        // Return oldest first by createdAt, with id as a tiebreaker for deterministic order
        return articleRepository.findAllByOrderByCreatedAtAscIdAsc();
    }

    @Cacheable(value = "articleById", key = "#id")
    public Optional<Article> getArticleById(Long id) {
        return articleRepository.findById(id);
    }

    @Cacheable(value = "articlesByCategory", key = "#category")
    public List<Article> getArticlesByCategory(ArticleCategory category) {
        // Return oldest first within category
        return articleRepository.findByCategoryOrderByCreatedAtAscIdAsc(category);
    }

    @Cacheable(value = "articlesByTag", key = "#tag")
    public List<Article> getArticlesByTag(String tag) {
        // Return oldest first within tag
        return articleRepository.findByTagsContainingOrderByCreatedAtAscIdAsc(tag);
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