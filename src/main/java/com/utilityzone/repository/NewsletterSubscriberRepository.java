package com.utilityzone.repository;

import com.utilityzone.model.NewsletterSubscriber;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NewsletterSubscriberRepository extends JpaRepository<NewsletterSubscriber, Long> {
    boolean existsByEmailIgnoreCase(String email);
    Optional<NewsletterSubscriber> findByEmailIgnoreCase(String email);
    List<NewsletterSubscriber> findAllByActiveTrue();
}
