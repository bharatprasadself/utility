import { Routes, Route, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import SpringBootArticles from './SpringBootArticles';
import ReactArticles from './ReactArticles';
import PostgreSQLArticles from './PostgreSQLArticles';
import DockerArticles from './DockerArticles';
import MicroservicesArticles from './MicroservicesArticles';

export default function Articles() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 3,
          background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)'
        }}
      >
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
          </Breadcrumbs>
        </Box>

        <Routes>
          <Route path="spring-boot" element={<SpringBootArticles />} />
          <Route path="react" element={<ReactArticles />} />
          <Route path="postgresql" element={<PostgreSQLArticles />} />
          <Route path="docker" element={<DockerArticles />} />
          <Route path="microservices" element={<MicroservicesArticles />} />
          <Route 
            path="/" 
            element={
              <Box>
                <Typography variant="h4" sx={{ mb: 4, color: 'primary.main' }}>
                  Technical Articles
                </Typography>
                <Typography variant="body1" sx={{ mb: 3 }}>
                  Explore our comprehensive collection of technical articles covering various technologies and frameworks.
                </Typography>
              </Box>
            } 
          />
        </Routes>
      </Paper>
    </Container>
  );
}