import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Box,
  Container,
  Alert,
  Chip
} from '@mui/material';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import Advertisement from '../Advertisement';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';

interface ArticleLayoutProps {
  title: string;
  description: string;
  articles: Article[];
  isAdmin: boolean;
  handleEdit: (article: Article) => void;
  handleDelete: (id: string) => void;
  handleCreate?: (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const ArticleLayout: React.FC<ArticleLayoutProps> = ({
  title,
  description,
  articles,
  isAdmin,
  handleEdit,
  handleDelete,
  handleCreate
}) => {
  // Local state for dialogs and form fields
  const [open, setOpen] = useState(false);
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [tagsInput, setTagsInput] = useState<string[]>(['Spring Boot']); // Default tag
  const [readTimeInput, setReadTimeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Track which articles have their content expanded
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

  // Function to open edit mode for a specific article
  const openEditDialog = (article: Article) => {
    setEditArticleId(article.id);
    setTitleInput(article.title || '');
    setDescInput(article.description || '');
    setContentInput(article.content || '');
    setTagsInput(article.tags || ['Spring Boot']);
    setReadTimeInput(article.readTime || '');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditArticleId(null);
    setTitleInput('');
    setDescInput('');
    setContentInput('');
    setTagsInput(['Spring Boot']); // Reset to default tag
    setReadTimeInput('');
    setError('');
  };
  
  // Toggle content expansion for an article
  const toggleArticleContent = (articleId: string) => {
    setExpandedArticles(prevState => {
      const newState = new Set(prevState);
      if (newState.has(articleId)) {
        newState.delete(articleId);
      } else {
        newState.add(articleId);
      }
      return newState;
    });
  };

  const handleSubmit = async () => {
    if (!titleInput || !descInput) {
      setError('Title and description are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get category from articles or default to SPRING_BOOT
      const categoryValue = articles.length > 0 ? articles[0].category : ArticleCategory.SPRING_BOOT;
      
      // Common article data for both create and update
      const articleData = {
        title: titleInput,
        description: descInput,
        content: contentInput,
        tags: tagsInput.length ? tagsInput : ['Spring Boot'], // Ensure we have at least one tag
        readTime: readTimeInput || '5 min read',
        category: categoryValue
      };
      
      if (editArticleId) {
        // Handle edit logic by finding the article to update
        const articleToEdit = articles.find(a => a.id === editArticleId);
        
        if (articleToEdit && handleEdit) {
          console.log('Updating article with ID:', editArticleId);
          
          // Call the parent component's handleEdit function with the updated article
          handleEdit({
            ...articleToEdit,
            ...articleData
          });
        } else {
          console.error('Article not found for editing or handleEdit not provided');
          setError('Could not find article to edit');
        }
      } else if (handleCreate) {
        console.log('Creating new article with data:', articleData);
        
        // Create new article
        await handleCreate(articleData);
      }
      
      handleClose();
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError(error?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, px: 0, width: '100%' }}>
      <Container
        maxWidth="md"
        sx={{
          mt: 4,
          mb: 4,
          flexGrow: 1,
          minWidth: 0
        }}
      >
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header Section (styled like Blogs) */}
        <Box sx={{ mb: 4, width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
              {isAdmin && (
                <Typography
                  component="span"
                  sx={{
                    ml: 1,
                    px: 1,
                    py: 0.5,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.75rem'
                  }}
                >
                  Admin
                </Typography>
              )}
            </Typography>
          </Box>
          {isAdmin && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => setOpen(true)}
                startIcon={<AddIcon />}
                sx={{
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                Create Article
              </Button>
            </Box>
          )}
          
          <Box sx={{ borderTop: '2px solid #e0e0e0', mt: 1 }} />
          
          
          
          
          
          
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
        </Box>
        <Stack spacing={2}>
          {articles.map((article) => (
            <Card key={article.id} sx={{
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                  {article.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                    {article.category}
                  </Typography>
                  {article.readTime && (
                    <Typography variant="body2" color="text.secondary">
                      • {article.readTime}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ position: 'relative' }}>
                  <Typography
                    variant="body1"
                    sx={{
                      color: '#34495e',
                      lineHeight: 1.5,
                      mb: 2
                    }}
                  >
                    {article.description}
                  </Typography>
                  
                  {/* Show content only if article is expanded */}
                  {article.content && expandedArticles.has(article.id) && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#555',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                        mt: 1,
                        mb: 2,
                        p: 2,
                        borderLeft: '4px solid #e0e0e0',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: '0 4px 4px 0'
                      }}
                    >
                      {article.content}
                    </Typography>
                  )}
                  
                  {/* Show Read More/Show Less button if article has content */}
                  {article.content && (
                    <Button
                      color="primary"
                      onClick={() => toggleArticleContent(article.id)}
                      endIcon={expandedArticles.has(article.id) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      sx={{ 
                        textTransform: 'none',
                        mt: 1,
                        fontWeight: 'medium',
                        '&:hover': { 
                          backgroundColor: 'transparent',
                          textDecoration: 'underline' 
                        }
                      }}
                    >
                      {expandedArticles.has(article.id) ? 'Show Less' : 'Read More'}
                    </Button>
                  )}
                </Box>
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  borderTop: '1px solid #e0e0e0',
                  mt: 2,
                  pt: 2
                }}>
                  {isAdmin && (
                    <Box>
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => openEditDialog(article)}
                        color="primary"
                        variant="contained"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Edit
                      </Button>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => setConfirmDelete(article.id)}
                        color="error"
                        variant="contained"
                        size="small"
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          ))}
  </Stack>
  </Paper>
  {/* Dialogs for create/edit and delete */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 3
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'grey.50', px: 3, py: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {editArticleId ? 'Edit Article' : 'Create New Article'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 1 }}>
                  {error}
                </Alert>
              )}
              <TextField
                label="Title"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
              <TextField
                label="Description"
                value={descInput}
                onChange={(e) => setDescInput(e.target.value)}
                multiline
                rows={2}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
              <TextField
                label="Content (Markdown supported)"
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                multiline
                rows={6}
                fullWidth
                variant="outlined"
                placeholder="# Heading\n\nParagraph text\n\n- List item\n- Another item"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
              <TextField
                label="Read Time (e.g., '5 min read')"
                value={readTimeInput}
                onChange={(e) => setReadTimeInput(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="5 min read"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
              <Box>
                <TextField
                  label="Tags (comma separated)"
                  placeholder="Spring, REST, API"
                  fullWidth
                  variant="outlined"
                  // Display current tags as comma-separated string in the input field
                  value={tagsInput.join(', ')}
                  onChange={(e) => {
                    const tagInput = e.target.value;
                    const tagArray = tagInput
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0);
                    setTagsInput(tagArray);
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {tagsInput.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag} 
                      size="small" 
                      onDelete={() => {
                        setTagsInput(tagsInput.filter((_, i) => i !== index));
                      }} 
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={loading || !titleInput || !descInput}
              sx={{ borderRadius: 1, px: 3 }}
            >
              {loading ? 'Saving...' : editArticleId ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 3
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'error.light', color: 'error.contrastText', px: 3, py: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Typography>
              Are you sure you want to delete this article? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setConfirmDelete(null)} variant="outlined" sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            <Button
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              color="error"
              variant="contained"
              sx={{ borderRadius: 1, px: 3 }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Box
  sx={{
    marginTop: '0',
    ml: 6,
    alignSelf: 'flex-start',
    position: 'sticky',
    top: '5rem',
    width: '200px',  // Match the ad's width to reduce space
    display: 'flex',  // Enable flexbox for alignment
    justifyContent: 'flex-end',  // Push ad to the right
    mr: 1,  // Optional: Small right margin for slight spacing from the border
  }}
>
  <Advertisement />
</Box>
      </Box>  
  );
};

export default ArticleLayout;