import { Box, Typography, Card, CardContent, Avatar, CircularProgress, Pagination, Stack, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useAuth } from '@/contexts/AuthContext';
import type { BlogRequest } from '../services/blog';
import BlogEditorDialog from './BlogEditorDialog';
import type { Theme } from '@mui/material/styles';
import type { SxProps } from '@mui/system';
import { useEffect, useState } from 'react';
import blogService from '../services/blog';
// Use centralized Blog type; extend locally with optional timestamps for UI comparison
import type { Blog } from '../types/Blog';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Advertisement from './Advertisement';

// Lightweight markdown preview styling (subset of BlogList's richer styling)
const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const cleaned = content
    .replace(/<span[^>]*style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>.*?<\/span>/gis, '')
    .replace(/<div[^>]*align=["']center["'][^>]*>.*?<\/div>/gis, '');
  return (
    <Box sx={{
      '& hr': { my: 2, border: 'none', height: '1px', bgcolor: 'grey.300' },
      '& p': { mb: 1.5, lineHeight: 1.6 },
      '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 1.5, color: 'primary.main', fontWeight: 600 },
      '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
      '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
      '& ul, & ol': { mb: 2, pl: 3 },
      '& li': { mb: 0.5 },
      '& blockquote': { borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 0.5, my: 2, bgcolor: 'grey.50', fontStyle: 'italic' },
      '& code': { bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' },
      '& pre': { bgcolor: 'grey.100', p: 2, borderRadius: 1, overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace', fontSize: '0.85rem', position: 'relative' }
    }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>
    </Box>
  );
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const cardStyles: SxProps<Theme> = {
  borderRadius: 2,
  boxShadow: 2,
  '&:hover': {
    boxShadow: 3
  }
};

const metaRowSx = {
  display: 'flex',
  alignItems: 'center',
  mb: 2,
  gap: 1
};

// removed unused contentTypographySx

const Blogs = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [viewDrafts, setViewDrafts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedPosts, setExpandedPosts] = useState<number[]>([]);
  // Admin create/edit dialog state (subset of BlogList functionality)
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [editBlogId, setEditBlogId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  // Dev page size override logic.
  // We treat several signals as "dev": Vite's import.meta.env.DEV, common local hosts, LAN IP ranges,
  // typical dev ports (5173 Vite, 4173 preview, 3000), and ".local" hostnames.
  // Additionally allow manual override via localStorage DEV_PAGE_SIZE.
  const envAny = (import.meta as any);
  const viteDev = !!envAny?.env?.DEV || envAny?.env?.MODE === 'development';
  const host = window.location.hostname;
  const port = window.location.port;
  const isLan = /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host);
  const isLocalLike = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local') || isLan;
  const isDevPort = ['5173','4173','3000'].includes(port);
  const isLocalDev = viteDev || isLocalLike || isDevPort;
  const storedOverrideRaw = typeof window !== 'undefined' ? window.localStorage.getItem('DEV_PAGE_SIZE') : null;
  const storedOverride = storedOverrideRaw ? parseInt(storedOverrideRaw, 10) : NaN;
  const effectiveOverride = !isNaN(storedOverride) && storedOverride > 0 && storedOverride <= 50 ? storedOverride : undefined;
  const pageSize = effectiveOverride ?? (isLocalDev ? 2 : 10);

  const loadPublishedPage = async (p: number) => {
    setLoading(true);
    try {
      const data = await blogService.getPage(p, pageSize);
      setBlogs(data.content as any);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load blogs');
    } finally { setLoading(false); }
  };

  const loadDraftsPage = async (p: number) => {
    setLoading(true);
    try {
      const allDrafts = await blogService.getDrafts();
      // client-side pagination for drafts
      const start = (p - 1) * pageSize;
      const pageDrafts = allDrafts.slice(start, start + pageSize) as any;
      setBlogs(pageDrafts);
      setTotalPages(Math.max(1, Math.ceil(allDrafts.length / pageSize)));
      setError(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally { setLoading(false); }
  };

  const loadPage = (p: number) => {
    if (viewDrafts) return loadDraftsPage(p);
    return loadPublishedPage(p);
  };

  const handleClose = () => {
    setOpen(false);
    setEditBlogId(null);
    setTitle('');
    setContent('');
    setError(null);
  };

  // handleSubmit is obsolete; BlogEditorDialog onSubmit handles create/update

  const handleEdit = (blog: Blog) => {
    if (!isAdmin()) { setError('You must be an admin to edit blogs'); return; }
    setEditBlogId((blog as any).id);
    setTitle(blog.title);
    setContent(blog.content);
    setOpen(true);
  };

  useEffect(() => {
    // reset page when toggling view mode
    setPage(1);
  }, [viewDrafts]);

  useEffect(() => {
    loadPage(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, viewDrafts]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, px: 0, width: '100%' }}>
      <Box sx={{ p: 3, flexGrow: 1, minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 0, fontWeight: 'bold', color: '#2c3e50' }}>
          Latest Blog Posts
        </Typography>
        {isAdmin() && (
          <Stack direction="row" spacing={1}>
            <Button
              variant={viewDrafts ? 'outlined' : 'contained'}
              color="secondary"
              onClick={() => setViewDrafts(false)}
              sx={{ textTransform: 'none' }}
            >Published</Button>
            <Button
              variant={viewDrafts ? 'contained' : 'outlined'}
              color="secondary"
              onClick={() => setViewDrafts(true)}
              sx={{ textTransform: 'none' }}
            >Drafts</Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => { setOpen(true); setEditBlogId(null); setTitle(''); setContent(''); }}
              sx={{ borderRadius: 2, boxShadow: 2, textTransform: 'none' }}
            >New Blog</Button>
          </Stack>
        )}
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Stack spacing={3}>
        {blogs.map((blog) => (
          <Card key={blog.id} sx={cardStyles}>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                {blog.title}
              </Typography>
              <Box sx={metaRowSx}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                  {blog.author[0]}
                </Avatar>
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 500 }}>
                  By {blog.author}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  • {formatDate(blog.publishDate)}
                </Typography>
                {/* Updated timestamp check; backend may omit these fields. */}
                {(blog as any).updatedAt && (blog as any).createdAt && (blog as any).updatedAt !== (blog as any).createdAt && (
                  <Typography variant="body2" sx={{ color: 'warning.main', fontSize: '0.8rem' }}>• Updated: {formatDate((blog as any).updatedAt)}</Typography>
                )}
                {isAdmin() && (
                  <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    <Button
                      onClick={() => handleEdit(blog)}
                      variant="contained"
                      color="success"
                      startIcon={<EditIcon />}
                      size="small"
                      sx={{
                        textTransform: 'none',
                        borderRadius: 1,
                        fontWeight: 500,
                        px: 2,
                        py: 0.75,
                        boxShadow: 1,
                        letterSpacing: 0.3,
                        '&:hover': { boxShadow: 2 }
                      }}
                    >
                      Update
                    </Button>
                    <Button
                      onClick={() => setConfirmDelete((blog as any).id)}
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      size="small"
                      sx={{
                        textTransform: 'none',
                        borderRadius: 1,
                        fontWeight: 500,
                        px: 2,
                        py: 0.75,
                        boxShadow: 1,
                        letterSpacing: 0.3,
                        '&:hover': { boxShadow: 2 }
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                )}
              </Box>
              <Box sx={{ mt: 1 }}>
                {expandedPosts.includes(blog.id) ? (
                  <Box>
                    <MarkdownPreview content={blog.content} />
                    <Button
                      onClick={() => setExpandedPosts(prev => prev.filter(id => id !== blog.id))}
                      sx={{ display: 'block', mt: 2, color: 'primary.main', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
                    >Show Less</Button>
                  </Box>
                ) : (
                  <Box>
                    <MarkdownPreview content={blog.content.slice(0, 200) + (blog.content.length > 200 ? '...' : '')} />
                    {blog.content.length > 200 && (
                      <Button
                        onClick={() => setExpandedPosts(prev => [...prev, blog.id])}
                        sx={{ display: 'block', mt: 1, color: 'primary.main', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
                      >Read More</Button>
                    )}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Stack>

      <BlogEditorDialog
        open={open}
        onClose={handleClose}
        isAdmin={isAdmin()}
        initial={editBlogId !== null ? { id: editBlogId, title, content } : null}
        onSubmit={async ({ id, title: t, content: c, status }) => {
          if (!isAdmin()) throw new Error('Not authorized');
          const payload: BlogRequest = { title: t, content: c, status };
          if (id) await blogService.update(id, payload); else await blogService.create(payload);
          await loadPage(1);
        }}
      />

      {/* Delete confirmation dialog */}
      <Dialog open={confirmDelete !== null} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'error.light', color: 'error.contrastText', px: 3, py: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>Confirm Delete</Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 3 }}>
          <Typography>Are you sure you want to delete this blog post? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setConfirmDelete(null)} variant="outlined">Cancel</Button>
          <Button
            onClick={async () => {
              if (confirmDelete) {
                try {
                  await blogService.delete(confirmDelete);
                  setConfirmDelete(null);
                  await loadPage(1);
                } catch (e: any) {
                  setError(e.message || 'Failed to delete blog');
                  setConfirmDelete(null);
                }
              }
            }}
            color="error" variant="contained" startIcon={<DeleteIcon />}>Delete</Button>
        </DialogActions>
      </Dialog>
      </Box>
      <Box
        sx={{
          marginTop: '0',
          ml: 6,
          alignSelf: 'flex-start',
          position: 'sticky',
          top: '5rem',
          width: '200px',
          display: 'flex',
          justifyContent: 'flex-end',
          mr: 1
        }}
      >
        <Advertisement />
      </Box>
    </Box>
  );
};

export default Blogs;
