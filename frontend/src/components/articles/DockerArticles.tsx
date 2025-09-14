import { ArticleLayout, type Article } from './ArticleLayout';

const dockerArticles: Article[] = [
  {
    id: 1,
    title: "Docker Containers for Beginners",
    description: "Get started with Docker containers. Learn about basic concepts, commands, and how to create your first container.",
    tags: ["Docker", "Containers", "Beginner"],
    readTime: "10 min read"
  },
  {
    id: 2,
    title: "Docker Compose in Production",
    description: "Learn how to use Docker Compose to manage multi-container applications in production environments.",
    tags: ["Docker Compose", "Production", "Advanced"],
    readTime: "15 min read"
  },
  {
    id: 3,
    title: "Docker Security Best Practices",
    description: "Essential security practices for Docker containers including image scanning, resource limits, and network security.",
    tags: ["Security", "Best Practices", "DevOps"],
    readTime: "12 min read"
  }
];

function DockerArticles() {
  return (
    <ArticleLayout
      title="Docker Articles"
      description="Learn about container technology, Docker best practices, and deployment strategies."
      articles={dockerArticles}
      breadcrumbLabel="Docker"
    />
  );
}

export default DockerArticles;