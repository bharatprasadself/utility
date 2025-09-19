import { useState, useEffect } from 'react';
import  ArticleLayout  from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';
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
  const [articles, setArticles] = useState<Article[]>(staticArticles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        console.log('Loading Docker articles...');
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.DOCKER);
        console.log('Docker articles response:', response);
        if (response.data && response.data.length > 0) {
          setArticles(response.data);
        } else {
          console.log('No articles found, using static content');
          setArticles(staticArticles);
        }
      } catch (error) {
        console.error('Failed to load Docker articles:', error);
        console.log('Using static content due to error');
        setArticles(staticArticles);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, []);

  return (
    <ArticleLayout
      title="Docker Articles"
      description="Learn about container technology, Docker best practices, and deployment strategies."
      articles={articles}
      isAdmin={false}
      handleEdit={() => {}}
      handleDelete={() => {}}
    />
  );
}

export default DockerArticles;