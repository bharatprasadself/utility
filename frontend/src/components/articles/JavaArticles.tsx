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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = async () => {
    try {
      console.log('Loading Java articles...');
      const response = await ArticleService.getArticlesByCategory(ArticleCategory.JAVA);
      console.log('Java articles response:', response);
      if (response.data && response.data.length > 0) {
        setArticles(response.data);
      } else {
        console.log('No Java articles found, using static content');
        setArticles(staticArticles);
      }
    } catch (error) {
      console.error('Failed to load Java articles:', error);
      setArticles(staticArticles);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleCreateArticle = async (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAdmin) {
      setError('You must be an admin to create articles');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      console.log('Creating Java article:', articleData);
      const articleToCreate = {
        ...articleData,
        category: ArticleCategory.JAVA
      };
      const apiArticle = {
        ...articleToCreate,
        category: 'JAVA',
        tags: articleToCreate.tags && Array.isArray(articleToCreate.tags) ? articleToCreate.tags : ['Java']
      };
      // @ts-ignore intentional formatting for API
      await ArticleService.createArticle(apiArticle);
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to create Java article:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to create article. Please try again.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (article: Article) => {
    if (!isAdmin) {
      setError('You must be an admin to edit articles');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const updated = {
        ...article,
        category: 'JAVA'
      } as any;
      const resp = await ArticleService.updateArticle(article.id, updated);
      console.log('Java article updated:', resp);
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to update Java article:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to update article. Please try again.';
      setError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      setError('You must be an admin to delete articles');
      return;
    }
    try {
      await ArticleService.deleteArticle(id);
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to delete Java article:', error);
      setError(error?.response?.data?.message || 'Failed to delete article. Please try again.');
    }
  };

  return (
    <>
      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}
      <ArticleLayout
        title="Java Articles"
        description="Articles about the Java language, platform, and ecosystem."
        articles={articles}
        isAdmin={isAdmin}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCreate={handleCreateArticle}
      />
      {creating && <div>Saving...</div>}
    </>
  );
}

export default JavaArticles;
