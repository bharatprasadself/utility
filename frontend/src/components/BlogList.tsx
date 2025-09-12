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
    CircularProgress
} from '@mui/material';
import { useState, useEffect } from 'react';
import blogService from '../services/blog';
import type { Blog, CreateBlogRequest } from '../services/blog';
import { useAuth } from '../contexts/AuthContext';

export default function BlogList() {
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { user, isAdmin } = useAuth();

    useEffect(() => {
        loadBlogs();
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(loadBlogs, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadBlogs = async () => {
        setIsLoading(true);
        try {
            console.log('Loading blogs...');
            const blogs = await blogService.getAll();
            console.log('Blogs loaded:', blogs);
            if (Array.isArray(blogs)) {
                setBlogs(blogs);
                setError('');
            } else {
                console.error('Invalid blogs data:', blogs);
                setError('Received invalid data from server');
                setBlogs([]);
            }
        } catch (err: any) {
            console.error('Failed to load blogs:', err);
            setError(err.message || 'Failed to load blogs. Please try again later.');
            setBlogs([]); // Reset blogs on error
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }
        try {
            const newBlog: CreateBlogRequest = { title, content };
            await blogService.create(newBlog);
            await loadBlogs(); // Refresh the list
            setOpen(false);
            setTitle('');
            setContent('');
            setError('');
        } catch (err: any) {
            console.error('Failed to create blog:', err);
            setError(err.message || 'Failed to create blog. Please try again later.');
            await loadBlogs(); // Refresh list even if creation fails
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">Blog Posts</Typography>
                {user && isAdmin() && (
                    <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
                        Create New Post
                    </Button>
                )}
            </Box>
            
            <Stack spacing={2}>
                {blogs.map((blog) => (
                    <Card key={blog.id}>
                        <CardContent>
                            <Typography variant="h5" gutterBottom>
                                {blog.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                By {blog.author} on {new Date(blog.createdAt).toLocaleDateString()}
                                {blog.updatedAt !== blog.createdAt && ` (Updated: ${new Date(blog.updatedAt).toLocaleDateString()})`}
                            </Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                {blog.content}
                            </Typography>
                        </CardContent>
                    </Card>
                ))}
            </Stack>

            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Create New Blog Post</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            fullWidth
                            required
                        />
                        <TextField
                            label="Content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            multiline
                            rows={4}
                            fullWidth
                            required
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} variant="contained" color="primary">
                        Create
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}
