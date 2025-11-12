package com.utilityzone.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "canva_templates")
public class CanvaTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(name = "canva_use_copy_url", length = 1000)
    private String canvaUseCopyUrl;

    @Column(name = "mockup_url", length = 1000)
    private String mockupUrl;

    @Column(name = "buyer_pdf_url", length = 1000)
    private String buyerPdfUrl;

    @Column(name = "etsy_listing_url", length = 1000)
    private String etsyListingUrl;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCanvaUseCopyUrl() { return canvaUseCopyUrl; }
    public void setCanvaUseCopyUrl(String canvaUseCopyUrl) { this.canvaUseCopyUrl = canvaUseCopyUrl; }

    public String getMockupUrl() { return mockupUrl; }
    public void setMockupUrl(String mockupUrl) { this.mockupUrl = mockupUrl; }

    public String getBuyerPdfUrl() { return buyerPdfUrl; }
    public void setBuyerPdfUrl(String buyerPdfUrl) { this.buyerPdfUrl = buyerPdfUrl; }

    public String getEtsyListingUrl() { return etsyListingUrl; }
    public void setEtsyListingUrl(String etsyListingUrl) { this.etsyListingUrl = etsyListingUrl; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
