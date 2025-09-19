import { useState, useEffect } from 'react';
import ArticleLayout from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';

// Static fallback articles
const staticArticles: Article[] = [
  {
    id: "5001",
    title: 'Introduction to Microservices Architecture',
    description: 'Learn fundamentals of microservices architecture, benefits, and use cases.',
    content: '# Introduction to Microservices Architecture\n\nMicroservices architecture structures an application as a collection of small autonomous services.',
    tags: ['Architecture', 'Beginner', 'Design Patterns'],
    readTime: '8 min read',
    category: ArticleCategory.MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "5002",
    title: 'Service Discovery and Load Balancing',
    description: 'Implement service discovery and load balancing patterns in microservices.',
    content: '# Service Discovery & Load Balancing\n\nKey mechanisms for dynamic microservice environments.',
    tags: ['Service Discovery', 'Networking', 'Advanced'],
    readTime: '10 min read',
    category: ArticleCategory.MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "5003",
    title: 'Event-Driven Microservices',
    description: 'Event-driven patterns with messaging and eventual consistency.',
    content: '# Event-Driven Microservices\n\nUsing events to decouple service responsibilities.',
    tags: ['Event-Driven', 'Kafka', 'Messaging'],
    readTime: '11 min read',
    category: ArticleCategory.MICROSERVICES,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function MicroservicesArticles() {
  const [articles, setArticles] = useState<Article[]>(staticArticles);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        console.log('🔍 Fetching articles in category: MICROSERVICES');
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.MICROSERVICES);
        console.log(`✅ Successfully fetched ${response.data.length} articles in category MICROSERVICES`);
        if (response.data && response.data.length > 0) {
          setArticles(response.data);
        } else {
          console.log('No articles returned from API, using static content');
          setArticles(staticArticles);
        }
      } catch (e) {
        console.log('No articles returned from API, using static content');
        setArticles(staticArticles);
      }
    };
    load();
  }, []);

  return (
    <ArticleLayout
      title="Microservices Articles"
      description="Explore microservices architecture, communication patterns, and operational practices."
      articles={articles}
      isAdmin={false}
      handleEdit={() => {}}
      handleDelete={() => {}}
    />
  );
}

export default MicroservicesArticles;
