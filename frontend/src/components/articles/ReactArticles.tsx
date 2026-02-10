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
import { ThemeProvider, createTheme } from '@mui/material/styles';

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
  const [articles, setArticles] = useState<Article[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = async () => {
    try {
      console.log('Loading React articles...');
      const response = await ArticleService.getArticlesByCategory(ArticleCategory.REACT);
      console.log('React articles response:', response);
      const list = Array.isArray(response.data) ? response.data : [];
      const showStatic = (import.meta as any)?.env?.VITE_SHOW_STATIC_FALLBACK === 'true';
      setArticles(list.length === 0 && showStatic ? staticArticles : list);
    } catch (error) {
      console.error('Failed to load React articles:', error);
      const showStatic = (import.meta as any)?.env?.VITE_SHOW_STATIC_FALLBACK === 'true';
      setArticles(showStatic ? staticArticles : []);
    }
  };

  useEffect(() => {
    loadArticles();
  }, []);

  const handleCreateArticle = async (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAdmin) {
      setError('You must be an admin to create articles');
      return;
    }
    
    setCreating(true);
    setError(null);
    
    try {
      console.log('Creating article:', articleData);
      
      // Create a new article with the REACT category
      const articleToCreate = {
        ...articleData,
        category: ArticleCategory.REACT
      };
      
      console.log('Article to create with category:', articleToCreate);
      
      // Create a modified version for the API that has the raw enum name
      const apiArticle = {
        ...articleToCreate,
        // We need to convert the ArticleCategory enum to a string for the API
        category: 'REACT', // Hard-coded for now since we know this component is for React articles
        // Make sure tags is always an array, not undefined or null
        tags: articleToCreate.tags && Array.isArray(articleToCreate.tags) 
          ? articleToCreate.tags 
          : ['React'] // Default tag if none provided
      };
      
      console.log('API article with raw enum name:', apiArticle);
      // @ts-ignore - Ignoring type mismatch as we're manually formatting for the API
      await ArticleService.createArticle(apiArticle);
      console.log('Article created successfully');
      
      // Reload articles to include the new one
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to create article:', error);
      // More detailed error reporting
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to create article. Please try again.';
      
      console.error('Error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: errorMessage
      });
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };
  
  const handleEdit = async (article: Article) => {
    if (!isAdmin) {
      setError('You must be an admin to edit articles');
      return;
    }
    
    console.log('Starting article edit:', article);
    setCreating(true); // Reusing the creating state for edit operation
    setError(null);
    
    try {
      // Convert category to backend format if needed
      const updatedArticle = {
        ...article,
        category: 'REACT' // Hard-coded for React articles
      };
      
      // Make sure tags is always an array
      if (!updatedArticle.tags || !Array.isArray(updatedArticle.tags)) {
        updatedArticle.tags = ['React'];
      }
      
      console.log('Sending updated article:', updatedArticle);
      
      // @ts-ignore - Ignoring type issues with the category
      await ArticleService.updateArticle(article.id, updatedArticle);
      console.log('Article updated successfully');
      
      // Reload articles to reflect changes
      await loadArticles();
    } catch (error: any) {
      console.error('Failed to update article:', error);
      const errorMessage = 
        error?.response?.data?.message || 
        error?.message || 
        'Failed to update article. Please try again.';
      
      console.error('Update error details:', {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        message: errorMessage
      });
      
      setError(errorMessage);
    } finally {
      setCreating(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      setError('You must be an admin to delete articles');
      return;
    }
    
    try {
      console.log('Deleting article:', id);
      await ArticleService.deleteArticle(id);
      await loadArticles(); // Refresh the articles list
    } catch (error: any) {
      console.error('Failed to delete article:', error);
      setError(error?.response?.data?.message || 'Failed to delete article. Please try again.');
    }
  };

  return (
    <>
      {error && (
        <div style={{ color: 'red', padding: '10px', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}
      <ArticleLayout
        title="React JS Articles"
        description="Learn about React development, modern practices, and popular libraries in the React ecosystem."
        articles={articles}
        isAdmin={isAdmin}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handleCreate={handleCreateArticle}
      />
      {creating && <div>Processing article action...</div>}
    </>
  );
}

export default ReactArticles;