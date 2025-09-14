import { ArticleLayout, type Article } from './ArticleLayout';

const postgresqlArticles: Article[] = [
  {
    id: 1,
    title: "PostgreSQL Performance Optimization",
    description: "Learn advanced techniques for optimizing PostgreSQL database performance, including indexing strategies and query optimization.",
    tags: ["Performance", "Optimization", "Advanced"],
    readTime: "15 min read"
  },
  {
    id: 2,
    title: "Database Design Best Practices",
    description: "Discover best practices for designing efficient and scalable PostgreSQL database schemas.",
    tags: ["Database Design", "Best Practices", "Schema"],
    readTime: "12 min read"
  },
  {
    id: 3,
    title: "PostgreSQL Backup and Recovery",
    description: "Comprehensive guide to implementing robust backup and recovery strategies for PostgreSQL databases.",
    tags: ["Backup", "Recovery", "Maintenance"],
    readTime: "10 min read"
  }
];

function PostgreSQLArticles() {
  return (
    <ArticleLayout
      title="PostgreSQL Articles"
      description="Explore articles about PostgreSQL database management, optimization, and best practices."
      articles={postgresqlArticles}
      breadcrumbLabel="PostgreSQL"
    />
  );
}

export default PostgreSQLArticles;