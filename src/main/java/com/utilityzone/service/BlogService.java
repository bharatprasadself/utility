package com.utilityzone.service;

import com.utilityzone.model.Blog;
import com.utilityzone.repository.BlogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogRepository blogRepository;

    @Cacheable(value = "blogs", key = "#limit")
    public List<Blog> getLatestBlogs(int limit) {
        if (limit <= 0) {
            return blogRepository.findAllByOrderByPublishDateDesc();
        }
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "publishDate"));
        return blogRepository.findAll(pageable).getContent();
    }

    @CacheEvict(value = "blogs", allEntries = true)
    public Blog save(Blog blog) {
        return blogRepository.save(blog);
    }

    @CacheEvict(value = "blogs", allEntries = true)
    public void deleteById(Long id) {
        blogRepository.deleteById(id);
    }

    @Cacheable(value = "blogById", key = "#id")
    public Optional<Blog> findById(Long id) {
        return blogRepository.findById(id);
    }
}
