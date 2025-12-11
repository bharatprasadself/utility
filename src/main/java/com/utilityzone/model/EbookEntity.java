package com.utilityzone.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "ebooks")
@Getter
@Setter
public class EbookEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Lob
    @Column(name = "book_json", nullable = false, columnDefinition = "TEXT")
    private String bookJson;

    @Column(name = "status", length = 20)
    private String status = "draft";

    @Column(name = "cover_url", length = 500)
    private String coverUrl;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
