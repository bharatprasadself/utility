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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
      
  // Determine if we're on a static route (kept for future use)
  // const isStaticRoute = window.location.pathname.includes('/static/');
      
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

            <Box sx={{ mb: 3 }}>
              <MarkdownContent content={article.description} hideLeadingH1 />
            </Box>

            <Box sx={{ mb: 3,
              '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
              '& .footnotes': { mt: 2, pt: 1, borderTop: '1px solid #e0e0e0' }
            }}>
              <MarkdownContent content={article.content} hideLeadingH1 />
            </Box>

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

// Reusable markdown renderer with heading size constraints and optional H1 removal
const MarkdownContent: React.FC<{ content: string; hideLeadingH1?: boolean }> = ({ content, hideLeadingH1 = false }) => {
  const processed = hideLeadingH1 ? content.replace(/^\s*#\s+.*\n?/, '') : content;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: (props: any) => (
          <Typography component="h1" variant="h4" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 700 }}>
            {props.children}
          </Typography>
        ),
        h2: (props: any) => (
          <Typography component="h2" variant="h5" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 700 }}>
            {props.children}
          </Typography>
        ),
        h3: (props: any) => (
          <Typography component="h3" variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 700 }}>
            {props.children}
          </Typography>
        ),
        h4: (props: any) => (
          <Typography component="h4" variant="subtitle1" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            {props.children}
          </Typography>
        ),
        h5: (props: any) => (
          <Typography component="h5" variant="subtitle2" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            {props.children}
          </Typography>
        ),
        h6: (props: any) => (
          <Typography component="h6" variant="body1" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 600 }}>
            {props.children}
          </Typography>
        ),
        p: (props: any) => (
          <Typography component="p" variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
            {props.children}
          </Typography>
        )
      }}
    >
      {processed}
    </ReactMarkdown>
  );
};