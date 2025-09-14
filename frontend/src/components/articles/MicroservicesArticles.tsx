import { ArticleLayout, type Article } from './ArticleLayout';

const microservicesArticles: Article[] = [
  {
    id: 1,
    title: "Introduction to Microservices Architecture",
    description: "Learn the fundamentals of microservices architecture, its benefits, and when to use it in your applications.",
    tags: ["Architecture", "Beginner", "Design Patterns"],
    readTime: "12 min read"
  },
  {
    id: 2,
    title: "Service Discovery and Load Balancing",
    description: "Implement service discovery and load balancing in your microservices architecture using modern tools and techniques.",
    tags: ["Service Discovery", "Load Balancing", "Advanced"],
    readTime: "15 min read"
  },
  {
    id: 3,
    title: "Event-Driven Microservices",
    description: "Deep dive into event-driven architecture in microservices, including message queues and event sourcing.",
    tags: ["Event-Driven", "Kafka", "Advanced"],
    readTime: "15 min read"
  }
];

function MicroservicesArticles() {
  return (
    <ArticleLayout
      title="Microservices Articles"
      description="Explore microservices architecture, patterns, and implementation strategies."
      articles={microservicesArticles}
      breadcrumbLabel="Microservices"
    />
  );
}

export default MicroservicesArticles;