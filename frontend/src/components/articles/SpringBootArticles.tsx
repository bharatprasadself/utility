import { useState, useEffect } from 'react';
import ArticleLayout from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';

// Static fallback articles
const staticArticles: Article[] = [
  {
    id: "1001",
    title: 'Getting Started with Spring Boot 3',
    description: 'Create your first Spring Boot 3 application: setup, structure, and essentials.',
    content: '# Getting Started with Spring Boot 3\n\nSpring Boot 3 streamlines Java development with opinionated auto-configuration.',
    tags: ['Spring Boot', 'Beginner', 'Setup'],
    readTime: '8 min read',
    category: ArticleCategory.SPRING_BOOT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "1002",
    title: 'Spring Boot Security Basics',
    description: 'Add authentication, authorization, and password security to your Spring Boot app.',
    content: '# Spring Boot Security Basics\n\nImplement foundational security patterns in Spring Boot.',
    tags: ['Security', 'Auth', 'Spring'],
    readTime: '10 min read',
    category: ArticleCategory.SPRING_BOOT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "1003",
    title: 'Building REST APIs with Spring Boot',
    description: 'Design and implement clean RESTful APIs using Spring Boot best practices.',
    content: '# Building REST APIs\n\nDesigning resource-centric endpoints and handling validation.',
    tags: ['REST', 'API', 'Spring Boot'],
    readTime: '9 min read',
    category: ArticleCategory.SPRING_BOOT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function SpringBootArticles() {
  console.log('SpringBootArticles component rendering');
  const [articles, setArticles] = useState<Article[]>(staticArticles);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SpringBootArticles useEffect triggered');
    console.log('Current static articles:', staticArticles);
    
    // Ensure static content is set immediately
    setArticles(staticArticles);
    console.log('Static content set initially');

    const loadArticles = async () => {
      try {
        setLoading(true);
        console.log('Attempting to load dynamic Spring Boot articles...');
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.SPRING_BOOT);
        console.log('API Response:', response);
        
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
        console.log('Final articles state after API call');
      }
    };

    // Attempt to load dynamic content after static content is set
    loadArticles();
  }, []);

  return (
    <ArticleLayout
      title="Spring Boot Articles"
      description="Explore Spring Boot features, security, and API development guides."
      articles={articles}
      isAdmin={false}
      handleEdit={() => {}}
      handleDelete={() => {}}
    />
  );
}

export default SpringBootArticles;
