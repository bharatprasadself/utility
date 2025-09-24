import { useState, useEffect } from 'react';
import ArticleLayout from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';
import { useAuth } from '../../contexts/AuthContext';

// Static data as fallback while API is being set up
const staticArticles: Article[] = [
  {
    id: '2001',
    title: 'Getting Started with Spring Boot',
    description: 'An introduction to Spring Boot and how to create your first application.',
    content: `# Getting Started with Spring Boot\n\n## Introduction\nThis guide helps you create your first Spring Boot application using Spring Initializr.\n\n## Steps\n1. Generate a new project on start.spring.io\n2. Import into your IDE\n3. Run with ./mvnw spring-boot:run\n`,
    tags: ['Spring Boot', 'Beginner'],
    readTime: '8 min read',
    category: ArticleCategory.SPRING_BOOT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2002',
    title: 'Building REST APIs with Spring Boot',
    description: 'Best practices for designing and implementing RESTful APIs using Spring Boot and Spring MVC.',
    content: `# Building REST APIs with Spring Boot\n\n## Controllers\nUse @RestController and @RequestMapping to define endpoints.\n\n## DTOs and Validation\nUse DTO objects and @Valid to validate incoming requests.\n`,
    tags: ['REST', 'Spring MVC', 'API'],
    readTime: '12 min read',
    category: ArticleCategory.SPRING_BOOT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2003',
    title: 'Spring Boot Actuator and Monitoring',
    description: 'Expose operational endpoints and monitor your Spring Boot application with Actuator.',
    content: `# Spring Boot Actuator and Monitoring\n\n## Overview\nSpring Boot Actuator provides production-ready features such as health checks, metrics, and info endpoints.\n\n## Setup\nAdd spring-boot-starter-actuator to your dependencies and configure management endpoints.\n`,
    tags: ['Actuator', 'Monitoring', 'Production'],
    readTime: '7 min read',
    category: ArticleCategory.SPRING_BOOT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function SpringBootArticles() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  const [articles, setArticles] = useState<Article[]>(staticArticles);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        console.log('Loading Spring Boot articles...');
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.SPRING_BOOT);
        console.log('Spring Boot articles response:', response);
        if (response.data && response.data.length > 0) {
          setArticles(response.data);
        } else {
          console.log('No Spring Boot articles found, using static content');
          setArticles(staticArticles);
        }
      } catch (error) {
        console.error('Failed to load Spring Boot articles:', error);
        console.log('Using static Spring Boot content due to error');
        setArticles(staticArticles);
      }
    };

    loadArticles();
  }, []);

  return (
    <ArticleLayout
      title="Spring Boot Articles"
      description="Articles about Spring Boot, microservices, and building production-ready Java applications."
      articles={articles}
      isAdmin={isAdmin}
      handleEdit={() => {}}
      handleDelete={() => {}}
    />
  );
}

export default SpringBootArticles;

