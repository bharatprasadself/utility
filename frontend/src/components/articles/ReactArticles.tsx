import { useState, useEffect } from 'react';
import ArticleLayout from './ArticleLayout';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';
import { useAuth } from '../../contexts/AuthContext';

// Static data as fallback
const staticArticles: Article[] = [
  {
    id: "2001",
    title: "Modern React Development with Hooks",
    description: "Deep dive into React Hooks and how they revolutionize state management and side effects in functional components.",
    content: `# Modern React Development with Hooks

## Introduction
React Hooks have revolutionized how we write React components. This guide covers essential hooks and best practices.

## Essential Hooks

### 1. useState Hook
\`\`\`jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
\`\`\`

### 2. useEffect Hook
\`\`\`jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch(\`/api/users/\${userId}\`);
      const data = await response.json();
      setUser(data);
    };
    
    fetchUser();
  }, [userId]);
  
  if (!user) return 'Loading...';
  return <div>{user.name}</div>;
}
\`\`\`

### 3. Custom Hooks
\`\`\`jsx
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
\`\`\`

## Best Practices
1. Use multiple simple hooks instead of one complex hook
2. Keep hooks at the top level
3. Name custom hooks with 'use' prefix
4. Memoize callbacks and values when needed
5. Clean up side effects`,
    tags: ["React Hooks", "Functional Components", "State Management"],
    readTime: "12 min read",
    category: ArticleCategory.REACT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "2002",
    title: "Building Responsive UIs with Material-UI",
    description: "Learn how to create beautiful, responsive user interfaces using Material-UI components in React applications.",
    content: `# Building Responsive UIs with Material-UI

## Introduction
Material-UI provides a comprehensive set of React components that implement Google's Material Design. Learn how to create beautiful, responsive interfaces.

## Getting Started

### 1. Installation
\`\`\`bash
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material
\`\`\`

### 2. Theme Setup
\`\`\`jsx
import { ThemeProvider, createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <YourApp />
    </ThemeProvider>
  );
}
\`\`\`

## Responsive Design

### 1. Grid System
\`\`\`jsx
function ResponsiveGrid() {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h5">
              Item 1
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      {/* More grid items */}
    </Grid>
  );
}
\`\`\`

### 2. Breakpoints
\`\`\`jsx
const styles = {
  box: {
    padding: {
      xs: 1,
      sm: 2,
      md: 3,
    },
    display: {
      xs: 'block',
      md: 'flex',
    },
  },
};
\`\`\`

## Best Practices
1. Use the theme system
2. Implement proper spacing
3. Consider mobile-first approach
4. Utilize CSS-in-JS effectively
5. Follow Material Design guidelines`,
    tags: ["Material-UI", "Responsive Design", "UI/UX"],
    readTime: "10 min read",
    category: ArticleCategory.REACT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "2003",
    title: "State Management with Redux Toolkit",
    description: "Explore modern Redux development using Redux Toolkit. Simplify your state management with built-in best practices.",
    content: `# State Management with Redux Toolkit

## Introduction
Redux Toolkit is the official, opinionated toolset for efficient Redux development. Learn how to manage state effectively using RTK.

## Getting Started

### 1. Installation
\`\`\`bash
npm install @reduxjs/toolkit react-redux
\`\`\`

### 2. Store Setup
\`\`\`typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from './features/counter/counterSlice';
import userReducer from './features/user/userSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
\`\`\`

## Creating Slices

### 1. Feature Slice
\`\`\`typescript
// features/counter/counterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  status: 'idle' | 'loading' | 'failed';
}

const initialState: CounterState = {
  value: 0,
  status: 'idle',
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, decrement, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
\`\`\`

### 2. Using in Components
\`\`\`typescript
import { useSelector, useDispatch } from 'react-redux';
import { increment, decrement } from './counterSlice';
import type { RootState } from '../../store';

export function Counter() {
  const count = useSelector((state: RootState) => state.counter.value);
  const dispatch = useDispatch();

  return (
    <div>
      <div>{count}</div>
      <button onClick={() => dispatch(increment())}>+</button>
      <button onClick={() => dispatch(decrement())}>-</button>
    </div>
  );
}
\`\`\`

## Best Practices
1. Use RTK Query for API calls
2. Implement proper TypeScript types
3. Organize by feature folders
4. Use createSelector for memoization
5. Keep state normalized`,
    tags: ["Redux", "State Management", "Advanced"],
    readTime: "15 min read",
    category: ArticleCategory.REACT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function ReactArticles() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN') ?? false;
  const [articles, setArticles] = useState<Article[]>(staticArticles);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await ArticleService.getArticlesByCategory(ArticleCategory.REACT);
        if (response.data && response.data.length > 0) {
          setArticles(response.data);
        } else {
          console.log('No articles returned from API, using static content');
          setArticles(staticArticles);
        }
      } catch (error) {
        console.error('Error loading React articles:', error);
        console.log('Using static content as fallback');
        setArticles(staticArticles);
      }
    };

    loadArticles();
  }, []);

  return (
    <ArticleLayout
      title="React JS Articles"
      description="Learn about React development, modern practices, and popular libraries in the React ecosystem."
      articles={articles}
      isAdmin={isAdmin}
      handleEdit={() => {}}
      handleDelete={() => {}}
    />
  );
}

export default ReactArticles;