import { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button, Stack, Alert, Divider } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import type { ContactLink } from '@/types/Ebooks';
import { AuthorService } from '@/services/author';
import type { AuthorData } from '@/services/author';
import EbookService from '@/services/ebooks';

export default function AuthorPage() {
    const [newsletterEndpoint, setNewsletterEndpoint] = useState<string>("");
    const [sendSubject, setSendSubject] = useState("");
    const [sendBody, setSendBody] = useState("");
    const [sendStatus, setSendStatus] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const [content, setContent] = useState<AuthorData & { contacts: ContactLink[] }>({ name: '', bio: '', contactEmail: '', profileImageUrl: '', contacts: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await AuthorService.get();
        if (data) setContent({ ...data, contacts: data.contacts ?? [] });
      } catch (e: any) {
        setError(e?.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleContactChange = (index: number, patch: Partial<ContactLink>) => {
    setContent(prev => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => i === index ? { ...c, ...patch } : c)
    }));
  };
  const addContact = () => setContent(prev => ({
    ...prev,
    contacts: [...prev.contacts, { label: '', url: '' }]
  }));
  const removeContact = (index: number) => setContent(prev => ({
    ...prev,
    contacts: prev.contacts.filter((_, i) => i !== index)
  }));

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await AuthorService.save(content);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!admin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">You are not authorized to access this page.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 980 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
        Author Page
      </Typography>
      {loading ? (
        <Typography color="text.secondary">Loading…</Typography>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            label="Author Name"
            value={content.name}
            onChange={(e) => setContent({ ...content, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Bio"
            value={content.bio}
            onChange={(e) => setContent({ ...content, bio: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            type="email"
            label="Contact Email"
            value={content.contactEmail || ''}
            onChange={(e) => setContent({ ...content, contactEmail: e.target.value })}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Profile Image URL"
            value={content.profileImageUrl || ''}
            onChange={(e) => setContent({ ...content, profileImageUrl: e.target.value })}
            helperText="Publicly accessible image URL shown with author bio"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 2 }} />
          <TextField
            fullWidth
            label="Newsletter Endpoint (optional)"
            value={newsletterEndpoint}
            onChange={(e) => setNewsletterEndpoint(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Contact / Links
          </Typography>
          <Stack spacing={2}>
            {content.contacts.map((c, i) => (
              <Box key={i} sx={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: 1 }}>
                <TextField label="Label" value={c.label} onChange={(e) => handleContactChange(i, { label: e.target.value })} />
                <TextField label="URL" value={c.url} onChange={(e) => handleContactChange(i, { url: e.target.value })} />
                <Button color="error" onClick={() => removeContact(i)}>Remove</Button>
              </Box>
            ))}
            <Button onClick={addContact}>Add Link</Button>
          </Stack>

          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Send Newsletter (admin)
          </Typography>
          <TextField
            fullWidth
            label="Subject"
            value={sendSubject}
            onChange={(e) => setSendSubject(e.target.value)}
            sx={{ mb: 1 }}
          />
          <TextField
            fullWidth
            multiline
            minRows={6}
            label="HTML Body"
            value={sendBody}
            onChange={(e) => setSendBody(e.target.value)}
            helperText="Basic HTML supported. An unsubscribe link will be appended automatically."
          />
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={async () => {
                setSendStatus(null);
                try {
                  const res = await EbookService.sendNewsletter(sendSubject, sendBody);
                  if (res.success) setSendStatus(`Sent to ${res.recipients ?? 0} subscribers.`);
                  else setSendStatus(res.message || 'Failed to send');
                } catch (e: any) {
                  setSendStatus(e?.message || 'Failed to send');
                }
              }}
              disabled={!sendSubject || !sendBody}
            >
              Send Newsletter
            </Button>
          </Stack>
          {sendStatus && (
            <Alert sx={{ mt: 2 }} severity="info">{sendStatus}</Alert>
          )}
        </>
      )}
    </Box>
  );
}
