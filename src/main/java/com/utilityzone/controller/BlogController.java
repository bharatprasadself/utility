package com.utilityzone.controller;

import com.utilityzone.model.Blog;
import com.utilityzone.repository.BlogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/blogs")
@CrossOrigin(origins = "http://localhost:3000")
public class BlogController {

    @Autowired
    private BlogRepository blogRepository;

    @GetMapping
    public List<Blog> getAllBlogs() {
        return blogRepository.findAllByOrderByPublishDateDesc();
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Blog createBlog(@RequestBody Blog blog, @RequestHeader("Authorization") String token) {
        blog.setPublishDate(LocalDateTime.now());
        // Get username from JWT token
        String username = getUsernameFromToken(token);
        blog.setAuthor(username);
        return blogRepository.save(blog);
    }

    private String getUsernameFromToken(String token) {
        // Remove "Bearer " prefix
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        // TODO: Extract username from JWT token
        return "Anonymous"; // Temporary placeholder
    }

    @GetMapping("/{id}")
    public ResponseEntity<Blog> getBlogById(@PathVariable Long id) {
        return blogRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
