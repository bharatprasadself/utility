package com.utilityzone.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "author_data")
public class AuthorData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String bio;
    private String contactEmail;
    private String socialLinks; // JSON or comma-separated
    private String profileImageUrl;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String contactsJson; // stores contacts as JSON

    @Transient
    private List<ContactLink> contacts;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters and setters
        public String getContactsJson() { return contactsJson; }
        public void setContactsJson(String contactsJson) { this.contactsJson = contactsJson; }

        public List<ContactLink> getContacts() {
            if (contacts == null && contactsJson != null && !contactsJson.isEmpty()) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    contacts = mapper.readValue(contactsJson, new TypeReference<List<ContactLink>>() {});
                } catch (Exception e) {
                    contacts = null;
                }
            }
            return contacts;
        }

        public void setContacts(List<ContactLink> contacts) {
            this.contacts = contacts;
            if (contacts != null) {
                try {
                    ObjectMapper mapper = new ObjectMapper();
                    this.contactsJson = mapper.writeValueAsString(contacts);
                } catch (Exception e) {
                    this.contactsJson = null;
                }
            } else {
                this.contactsJson = null;
            }
        }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getSocialLinks() { return socialLinks; }
    public void setSocialLinks(String socialLinks) { this.socialLinks = socialLinks; }
    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
