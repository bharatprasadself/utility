import { ArticleLayout, type Article } from './ArticleLayout';

const springBootArticles: Article[] = [
  {
    id: 1,
    title: "Getting Started with Spring Boot 3",
    description: "Learn how to create your first Spring Boot application with the latest version. Covers basic setup, configuration, and best practices.",
    tags: ["Spring Boot 3", "Beginner", "Tutorial"],
    readTime: "10 min read"
  },
  {
    id: 2,
    title: "Spring Boot Security: A Complete Guide",
    description: "Comprehensive guide to implementing security in your Spring Boot applications. Learn about authentication, authorization, and JWT.",
    tags: ["Security", "JWT", "Authentication"],
    readTime: "15 min read"
  },
  {
    id: 3,
    title: "RESTful APIs with Spring Boot",
    description: "Master the art of building RESTful APIs using Spring Boot. Includes CRUD operations, validation, and error handling.",
    tags: ["REST API", "CRUD", "Intermediate"],
    readTime: "12 min read"
  }
];

function SpringBootArticles() {
  return (
    <ArticleLayout
      title="Spring Boot Articles"
      description="Discover articles about Spring Boot development, best practices, and advanced techniques."
      articles={springBootArticles}
      breadcrumbLabel="Spring Boot"
    />
  );
}

export default SpringBootArticles;