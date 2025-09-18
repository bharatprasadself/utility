import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Chip,
  Container,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Dialog,
  Stack,
  Alert
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { Article } from '@/types/Article';
import { ArticleCategory } from '@/types/Article';
import { ArticleService } from '@/services/article';
import { ArticleForm } from './ArticleForm';
import { useAuth } from '@/contexts/AuthContext';

export const ArticleList: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  console.log('=== ArticleList Auth Context ===');
  console.log('Full auth context:', auth);
  
  const { user } = auth;
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // Immediate debug log when component is rendered
  console.log('=== ArticleList User Info ===');
  console.log('User object:', user);
  console.log('Username:', user?.username);
  console.log('Roles array:', user?.roles);
  console.log('Roles type:', typeof user?.roles);
  console.log('Is roles an array?', Array.isArray(user?.roles));
  
  // Get admin status from user roles - with detailed debugging
  const hasRoles = !!user?.roles;
  const rolesArray = user?.roles || [];
  const containsAdminRole = rolesArray.includes("ROLE_ADMIN");
  const isAdmin = hasRoles && containsAdminRole;

  console.log('=== Admin Check Debug ===');
  console.log('Has roles?', hasRoles);
  console.log('Roles array:', rolesArray);
  console.log('Contains ROLE_ADMIN?', containsAdminRole);
  console.log('Final isAdmin value:', isAdmin);
  
  // Function to log debug info
  const logDebugInfo = () => {
    console.clear(); // Clear previous logs
    console.log('=== ArticleList Debug Info ===');
    console.log('User:', user);
    console.log('Roles:', user?.roles);
    console.log('Has ROLE_ADMIN:', user?.roles?.includes("ROLE_ADMIN"));
    console.log('isAdmin value:', isAdmin);
    console.log('Number of articles:', articles.length);
    console.log('Current category:', selectedCategory);
  };

  // Debug effect
  useEffect(() => {
    logDebugInfo();
  }, [user, isAdmin, articles]);

  // Add articles debug log
  useEffect(() => {
    console.log('ArticleList - Data Debug:');
    console.log('  Number of articles:', articles.length);
    console.log('  Articles:', articles);
  }, [articles]);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'ALL'>('ALL');
  const [searchTag, setSearchTag] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | undefined>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadArticles();
  }, [selectedCategory, searchTag]);

  const loadArticles = async () => {
    setLoading(true);
    try {
      let response;
      if (selectedCategory !== 'ALL') {
        response = await ArticleService.getArticlesByCategory(selectedCategory as ArticleCategory);
      } else if (searchTag) {
        response = await ArticleService.getArticlesByTag(searchTag);
      } else {
        response = await ArticleService.getAllArticles();
      }
      setArticles(response.data);
      console.log('Loaded articles:', response.data);
    } catch (error) {
      console.error('Error loading articles:', error);
      setAlert({
        type: 'error',
        message: 'Failed to load articles. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateArticle = async (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAdmin) {
      setAlert({
        type: 'error',
        message: 'You must be an admin to create articles'
      });
      return;
    }

    try {
      await ArticleService.createArticle(articleData);
      await loadArticles();
      setIsFormOpen(false);
      setAlert({
        type: 'success',
        message: 'Article created successfully!'
      });
    } catch (error) {
      console.error('Error creating article:', error);
      setAlert({
        type: 'error',
        message: 'Failed to create article. Please try again.'
      });
    }
  };

  const handleUpdateArticle = async (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAdmin) {
      setAlert({
        type: 'error',
        message: 'You must be an admin to update articles'
      });
      return;
    }

    try {
      if (selectedArticle) {
        await ArticleService.updateArticle(selectedArticle.id, articleData);
        await loadArticles();
        setIsFormOpen(false);
        setSelectedArticle(undefined);
        setAlert({
          type: 'success',
          message: 'Article updated successfully!'
        });
      }
    } catch (error) {
      console.error('Error updating article:', error);
      setAlert({
        type: 'error',
        message: 'Failed to update article. Please try again.'
      });
    }
  };

  const handleDelete = async () => {
    if (!isAdmin) {
      setAlert({
        type: 'error',
        message: 'You must be an admin to delete articles'
      });
      return;
    }

    try {
      if (articleToDelete) {
        await ArticleService.deleteArticle(articleToDelete.id);
        await loadArticles();
        setIsDeleteDialogOpen(false);
        setArticleToDelete(null);
        setAlert({
          type: 'success',
          message: 'Article deleted successfully!'
        });
      }
    } catch (error) {
      console.error('Error deleting article:', error);
      setAlert({
        type: 'error',
        message: 'Failed to delete article. Please try again.'
      });
    }
  };

  const handleEdit = (article: Article) => {
    setSelectedArticle(article);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedArticle(undefined);
  };

  // Debug render
  console.log('ArticleList - Render Debug:');
  console.log('  isAdmin:', isAdmin);
  console.log('  Username:', user?.username);
  console.log('  Has user:', !!user);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography>Please log in to view articles</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3 }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              '& > span': { mx: 1 }
            }}
          >
            Articles <span>/</span> {selectedCategory !== 'ALL' ? selectedCategory.replace(/_/g, ' ') : 'All Categories'}
          </Typography>
        </Box>

        {/* Header Section */}
        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          alignItems={{ xs: 'flex-start', md: 'center' }} 
          justifyContent="space-between" 
          spacing={2} 
          mb={4}
        >
          <Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                color: 'primary.main', 
                mb: 1,
                fontWeight: 'bold'
              }}
            >
              {selectedCategory !== 'ALL' 
                ? `${selectedCategory.replace(/_/g, ' ')} Articles`
                : 'Technical Articles'
              }
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
              Discover articles about development, best practices, and advanced techniques.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Logged in as: {user?.username}
              </Typography>
              {isAdmin && (
                <Chip
                  label="Admin"
                  color="primary"
                  size="small"
                  sx={{
                    borderRadius: 1,
                    fontWeight: 500
                  }}
                />
              )}
            </Box>
          </Box>
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setIsFormOpen(true)}
              startIcon={<AddIcon />}
              sx={{
                px: 3,
                py: 1,
                borderRadius: 2,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4,
                }
              }}
            >
              Create Article
            </Button>
          )}
        </Stack>
        {/* Debug Button */}
        <Button
          onClick={logDebugInfo}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        >
          Debug Info
        </Button>

        {/* Alert Messages */}
        {alert && (
          <Alert 
            severity={alert.type}
            onClose={() => setAlert(null)}
            sx={{ 
              mb: 3,
              borderRadius: 2,
              boxShadow: 1
            }}
          >
            {alert.message}
          </Alert>
        )}

        {/* Filters Section */}
        <Box 
          sx={{ 
            bgcolor: 'background.paper',
            p: 3,
            borderRadius: 2,
            boxShadow: 1,
            mb: 4
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>Filter Articles</Typography>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value as ArticleCategory | 'ALL')}
                >
                  <MenuItem value="ALL">All Categories</MenuItem>
                  {Object.values(ArticleCategory).map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                size="small"
                label="Search by tag"
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
            </Box>
            {searchTag && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                  Active Filters:
                </Typography>
                <Chip
                  label={searchTag}
                  onDelete={() => setSearchTag('')}
                  size="small"
                  sx={{ borderRadius: 1 }}
                />
              </Box>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Articles Grid */}
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4, gridColumn: '1 / -1' }}>
            <Typography variant="body1" color="text.secondary">
              Loading articles...
            </Typography>
          </Box>
        ) : articles.map((article) => (
          <Card 
            key={article.id}
            onClick={() => navigate(`/articles/${article.id}`)}
            sx={{ 
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              borderRadius: 2,
              boxShadow: 2,
              transition: 'box-shadow 0.2s',
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 4
              }
            }}
          >
            <CardContent sx={{ flex: 1, p: 3 }}>
              {/* Category and Read Time */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Chip 
                  label={article.category.replace(/_/g, ' ')} 
                  color="primary" 
                  size="small"
                  sx={{ borderRadius: 1, fontWeight: 500 }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5
                  }}
                >
                  {article.readTime} read
                </Typography>
              </Box>

              {/* Title and Description */}
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  mb: 2
                }}
              >
                {article.title}
              </Typography>
              <Typography 
                variant="body1" 
                paragraph
                sx={{ 
                  color: 'text.secondary',
                  mb: 3,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {article.description}
              </Typography>

              {/* Tags */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {article.tags.map((tag) => (
                  <Chip 
                    key={tag} 
                    label={tag} 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setSearchTag(tag)}
                    sx={{ 
                      borderRadius: 1,
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  />
                ))}
              </Box>
            </CardContent>

            {/* Footer */}
            <Box 
              sx={{ 
                borderTop: 1, 
                borderColor: 'divider',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Published: {new Date(article.createdAt).toLocaleDateString()}
              </Typography>
              
              {isAdmin && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(article);
                    }}
                    size="small"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      '&:hover': { 
                        bgcolor: 'primary.main',
                        color: 'white'
                      }
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setArticleToDelete(article);
                      setIsDeleteDialogOpen(true);
                    }}
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{
                      borderRadius: 1,
                      '&:hover': { 
                        bgcolor: 'error.main',
                        color: 'white'
                      }
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </Box>
          </Card>
        ))}
      </Box>

      <Dialog 
        open={isFormOpen} 
        onClose={handleCloseForm}
        maxWidth="md"
        fullWidth
      >
        <ArticleForm
          article={selectedArticle}
          onSubmit={selectedArticle ? handleUpdateArticle : handleCreateArticle}
          onCancel={handleCloseForm}
        />
      </Dialog>

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Confirm Delete
          </Typography>
          <Typography variant="body1" paragraph>
            Are you sure you want to delete the article "{articleToDelete?.title}"?
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </Stack>
        </Box>
      </Dialog>
    </Container>
  );
};