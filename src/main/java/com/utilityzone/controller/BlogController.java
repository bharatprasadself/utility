package com.utilityzone.controller;

import com.utilityzone.model.Blog;
import com.utilityzone.security.JwtUtils;
import com.utilityzone.service.BlogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;


@RestController
@RequestMapping("/api/blogs")
public class BlogController {

    private final BlogService blogService;
    private final JwtUtils jwtUtils;
    private final CacheManager cacheManager;
    private static final Logger log = LoggerFactory.getLogger(BlogController.class);

    public BlogController(BlogService blogService, JwtUtils jwtUtils, CacheManager cacheManager) {
        this.blogService = blogService;
        this.jwtUtils = jwtUtils;
        this.cacheManager = cacheManager;
    }

    @GetMapping("/page")
    public ResponseEntity<?> getBlogsPage(
            @RequestParam(name = "page", defaultValue = "1") int page,
            @RequestParam(name = "size", defaultValue = "9") int size) {
        try {
            int pageIndex = Math.max(0, page - 1); // convert to 0-based
            int pageSize = Math.min(Math.max(1, size), 50); // guard rails: 1..50
            Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(Sort.Direction.DESC, "publishDate"));
            Page<Blog> result = blogService.getPublishedBlogs(pageable);
            return ResponseEntity.ok(new com.utilityzone.payload.response.PageResponse<>(
                    result.getContent(),
                    result.getNumber() + 1, // return 1-based page
                    result.getSize(),
                    result.getTotalElements(),
                    result.getTotalPages(),
                    result.hasNext(),
                    result.hasPrevious()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of("message", "Failed to fetch blogs: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllBlogs(@RequestParam(name = "limit", required = false) Integer limit) {
        try {
            int effectiveLimit = (limit == null) ? 0 : Math.max(0, limit);
            Cache cache = cacheManager.getCache("blogs");
            if (cache != null) {
                Object cached = cache.get(effectiveLimit);
                if (cached != null) {
                    log.info("Cache HIT: blogs[limit={}]", effectiveLimit);
                } else {
                    log.info("Cache MISS: blogs[limit={}]", effectiveLimit);
                }
            }
            List<Blog> blogs = blogService.getLatestBlogs(effectiveLimit);
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
            // If not explicitly set to DRAFT, treat as PUBLISHED
            if (blog.getStatus() == null) {
                blog.setStatus(com.utilityzone.model.PublicationStatus.PUBLISHED);
            }
            String username = extractUsernameFromToken(token);
            blog.setAuthor(username);
            Blog savedBlog;
            if (blog.getStatus() == com.utilityzone.model.PublicationStatus.DRAFT) {
                // Upsert draft to avoid duplicate draft versions by same author/title
                blog.setPublishDate(null);
                savedBlog = blogService.createOrUpdateDraft(blog, username);
            } else {
                // PUBLISHED: ensure publishDate is set
                blog.setPublishDate(LocalDateTime.now());
                savedBlog = blogService.save(blog);
            }
            return ResponseEntity.ok(savedBlog);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to create blog: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Blog> getBlogById(@PathVariable Long id) {
        Cache cache = cacheManager.getCache("blogById");
        if (cache != null) {
            Object cached = cache.get(id);
            if (cached != null) {
                log.info("Cache HIT: blogById[id={}]", id);
            } else {
                log.info("Cache MISS: blogById[id={}]", id);
            }
        }
        return blogService.findById(id)
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

            return blogService.findById(id)
                .map(existingBlog -> {
                    existingBlog.setTitle(blog.getTitle().trim());
                    existingBlog.setContent(blog.getContent().trim());
                    existingBlog.setUpdatedAt(LocalDateTime.now());
                    // Apply status changes
                    if (blog.getStatus() != null) {
                        existingBlog.setStatus(blog.getStatus());
                        if (blog.getStatus() == com.utilityzone.model.PublicationStatus.PUBLISHED && existingBlog.getPublishDate() == null) {
                            existingBlog.setPublishDate(LocalDateTime.now());
                        }
                        if (blog.getStatus() == com.utilityzone.model.PublicationStatus.DRAFT) {
                            // Keep publishDate null for drafts
                            existingBlog.setPublishDate(null);
                        }
                    }
                    return ResponseEntity.ok(blogService.save(existingBlog));
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to update blog: " + e.getMessage());
        }
    }

    @GetMapping("/drafts")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> getDraftBlogs(@RequestParam(name = "limit", required = false) Integer limit) {
        try {
            int effectiveLimit = (limit == null) ? 0 : Math.max(0, limit);
            List<Blog> drafts = blogService.getDraftBlogs(effectiveLimit);
            return ResponseEntity.ok(drafts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to fetch drafts: " + e.getMessage());
        }
    }

    // Optional admin maintenance endpoint to remove existing duplicate drafts.
    @PostMapping("/drafts/deduplicate")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deduplicateDrafts() {
        try {
            int removed = blogService.deduplicateDrafts();
            return ResponseEntity.ok(Map.of("removed", removed));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to de-duplicate drafts: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deleteBlog(@PathVariable Long id) {
        try {
            blogService.deleteById(id);
            return ResponseEntity.ok().build();
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
