import { useState, useEffect } from 'react';
import  ArticleLayout  from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';
import { useAuth } from '../../contexts/AuthContext';

// Static data as fallback while API is being set up
const staticArticles: Article[] = [
  {
    id: "3001",
    title: "Docker Containers for Beginners",
    description: "Get started with Docker containers. Learn about basic concepts, commands, and how to create your first container.",
    content: `# Docker Containers for Beginners

## Introduction
Learn the basics of Docker containers and how to get started with containerization.

## What is Docker?
Docker is a platform for developing, shipping, and running applications in containers.

## Key Concepts
- Containers
- Images
- Dockerfile
- Docker Hub

## Basic Commands
\`\`\`bash
# Pull an image
docker pull hello-world

# Run a container
docker run hello-world

# List containers
docker ps
\`\`\``,
    tags: ["Docker", "Containers", "Beginner"],
    readTime: "10 min read",
    category: ArticleCategory.DOCKER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "3002",
    title: "Docker Compose in Production",
    description: "Learn how to use Docker Compose to manage multi-container applications in production environments.",
    content: `# Docker Compose in Production

## Introduction
A guide to using Docker Compose effectively in production environments.

## Key Topics
1. Docker Compose file structure
2. Environment variables
3. Network configuration
4. Volume management

## Example docker-compose.yml
\`\`\`yaml
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./web:/usr/share/nginx/html
  api:
    build: ./api
    environment:
      - NODE_ENV=production
    depends_on:
      - db
  db:
    image: postgres:13
    volumes:
      - db-data:/var/lib/postgresql/data
volumes:
  db-data:
\`\`\``,
    tags: ["Docker Compose", "Production", "Advanced"],
    readTime: "15 min read",
    category: ArticleCategory.DOCKER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "3003",
    title: "Docker Security Best Practices",
    description: "Essential security practices for Docker containers including image scanning, resource limits, and network security.",
    content: `# Docker Security Best Practices

## Introduction
Learn essential security practices for running Docker containers in production.

## Key Security Practices

### 1. Image Security
- Use official base images
- Regularly scan for vulnerabilities
- Implement least privilege principle

### 2. Container Security
\`\`\`bash
# Run container with limited resources
docker run --cpus=0.5 --memory=512m my-app

# Run as non-root user
docker run --user 1000:1000 my-app
\`\`\`

### 3. Network Security
- Use custom networks
- Implement network segmentation
- Control exposed ports

### 4. Runtime Security
- Enable security features
- Monitor container activity
- Regular security audits`,
    tags: ["Security", "Best Practices", "DOCKER"],
    readTime: "12 min read",
    category: ArticleCategory.DOCKER,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function DockerArticles() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  const [articles, setArticles] = useState<Article[]>([]);
  // Removed unused loading state to clean up warnings
  // const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = async () => {
  // no-op loading removed
    try {
      console.log('Loading Docker articles...');
      const response = await ArticleService.getArticlesByCategory(ArticleCategory.DOCKER);
      console.log('Docker articles response:', response);
      const list = Array.isArray(response.data) ? response.data : [];
      const showStatic = (import.meta as any)?.env?.VITE_SHOW_STATIC_FALLBACK === 'true';
      setArticles(list.length === 0 && showStatic ? staticArticles : list);
    } catch (error) {
      console.error('Failed to load Docker articles:', error);
      const showStatic = (import.meta as any)?.env?.VITE_SHOW_STATIC_FALLBACK === 'true';
      setArticles(showStatic ? staticArticles : []);
    } finally {
      // no-op
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
      console.log('Creating Docker article:', articleData);
      
      // Create a new article with the DOCKER category
      const articleToCreate = {
        ...articleData,
        category: ArticleCategory.DOCKER
      };
      
      console.log('Docker article to create:', articleToCreate);
      
      // Create a modified version for the API that has the raw enum name
      const apiArticle = {
        ...articleToCreate,
        category: 'DOCKER', // Hard-coded for Docker articles
        tags: articleToCreate.tags && Array.isArray(articleToCreate.tags) 
          ? articleToCreate.tags 
          : ['Docker'] // Default tag if none provided
      };
      
      console.log('API article with raw enum name:', apiArticle);
      // @ts-ignore - Ignoring type mismatch as we're manually formatting for the API
      await ArticleService.createArticle(apiArticle);
      console.log('Docker article created successfully');
      
      // Reload articles to include the new one
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to create Docker article:', error);
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
    
    console.log('Editing Docker article:', article);
    setCreating(true); // Reusing the creating state for edit operation
    setError(null);
    
    try {
      // Convert category to backend format if needed
      const updatedArticle = {
        ...article,
        category: 'DOCKER' // Hard-coded for Docker articles
      };
      
      // Make sure tags is always an array
      if (!updatedArticle.tags || !Array.isArray(updatedArticle.tags)) {
        updatedArticle.tags = ['Docker'];
      }
      
      console.log('Sending updated Docker article:', updatedArticle);
      
      // @ts-ignore - Ignoring type issues with the category
      await ArticleService.updateArticle(article.id, updatedArticle);
      console.log('Docker article updated successfully');
      
      // Reload articles to reflect changes
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to update Docker article:', error);
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
      console.log('Deleting Docker article:', id);
      await ArticleService.deleteArticle(id);
      await loadArticles(); // Refresh the articles list
    } catch (error: any) {
      console.error('Failed to delete Docker article:', error);
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
        title="Docker Articles"
        description="Learn about container technology, Docker best practices, and deployment strategies."
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

export default DockerArticles;