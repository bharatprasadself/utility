import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  IconButton,
  Skeleton,
  Breadcrumbs,
  Link,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import type { Article } from '../types/Article';
import { useAuth } from '../contexts/AuthContext';
import { useArticles } from '../contexts/ArticleContext';

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // debug routing pathRest: removed verbose console log

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const { getArticleById } = useArticles();

  useEffect(() => {
    console.log('ArticleDetail mounted with ID:', id);
    loadArticle();
  }, [id]);

  const loadArticle = async () => {
    if (!id) {
      console.log('No article ID provided');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Fetching article with ID:', id);
      
      // Determine if we're on a static route
      const isStaticRoute = window.location.pathname.includes('/static/');
      console.log('Is static route:', isStaticRoute);
      
      const foundArticle = await getArticleById(id);
      if (foundArticle) {
        console.log('Article found:', foundArticle);
        setArticle(foundArticle);
      } else {
        console.log('Article not found');
        setError('Article not found');
      }
    } catch (err) {
      console.error('Error loading article:', err);
      setError('Failed to load article. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        text: article?.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Add a snackbar notification
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Skeleton variant="text" width="60%" height={60} />
        <Skeleton variant="text" width="40%" height={30} />
        <Box sx={{ mt: 3 }}>
          <Skeleton variant="rectangular" height={200} />
        </Box>
      </Container>
    );
  }

  if (error || !article) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">{error || 'Article not found'}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            component="button"
            color="inherit"
            onClick={() => navigate('/articles')}
          >
            Articles
          </Link>
          <Typography color="text.primary">{article.title}</Typography>
        </Breadcrumbs>
      </Box>

  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <IconButton 
            onClick={() => navigate('/articles')}
            sx={{ mt: 1 }}
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              {article.title}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • {article.readTime}
              </Typography>
              <Chip label={article.category} color="primary" size="small" />
            </Box>

            <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
              {article.description}
            </Typography>

            <Typography 
              variant="body1" 
              component="div"
              sx={{ 
                mb: 3,
                '& p': { mb: 2 },
                '& a': { 
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' }
                }
              }}
            >
              {article.content}
            </Typography>

            <Box sx={{ mt: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {article.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  onClick={() => navigate(`/articles?tag=${tag}`)}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <IconButton onClick={handleShare} title="Share article">
              <ShareIcon />
            </IconButton>
            {isAdmin && (
              <IconButton 
                onClick={() => navigate(`/articles/edit/${article.id}`)}
                title="Edit article"
              >
                <EditIcon />
              </IconButton>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};