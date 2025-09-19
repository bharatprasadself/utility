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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Advertisement from '../Advertisement';

interface Article {
  id: string;
  title: string;
  description: string;
  category?: string;
  readTime?: string;
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
  const [open, setOpen] = useState(false);
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [descInput, setDescInput] = useState('');

  const handleClose = () => {
    setOpen(false);
    setEditArticleId(null);
    setTitleInput('');
    setDescInput('');
    setError('');
  };

  const handleSubmit = () => {
    // Implement create or update logic here
    handleClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            borderBottom: '2px solid #e0e0e0',
            pb: 2
          }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
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
            )}
          </Box>
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
              <CardContent>
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
      <Box sx={{
        mt: { xs: 3, md: 0 },
        ml: { md: 3 },
        position: { md: 'sticky' },
        top: { md: '5rem' },
        width: { md: '300px' },
        alignSelf: { md: 'flex-start' }
      }}>
        <Advertisement />
      </Box>
    </Box>
  );
};

export default ArticleLayout;