import type { ReactNode } from 'react';
import { 
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Breadcrumbs,
  Link
} from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useNavigate } from 'react-router-dom';

import type { Article } from '../../types/Article';

interface ArticleLayoutProps {
  title: string;
  description: string;
  articles: Article[];
  breadcrumbLabel: string;
  loading?: boolean;
  children?: ReactNode;
}

export function ArticleLayout({ 
  title, 
  description, 
  articles, 
  breadcrumbLabel,
  loading = false,
  children 
}: ArticleLayoutProps) {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            color="inherit"
            onClick={() => navigate('/articles')}
            sx={{ cursor: 'pointer' }}
          >
            Articles
          </Link>
          <Typography color="text.primary">{breadcrumbLabel}</Typography>
        </Breadcrumbs>
      </Box>

      <Typography variant="h4" sx={{ mb: 1, color: 'primary.main' }}>
        {title}
      </Typography>

      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        {description}
      </Typography>

      {children}

      {loading ? (
        <Stack spacing={3}>
          {[1, 2, 3].map((index) => (
            <Card key={index} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ width: '60%', height: 24, bgcolor: 'grey.200', borderRadius: 1, mb: 1 }} />
                  <Box sx={{ width: '40%', height: 20, bgcolor: 'grey.100', borderRadius: 1 }} />
                </Box>
                <Box sx={{ width: '90%', height: 60, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Box sx={{ width: 60, height: 24, bgcolor: 'grey.200', borderRadius: 1 }} />
                  <Box sx={{ width: 80, height: 24, bgcolor: 'grey.200', borderRadius: 1 }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        <Stack spacing={3}>
          {articles.map((article) => (
          <Card 
            key={article.id}
            sx={{ 
              borderRadius: 2,
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease-in-out'
              }
            }}
          >
            <CardContent>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  mb: 2,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  console.log('Article clicked:', article);
                  const id = article.id;
                  const category = article.category.toLowerCase();
                  navigate(`/articles/${category}/${id}`);
                }}
              >
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                  {article.title}
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Bookmark clicked');
                  }}
                >
                  <BookmarkIcon />
                </IconButton>
              </Box>

              <Typography variant="body1" sx={{ mb: 2, color: 'text.secondary' }}>
                {article.description}
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {article.tags.map((tag) => (
                    <Chip 
                      key={tag} 
                      label={tag} 
                      size="small"
                      sx={{ 
                        bgcolor: 'primary.light',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.main'
                        }
                      }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {article.readTime}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
        </Stack>
      )}
    </Box>
  );
}