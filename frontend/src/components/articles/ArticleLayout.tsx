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

export interface Article {
  id: number;
  title: string;
  description: string;
  tags: string[];
  readTime: string;
}

interface ArticleLayoutProps {
  title: string;
  description: string;
  articles: Article[];
  breadcrumbLabel: string;
  children?: ReactNode;
}

export function ArticleLayout({ 
  title, 
  description, 
  articles, 
  breadcrumbLabel,
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

      <Stack spacing={3}>
        {articles.map((article) => (
          <Card 
            key={article.id}
            sx={{ 
              borderRadius: 2,
              '&:hover': {
                boxShadow: 3,
                transform: 'translateY(-2px)',
                transition: 'all 0.3s ease-in-out'
              }
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Typography variant="h6" sx={{ color: '#2c3e50', fontWeight: 'bold' }}>
                  {article.title}
                </Typography>
                <IconButton size="small">
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
    </Box>
  );
}