import { Box, Typography, Paper, Grid, TextField, Button, Stack, CircularProgress, Link as MuiLink, Alert, AlertTitle } from '@mui/material';
import { useEffect, useState } from 'react';
import { createTemplate, generateBuyerPdf, listTemplates, uploadMockup, updateTemplate, deleteTemplate, type CanvaTemplate } from '@/services/canvaTemplates';

const CanvaTemplates = () => {
  const [title, setTitle] = useState('');
  const [canvaUrl, setCanvaUrl] = useState('');
  const [mockupFile, setMockupFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>('');
  const [etsyUrl, setEtsyUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<CanvaTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const refresh = async () => {
    try {
      setError(null);
  const data = await listTemplates();
  setTemplates(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load products');
    }
  };

  useEffect(() => { refresh(); }, []);

  const handleUploadMockup = async () => {
    if (!mockupFile) return;
    try {
      setLoading(true);
  const url = await uploadMockup(mockupFile);
      setMockupUrl(url);
      setSuccess('Mockup uploaded');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
  const p = await createTemplate({ title: title.trim(), canvaUseCopyUrl: canvaUrl.trim(), mockupUrl: mockupUrl.trim() || undefined, etsyListingUrl: etsyUrl.trim() || undefined });
      setTitle('');
      setCanvaUrl('');
      setMockupFile(null);
      setMockupUrl('');
    setEtsyUrl('');
  setSuccess(`Template created (id=${p.id})`);
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (editId == null) return;
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await updateTemplate(editId, { title: title.trim(), canvaUseCopyUrl: canvaUrl.trim(), mockupUrl: mockupUrl.trim() || undefined, etsyListingUrl: etsyUrl.trim() || undefined });
      setEditId(null);
      setTitle('');
      setCanvaUrl('');
      setMockupFile(null);
      setMockupUrl('');
      setEtsyUrl('');
      setSuccess('Template updated');
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (t: CanvaTemplate) => {
    setEditId(t.id);
    setTitle(t.title || '');
    setCanvaUrl(t.canvaUseCopyUrl || '');
    setMockupUrl(t.mockupUrl || '');
    setEtsyUrl(t.etsyListingUrl || '');
    setMockupFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle('');
    setCanvaUrl('');
    setMockupFile(null);
    setMockupUrl('');
    setEtsyUrl('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template? This will also remove its generated buyer PDF.')) return;
    try {
      setLoading(true);
      setError(null);
      await deleteTemplate(id);
      setSuccess('Template deleted');
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const pdfUrl = await generateBuyerPdf(id);
      setSuccess('Buyer PDF generated');
  await refresh();
      // Optionally open in new tab
      window.open(pdfUrl, '_blank');
    } catch (e: any) {
      setError(e.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>Canva Templates — Admin</Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        <AlertTitle>What goes into each field?</AlertTitle>
        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>
            <strong>Title</strong>: A short, descriptive name that will appear in listings, e.g.
            <em> "Wedding Invitation Set"</em> or <em>"Minimal Instagram Post Pack"</em>.
          </li>
          <li>
            <strong>Canva “Use a copy” URL</strong>: In Canva, open your design → click <em>Share</em> → choose <em>More</em> (or <em>Template link</em>) → copy the
            <em> Template/Use this template</em> link. Paste that URL here.
          </li>
          <li>
            <strong>Mockup</strong>: Upload a PNG/JPG preview image that best represents your template (export from Canva via File → Download → PNG/JPG).
          </li>
        </ul>
      </Alert>

      <Alert severity="success" sx={{ mb: 3 }}>
        <AlertTitle>End‑to‑end workflow</AlertTitle>
        <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
          <li>
            <strong>Create the template</strong> in Canva and make sure you can share a <em>Template / Use this template</em> link
            (Share → More/Template link → Copy).
          </li>
          <li>
            <strong>Add it here</strong>: enter Title, paste the Canva “Use a copy” URL, and upload a primary mockup image.
            Click <em>Upload Mockup</em> to get a public mockup URL, then click <em>Save Template</em>.
          </li>
          <li>
            <strong>Generate the buyer PDF</strong>: in the list below, click <em>Generate Buyer PDF</em>. The backend creates a PDF with
            the Canva link and simple instructions, stores it, and updates the template’s <code>buyerPdfUrl</code>.
          </li>
          <li>
            <strong>Deliver to customers</strong>: use the Buyer PDF link (e.g., in your order confirmation page or email) so buyers can
            open the PDF and click the Canva link to make their own copy.
          </li>
        </ol>
        <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.6)' }}>
          Storage notes: mockups are served from <code>/api/canva-templates/mockups/&lt;file&gt;</code>, and PDFs from
          <code> /api/canva-templates/pdfs/{'{id}'} .pdf</code>. Files are persisted under <code>./data/uploads/canva-templates</code>.
        </div>
      </Alert>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} useFlexGap flexWrap="wrap">
          <TextField
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            sx={{ minWidth: 260 }}
          />
          <TextField
            label="Canva ‘Use a copy’ URL"
            value={canvaUrl}
            onChange={e => setCanvaUrl(e.target.value)}
            sx={{ minWidth: 320 }}
          />
          <Button variant="outlined" component="label">
            {mockupFile ? `Mockup: ${mockupFile.name}` : 'Select Mockup'}
            <input type="file" hidden accept="image/*" onChange={e => setMockupFile(e.target.files?.[0] || null)} />
          </Button>
          <Button variant="contained" onClick={handleUploadMockup} disabled={!mockupFile || loading}>
            Upload Mockup
          </Button>
          <TextField
            label="Etsy listing URL"
            value={etsyUrl}
            onChange={e => setEtsyUrl(e.target.value)}
            sx={{ minWidth: 320 }}
          />

          {editId == null ? (
            <Button variant="contained" color="success" onClick={handleCreate} disabled={!title.trim() || loading}>
              Save Template
            </Button>
          ) : (
            <>
              <Button variant="contained" color="success" onClick={handleUpdate} disabled={!title.trim() || loading}>
                Save Changes
              </Button>
              <Button variant="text" color="inherit" onClick={cancelEdit} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
          {loading && <CircularProgress size={24} />}
        </Stack>
        {mockupUrl && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Uploaded mockup URL: {mockupUrl}</Typography>
        )}
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
  {success && <Typography sx={{ mt: 1, color: 'success.main' }}>{success}</Typography>}
      </Paper>

      <Typography variant="h6" sx={{ mb: 1 }}>Templates</Typography>
      <Grid container spacing={2}>
        {templates.map(p => (
          <Grid item xs={12} md={6} key={p.id}>
            <Paper sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>{p.title}</Typography>
                {p.canvaUseCopyUrl && <MuiLink href={p.canvaUseCopyUrl} target="_blank" rel="noreferrer">Canva link</MuiLink>}
                {p.buyerPdfUrl && (
                  <>
                    <br />
                    <MuiLink href={p.buyerPdfUrl} target="_blank" rel="noreferrer">Buyer PDF</MuiLink>
                  </>
                )}
                {p.etsyListingUrl && (
                  <>
                    <br />
                    <MuiLink href={p.etsyListingUrl} target="_blank" rel="noreferrer">Etsy Listing</MuiLink>
                  </>
                )}
              </Box>
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" onClick={() => startEdit(p)} disabled={loading}>Edit</Button>
                <Button variant="outlined" color="error" onClick={() => handleDelete(p.id)} disabled={loading}>Delete</Button>
                <Button variant="contained" onClick={() => handleGeneratePdf(p.id)} disabled={loading}>Generate Buyer PDF</Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
        {templates.length === 0 && (
          <Grid item xs={12}><Typography color="text.secondary">No templates yet.</Typography></Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CanvaTemplates;
