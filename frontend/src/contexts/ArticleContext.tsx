import React, { createContext, useContext } from 'react';
import { ArticleService } from '../services/article';
import type { Article } from '../types/Article';
import { ArticleCategory } from '../types/Article';

interface ArticleContextType {
  getArticleById: (id: string) => Promise<Article | undefined>;
  getDynamicArticleById: (id: string) => Promise<Article | undefined>;
  isStaticArticle: (id: string) => boolean;
}

const ArticleContext = createContext<ArticleContextType | undefined>(undefined);

// Static articles data
const staticArticles: Article[] = [
  {
    id: "1001",
    title: "Getting Started with Spring Boot 3",
    description: "Learn how to create your first Spring Boot application with the latest version. Covers basic setup, configuration, and best practices.",
    content: `# Getting Started with Spring Boot 3

## Introduction
Spring Boot 3 offers a streamlined way to create production-grade Spring-based applications. This guide will walk you through creating your first Spring Boot application.

## Prerequisites
- Java 17 or higher
- Maven or Gradle
- Your favorite IDE

## Steps to Create Your First Application

### 1. Setup the Project
Use Spring Initializer at https://start.spring.io to create a new project with basic dependencies:
- Spring Web
- Spring Data JPA
- H2 Database

### 2. Project Structure
Organize your project with the following structure:
- src/main/java: Java source files
- src/main/resources: Configuration files
- src/test/java: Test files

### 3. Basic Configuration
application.properties setup:
\`\`\`properties
spring.application.name=my-first-app
server.port=8080
\`\`\`

### 4. Create Your First REST Controller
\`\`\`java
@RestController
@RequestMapping("/api")
public class HelloController {
    @GetMapping("/hello")
    public String hello() {
        return "Hello from Spring Boot 3!";
    }
}
\`\`\`

## Best Practices
1. Use proper package structure
2. Implement error handling
3. Add comprehensive logging
4. Write unit tests

## Next Steps
- Add database integration
- Implement security
- Create custom configurations`,
    tags: ["Spring Boot 3", "Beginner", "Tutorial"],
    readTime: "10 min read",
    category: ArticleCategory.SPRING_BOOT,
    createdAt: "2025-09-15T10:00:00Z",
    updatedAt: "2025-09-15T10:00:00Z"
  },
  {
    id: "1002",
    title: "Spring Boot Security: A Complete Guide",
    description: "Comprehensive guide to implementing security in your Spring Boot applications. Learn about authentication, authorization, and JWT.",
    content: "# Spring Boot Security Guide\n\nDetailed content about Spring Security...",
    tags: ["Security", "JWT", "Authentication"],
    readTime: "15 min read",
    category: ArticleCategory.SPRING_BOOT,
    createdAt: "2025-09-15T11:00:00Z",
    updatedAt: "2025-09-15T11:00:00Z"
  },
  // Add more articles as needed
];

export const ArticleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isStaticArticle = (id: string) => {
    return staticArticles.some(article => article.id === id);
  };

  const getDynamicArticleById = async (id: string) => {
    try {
      const response = await ArticleService.getArticleById(id);
      console.log('Found dynamic article:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching dynamic article:', error);
      return undefined;
    }
  };

  const getArticleById = async (id: string) => {
    console.log('Getting article by ID:', id);
    
    // Try static articles first
    const staticArticle = staticArticles.find(article => article.id === id);
    if (staticArticle) {
      console.log('Found static article:', staticArticle);
      return staticArticle;
    }

    // Fall back to dynamic articles
    return getDynamicArticleById(id);
  };

  return (
    <ArticleContext.Provider value={{
      getArticleById,
      getDynamicArticleById,
      isStaticArticle
    }}>
      {children}
    </ArticleContext.Provider>
  );
};

export const useArticles = () => {
  const context = useContext(ArticleContext);
  if (!context) {
    throw new Error('useArticles must be used within an ArticleProvider');
  }
  return context;
};