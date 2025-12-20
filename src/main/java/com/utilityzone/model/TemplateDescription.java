package com.utilityzone.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "template_descriptions", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"event_type", "style", "audience"})
})
public class TemplateDescription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;


    @Column(name = "buyer_pdf_type", nullable = false, length = 50)
    private String buyerPdfType;

    @Column(name = "style", nullable = false, length = 50)
    private String style;

    @Column(name = "audience", nullable = false, length = 50)
    private String audience;

    @Column(name = "region", nullable = false, length = 50)
    private String region;

    @Column(name = "template_body", nullable = false, columnDefinition = "TEXT")
    private String templateBody;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getBuyerPdfType() { return buyerPdfType; }
    public void setBuyerPdfType(String buyerPdfType) { this.buyerPdfType = buyerPdfType; }
    public String getStyle() { return style; }
    public void setStyle(String style) { this.style = style; }
    public String getAudience() { return audience; }
    public void setAudience(String audience) { this.audience = audience; }
    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }
    public String getTemplateBody() { return templateBody; }
    public void setTemplateBody(String templateBody) { this.templateBody = templateBody; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
