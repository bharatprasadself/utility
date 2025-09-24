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
  Alert
} from '@mui/material';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Advertisement from '../Advertisement';

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  readTime: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ArticleLayoutProps {
  title: string;
  description: string;
  articles: Article[];
  isAdmin: boolean;
  handleEdit: (article: Article) => void;
  handleDelete: (id: string) => void;
}

const ArticleLayout: React.FC<ArticleLayoutProps> = ({
  title,
  description,
  articles,
  isAdmin,
  handleEdit,
  handleDelete
}) => {
  // Local state for dialogs and form fields
  const [open, setOpen] = useState(false);
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleClose = () => {
    setOpen(false);
    setEditArticleId(null);
    setTitleInput('');
    setDescInput('');
    setError('');
  };

  const handleSubmit = () => {
    // Placeholder for submit logic
    handleClose();
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
                  {article.content && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#555',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line',
                        mt: 1
                      }}
                    >
                      {article.content}
                    </Typography>
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
                        onClick={() => handleEdit(article)}
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
                rows={4}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
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
              sx={{ borderRadius: 1, px: 3 }}
            >
              {editArticleId ? 'Update' : 'Create'}
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