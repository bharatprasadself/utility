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
    IconButton,
    Tooltip,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Advertisement from './Advertisement';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect, useRef } from 'react';
import blogService from '../services/blog';
import type { Blog, BlogRequest } from '../services/blog';
import { useAuth } from '../contexts/AuthContext';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
    // Clean up common inline HTML artifacts from pasted content
    const cleaned = content
        .replace(/<span[^>]*style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>.*?<\/span>/gis, '')
        .replace(/<div[^>]*align=["']center["'][^>]*>.*?<\/div>/gis, '');
    return (
    <Box sx={{
        '& hr': { my: 3, border: 'none', height: '1px', bgcolor: 'grey.300' },
        '& p': { mb: 2, lineHeight: 1.6 },
        '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 3, mb: 2, color: 'primary.main' },
        '& a': { color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
        '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1 },
        '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
        '& th, & td': { border: '1px solid', borderColor: 'grey.300', p: 1, textAlign: 'left', verticalAlign: 'top' },
        '& thead th': { bgcolor: 'grey.100', fontWeight: 600 },
        '& blockquote': { borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 1, my: 2, bgcolor: 'grey.50', fontStyle: 'italic' },
        '& ul, & ol': { mb: 2, pl: 3 },
        '& li': { mb: 1 },
        '& code': { bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' },
        '& pre': { bgcolor: 'grey.100', p: 2, borderRadius: 1, overflowX: 'auto' }
    }}>
        <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
                code: (props: any) => {
                    const { inline, children } = props;
                    const text = String(children ?? '').replace(/\n$/, '');
                    if (inline || (!text.includes('\n'))) {
                        return (
                            <Box component="code" sx={{ bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace' }}>
                                {text}
                            </Box>
                        );
                    }
                    return (
                        <Box sx={{ position: 'relative', my: 2 }}>
                            <Box component="pre" sx={{ m: 0, p: 2, bgcolor: 'grey.100', borderRadius: 1, overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace', fontSize: '0.9rem' }}>
                                <code>{text}</code>
                            </Box>
                            <Tooltip title="Copy">
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (navigator.clipboard && navigator.clipboard.writeText) {
                                            navigator.clipboard.writeText(text).catch(() => {});
                                        }
                                    }}
                                    sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'grey.300', '&:hover': { bgcolor: 'grey.50' } }}
                                    aria-label="Copy code"
                                >
                                    <ContentCopyIcon fontSize="inherit" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    );
                },
                img: (props: any) => {
                    const alt = props.alt as string | undefined;
                    const src = props.src as string | undefined;
                    return (
                        <Box sx={{ my: 2, textAlign: 'center' }}>
                            <img src={src} alt={alt} style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)', backgroundColor: '#f5f5f5' }} />
                            {alt && (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    {alt}
                                </Typography>
                            )}
                        </Box>
                    );
                },
                table: (props: any) => (
                    <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', my: 2 }}>
                        {props.children}
                    </Box>
                ),
                thead: (props: any) => <Box component="thead">{props.children}</Box>,
                tbody: (props: any) => <Box component="tbody">{props.children}</Box>,
                tr: (props: any) => <Box component="tr">{props.children}</Box>,
                th: (props: any) => (
                    <Box component="th" sx={{ border: '1px solid', borderColor: 'grey.300', p: 1, textAlign: 'left', bgcolor: 'grey.100', fontWeight: 600 }}>
                        {props.children}
                    </Box>
                ),
                td: (props: any) => (
                    <Box component="td" sx={{ border: '1px solid', borderColor: 'grey.300', p: 1, textAlign: 'left', verticalAlign: 'top' }}>
                        {props.children}
                    </Box>
                )
            }}
        >
            {cleaned}
        </ReactMarkdown>
    </Box>
    );
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
    // Markdown import helpers
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importedFileName, setImportedFileName] = useState('');

    // Content size checks (soft 250KB, hard 1MB)
    const SOFT_LIMIT = 250 * 1024; // 250KB
    const HARD_LIMIT = 1024 * 1024; // 1MB
    const contentBytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(content).length : content.length;
    const overSoft = contentBytes > SOFT_LIMIT;
    const overHard = contentBytes > HARD_LIMIT;

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
        if (overHard) {
            setError('Content exceeds the 1 MB limit. Please reduce the size before saving.');
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
        setImportedFileName('');
    };

    const handleMarkdownImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.md')) {
            setError('Please select a Markdown (.md) file');
            e.target.value = '';
            return;
        }

        if (file.size > HARD_LIMIT) {
            setError('Selected file exceeds the 1 MB limit. Please choose a smaller Markdown file.');
            e.target.value = '';
            return;
        }

        // Helper: extract first H1 and return cleaned body without that heading
        const splitMdHeading = (md: string): { heading: string | null; body: string } => {
            const lines = md.split(/\r?\n/);
            let i = 0;
            // skip leading blank lines
            while (i < lines.length && lines[i].trim() === '') i++;
            if (i < lines.length && /^#\s+/.test(lines[i])) {
                const heading = lines[i].replace(/^#\s+/, '').trim();
                i++;
                // skip a single blank line after the heading if present
                if (i < lines.length && lines[i].trim() === '') i++;
                const body = lines.slice(i).join('\n').replace(/^\s+/, '');
                return { heading, body };
            }
            return { heading: null, body: md };
        };

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = (ev.target?.result as string) || '';
            const { heading, body } = splitMdHeading(text);
            // Set title from heading if none provided
            if (!title && heading) {
                setTitle(heading);
            }
            // Always use body so we don't render duplicate heading in content
            setContent(body || text);
            setImportedFileName(file.name);
        };
        reader.readAsText(file);
        // allow reselecting same file
        e.target.value = '';
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
            <Container maxWidth="md" sx={{ mt: 4, mb: 4, flexGrow: 1, minWidth: 0 }}>
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
                                onClick={() => {
                                    // Ensure we are in "create" mode and not accidentally editing
                                    setEditBlogId(null);
                                    setTitle('');
                                    setContent('');
                                    setImportedFileName('');
                                    setError('');
                                    setOpen(true);
                                }}
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
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
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
                                                flex: 1,
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: 1
                                                },
                                                '& .MuiInputBase-input, & .MuiInputBase-inputMultiline': {
                                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
                                                    fontSize: '0.95rem',
                                                    lineHeight: 1.6
                                                }
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 1 }}>
                                            <input
                                                type="file"
                                                accept=".md"
                                                onChange={handleMarkdownImport}
                                                style={{ display: 'none' }}
                                                ref={fileInputRef}
                                            />
                                            <Tooltip title="Import Markdown File" placement="left">
                                                <IconButton
                                                    onClick={() => fileInputRef.current?.click()}
                                                    size="medium"
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: 2,
                                                        bgcolor: 'primary.main',
                                                        color: 'common.white',
                                                        boxShadow: 1,
                                                        '&:hover': { bgcolor: 'primary.dark' }
                                                    }}
                                                >
                                                    <UploadFileIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            {importedFileName && (
                                                <Tooltip title="Clear imported content" placement="left">
                                                    <IconButton
                                                        onClick={() => {
                                                            setContent('');
                                                            setImportedFileName('');
                                                        }}
                                                        size="medium"
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 2,
                                                            bgcolor: 'error.main',
                                                            color: 'common.white',
                                                            boxShadow: 1,
                                                            '&:hover': { bgcolor: 'error.dark' }
                                                        }}
                                                    >
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </Box>
                                    {importedFileName && (
                                        <Typography 
                                            variant="caption" 
                                            color="text.secondary"
                                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                                        >
                                            <UploadFileIcon fontSize="inherit" /> Imported from: {importedFileName}
                                        </Typography>
                                    )}
                                    {/* Toolbar: helpers on the left, size on the right */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                                        <Stack direction="row" spacing={1}>
                                            <Button
                                                onClick={() => {
                                                    const textArea = document.querySelector('textarea');
                                                    const start = textArea ? (textArea as HTMLTextAreaElement).selectionStart : content.length;
                                                    const end = textArea ? (textArea as HTMLTextAreaElement).selectionEnd : content.length;
                                                    let divider = '\n---\n';
                                                    if (!content.endsWith('\n\n')) {
                                                        divider = '\n\n' + divider;
                                                    }
                                                    if (!content.substring(end).startsWith('\n')) {
                                                        divider = divider + '\n';
                                                    }
                                                    const newContent = content.substring(0, start) + divider + content.substring(end);
                                                    setContent(newContent);
                                                    setTimeout(() => {
                                                        if (textArea) {
                                                            const newPosition = start + divider.length;
                                                            (textArea as HTMLTextAreaElement).focus();
                                                            (textArea as HTMLTextAreaElement).selectionStart = (textArea as HTMLTextAreaElement).selectionEnd = newPosition;
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
                                                    const textArea = document.querySelector('textarea') as HTMLTextAreaElement | null;
                                                    if (!textArea) return;
                                                    const start = textArea.selectionStart;
                                                    const end = textArea.selectionEnd;
                                                    const selectedText = content.substring(start, end);
                                                    const newContent = content.substring(0, start) + '**' + (selectedText || '') + '**' + content.substring(end);
                                                    setContent(newContent);
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
                                            <Button
                                                onClick={() => {
                                                    const ta = document.querySelector('textarea') as HTMLTextAreaElement | null;
                                                    if (!ta) return;
                                                    const start = ta.selectionStart;
                                                    const end = ta.selectionEnd;
                                                    const selected = content.substring(start, end);
                                                    if (!selected) {
                                                        const insert = (content.endsWith('\n') ? '' : '\n') + '- ';
                                                        const updated = content.substring(0, start) + insert + content.substring(end);
                                                        setContent(updated);
                                                        setTimeout(() => {
                                                            ta.focus();
                                                            const pos = start + insert.length;
                                                            ta.selectionStart = ta.selectionEnd = pos;
                                                        }, 0);
                                                        return;
                                                    }
                                                    const lines = selected.split(/\r?\n/);
                                                    const transformed = lines.map(l => {
                                                        const trimmed = l.replace(/^\s+/, '');
                                                        if (/^(?:- |\* |\d+\. )/.test(trimmed)) return l; // already list-like
                                                        return (l ? '- ' + trimmed : l);
                                                    }).join('\n');
                                                    const updated = content.substring(0, start) + transformed + content.substring(end);
                                                    setContent(updated);
                                                    setTimeout(() => {
                                                        ta.focus();
                                                        ta.selectionStart = start;
                                                        ta.selectionEnd = start + transformed.length;
                                                    }, 0);
                                                }}
                                                variant="text"
                                                size="small"
                                            >
                                                Bulleted List
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    const ta = document.querySelector('textarea') as HTMLTextAreaElement | null;
                                                    if (!ta) return;
                                                    const start = ta.selectionStart;
                                                    const end = ta.selectionEnd;
                                                    const selected = content.substring(start, end);
                                                    if (!selected) {
                                                        const insert = (content.endsWith('\n') ? '' : '\n') + '1. ';
                                                        const updated = content.substring(0, start) + insert + content.substring(end);
                                                        setContent(updated);
                                                        setTimeout(() => {
                                                            ta.focus();
                                                            const pos = start + insert.length;
                                                            ta.selectionStart = ta.selectionEnd = pos;
                                                        }, 0);
                                                        return;
                                                    }
                                                    const lines = selected.split(/\r?\n/);
                                                    let counter = 1;
                                                    const transformed = lines.map(l => {
                                                        const trimmed = l.replace(/^\s+/, '');
                                                        if (/^(?:- |\* |\d+\. )/.test(trimmed)) return l; // already list-like
                                                        const prefix = (trimmed.length > 0) ? (counter++ + '. ') : '';
                                                        return prefix + trimmed;
                                                    }).join('\n');
                                                    const updated = content.substring(0, start) + transformed + content.substring(end);
                                                    setContent(updated);
                                                    setTimeout(() => {
                                                        ta.focus();
                                                        ta.selectionStart = start;
                                                        ta.selectionEnd = start + transformed.length;
                                                    }, 0);
                                                }}
                                                variant="text"
                                                size="small"
                                            >
                                                Numbered List
                                            </Button>
                                        </Stack>
                                        <Typography variant="caption" color={overHard ? 'error.main' : overSoft ? 'warning.main' : 'text.secondary'}>
                                            Size: {formatBytes(contentBytes)}{overHard ? ' (over 1 MB limit)' : overSoft ? ' (getting large)' : ''}
                                        </Typography>
                                    </Box>
                                    {overHard && (
                                        <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }}>
                                            Content exceeds the 1 MB limit. Please remove images/sections or split into multiple posts.
                                        </Alert>
                                    )}
                                    {!overHard && overSoft && (
                                        <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }}>
                                            Your content is getting large (over 250 KB). Consider trimming or splitting for faster loads.
                                        </Alert>
                                    )}
                                    
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
                            disabled={!title.trim() || !content.trim() || overHard}
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
}

// Helper to format bytes nicely
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value.toFixed(value >= 100 || i === 0 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}