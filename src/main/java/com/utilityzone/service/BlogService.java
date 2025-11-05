package com.utilityzone.service;

import com.utilityzone.model.Blog;
import com.utilityzone.repository.BlogRepository;
import com.utilityzone.model.PublicationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class BlogService {

    private final BlogRepository blogRepository;

    @Cacheable(value = "blogs", key = "#limit")
    public List<Blog> getLatestBlogs(int limit) {
        if (limit <= 0) {
            return blogRepository.findAllByStatusOrderByPublishDateDesc(PublicationStatus.PUBLISHED);
        }
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "publishDate"));
        return blogRepository.findAllByStatus(PublicationStatus.PUBLISHED, pageable).getContent();
    }

    @CacheEvict(value = "blogs", allEntries = true)
    public Blog save(Blog blog) {
        return blogRepository.save(blog);
    }

    @CacheEvict(value = "blogs", allEntries = true)
    @Transactional
    public Blog createOrUpdateDraft(Blog draft, String author) {
        String inputTitle = draft.getTitle() != null ? draft.getTitle() : "";
        String normalizedKey = normalizeTitle(inputTitle);

        // Try direct case-insensitive match first
        Blog updated = blogRepository
                .findFirstByTitleIgnoreCaseAndAuthorAndStatus(inputTitle.trim(), author, PublicationStatus.DRAFT)
                .map(existing -> applyDraftUpdate(existing, draft, inputTitle))
                .orElse(null);
        if (updated != null) return updated;

        // Fallback: fetch all author's drafts and match by normalized key (ignoring extra spaces & case)
        List<Blog> authorDrafts = blogRepository.findAllByAuthorAndStatus(author, PublicationStatus.DRAFT);
        for (Blog b : authorDrafts) {
            if (normalizeTitle(b.getTitle()).equals(normalizedKey)) {
                return applyDraftUpdate(b, draft, inputTitle);
            }
        }

        // No match: create new draft
        draft.setTitle(inputTitle.trim());
        draft.setAuthor(author);
        draft.setStatus(PublicationStatus.DRAFT);
        draft.setPublishDate(null);
        return blogRepository.save(draft);
    }

    private Blog applyDraftUpdate(Blog existing, Blog incoming, String inputTitle) {
        existing.setContent(incoming.getContent());
        // store a trimmed title to reduce accidental duplicates from trailing spaces
        existing.setTitle(inputTitle != null ? inputTitle.trim() : existing.getTitle());
        // keep status as DRAFT and publishDate null
        existing.setStatus(PublicationStatus.DRAFT);
        existing.setPublishDate(null);
        return blogRepository.save(existing);
    }

    private String normalizeTitle(String title) {
        if (title == null) return "";
        // collapse inner whitespace to single spaces, trim, and lowercase for matching
        return title.replaceAll("\\s+", " ").trim().toLowerCase();
    }

    @CacheEvict(value = "blogs", allEntries = true)
    public void deleteById(Long id) {
        blogRepository.deleteById(id);
    }

    @Cacheable(value = "blogById", key = "#id")
    public Optional<Blog> findById(Long id) {
        return blogRepository.findById(id);
    }

    public List<Blog> getDraftBlogs(int limit) {
        if (limit <= 0) {
            // For drafts, order by createdAt desc for admin visibility
            Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE, Sort.by(Sort.Direction.DESC, "createdAt"));
            return blogRepository.findAllByStatus(PublicationStatus.DRAFT, pageable).getContent();
        }
        Pageable pageable = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        return blogRepository.findAllByStatus(PublicationStatus.DRAFT, pageable).getContent();
    }

    @CacheEvict(value = "blogs", allEntries = true)
    @Transactional
    public int deduplicateDrafts() {
        List<Blog> drafts = blogRepository.findAllByStatus(PublicationStatus.DRAFT);
        if (drafts.isEmpty()) return 0;

        // Keep the most recently updated (or created) per (author, normalizedTitle)
        java.util.Map<String, Blog> keep = new java.util.HashMap<>();
        java.util.List<Blog> toDelete = new java.util.ArrayList<>();
        for (Blog b : drafts) {
            String key = b.getAuthor() + "|" + normalizeTitle(b.getTitle());
            Blog existing = keep.get(key);
            if (existing == null) {
                keep.put(key, b);
            } else {
                LocalDateTime eTime = existing.getUpdatedAt() != null ? existing.getUpdatedAt() : existing.getCreatedAt();
                LocalDateTime bTime = b.getUpdatedAt() != null ? b.getUpdatedAt() : b.getCreatedAt();
                if (bTime != null && (eTime == null || bTime.isAfter(eTime))) {
                    toDelete.add(existing);
                    keep.put(key, b);
                } else {
                    toDelete.add(b);
                }
            }
        }
        if (!toDelete.isEmpty()) {
            blogRepository.deleteAllInBatch(toDelete);
        }
        return toDelete.size();
    }
}
