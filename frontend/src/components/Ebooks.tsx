import { useEffect, useMemo, useState } from 'react';
import { Box, Typography, Grid, Card, CardMedia, CardContent, Button, TextField, Alert, Stack } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { EbookContent, EbookItem, ContactLink } from '@/types/Ebooks';
import { defaultEbookContent } from '@/types/Ebooks';
import EbookService from '@/services/ebooks';
import { AuthorService } from '@/services/author';
import { API_BASE_URL } from '@/services/axiosConfig';
import Advertisement from './Advertisement';

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

const resolveCoverUrl = (url?: string): string => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  // For relative URLs like /uploads/xyz, prefix with backend base URL when available
  if (url.startsWith('/')) return `${API_BASE_URL || ''}${url}`;
  return url;
};

const BooksGrid = ({ books, updatedAt }: { books: EbookItem[]; updatedAt?: string }) => {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setExpandedMap(prev => ({ ...prev, [key]: !prev[key] }));

  const PREVIEW_LEN = 500;

  return (
    <Grid container spacing={2}>
      {books.map((b, idx) => {
        const key = `${b.id ?? idx}-${b.title}`;
        const fullMd = b.description || '';
        const isLong = fullMd.length > PREVIEW_LEN;
        const isExpanded = !!expandedMap[key];
        const mdToRender = isExpanded || !isLong ? fullMd : (fullMd.slice(0, PREVIEW_LEN) + '...');

        return (
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
                    image={resolveCoverUrl(b.coverUrl)}
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
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                    {b.title}
                  </Typography>
                )}

                {updatedAt && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    Updated {new Date(updatedAt).toLocaleString()}
                  </Typography>
                )}

                {fullMd && (
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
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{mdToRender}</ReactMarkdown>
                    {isLong && (
                      <Button
                        onClick={() => toggle(key)}
                        sx={{ display: 'block', mt: 1, color: 'primary.main', '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
                      >
                        {isExpanded ? 'Show Less' : 'Read More'}
                      </Button>
                    )}
                  </Box>
                )}

                {/* Clear float to ensure card height includes the floated media */}
                <Box sx={{ clear: 'both' }} />
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};

const ContactLinks = ({ links }: { links: ContactLink[] }) => (
  <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
    {links.map((l, idx) => {
      let url = l.url || '';
      if (l.label && l.label.trim().toLowerCase() === 'email' && url && !url.startsWith('mailto:')) {
        url = 'mailto:' + url;
      }
      return (
        <Button key={(l.url ?? idx.toString()) + l.label} variant="outlined" href={url} target="_blank" rel="noopener noreferrer">
          {l.label}
        </Button>
      );
    })}
  </Stack>
);

// Admin editor removed from public /ebooks page; moved to Tools > Publish Ebooks

export default function Ebooks() {
  // const { isAdmin } = useAuth();
  const [content, setContent] = useState<EbookContent>(defaultEbookContent);
  const [author, setAuthor] = useState<{ name: string; bio: string; contacts?: ContactLink[] }>({ name: '', bio: '', contacts: [] });
  const [email, setEmail] = useState('');
  const [subResult, setSubResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [catalogContent, authorData] = await Promise.all([
          EbookService.getContent(),
          AuthorService.get()
        ]);
        const onlyPublished = (catalogContent?.books || []).filter(b => (b.status || '').toLowerCase() === 'published');
        setContent({ ...(catalogContent || defaultEbookContent), books: onlyPublished });
        setAuthor({
          name: authorData?.name || '',
          bio: authorData?.bio || '',
          contacts: authorData?.contacts || []
        });
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Admin save removed from public page

  const subscribe = async () => {
    setSubResult(null);
    const res = await EbookService.subscribeNewsletter(email, content.newsletterEndpoint);
    const msg = res.message || (res.status === 'already-subscribed'
      ? 'You are already subscribed.'
      : res.status === 'reactivated'
        ? 'Welcome back! Your subscription has been reactivated.'
        : res.success
          ? 'Thanks for subscribing! Please check your inbox.'
          : 'Subscription failed.');
    setSubResult(msg);
    setEmail('');
  };

  const hasBooks = useMemo(() => content.books?.length > 0, [content.books]);
  const hasContacts = useMemo(() => (author.contacts?.length ?? 0) > 0, [author.contacts]);

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, px: 0, width: '100%' }}>
      <Box sx={{ p: 3, flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
            Author{author.name ? ` : ${author.name}` : ''}
          </Typography>
        </Box>
        {loading && (
          <Typography color="text.secondary" sx={{ mb: 2 }}>Loading...</Typography>
        )}
        {/* Page-level updated timestamp moved to each ebook card */}

        {/* Books */}
        <SectionHeader title="Books" />
        {hasBooks ? (
          <BooksGrid books={content.books} updatedAt={content.updatedAt} />
        ) : (
          <Typography color="text.secondary">No published books available.</Typography>
        )}

        {/* About */}
        <SectionHeader title="About" />
        <Box sx={{ maxWidth: { xs: '100%', md: 980 }, ml: 0, mr: 'auto' }}>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>
            {author.bio || 'Short bio goes here.'}
          </Typography>
        </Box>

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
        {subResult && (
          <Alert sx={{ mt: 2 }} severity={subResult.includes('failed') ? 'error' : (subResult.includes('already') ? 'info' : 'success')}>
            {subResult}
          </Alert>
        )}

        {/* Contact / Links */}
        <SectionHeader title="Contact / Links" />
        {hasContacts ? (
          <ContactLinks links={author.contacts || []} />
        ) : (
          <Typography color="text.secondary">No links added yet.</Typography>
        )}

        {/* Admin editor removed from public page */}
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
}
