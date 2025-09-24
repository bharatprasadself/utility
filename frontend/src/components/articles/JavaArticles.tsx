import { useState, useEffect } from 'react';
import ArticleLayout from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';
import { useAuth } from '../../contexts/AuthContext';

// Static data as fallback while API is being set up
const staticArticles: Article[] = [
  {
    id: "4001",
    title: "Java 17 Features and Migration",
    description: "An overview of new features in Java 17 and migration tips from older Java versions.",
    content: `# Java 17 Features and Migration

## Introduction
Java 17 is a long-term support (LTS) release with many improvements including sealed classes, pattern matching enhancements, and more.

## Key Features
- Sealed classes
- Pattern matching for instanceof
- Records improvements

## Migration Tips
1. Update your toolchain (JDK, build plugins)
2. Run tests and static analysis
3. Replace deprecated APIs
`,
    tags: ["Java", "JDK", "LTS"],
    readTime: "12 min read",
    category: ArticleCategory.JAVA,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "4002",
    title: "Building RESTful APIs with Spring Boot and Java",
    description: "Best practices for building RESTful services with Spring Boot on Java.",
    content: `# Building RESTful APIs with Spring Boot and Java

## Introduction
Spring Boot makes it simple to build production-ready REST services. This article covers controller design, DTOs, and exception handling.
`,
    tags: ["Spring Boot", "REST", "Java"],
    readTime: "10 min read",
    category: ArticleCategory.JAVA,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function JavaArticles() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  const [articles, setArticles] = useState<Article[]>(staticArticles);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        console.log('Loading Java articles...');
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.JAVA as any);
        console.log('Java articles response:', response);
        if (response.data && response.data.length > 0) {
          setArticles(response.data);
        } else {
          console.log('No articles found, using static content');
          setArticles(staticArticles);
        }
      } catch (error) {
        console.error('Failed to load Java articles:', error);
        setArticles(staticArticles);
      }
    };

    loadArticles();
  }, []);

  return (
    <ArticleLayout
      title="Java Articles"
      description="Articles about the Java language, platform, and ecosystem."
      articles={articles}
      isAdmin={isAdmin}
      handleEdit={() => {}}
      handleDelete={() => {}}
    />
  );
}

export default JavaArticles;
