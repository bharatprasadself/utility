package com.utilityzone.controller;

import com.utilityzone.model.Blog;
import com.utilityzone.repository.BlogRepository;
import com.utilityzone.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.RequestMethod;

@RestController
@RequestMapping("/api/blogs")
@CrossOrigin(
    origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:8080", "https://utility-nrd7.onrender.com"}, 
    allowedHeaders = {"Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"},
    exposedHeaders = {"Access-Control-Allow-Origin", "Access-Control-Allow-Credentials"},
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS},
    allowCredentials = "true")
public class BlogController {

    @Autowired
    private BlogRepository blogRepository;
    
    @Autowired
    private JwtUtils jwtUtils;

    @GetMapping
    public ResponseEntity<?> getAllBlogs() {
        try {
            System.out.println("Fetching all blogs...");
            List<Blog> blogs = blogRepository.findAllByOrderByPublishDateDesc();
            System.out.println("Found " + blogs.size() + " blogs");
            return ResponseEntity.ok(blogs);
        } catch (Exception e) {
            System.err.println("Error fetching blogs: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500)
                .body(Map.of("message", "Failed to fetch blogs: " + e.getMessage()));
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> createBlog(@RequestBody Blog blog, @RequestHeader("Authorization") String token) {
        try {
            if (blog.getTitle() == null || blog.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Title is required");
            }
            if (blog.getContent() == null || blog.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Content is required");
            }

            blog.setPublishDate(LocalDateTime.now());
            String username = extractUsernameFromToken(token);
            blog.setAuthor(username);
            Blog savedBlog = blogRepository.save(blog);
            return ResponseEntity.ok(savedBlog);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to create blog: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Blog> getBlogById(@PathVariable Long id) {
        return blogRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateBlog(@PathVariable Long id, @RequestBody Blog blog, @RequestHeader("Authorization") String token) {
        try {
            if (blog.getTitle() == null || blog.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Title is required");
            }
            if (blog.getContent() == null || blog.getContent().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Content is required");
            }

            return blogRepository.findById(id)
                .map(existingBlog -> {
                    existingBlog.setTitle(blog.getTitle().trim());
                    existingBlog.setContent(blog.getContent().trim());
                    existingBlog.setUpdatedAt(LocalDateTime.now());
                    return ResponseEntity.ok(blogRepository.save(existingBlog));
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to update blog: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deleteBlog(@PathVariable Long id) {
        try {
            return blogRepository.findById(id)
                .map(blog -> {
                    blogRepository.delete(blog);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to delete blog: " + e.getMessage());
        }
    }

    private String extractUsernameFromToken(String token) {
        if (token == null || !token.startsWith("Bearer ")) {
            throw new IllegalArgumentException("Invalid authorization header");
        }
        try {
            token = token.substring(7);
            return jwtUtils.getUserNameFromJwtToken(token);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JWT token: " + e.getMessage());
        }
    }
}
