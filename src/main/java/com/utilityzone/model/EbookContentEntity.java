package com.utilityzone.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "ebooks_content")
@Getter
@Setter
public class EbookContentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Lob
    @Column(name = "content_json", nullable = false, columnDefinition = "TEXT")
    private String contentJson;

    @Column(name = "status", length = 20)
    private String status = "draft";

    @Column(name = "updated_at")
    private Instant updatedAt;
}
