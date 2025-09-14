import { ArticleLayout, type Article } from './ArticleLayout';

const reactArticles: Article[] = [
  {
    id: 1,
    title: "Modern React Development with Hooks",
    description: "Deep dive into React Hooks and how they revolutionize state management and side effects in functional components.",
    tags: ["React Hooks", "Functional Components", "State Management"],
    readTime: "12 min read"
  },
  {
    id: 2,
    title: "Building Responsive UIs with Material-UI",
    description: "Learn how to create beautiful, responsive user interfaces using Material-UI components in React applications.",
    tags: ["Material-UI", "Responsive Design", "UI/UX"],
    readTime: "10 min read"
  },
  {
    id: 3,
    title: "State Management with Redux Toolkit",
    description: "Explore modern Redux development using Redux Toolkit. Simplify your state management with built-in best practices.",
    tags: ["Redux", "State Management", "Advanced"],
    readTime: "15 min read"
  }
];

function ReactArticles() {
  return (
    <ArticleLayout
      title="React JS Articles"
      description="Learn about React development, modern practices, and popular libraries in the React ecosystem."
      articles={reactArticles}
      breadcrumbLabel="React JS"
    />
  );
}

export default ReactArticles;