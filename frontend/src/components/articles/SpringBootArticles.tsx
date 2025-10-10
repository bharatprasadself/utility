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
  
  // Debug user roles
  console.log('User in SpringBootArticles:', user);
  console.log('User roles in SpringBootArticles:', user?.roles);
  console.log('User roles type:', Array.isArray(user?.roles) ? 'array' : typeof user?.roles);
  
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  console.log('Is admin in SpringBootArticles:', isAdmin);
  
  const [articles, setArticles] = useState<Article[]>(staticArticles);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      console.log('Creating article:', articleData);
      
      // Create a new article with the SPRING_BOOT category
      const articleToCreate = {
        ...articleData,
        category: ArticleCategory.SPRING_BOOT
      };
      
      console.log('Article to create with category:', articleToCreate);
      
      // Create a modified version for the API that has the raw enum name
      const apiArticle = {
        ...articleToCreate,
        // We need to convert the ArticleCategory enum to a string for the API
        category: 'SPRING_BOOT', // Hard-coded for now since we know this component is for Spring Boot articles
        // Make sure tags is always an array, not undefined or null
        tags: articleToCreate.tags && Array.isArray(articleToCreate.tags) 
          ? articleToCreate.tags 
          : ['Spring Boot'] // Default tag if none provided
      };
      
      console.log('API article with raw enum name:', apiArticle);
      // @ts-ignore - Ignoring type mismatch as we're manually formatting for the API
      await ArticleService.createArticle(apiArticle);
      console.log('Article created successfully');
      
      // Reload articles to include the new one
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to create article:', error);
      // More detailed error reporting
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to create article. Please try again.';
      
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: errorMessage
      });
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };
  
  const handleEdit = async (article: Article) => {
    if (!isAdmin) {
      setError('You must be an admin to edit articles');
      return;
    }
    
    console.log('Starting article edit:', article);
    console.log('Article ID type:', typeof article.id, 'Value:', article.id);
    setCreating(true); // Reusing the creating state for edit operation
    setError(null);
    
    try {
      // Convert category to backend format if needed
      const updatedArticle = {
        ...article,
        category: 'SPRING_BOOT' // Hard-coded for Spring Boot articles
      };
      
      // Make sure tags is always an array
      if (!updatedArticle.tags || !Array.isArray(updatedArticle.tags)) {
        updatedArticle.tags = ['Spring Boot'];
      }
      
      console.log('Sending updated article:', updatedArticle);
      console.log('Article ID for update:', article.id);
      
      // @ts-ignore - Ignoring type issues with the category
      const response = await ArticleService.updateArticle(article.id, updatedArticle);
      console.log('Article updated successfully', response);
      
      // Reload articles to reflect changes
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to update article:', error);
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to update article. Please try again.';
      
      console.error('Update error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: errorMessage
      });
      
      setError(errorMessage);
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
      console.log('Deleting article:', id);
      await ArticleService.deleteArticle(id);
      await loadArticles(); // Refresh the articles list
    } catch (error: any) {
      console.error('Failed to delete article:', error);
      setError(error?.response?.data?.message || 'Failed to delete article. Please try again.');
    }
  };

  // Pass the error to the parent component if needed
  useEffect(() => {
    if (error) {
      console.error('Article error:', error);
      // Could display a toast or alert here
    }
  }, [error]);

  return (
    <>
      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}
      <ArticleLayout
        title="Spring Boot Articles"
        description="Articles about Spring Boot, microservices, and building production-ready Java applications."
        articles={articles}
        isAdmin={isAdmin}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCreate={handleCreateArticle}
      />
      {creating && <div>Creating article...</div>}
    </>
  );
}

export default SpringBootArticles;

