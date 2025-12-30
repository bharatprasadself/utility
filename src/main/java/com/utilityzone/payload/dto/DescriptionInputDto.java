package com.utilityzone.payload.dto;

import java.util.List;

public class DescriptionInputDto {
    public enum EventType { WEDDING, RECEPTION, BIRTHDAY }
    public enum Style { TRADITIONAL, MINIMAL, FLORAL, MODERN, KIDS, OTHER }
    public enum Audience { KIDS, ADULTS, ALL }
    public enum Size { MOBILE_1080x1920, PRINT_5x7 }
    public enum EditingLevel { TEXT_ONLY, TEXT_AND_ELEMENTS }
    public enum Platform { ETSY }
    public enum Language { EN }

    private EventType eventType;
    private Style style;
    private Audience audience;
    private List<Size> sizesIncluded;
    private EditingLevel editingLevel;
    private Platform platform;
    private Language language;

    // Getters and setters
    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }
    public Style getStyle() { return style; }
    public void setStyle(Style style) { this.style = style; }
    public Audience getAudience() { return audience; }
    public void setAudience(Audience audience) { this.audience = audience; }
    public List<Size> getSizesIncluded() { return sizesIncluded; }
    public void setSizesIncluded(List<Size> sizesIncluded) { this.sizesIncluded = sizesIncluded; }
    public EditingLevel getEditingLevel() { return editingLevel; }
    public void setEditingLevel(EditingLevel editingLevel) { this.editingLevel = editingLevel; }
    public Platform getPlatform() { return platform; }
    public void setPlatform(Platform platform) { this.platform = platform; }
    public Language getLanguage() { return language; }
    public void setLanguage(Language language) { this.language = language; }
}
