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
    const { user } = useAuth();

    useEffect(() => {
        loadBlogs();
    }, []);

    const loadBlogs = async () => {
        try {
            const data = await blogService.getAll();
            setBlogs(Array.isArray(data.data) ? data.data : []); // Handle API response structure
            setError('');
        } catch (err) {
            console.error('Failed to load blogs:', err);
            setError('Failed to load blogs. Please try again later.');
        }
    };

    const handleSubmit = async () => {
        try {
            const newBlog: CreateBlogRequest = { title, content };
            await blogService.create(newBlog);
            setOpen(false);
            setTitle('');
            setContent('');
            loadBlogs();
        } catch (err) {
            setError('Failed to create blog post');
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4">Blog Posts</Typography>
                {user && (
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
                            </Typography>
                            <Typography variant="body1">
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
