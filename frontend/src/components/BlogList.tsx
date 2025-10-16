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
    Alert,
    Container,
    Box,
    Paper,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import Advertisement from './Advertisement';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import blogService from '../services/blog';
import type { Blog, BlogRequest } from '../services/blog';
import { useAuth } from '../contexts/AuthContext';

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => (
    <Box sx={{
        '& hr': {
            my: 3,
            border: 'none',
            height: '1px',
            bgcolor: 'grey.300'
        },
        '& p': {
            mb: 2,
            lineHeight: 1.6
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
            mt: 3,
            mb: 2,
            color: 'primary.main'
        },
        '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
                textDecoration: 'underline'
            }
        },
        '& img': {
            maxWidth: '100%',
            height: 'auto',
            borderRadius: 1
        },
        '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            pl: 2,
            py: 1,
            my: 2,
            bgcolor: 'grey.50',
            fontStyle: 'italic'
        },
        '& ul, & ol': {
            mb: 2,
            pl: 3
        },
        '& li': {
            mb: 1
        },
        '& code': {
            bgcolor: 'grey.100',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontFamily: 'monospace'
        }
    }}>
        <ReactMarkdown>{content}</ReactMarkdown>
    </Box>
);



export default function BlogList() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [open, setOpen] = useState(false);
    const [editBlogId, setEditBlogId] = useState<number | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [expandedPosts, setExpandedPosts] = useState<number[]>([]);
    const { user } = useAuth();

    const isAdmin = user?.roles?.includes("ROLE_ADMIN") ?? false;

    useEffect(() => {
        loadBlogs();
        const interval = setInterval(loadBlogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadBlogs = async () => {
        try {
            const blogs = await blogService.getAll();
            if (Array.isArray(blogs)) {
                setBlogs(blogs);
                setError('');
            } else {
                setError('Received invalid data from server');
                setBlogs([]);
            }
        } catch (err: any) {
            console.error('Failed to load blogs:', err);
            setError(err.message || 'Failed to load blogs. Please try again later.');
            setBlogs([]);
        }
    };

    const handleSubmit = async () => {
        if (!isAdmin) {
            setError('You must be an admin to manage blogs');
            return;
        }
        try {
            const blogData: BlogRequest = { 
                title: title.trim(), 
                content: content.trim() 
            };
            if (editBlogId !== null) {
                await blogService.update(editBlogId, blogData);
            } else {
                await blogService.create(blogData);
            }
            await loadBlogs();
            handleClose();
        } catch (err: any) {
            console.error(`Failed to ${editBlogId ? 'update' : 'create'} blog:`, err);
            setError(err.message || `Failed to ${editBlogId ? 'update' : 'create'} blog. Please try again later.`);
        }
    };

    const handleEdit = (blog: Blog) => {
        if (!isAdmin) {
            setError('You must be an admin to edit blogs');
            return;
        }
        setEditBlogId(blog.id);
        setTitle(blog.title);
        setContent(blog.content);
        setOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!isAdmin) {
            setError('You must be an admin to delete blogs');
            return;
        }
        try {
            await blogService.delete(id);
            setConfirmDelete(null);
            await loadBlogs();
        } catch (err: any) {
            console.error('Failed to delete blog:', err);
            setError(err.message || 'Failed to delete blog. Please try again later.');
        }
    };

    const handleClose = () => {
        setOpen(false);
        setEditBlogId(null);
        setTitle('');
        setContent('');
        setError('');
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
            <Container maxWidth="md" sx={{ mt: 4, mb: 4, flex: 1 }}>
                {/* ...existing blog list code (copied from above, minus the outer Container)... */}
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
                                Blog Posts
                            </Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                                {user?.username && (
                                                                    <>Logged in as: {user.username}</>
                                                                )}
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
                                startIcon={<EditIcon />}
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
                                Create New Post
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
                    {blogs.map((blog) => (
                        <Card key={blog.id} sx={{ 
                            borderRadius: 2, 
                            boxShadow: 2,
                            '&:hover': {
                                boxShadow: 3
                            }
                        }}>
                            <CardContent>
                                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                                    {blog.title}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                                        By {blog.author}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        • {new Date(blog.createdAt).toLocaleDateString()}
                                    </Typography>
                                    {blog.updatedAt !== blog.createdAt && (
                                        <Typography variant="body2" sx={{ color: 'warning.main', fontSize: '0.8rem' }}>
                                            • Updated: {new Date(blog.updatedAt).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                                <Box sx={{ position: 'relative' }}>
                                    <Typography 
                                        variant="body1" 
                                        sx={{ 
                                            color: '#34495e',
                                            lineHeight: 1.5,
                                            '& .blog-content': {
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.75rem'
                                            },
                                            '& .blog-paragraph': { 
                                                margin: 0
                                            },
                                            '& a': { 
                                                color: 'primary.main',
                                                textDecoration: 'none',
                                                '&:hover': {
                                                    textDecoration: 'underline'
                                                }
                                            },
                                            '& .blog-list': { 
                                                listStyleType: 'disc',
                                                pl: 3,
                                                m: 0,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '0.5rem'
                                            },
                                            '& li': {
                                                m: 0,
                                                pl: 0.5
                                            }
                                        }}
                                    >
                                        {expandedPosts.includes(blog.id) ? (
                                            <Box>
                                                <MarkdownPreview content={blog.content} />
                                                <Button
                                                    onClick={() => setExpandedPosts(prev => prev.filter(id => id !== blog.id))}
                                                    sx={{ 
                                                        display: 'block',
                                                        mt: 2,
                                                        color: 'primary.main',
                                                        '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                                    }}
                                                >
                                                    Show Less
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box>
                                                <MarkdownPreview content={blog.content.slice(0, 200) + (blog.content.length > 200 ? '...' : '')} />
                                                <Button
                                                    onClick={() => setExpandedPosts(prev => [...prev, blog.id])}
                                                    sx={{ 
                                                        display: 'block',
                                                        mt: 1,
                                                        color: 'primary.main',
                                                        '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                                                    }}
                                                >
                                                    Read More
                                                </Button>
                                            </Box>
                                        )}
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
                                                onClick={() => handleEdit(blog)}
                                                color="primary"
                                                variant="contained"
                                                size="small"
                                                sx={{ mr: 1 }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                startIcon={<DeleteIcon />}
                                                onClick={() => setConfirmDelete(blog.id)}
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
                {/* Dialogs for create/edit and delete remain unchanged */}
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
                            {editBlogId ? 'Edit Blog Post' : 'Create New Blog Post'}
                        </Typography>
                    </DialogTitle>
                    <DialogContent sx={{ px: 3, py: 3, mt: 2 }}>
                        <Stack spacing={3}>
                            {error && (
                                <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 1 }}>
                                    {error}
                                </Alert>
                            )}
                            <TextField
                                label="Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                fullWidth
                                required
                                variant="outlined"
                                margin="normal"
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        background: '#ffffff',
                                        padding: '0 8px'
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 1
                                    }
                                }}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box>
                                    <TextField
                                        label="Content (Markdown supported)"
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        multiline
                                        rows={6}
                                        fullWidth
                                        required
                                        variant="outlined"
                                        inputProps={{
                                            ref: (input: HTMLTextAreaElement | null) => {
                                                if (input) {
                                                    input.addEventListener('select', (e) => {
                                                        e.preventDefault();
                                                    });
                                                }
                                            }
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: 1
                                            }
                                        }}
                                    />
                                    <Stack direction="row" spacing={1} mt={1}>
                                        <Button
                                            onClick={() => {
                                                // Insert divider at cursor position or at the end if no cursor position
                                                const textArea = document.querySelector('textarea');
                                                const start = textArea ? textArea.selectionStart : content.length;
                                                const end = textArea ? textArea.selectionEnd : content.length;
                                                
                                                // Add spacing around divider if not already present
                                                let divider = '\n---\n';
                                                if (!content.endsWith('\n\n')) {
                                                    divider = '\n\n' + divider;
                                                }
                                                if (!content.substring(end).startsWith('\n')) {
                                                    divider = divider + '\n';
                                                }
                                                
                                                const newContent = content.substring(0, start) + divider + content.substring(end);
                                                setContent(newContent);
                                                
                                                // Focus and move cursor after the divider
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
                                                const textArea = document.querySelector('textarea');
                                                if (!textArea) return;
                                                
                                                const start = textArea.selectionStart;
                                                const end = textArea.selectionEnd;
                                                const selectedText = content.substring(start, end);
                                                
                                                // If text is selected, wrap it in bold markers
                                                // If no text is selected, insert bold markers and place cursor between them
                                                const newContent = content.substring(0, start) + 
                                                    '**' + (selectedText || '') + '**' + 
                                                    content.substring(end);
                                                
                                                setContent(newContent);
                                                
                                                // Position cursor after the bold text if text was selected,
                                                // or between the ** marks if no text was selected
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
                                </Box>

                                {content && (
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                            Preview
                                        </Typography>
                                        <Paper
                                            variant="outlined"
                                            sx={{
                                                p: 2,
                                                minHeight: '200px',
                                                bgcolor: 'grey.50'
                                            }}
                                        >
                                            <MarkdownPreview content={content} />
                                        </Paper>
                                    </Box>
                                )}
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
                            sx={{ borderRadius: 1, px: 3 }}
                        >
                            {editBlogId ? 'Update' : 'Create'}
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
                            Are you sure you want to delete this blog post? This action cannot be undone.
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
}