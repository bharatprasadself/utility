import { Routes, Route, useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Box, Breadcrumbs, Link } from '@mui/material';
import SpringBootArticles from './SpringBootArticles';
import ReactArticles from './ReactArticles.tsx';
import PostgreSQLArticles from './PostgreSQLArticles.tsx';
import DockerArticles from './DockerArticles.tsx';
import MicroservicesArticles from './MicroservicesArticles.tsx';

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
        <Routes>
          <Route path="spring-boot/*" element={<SpringBootArticles />} />
          <Route path="react/*" element={<ReactArticles />} />
          <Route path="postgresql/*" element={<PostgreSQLArticles />} />
          <Route path="docker/*" element={<DockerArticles />} />
          <Route path="microservices/*" element={<MicroservicesArticles />} />
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