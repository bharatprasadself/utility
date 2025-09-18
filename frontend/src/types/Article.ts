export enum ArticleCategory {
  SPRING_BOOT = 'SPRING_BOOT',
  REACT = 'REACT',
  POSTGRESQL = 'POSTGRESQL',
  DOCKER = 'DOCKER',
  MICROSERVICES = 'MICROSERVICES'
}

export interface Article {
  id: number;
  title: string;
  description: string;
  content: string;
  tags: string[];
  readTime: string;
  category: ArticleCategory;
  createdAt: string;
  updatedAt: string;
}