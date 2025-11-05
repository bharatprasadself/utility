package com.utilityzone.model;

public enum ArticleCategory {
    SPRING_BOOT("Spring Boot"),
    JAVA("Java"),
    REACT("React JS"),
    POSTGRESQL("PostgreSQL"),
    DOCKER("Docker"),
    MICROSERVICES("Microservices");

    private final String displayName;

    ArticleCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}