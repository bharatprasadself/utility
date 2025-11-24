// AdminEditor: Handles editing and publishing of ebooks
import React, { useEffect, useState } from 'react';
// Utility to generate a UUID (RFC4122 v4)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Ensure every book has a unique id
function ensureBookIds(books: EbookItem[]): EbookItem[] {
  return (books || []).map((book) => ({
    ...book,
    id: book.id || generateUUID(),
  }));
}
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { Box, Typography, Button, Stack, Alert, Paper, TextField } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import Advertisement from '../Advertisement';
import type { EbookContent, EbookItem } from '@/types/Ebooks';
import { defaultEbookContent } from '@/types/Ebooks';
import { API_BASE_URL } from '@/services/axiosConfig';
import EbookService from '@/services/ebooks';

const AdminEditor = ({ value, onChange }: { value: EbookContent; onChange: (c: EbookContent) => void; }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const MAX_COVER_BYTES = 2 * 1024 * 1024;
  const booksSafe: EbookItem[] = value.books ?? [];


  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const handleBookChange = (index: number, patch: Partial<EbookItem>) => {
    const next = { ...value, books: booksSafe.map((b, i) => (i === index ? { ...b, ...patch } : b)) };
    onChange(next);
  };

  // Remove book using backend delete endpoint and refresh content
  const removeBook = async (index: number) => {
    setSaving(true);
    setError(null);
    try {
      const book = booksSafe[index];
      if (!book.rowId) throw new Error('Row ID is required for delete');
      await EbookService.deleteBook(book.rowId);
      // Remove from UI immediately
      const nextBooks = booksSafe.filter((_, i) => i !== index);
      onChange({ ...value, books: nextBooks });
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally {
      setSaving(false);
      setConfirmDeleteIdx(null);
    }
  };

  // Handler to publish a single book
  const publishBook = async (index: number) => {
    setSaving(true);
    setError(null);
    try {
      const book = booksSafe[index];
      const contentToPublish = { ...value, books: [book] };
      await EbookService.upsertContent(contentToPublish);
    } catch (e: any) {
      setError(e?.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper elevation={1} sx={{ p: { xs: 2, md: 4 }, mt: 2, maxWidth: { xs: '100%', md: 900 }, ml: 0, mr: 'auto', background: '#fafbfc' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}
      <Stack spacing={4} sx={{ mb: 3 }}>
        {booksSafe.map((b, i) => (
          <Box key={i} sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'flex-start' },
            gap: 3,
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            background: '#fff',
            boxShadow: 1,
            position: 'relative',
          }}>
            {/* Cover upload and preview */}
            <Box sx={{ width: { xs: '100%', sm: 180 }, flexShrink: 0, mb: { xs: 2, sm: 0 } }}>
              <Box sx={{ mb: 2, width: '100%' }}>
                {b.coverUrl && (
                  <Box sx={{ mb: 1, width: '100%' }}>
                    <img
                      src={b.coverUrl}
                      alt={b.title || 'Cover'}
                      style={{ width: '100%', height: 'auto', maxHeight: 220, objectFit: 'contain', borderRadius: 8, background: '#f5f5f5', border: '1px solid #eee' }}
                    />
                  </Box>
                )}
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const inputEl = e.currentTarget as HTMLInputElement;
                      const file = inputEl.files?.[0];
                      if (!file) return;
                      if (file.size > MAX_COVER_BYTES) {
                        alert('Cover image exceeds 2 MB. Please upload a smaller image.');
                        inputEl.value = '';
                        return;
                      }
                      try {
                        setUploadingIndex(i);
                        const url = await EbookService.uploadCover(file);
                        const absolute = url && url.startsWith('/') ? `${API_BASE_URL || ''}${url}` : url;
                        handleBookChange(i, { coverUrl: absolute });
                      } catch (err) {
                        console.error('Upload failed', err);
                        alert('Cover upload failed');
                      } finally {
                        setUploadingIndex(null);
                        inputEl.value = '';
                      }
                    }}
                  />
                  <Button variant="outlined" component="span" disabled={uploadingIndex === i} sx={{ width: '100%' }}>
                    {uploadingIndex === i ? 'Uploading...' : (b.coverUrl ? 'Change Cover' : 'Upload Cover')}
                  </Button>
                </label>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Max 2 MB
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mt: 2 }}>
                <Button variant="outlined" color="error" onClick={() => setConfirmDeleteIdx(i)} sx={{ flex: 1 }}>
                  Delete
                </Button>
                        {/* Delete confirmation dialog */}
                        <Dialog open={confirmDeleteIdx !== null} onClose={() => setConfirmDeleteIdx(null)}>
                          <DialogTitle>Confirm Delete</DialogTitle>
                          <DialogContent>
                            <DialogContentText>
                              Are you sure you want to delete this book? This action cannot be undone.
                            </DialogContentText>
                          </DialogContent>
                          <DialogActions>
                            <Button onClick={() => setConfirmDeleteIdx(null)} color="primary">
                              Cancel
                            </Button>
                            <Button onClick={() => confirmDeleteIdx !== null && removeBook(confirmDeleteIdx)} color="error" variant="contained" autoFocus>
                              Delete
                            </Button>
                          </DialogActions>
                        </Dialog>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => publishBook(i)}
                  disabled={saving}
                  sx={{ flex: 1, fontWeight: 600 }}
                >
                  {saving ? 'Publishing...' : 'Publish'}
                </Button>
              </Box>
            </Box>
            {/* Book details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField label="Title" value={b.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBookChange(i, { title: e.target.value })} sx={{ mb: 2 }} fullWidth />
              <TextField label="Status" value={b.status || ''} InputProps={{ readOnly: true }} sx={{ mb: 2 }} fullWidth />
              {/* Cover URL field removed as per request */}
              <TextField label="Buy Link" value={b.buyLink} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBookChange(i, { buyLink: e.target.value })} sx={{ mb: 2 }} fullWidth />
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Description"
                value={b.description || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleBookChange(i, { description: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Box>
            {/* Publish button moved next to Remove Book */}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
};

export default function PublishEbooks() {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState<EbookContent>(defaultEbookContent);
  const [loading, setLoading] = useState(true);
  const admin = isAdmin();

  useEffect(() => {
    const load = async () => {
      try {
        const all = await EbookService.listAll();
        const data = await EbookService.getContent();
        let books: EbookItem[] = [];
        (all as any[]).forEach((content: any) => {
          if (Array.isArray(content.books)) {
            content.books.forEach((book: any) => books.push({ ...book, status: content.status || 'draft', rowId: content.id }));
          }
        });
        // Ensure all books have an id
        books = ensureBookIds(books);
        setContent({
          ...defaultEbookContent,
          ...data,
          books,
          contacts: data?.contacts ?? []
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">You are not authorized to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Box sx={{ p: 3, flexGrow: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
          Publish Ebooks
        </Typography>
        {loading ? (
          <Typography color="text.secondary">Loading…</Typography>
        ) : (
          <AdminEditor value={content} onChange={setContent} />
        )}
      </Box>
      <Box
        sx={{
          marginTop: { xs: 2, md: 0 },
          ml: { md: 6 },
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
