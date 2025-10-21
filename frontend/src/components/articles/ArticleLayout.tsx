import React, { useState, useRef } from 'react';
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
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import Paper from '@mui/material/Paper';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

// Local markdown preview styled similarly to Blogs, with heading size constraints
const MarkdownPreview: React.FC<{ content: string; hideLeadingH1?: boolean }> = ({ content, hideLeadingH1 = false }) => {
  // Optionally remove a top-level H1 to avoid giant duplicate title
  const processed = hideLeadingH1 ? content.replace(/^\s*#\s+.*\n?/, '') : content;
  return (
    <Box sx={{
      '& hr': { my: 3, border: 'none', height: '1px', bgcolor: 'grey.300' },
      '& a': {
        color: 'primary.main',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' }
      },
      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
      '& blockquote': {
        borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 1, my: 2, bgcolor: 'grey.50', fontStyle: 'italic'
      },
      '& ul, & ol': { mb: 2, pl: 3 },
      '& li': { mb: 1 },
      '& code': { bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, fontFamily: 'monospace' }
    }}>
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
            <Typography component="p" variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              {props.children}
            </Typography>
          )
        }}
      >
        {processed}
      </ReactMarkdown>
    </Box>
  );
};

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
  const [deleteLoading, setDeleteLoading] = useState(false); // Add loading state for delete action
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // File import helpers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const contentTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  // Track which articles have their content expanded
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());

  // Content size checks (soft 250KB, hard 1MB)
  const SOFT_LIMIT = 250 * 1024; // 250KB
  const HARD_LIMIT = 1024 * 1024; // 1MB
  const contentBytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(contentInput).length : contentInput.length;
  const overSoft = contentBytes > SOFT_LIMIT;
  const overHard = contentBytes > HARD_LIMIT;

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
    setImportedFileName('');
  };

  const handleMarkdownImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.md')) {
      // Use existing error alert area instead of blocking alert
      setError('Please select a Markdown (.md) file');
      return;
    }
    if (file.size > HARD_LIMIT) {
      setError('Selected file exceeds the 1 MB limit. Please choose a smaller Markdown file.');
      e.target.value = '';
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) || '';
        setContentInput(text);
        setImportedFileName(file.name);
        // Extract title from first heading if empty
        const firstLine = text.split('\n')[0] || '';
        if (!titleInput && firstLine.startsWith('# ')) {
          setTitleInput(firstLine.substring(2).trim());
        }
        // Extract description from first paragraph if empty
        const para = text.split('\n\n')[1]?.trim();
        if (!descInput && para && !para.startsWith('#')) {
          setDescInput(para);
        }
        // Estimate read time
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        if (!readTimeInput) {
          const mins = Math.max(1, Math.ceil(words / 200));
          setReadTimeInput(`${mins} min read`);
        }
      };
      reader.readAsText(file);
    } finally {
      // allow re-selecting the same file
      e.target.value = '';
    }
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
    if (!titleInput?.trim() || !contentInput?.trim()) {
      setError('Title and content are required');
      return;
    }
    if (overHard) {
      setError('Content exceeds the 1 MB limit. Please reduce the size before saving.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Get category from articles or default to SPRING_BOOT
      const categoryValue = articles.length > 0 ? articles[0].category : ArticleCategory.SPRING_BOOT;
      
      // Derive description if empty from content (first paragraph / snippet)
      let effectiveDescription = (descInput || '').trim();
      if (!effectiveDescription) {
        const contentNoH1 = contentInput.replace(/^#\s+.*\n?/, '');
        const paragraphBlocks = contentNoH1.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
        const firstNonHeading = paragraphBlocks.find(b => !b.startsWith('#')) || contentNoH1.split('\n').slice(0, 3).join(' ').trim();
        // Preserve markdown so it can render in description areas; just trim and limit length
        effectiveDescription = (firstNonHeading || '').trim();
        if (effectiveDescription.length > 200) {
          effectiveDescription = effectiveDescription.slice(0, 200).trim() + '…';
        }
      }

      // Common article data for both create and update
      const articleData = {
        title: titleInput.trim(),
        description: effectiveDescription,
        content: contentInput,
        tags: tagsInput.length ? tagsInput : ['Spring Boot'], // Ensure we have at least one tag
        readTime: readTimeInput || '5 min read',
        category: categoryValue
      };
      
      if (editArticleId) {
        // Handle edit logic by finding the article to update
        const articleToEdit = articles.find(a => a.id === editArticleId);
        
        if (articleToEdit && handleEdit) {
          // Debug log removed
          
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
  // Debug log removed
        
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
            <Box sx={{ mb: 2 }}>
              <MarkdownPreview content={description} />
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
            </Box>
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
                  <Box sx={{
                    color: '#34495e',
                    lineHeight: 1.5,
                    mb: 2
                  }}>
                    <MarkdownPreview content={article.description} hideLeadingH1 />
                  </Box>

                  {article.content && (
                    expandedArticles.has(article.id) ? (
                      <Box>
                        <MarkdownPreview content={article.content} hideLeadingH1 />
                        <Button
                          color="primary"
                          onClick={() => toggleArticleContent(article.id)}
                          endIcon={<ExpandLessIcon fontSize="small" />}
                          sx={{ 
                            textTransform: 'none',
                            mt: 2,
                            fontWeight: 'medium',
                            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          Show Less
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <MarkdownPreview content={article.content.slice(0, 200) + (article.content.length > 200 ? '...' : '')} hideLeadingH1 />
                        <Button
                          color="primary"
                          onClick={() => toggleArticleContent(article.id)}
                          endIcon={<ExpandMoreIcon fontSize="small" />}
                          sx={{ 
                            textTransform: 'none',
                            mt: 1,
                            fontWeight: 'medium',
                            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          Read More
                        </Button>
                      </Box>
                    )
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
              {descInput && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Description Preview
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, bgcolor: 'grey.50' }}
                  >
                    <MarkdownPreview content={descInput} hideLeadingH1 />
                  </Paper>
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <TextField
                  label="Content (Markdown supported)"
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  multiline
                  rows={6}
                  fullWidth
                  variant="outlined"
                  placeholder="# Heading\n\nParagraph text\n\n- List item\n- Another item"
                  inputRef={contentTextAreaRef}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 0.5 }}>
                  <input
                    type="file"
                    accept=".md"
                    onChange={handleMarkdownImport}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <Tooltip title="Import Markdown (.md)">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Import markdown"
                      sx={{
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'primary.dark' },
                        boxShadow: 1
                      }}
                    >
                      <UploadFileIcon />
                    </IconButton>
                  </Tooltip>
                  {importedFileName && (
                    <Tooltip title="Clear imported content">
                      <IconButton
                        onClick={() => { setContentInput(''); setImportedFileName(''); }}
                        aria-label="Clear imported markdown"
                        sx={{
                          bgcolor: 'error.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'error.dark' },
                          boxShadow: 1
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              {importedFileName && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <UploadFileIcon fontSize="small" /> Imported from: {importedFileName}
                </Typography>
              )}
              {/* Size indicator and warnings */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="caption" color={overHard ? 'error.main' : overSoft ? 'warning.main' : 'text.secondary'}>
                  Size: {formatBytes(contentBytes)}{overHard ? ' (over 1 MB limit)' : overSoft ? ' (getting large)' : ''}
                </Typography>
              </Box>
              {overHard && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }}>
                  Content exceeds the 1 MB limit. Please remove images/sections or split into multiple articles.
                </Alert>
              )}
              {!overHard && overSoft && (
                <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }}>
                  Your content is getting large (over 250 KB). Consider trimming or splitting for faster loads.
                </Alert>
              )}
              {/* Content helpers like Blogs */}
              <Stack direction="row" spacing={1} mt={1}>
                <Button
                  onClick={() => {
                    const textArea = contentTextAreaRef.current;
                    const start = textArea ? textArea.selectionStart : contentInput.length;
                    const end = textArea ? textArea.selectionEnd : contentInput.length;
                    let divider = '\n---\n';
                    if (!contentInput.endsWith('\n\n')) {
                      divider = '\n\n' + divider;
                    }
                    if (!contentInput.substring(end).startsWith('\n')) {
                      divider = divider + '\n';
                    }
                    const newContent = contentInput.substring(0, start) + divider + contentInput.substring(end);
                    setContentInput(newContent);
                    setTimeout(() => {
                      if (textArea) {
                        const newPosition = start + divider.length;
                        textArea.focus();
                        textArea.selectionStart = textArea.selectionEnd = newPosition;
                      }
                    }, 0);
                  }}
                  variant="text"
                  size="small"
                >
                  Insert Divider
                </Button>
                <Button
                  onClick={() => {
                    const textArea = contentTextAreaRef.current;
                    if (!textArea) return;
                    const start = textArea.selectionStart;
                    const end = textArea.selectionEnd;
                    const selectedText = contentInput.substring(start, end);
                    const newContent = contentInput.substring(0, start) + '**' + (selectedText || '') + '**' + contentInput.substring(end);
                    setContentInput(newContent);
                    setTimeout(() => {
                      textArea.focus();
                      if (selectedText) {
                        textArea.selectionStart = textArea.selectionEnd = start + selectedText.length + 4;
                      } else {
                        textArea.selectionStart = textArea.selectionEnd = start + 2;
                      }
                    }, 0);
                  }}
                  variant="text"
                  size="small"
                >
                  Bold Text
                </Button>
              </Stack>

              {/* Preview section like Blogs */}
              {contentInput && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Preview
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, minHeight: '200px', bgcolor: 'grey.50' }}
                  >
                    <MarkdownPreview content={contentInput} />
                  </Paper>
                </Box>
              )}
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
              disabled={loading || !titleInput?.trim() || !contentInput?.trim() || overHard}
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
              onClick={() => {
                if (confirmDelete) {
                  setDeleteLoading(true);
                  // Call handleDelete and then close the dialog regardless of success/failure
                  Promise.resolve(handleDelete(confirmDelete))
                    .finally(() => {
                      setDeleteLoading(false);
                      setConfirmDelete(null); // Close the dialog after confirming delete
                    });
                }
              }}
              color="error"
              variant="contained"
              disabled={deleteLoading}
              sx={{ borderRadius: 1, px: 3 }}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
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

// Helper to format bytes nicely
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

export default ArticleLayout;