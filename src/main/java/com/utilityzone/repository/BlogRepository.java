package com.utilityzone.repository;

import com.utilityzone.model.Blog;
import com.utilityzone.model.PublicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BlogRepository extends JpaRepository<Blog, Long> {
    List<Blog> findAllByOrderByPublishDateDesc();

    // New: filter by status for published listing and drafts management
    List<Blog> findAllByStatusOrderByPublishDateDesc(PublicationStatus status);
    Page<Blog> findAllByStatus(PublicationStatus status, Pageable pageable);
    List<Blog> findAllByStatus(PublicationStatus status);

    Optional<Blog> findFirstByTitleIgnoreCaseAndAuthorAndStatus(String title, String author, PublicationStatus status);

    // For robust draft upsert, fetch drafts for an author and match in-service with normalized titles
    List<Blog> findAllByAuthorAndStatus(String author, PublicationStatus status);
}
