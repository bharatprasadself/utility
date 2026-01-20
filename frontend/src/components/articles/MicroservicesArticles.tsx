import { useState, useEffect } from 'react';
import ArticleLayout from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';
import { useAuth } from '../../contexts/AuthContext';

// Static data as fallback while API is being set up
const staticArticles: Article[] = [
  {
    id: '4001',
    title: 'Microservices Architecture Overview',
    description: 'Understand the fundamentals of microservices architecture and when to use it.',
    content: `# Microservices Architecture Overview

## Introduction
Microservices break an application into small, independently deployable services.

## Benefits
- Independent deployment
- Scalability
- Fault isolation
`,
    tags: ['Microservices', 'Architecture'],
    readTime: '10 min read',
    category: ArticleCategory.MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4002',
    title: 'Designing Microservices APIs',
    description: 'Best practices for designing stable APIs between microservices, including versioning and contracts.',
    content: `# Designing Microservices APIs

## Principles
- Keep contracts small
- Version APIs
- Prefer backward compatible changes
`,
    tags: ['API', 'Design', 'Microservices'],
    readTime: '12 min read',
    category: ArticleCategory.MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '4003',
    title: 'Distributed Tracing and Observability',
    description: 'Instrument microservices with tracing and logs to understand performance and failures.',
    content: `# Distributed Tracing and Observability

## Tools
- OpenTelemetry
- Jaeger
- Prometheus + Grafana
`,
    tags: ['Observability', 'Tracing', 'Monitoring'],
    readTime: '9 min read',
    category: ArticleCategory.MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function MicroservicesArticles() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  const [articles, setArticles] = useState<Article[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = async () => {
    try {
      console.log('Loading Microservices articles...');
      const response = await ArticleService.getArticlesByCategory(ArticleCategory.MICROSERVICES);
      console.log('Microservices articles response:', response);
      const list = Array.isArray(response.data) ? response.data : [];
      const showStatic = (import.meta as any)?.env?.VITE_SHOW_STATIC_FALLBACK === 'true';
      setArticles(list.length === 0 && showStatic ? staticArticles : list);
    } catch (error) {
      console.error('Failed to load Microservices articles:', error);
      const showStatic = (import.meta as any)?.env?.VITE_SHOW_STATIC_FALLBACK === 'true';
      setArticles(showStatic ? staticArticles : []);
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
      console.log('Creating Microservices article:', articleData);
      
      // Create a new article with the MICROSERVICES category
      const articleToCreate = {
        ...articleData,
        category: ArticleCategory.MICROSERVICES
      };
      
      console.log('Microservices article to create:', articleToCreate);
      
      // Create a modified version for the API that has the raw enum name
      const apiArticle = {
        ...articleToCreate,
        category: 'MICROSERVICES', // Hard-coded for Microservices articles
        tags: articleToCreate.tags && Array.isArray(articleToCreate.tags) 
          ? articleToCreate.tags 
          : ['Microservices'] // Default tag if none provided
      };
      
      console.log('API article with raw enum name:', apiArticle);
      // @ts-ignore - Ignoring type mismatch as we're manually formatting for the API
      await ArticleService.createArticle(apiArticle);
      console.log('Microservices article created successfully');
      
      // Reload articles to include the new one
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to create Microservices article:', error);
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
    
    console.log('Editing Microservices article:', article);
    setCreating(true); // Reusing the creating state for edit operation
    setError(null);
    
    try {
      // Convert category to backend format if needed
      const updatedArticle = {
        ...article,
        category: 'MICROSERVICES' // Hard-coded for Microservices articles
      };
      
      // Make sure tags is always an array
      if (!updatedArticle.tags || !Array.isArray(updatedArticle.tags)) {
        updatedArticle.tags = ['Microservices'];
      }
      
      console.log('Sending updated Microservices article:', updatedArticle);
      
      // @ts-ignore - Ignoring type issues with the category
      await ArticleService.updateArticle(article.id, updatedArticle);
      console.log('Microservices article updated successfully');
      
      // Reload articles to reflect changes
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to update Microservices article:', error);
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
      console.log('Deleting Microservices article:', id);
      await ArticleService.deleteArticle(id);
      await loadArticles(); // Refresh the articles list
    } catch (error: any) {
      console.error('Failed to delete Microservices article:', error);
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
        title="Microservices Articles"
        description="Articles about microservices design, deployment, and observability."
        articles={articles}
        isAdmin={isAdmin}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCreate={handleCreateArticle}
      />
      {creating && <div>Processing article action...</div>}
    </>
  );
}

export default MicroservicesArticles;

