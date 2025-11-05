package com.utilityzone.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "ebooks_covers")
@Getter
@Setter
public class EbookCoverEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "mime_type")
    private String mimeType;

    // Store as PostgreSQL BYTEA. Using @Lob on PostgreSQL maps to OID (bigint),
    // which caused a type mismatch when our column is BYTEA.
    // So we explicitly map to bytea and avoid @Lob.
    @Column(name = "data", nullable = false, columnDefinition = "bytea")
    private byte[] data;

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
