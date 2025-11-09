import { useState, useRef, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, TextField, Stack, Button, Alert, Box, Paper,
  IconButton, Tooltip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';

export interface BlogEditorInitial {
  id?: number;
  title?: string;
  content?: string;
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface BlogEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: number; title: string; content: string; status: 'DRAFT' | 'PUBLISHED' }) => Promise<void>;
  initial?: BlogEditorInitial | null;
  isAdmin: boolean;
}

const SOFT_LIMIT = 250 * 1024; // 250 KB
const HARD_LIMIT = 1024 * 1024; // 1 MB

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  return (kb / 1024).toFixed(2) + ' MB';
};

const BlogEditorDialog: React.FC<BlogEditorDialogProps> = ({ open, onClose, onSubmit, initial, isAdmin }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [content, setContent] = useState(initial?.content || '');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Track size
  const contentBytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(content).length : content.length;
  const overSoft = contentBytes > SOFT_LIMIT;
  const overHard = contentBytes > HARD_LIMIT;

  useEffect(() => {
    // Reset when initial changes (editing a different blog)
    setTitle(initial?.title || '');
    setContent(initial?.content || '');
    setError(null);
  }, [initial]);

  const handleSubmit = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!isAdmin) { setError('You must be an admin'); return; }
    if (!title.trim() || !content.trim()) { setError('Title and content are required'); return; }
    if (overHard) { setError('Content exceeds 1 MB limit'); return; }
    try {
      await onSubmit({ id: initial?.id, title: title.trim(), content: content.trim(), status });
    } catch (e: any) {
      setError(e.message || 'Failed to save blog');
      return;
    }
    onClose();
  };

  const importMarkdown = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.md')) { setError('Please select a .md file'); return; }
    if (file.size > HARD_LIMIT) { setError('File exceeds 1 MB limit'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      const { heading, body } = splitMdHeading(raw);
      if (!title.trim() && heading) {
        setTitle(heading);
      }
      setContent(body);
    };
    reader.readAsText(file);
  };

  const splitMdHeading = (md: string): { heading: string | null; body: string } => {
    const lines = md.split(/\r?\n/);
    let i = 0;
    while (i < lines.length && lines[i].trim() === '') i++;
    if (i < lines.length && /^#\s+/.test(lines[i])) {
      const heading = lines[i].replace(/^#\s+/, '').trim();
      return { heading, body: lines.slice(i + 1).join('\n') };
    }
    return { heading: null, body: md };
  };

  // Toolbar helpers
  const insertDivider = () => applyTransform((start, end) => {
    let divider = '\n---\n';
    if (!content.endsWith('\n\n')) divider = '\n\n' + divider;
    if (!content.substring(end).startsWith('\n')) divider = divider + '\n';
    return content.substring(0, start) + divider + content.substring(end);
  });

  const boldText = () => applyTransform((start, end) => {
    const selected = content.substring(start, end);
    return content.substring(0, start) + '**' + selected + '**' + content.substring(end);
  }, (start, end) => (end > start ? start + 2 + (end - start) + 2 : start + 2));

  const bulletedList = () => applyListTransform('- ');
  const numberedList = () => applyListTransform('1. ', true);

  const applyListTransform = (prefix: string, isNumbered = false) => applyTransform((start, end) => {
    const selected = content.substring(start, end);
    if (!selected) {
      const insert = (content.endsWith('\n') ? '' : '\n') + prefix;
      return content.substring(0, start) + insert + content.substring(end);
    }
    const lines = selected.split(/\r?\n/);
    let counter = 1;
    const transformed = lines.map(l => {
      const trimmed = l.replace(/^\s+/, '');
      if (/^(?:- |\* |\d+\. )/.test(trimmed)) return l; // already list-like
      if (!trimmed) return l;
      if (isNumbered) return (counter++) + '. ' + trimmed;
      return '- ' + trimmed;
    }).join('\n');
    return content.substring(0, start) + transformed + content.substring(end);
  });

  const applyTransform = (
    transform: (start: number, end: number) => string,
    caretPosition?: (start: number, end: number) => number
  ) => {
    const ta = document.querySelector('textarea') as HTMLTextAreaElement | null;
    const start = ta ? ta.selectionStart : content.length;
    const end = ta ? ta.selectionEnd : content.length;
    const newValue = transform(start, end);
    setContent(newValue);
    setTimeout(() => {
      if (ta) {
        const pos = caretPosition ? caretPosition(start, end) : start;
        ta.focus();
        ta.selectionStart = ta.selectionEnd = pos;
      }
    }, 0);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 2, boxShadow: 3 } }}>
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'grey.300', bgcolor: 'grey.50', px: 3, py: 2 }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          {initial?.id ? 'Edit Blog Post' : 'Create New Blog Post'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 3 }}>
        <Stack spacing={3}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth required />
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <TextField
                label="Content (Markdown supported)"
                value={content}
                onChange={e => setContent(e.target.value)}
                multiline rows={10} fullWidth required
                inputProps={{}}
              />
              <Stack spacing={1}>
                <input type="file" accept=".md" style={{ display: 'none' }} ref={fileInputRef} onChange={importMarkdown} />
                <Tooltip title="Import Markdown (.md)"><IconButton onClick={() => fileInputRef.current?.click()} color="primary"><UploadFileIcon /></IconButton></Tooltip>
                {content && <Tooltip title="Clear content"><IconButton onClick={() => setContent('')} color="error"><ClearIcon /></IconButton></Tooltip>}
              </Stack>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={insertDivider}>Divider</Button>
                <Button size="small" onClick={boldText}>Bold</Button>
                <Button size="small" onClick={bulletedList}>Bullets</Button>
                <Button size="small" onClick={numberedList}>Numbers</Button>
              </Stack>
              <Typography variant="caption" color={overHard ? 'error.main' : overSoft ? 'warning.main' : 'text.secondary'}>
                Size: {formatBytes(contentBytes)}{overHard ? ' (over 1 MB)' : overSoft ? ' (getting large)' : ''}
              </Typography>
            </Box>
            {overHard && <Alert severity="error" sx={{ mt: 1 }}>Content exceeds 1 MB limit.</Alert>}
            {!overHard && overSoft && <Alert severity="warning" sx={{ mt: 1 }}>Content over 250 KB; consider trimming.</Alert>}
          </Box>
          {content && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Preview</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </Paper>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'grey.300', gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        {isAdmin && (
          <>
            <Button onClick={() => handleSubmit('DRAFT')} variant="contained" color="secondary"
              disabled={!title.trim() || !content.trim() || overHard}>{initial?.id ? 'Save Draft' : 'Save as Draft'}</Button>
            <Button onClick={() => handleSubmit('PUBLISHED')} variant="contained" color="success"
              disabled={!title.trim() || !content.trim() || overHard}>Publish</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BlogEditorDialog;
