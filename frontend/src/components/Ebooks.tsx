import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent, Button, TextField, Alert, Stack, Divider, Paper } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import type { EbookContent, EbookItem, ContactLink } from '@/types/Ebooks';
import { defaultEbookContent } from '@/types/Ebooks';
import EbookService from '@/services/ebooks';

const SectionHeader = ({ title }: { title: string }) => (
  <Typography variant="h5" sx={{ mt: 4, mb: 2, fontWeight: 700 }}>{title}</Typography>
);

// Extract first markdown heading (e.g., # Title or ## Title) to help avoid duplicate titles
const extractFirstMdHeading = (md?: string): string | null => {
  if (!md) return null;
  const lines = md.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^#{1,6}\s+(.*)$/);
    if (m) {
      return m[1].trim();
    }
    // stop at first non-empty, non-heading line
    break;
  }
  return null;
};

const BooksGrid = ({ books }: { books: EbookItem[] }) => (
  <Grid container spacing={2}>
    {books.map((b, idx) => (
      <Grid item xs={12} key={(b.id ?? idx.toString()) + b.title}>
        <Card
          sx={{
            p: { xs: 2, sm: 3 },
            maxWidth: { xs: '100%', md: 980 },
            ml: 0,
            mr: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Float the cover on desktop so text wraps around it; on mobile it stacks */}
            <Box
              sx={{
                float: { xs: 'none', sm: 'left' },
                width: { xs: '100%', sm: 260 },
                mr: { xs: 0, sm: 3 },
                mb: 2,
              }}
            >
              <CardMedia
                component="img"
                image={b.coverUrl}
                alt={extractFirstMdHeading(b.description || '') || b.title}
                loading="lazy"
                sx={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: { xs: 280, sm: 340 },
                  objectFit: 'contain',
                  objectPosition: 'center',
                  bgcolor: 'grey.100',
                  borderRadius: { xs: 0, sm: 1 },
                }}
              />
              <Box sx={{ mt: 1, display: 'flex', justifyContent: { xs: 'flex-start', sm: 'center' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  href={b.buyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Buy
                </Button>
              </Box>
            </Box>

            {/* Title and content flow around the floated cover */}
            {/* Only show separate title if markdown doesn't already include a heading */}
            {!extractFirstMdHeading(b.description || '') && (
              <Typography variant="h6" gutterBottom>
                {b.title}
              </Typography>
            )}

            {b.description && (
              <Box
                sx={{
                  mt: 0.5,
                  '& h1, & h2, & h3': { mt: 0, mb: 1, fontWeight: 700 },
                  '& p': { mt: 1, mb: 1, lineHeight: 1.75 },
                  '& ul, & ol': { mt: 1, mb: 1.5, pl: 3, lineHeight: 1.7 },
                  '& li': { mb: 0.5 },
                  '& a': { color: 'primary.main' },                  
                  color: 'text.primary',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{b.description}</ReactMarkdown>
              </Box>
            )}

            {/* Clear float to ensure card height includes the floated media */}
            <Box sx={{ clear: 'both' }} />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
);

const ContactLinks = ({ links }: { links: ContactLink[] }) => (
  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
    {links.map((l, idx) => (
      <Button key={(l.url ?? idx.toString()) + l.label} variant="outlined" href={l.url} target="_blank" rel="noopener noreferrer">
        {l.label}
      </Button>
    ))}
  </Stack>
);

// Admin editor (inline, minimal)
const AdminEditor = ({ value, onChange, onSave }: { value: EbookContent; onChange: (c: EbookContent) => void; onSave: () => Promise<void> }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // guard against nulls from backend
  const booksSafe: EbookItem[] = value.books ?? [];
  const contactsSafe: ContactLink[] = value.contacts ?? [];

  const MAX_COVER_BYTES = 2 * 1024 * 1024; // 2 MB

  const handleBookChange = (index: number, patch: Partial<EbookItem>) => {
    const next = { ...value, books: booksSafe.map((b, i) => (i === index ? { ...b, ...patch } : b)) };
    onChange(next);
  };
  const addBook = () => onChange({ ...value, books: [...booksSafe, { title: '', coverUrl: '', buyLink: '', description: '' }] });
  const removeBook = (index: number) => onChange({ ...value, books: booksSafe.filter((_, i) => i !== index) });

  const handleContactChange = (index: number, patch: Partial<ContactLink>) => {
    const next = { ...value, contacts: contactsSafe.map((c, i) => (i === index ? { ...c, ...patch } : c)) };
    onChange(next);
  };
  const addContact = () => onChange({ ...value, contacts: [...contactsSafe, { label: '', url: '' }] });
  const removeContact = (index: number) => onChange({ ...value, contacts: contactsSafe.filter((_, i) => i !== index) });

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
    <Paper elevation={1} sx={{ p: 2, mt: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Admin Editor
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Header Title"
        value={value.headerTitle}
        onChange={(e) => onChange({ ...value, headerTitle: e.target.value })}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        minRows={3}
        label="About (short bio)"
        value={value.about}
        onChange={(e) => onChange({ ...value, about: e.target.value })}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Newsletter Endpoint (optional)"
        value={value.newsletterEndpoint || ''}
        onChange={(e) => onChange({ ...value, newsletterEndpoint: e.target.value })}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Books
      </Typography>
      <Stack spacing={2}>
        {booksSafe.map((b, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 1, alignItems: 'center' }}>
            <TextField label="Title" value={b.title} onChange={(e) => handleBookChange(i, { title: e.target.value })} />
            <TextField label="Cover URL" value={b.coverUrl} onChange={(e) => handleBookChange(i, { coverUrl: e.target.value })} />
            <TextField label="Buy Link" value={b.buyLink} onChange={(e) => handleBookChange(i, { buyLink: e.target.value })} />
            <Box sx={{ display: 'flex', gap: 1 }}>
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
                      setError('Cover image exceeds 2 MB. Please upload a smaller image.');
                      inputEl.value = '';
                      return;
                    }
                    try {
                      setUploadingIndex(i);
                      const url = await EbookService.uploadCover(file);
                      handleBookChange(i, { coverUrl: url });
                    } catch (err) {
                      console.error('Upload failed', err);
                      setError('Cover upload failed');
                    } finally {
                      setUploadingIndex(null);
                      inputEl.value = '';
                    }
                  }}
                />
                <Button variant="outlined" component="span" disabled={uploadingIndex === i}>
                  {uploadingIndex === i ? 'Uploading...' : 'Upload Cover'}
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary">
                Max 2 MB
              </Typography>
              <Button color="error" onClick={() => removeBook(i)}>
                Remove
              </Button>
            </Box>

            {/* Description spans full width below the first row */}
            <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Description"
                value={b.description || ''}
                onChange={(e) => handleBookChange(i, { description: e.target.value })}
              />
              <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <label>
                  <input
                    type="file"
                    accept=".md,text/markdown,text/plain"
                    style={{ display: 'none' }}
                    onChange={async (e) => {
                      const inputEl = e.currentTarget as HTMLInputElement;
                      const file = inputEl.files?.[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        const mdTitle = extractFirstMdHeading(text);
                        handleBookChange(i, { description: text, title: mdTitle || b.title });
                      } finally {
                        inputEl.value = '';
                      }
                    }}
                  />
                  <Button variant="outlined" size="small" component="span">
                    Import .md
                  </Button>
                </label>
                <Typography variant="caption" color="text.secondary">
                  Markdown supported (bold, italics, lists, links)
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
        <Button onClick={addBook}>Add Book</Button>
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Contact / Links
      </Typography>
      <Stack spacing={2}>
        {contactsSafe.map((c, i) => (
          <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 1 }}>
            <TextField label="Label" value={c.label} onChange={(e) => handleContactChange(i, { label: e.target.value })} />
            <TextField label="URL" value={c.url} onChange={(e) => handleContactChange(i, { url: e.target.value })} />
            <Button color="error" onClick={() => removeContact(i)}>
              Remove
            </Button>
          </Box>
        ))}
        <Button onClick={addContact}>Add Link</Button>
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </Stack>
    </Paper>
  );
};

export default function Ebooks() {
  const { isAdmin } = useAuth();
  const [content, setContent] = useState<EbookContent>(defaultEbookContent);
  const [email, setEmail] = useState('');
  const [subResult, setSubResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
      } catch {
        // keep defaults
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

  const subscribe = async () => {
    setSubResult(null);
    const res = await EbookService.subscribeNewsletter(email, content.newsletterEndpoint);
    setSubResult(res.success ? 'Thanks for subscribing!' : 'Subscription failed.');
    setEmail('');
  };

  const hasBooks = useMemo(() => content.books?.length > 0, [content.books]);
  const hasContacts = useMemo(() => content.contacts?.length > 0, [content.contacts]);

  return (
    <Box sx={{ p: 3 }}>
      {loading && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>Loading...</Typography>
      )}
      {/* Header */}
      <Typography variant="h5" gutterBottom sx={{ mb: 4 }}>
        {content.headerTitle || 'Bharat Prasad | Author'}
      </Typography>
      {content.updatedAt && (
        <Typography variant="caption" color="text.secondary">Updated {new Date(content.updatedAt).toLocaleString()}</Typography>
      )}

      {/* Books */}
      <SectionHeader title="Books" />
      {hasBooks ? (
        <BooksGrid books={content.books} />
      ) : (
        <Typography color="text.secondary">No books added yet.</Typography>
      )}

      {/* About */}
      <SectionHeader title="About" />
      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{content.about || 'Short bio goes here.'}</Typography>

      {/* Newsletter */}
      <SectionHeader title="Newsletter" />
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', maxWidth: 480 }}>
        <TextField
          type="email"
          label="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={subscribe} disabled={!email}>
          Sign up
        </Button>
      </Box>
      {subResult && <Alert sx={{ mt: 2 }} severity="success">{subResult}</Alert>}

      {/* Contact / Links */}
      <SectionHeader title="Contact / Links" />
      {hasContacts ? (
        <ContactLinks links={content.contacts} />
      ) : (
        <Typography color="text.secondary">No links added yet.</Typography>
      )}

      {/* Admin editor */}
      {isAdmin() && (
        <AdminEditor value={content} onChange={setContent} onSave={onSave} />
      )}
    </Box>
  );
}
