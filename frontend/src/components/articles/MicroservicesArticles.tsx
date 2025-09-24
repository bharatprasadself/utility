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
  const [articles, setArticles] = useState<Article[]>(staticArticles);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        console.log('Loading Microservices articles...');
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.MICROSERVICES);
        console.log('Microservices articles response:', response);
        if (response.data && response.data.length > 0) {
          setArticles(response.data);
        } else {
          console.log('No articles found, using static content');
          setArticles(staticArticles);
        }
      } catch (error) {
        console.error('Failed to load Microservices articles:', error);
        console.log('Using static content due to error');
        setArticles(staticArticles);
      }
    };

    loadArticles();
  }, []);

  return (
    <ArticleLayout
      title="Microservices Articles"
      description="Articles about microservices design, deployment, and observability."
      articles={articles}
      isAdmin={isAdmin}
      handleEdit={() => {}}
      handleDelete={() => {}}
    />
  );
}

export default MicroservicesArticles;

