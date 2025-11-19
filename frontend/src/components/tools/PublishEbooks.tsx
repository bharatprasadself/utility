import { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Alert, Divider, Paper } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import type { EbookContent, EbookItem } from '@/types/Ebooks';
import { defaultEbookContent } from '@/types/Ebooks';
import { API_BASE_URL } from '@/services/axiosConfig';
import EbookService from '@/services/ebooks';

// Admin editor extracted from Ebooks page
const AdminEditor = ({ value, onChange, onSave }: { value: EbookContent; onChange: (c: EbookContent) => void; onSave: () => Promise<void> }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  // Newsletter and send logic moved to Author Page

  // guard against nulls from backend
  const booksSafe: EbookItem[] = value.books ?? [];
  // author/contact editing moved to Author Page

  const MAX_COVER_BYTES = 2 * 1024 * 1024; // 2 MB

  const handleBookChange = (index: number, patch: Partial<EbookItem>) => {
    const next = { ...value, books: booksSafe.map((b, i) => (i === index ? { ...b, ...patch } : b)) };
    onChange(next);
  };
  // Add Book button removed; Save will publish new books
  const removeBook = (index: number) => onChange({ ...value, books: booksSafe.filter((_, i) => i !== index) });

  // contact handlers removed; managed in Author Page

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave();
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
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
              <Button variant="outlined" color="error" onClick={() => removeBook(i)} sx={{ mt: 2, width: '100%' }}>
                Remove Book
              </Button>
            </Box>
            {/* Book details */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <TextField label="Title" value={b.title} onChange={(e) => handleBookChange(i, { title: e.target.value })} sx={{ mb: 2 }} fullWidth />
              <TextField label="Cover URL" value={b.coverUrl} onChange={(e) => handleBookChange(i, { coverUrl: e.target.value })} sx={{ mb: 2 }} fullWidth />
              <TextField label="Buy Link" value={b.buyLink} onChange={(e) => handleBookChange(i, { buyLink: e.target.value })} sx={{ mb: 2 }} fullWidth />
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Description"
                value={b.description || ''}
                onChange={(e) => handleBookChange(i, { description: e.target.value })}
                sx={{ mb: 2 }}
              />
            </Box>
          </Box>
        ))}
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={save} disabled={saving} sx={{ minWidth: 120, fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
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
        const data = await EbookService.getContent();
        setContent({
          ...defaultEbookContent,
          ...data,
          books: data?.books ?? [],
          contacts: data?.contacts ?? []
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onSave = async () => {
    const saved = await EbookService.upsertContent(content);
    setContent(saved);
  };

  if (!admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">You are not authorized to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
        Publish Ebooks
      </Typography>
      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : (
        <AdminEditor value={content} onChange={setContent} onSave={onSave} />
      )}
    </Box>
  );
}
