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
    Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect } from 'react';
import blogService from '../services/blog';
import type { Blog, BlogRequest } from '../services/blog';
import { useAuth } from '../contexts/AuthContext';

interface FormattedContent {
    type: 'paragraph' | 'list';
    items: string[];
}

const formatContent = (content: string) => {
    // Normalize line endings and consolidate spaces
    const normalizedContent = content
        .replace(/\r\n/g, '\n')
        .replace(/\n\s+\n/g, '\n\n')
        .replace(/\n{2,}/g, '\n')
        .trim();

    const lines = normalizedContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const formattedContent: FormattedContent[] = [];
    let currentList: string[] = [];

    lines.forEach(line => {
        if (line.startsWith('- ')) {
            // List item
            currentList.push(formatLine(line.substring(2)));
        } else {
            // If we were building a list, add it to the content
            if (currentList.length > 0) {
                formattedContent.push({ type: 'list', items: [...currentList] });
                currentList = [];
            }
            // Add paragraph
            formattedContent.push({ type: 'paragraph', items: [formatLine(line)] });
        }
    });

    // Add any remaining list items
    if (currentList.length > 0) {
        formattedContent.push({ type: 'list', items: currentList });
    }

    return formattedContent;
};

// Helper function to format text within a line
const formatLine = (text: string) => {
    return text
        // Format links
        .replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: #1976d2; text-decoration: none;">$1</a>'
        )
        // Format bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Format italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>');
};

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

        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
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
        <Container maxWidth="lg" sx={{ mt: 4 }}>
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
                            Logged in as: {user?.username}
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
                                            <div className="blog-content">
                                                {formatContent(blog.content).map((section, index) => (
                                                    section.type === 'list' ? (
                                                        <ul key={index} className="blog-list">
                                                            {section.items.map((item, itemIndex) => (
                                                                <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p key={index} className="blog-paragraph" dangerouslySetInnerHTML={{ __html: section.items[0] }} />
                                                    )
                                                ))}
                                            </div>
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
                                            <div className="blog-content">
                                                {formatContent(blog.content.slice(0, 200) + (blog.content.length > 200 ? '...' : '')).map((section, index) => (
                                                    section.type === 'list' ? (
                                                        <ul key={index} className="blog-list">
                                                            {section.items.map((item, itemIndex) => (
                                                                <li key={itemIndex} dangerouslySetInnerHTML={{ __html: item }} />
                                                            ))}
                                                        </ul>
                                                    ) : (
                                                        <p key={index} className="blog-paragraph" dangerouslySetInnerHTML={{ __html: section.items[0] }} />
                                                    )
                                                ))}
                                            </div>
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
                <DialogContent sx={{ px: 3, py: 3 }}>
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 1
                                }
                            }}
                        />
                        <TextField
                            label="Content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            multiline
                            rows={6}
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
    );
}