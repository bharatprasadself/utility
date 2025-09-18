package com.utilityzone.service;

import com.utilityzone.model.Article;
import com.utilityzone.model.ArticleCategory;
import com.utilityzone.repository.ArticleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    public List<Article> getAllArticles() {
        return articleRepository.findAll();
    }

    public Optional<Article> getArticleById(Long id) {
        return articleRepository.findById(id);
    }

    public List<Article> getArticlesByCategory(ArticleCategory category) {
        return articleRepository.findByCategory(category);
    }

    public List<Article> getArticlesByTag(String tag) {
        return articleRepository.findByTagsContaining(tag);
    }

    public Article createArticle(Article article) {
        return articleRepository.save(article);
    }

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

    public void deleteArticle(Long id) {
        articleRepository.deleteById(id);
    }
}