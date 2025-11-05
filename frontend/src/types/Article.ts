export enum ArticleCategory {
  SPRING_BOOT = 'Spring Boot',
  JAVA = 'Java',
  REACT = 'React JS',
  POSTGRESQL = 'PostgreSQL',
  DOCKER = 'Docker',
  MICROSERVICES = 'Microservices'
}

export interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  readTime: string;
  category: ArticleCategory;
  status?: 'DRAFT' | 'PUBLISHED';
  publishDate?: string;
  createdAt: string;
  updatedAt: string;
}