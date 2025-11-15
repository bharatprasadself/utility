import { Box, Typography, Paper, Grid, TextField, Button, Stack, CircularProgress, Link as MuiLink, Alert, AlertTitle, FormLabel } from '@mui/material';
import { useEffect, useState } from 'react';
import { createTemplate, generateBuyerPdf, listTemplates, uploadMockup, updateTemplate, deleteTemplate, getNextTemplateTitle, type CanvaTemplate } from '@/services/canvaTemplates';

const CanvaTemplates = () => {
  const [title, setTitle] = useState('');
  const [canvaUrl, setCanvaUrl] = useState('');
  const [mobileCanvaUrl, setMobileCanvaUrl] = useState('');
  const [mockupFile, setMockupFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>('');
  const [etsyUrl, setEtsyUrl] = useState<string>('');
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [secondaryUrl, setSecondaryUrl] = useState<string>('');
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string>('');
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

  useEffect(() => {
    refresh();
    // Prefill next default title when starting a new entry
    (async () => {
      try {
        const next = await getNextTemplateTitle();
        setTitle(prev => prev || next);
      } catch {
        // ignore prefill errors
      }
    })();
  }, []);

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

  const handleUploadSecondary = async () => {
    if (!secondaryFile) return;
    try {
      setLoading(true);
      const url = await uploadMockup(secondaryFile);
      setSecondaryUrl(url);
      setSuccess('Secondary mockup uploaded');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMobile = async () => {
    if (!mobileFile) return;
    try {
      setLoading(true);
      const url = await uploadMockup(mobileFile);
      setMobileUrl(url);
      setSuccess('Mobile mockup uploaded');
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
  const p = await createTemplate({ title: title.trim(), canvaUseCopyUrl: canvaUrl.trim(), mobileCanvaUseCopyUrl: mobileCanvaUrl.trim(), mockupUrl: mockupUrl.trim() || undefined, secondaryMockupUrl: secondaryUrl.trim() || undefined, mobileMockupUrl: mobileUrl.trim() || undefined, etsyListingUrl: etsyUrl.trim() || undefined });
      // After create, prefill next suggested title for the next entry
      try {
        const next = await getNextTemplateTitle();
        setTitle(next);
      } catch {
        setTitle('');
      }
      setCanvaUrl('');
      setMobileCanvaUrl('');
      setMockupFile(null);
      setMockupUrl('');
    setEtsyUrl('');
    setSecondaryFile(null);
    setSecondaryUrl('');
    setMobileFile(null);
    setMobileUrl('');
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
  await updateTemplate(editId, { title: title.trim(), canvaUseCopyUrl: canvaUrl.trim(), mobileCanvaUseCopyUrl: mobileCanvaUrl.trim() || undefined, mockupUrl: mockupUrl.trim() || undefined, secondaryMockupUrl: secondaryUrl.trim() || undefined, mobileMockupUrl: mobileUrl.trim() || undefined, etsyListingUrl: etsyUrl.trim() || undefined });
      setEditId(null);
      setTitle('');
      setCanvaUrl('');
      setMobileCanvaUrl('');
      setMockupFile(null);
      setMockupUrl('');
      setEtsyUrl('');
      setSecondaryFile(null);
      setSecondaryUrl('');
      setMobileFile(null);
      setMobileUrl('');
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
  setMobileCanvaUrl(t.mobileCanvaUseCopyUrl || '');
    setMockupUrl(t.mockupUrl || '');
    setSecondaryUrl(t.secondaryMockupUrl || '');
    setMobileUrl(t.mobileMockupUrl || '');
    setEtsyUrl(t.etsyListingUrl || '');
    setMockupFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle('');
    setCanvaUrl('');
  setMobileCanvaUrl('');
    setMockupFile(null);
    setMockupUrl('');
    setSecondaryFile(null);
    setSecondaryUrl('');
    setMobileFile(null);
    setMobileUrl('');
    setEtsyUrl('');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template? This will also remove its generated buyer PDF.')) return;
    try {
      setLoading(true);
      setError(null);
      await deleteTemplate(id);
      // Clear any form/edit state so stale uploaded mockup URLs disappear after deletion
      cancelEdit();
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
      // Add a cache-busting param to avoid any intermediary caching
      const bust = pdfUrl.includes('?') ? `${pdfUrl}&v=${Date.now()}` : `${pdfUrl}?v=${Date.now()}`;
      window.open(bust, '_blank');
    } catch (e: any) {
      setError(e.message || 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>Canva Templates — Admin</Typography>
      <Grid container spacing={2} alignItems="stretch" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack spacing={2} direction="column">
              <Grid container spacing={2} sx={{ width: '100%' }}>
                <Grid item xs={12}>
                  <TextField
                    label="Title (auto-generated)"
                    value={title}
                    InputProps={{ readOnly: true }}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Canva ‘Use a Copy’ URL (5 X 7 in)"
                    value={canvaUrl}
                    onChange={e => setCanvaUrl(e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Mobile Canva ‘Use a Copy’ URL (1080 X 1920 px)"
                    value={mobileCanvaUrl}
                    onChange={e => setMobileCanvaUrl(e.target.value)}
                    fullWidth
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Grid item xs={12} sm={4} md={4} lg={3}>
                  <FormLabel>Primary mockup</FormLabel>
                </Grid>
                <Grid item xs={12} sm={8} md={8} lg={9}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Button variant="outlined" component="label" sx={{ flex: 1 }}>
                      Select Mockup
                      <input type="file" hidden accept="image/*" onChange={e => setMockupFile(e.target.files?.[0] || null)} />
                    </Button>
                    <Button variant="contained" onClick={handleUploadMockup} disabled={!mockupFile || loading} sx={{ flex: 1 }}>
                      Upload Mockup
                    </Button>
                  </Stack>
                  {mockupFile && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mockupFile.name}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Grid item xs={12} sm={4} md={4} lg={3}>
                  <FormLabel>Secondary mockup (optional)</FormLabel>
                </Grid>
                <Grid item xs={12} sm={8} md={8} lg={9}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Button variant="outlined" component="label" sx={{ flex: 1 }}>
                      Select Secondary Mockup
                      <input type="file" hidden accept="image/*" onChange={e => setSecondaryFile(e.target.files?.[0] || null)} />
                    </Button>
                    <Button variant="contained" onClick={handleUploadSecondary} disabled={!secondaryFile || loading} sx={{ flex: 1 }}>
                      Upload Secondary
                    </Button>
                  </Stack>
                  {secondaryFile && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {secondaryFile.name}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Grid container spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Grid item xs={12} sm={4} md={4} lg={3}>
                  <FormLabel>Mobile mockup (optional)</FormLabel>
                </Grid>
                <Grid item xs={12} sm={8} md={8} lg={9}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Button variant="outlined" component="label" sx={{ flex: 1 }}>
                      Select Mobile Mockup
                      <input type="file" hidden accept="image/*" onChange={e => setMobileFile(e.target.files?.[0] || null)} />
                    </Button>
                    <Button variant="contained" onClick={handleUploadMobile} disabled={!mobileFile || loading} sx={{ flex: 1 }}>
                      Upload Mobile
                    </Button>
                  </Stack>
                  {mobileFile && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mobileFile.name}
                    </Typography>
                  )}
                </Grid>
              </Grid>

          <TextField
            label="Etsy listing URL"
            value={etsyUrl}
            onChange={e => setEtsyUrl(e.target.value)}
            sx={{ minWidth: 320 }}
          />

          {editId == null ? (
            <Button variant="contained" color="success" onClick={handleCreate} disabled={loading}>
              Save Template
            </Button>
          ) : (
            <>
              <Button variant="contained" color="success" onClick={handleUpdate} disabled={loading}>
                Save Changes
              </Button>
              <Button variant="text" color="inherit" onClick={cancelEdit} disabled={loading}>
                Cancel
              </Button>
            </>
          )}
          {loading && <CircularProgress size={24} />}
        </Stack>
        {(mockupUrl || secondaryUrl || mobileUrl) && (
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Uploaded mockup URL: {mockupUrl}</Typography>
        )}
        {secondaryUrl && (
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>Secondary mockup URL: {secondaryUrl}</Typography>
        )}
        {mobileUrl && (
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>Mobile mockup URL: {mobileUrl}</Typography>
        )}
        {error && <Typography color="error" sx={{ mt: 1 }}>{error}</Typography>}
  {success && <Typography sx={{ mt: 1, color: 'success.main' }}>{success}</Typography>}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Alert severity="success" sx={{ height: '100%', width: '100%', alignItems: 'flex-start' }}>
            <AlertTitle>End‑to‑end workflow</AlertTitle>
            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li>
                <strong>Design in Canva</strong>: finish your design and make sure you can copy a <em>Template / Use this template</em> link
                (Share → More/Template link → Copy).
              </li>
              <li>
                <strong>Create the template entry here</strong>: enter a Title, paste the Canva link, and upload mockups.
                Use <em>Upload Mockup</em> for the primary, plus optional <em>Upload Secondary</em> and <em>Upload Mobile</em>.
                Optionally add your Etsy listing URL. Click <em>Save Template</em>.
              </li>
              <li>
                <strong>Generate the Buyer PDF (4 pages)</strong>: from the list below, click <em>Generate Buyer PDF</em>.
                The PDF includes: Cover (primary mockup), Canva Access (button + QR, included items, secondary mockup),
                How to Edit (step‑by‑step with mobile mockup), and License & Support. A shop logo is used when present
                at <code>./data/uploads/branding/shop-logo.(png|jpg|jpeg)</code>.
              </li>
              <li>
                <strong>Verify and publish</strong>: open the generated PDF to confirm links, QR, and images.
                Share the PDF link in order confirmations or your storefront. The public catalog shows the Etsy link when set.
              </li>
              <li>
                <strong>Maintain</strong>: use <em>Edit</em> to update fields (re‑generate the PDF after changes if needed) or <em>Delete</em>
                to remove the template and its associated PDF and mockup files.
              </li>
            </ol>
            <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.6)' }}>
              Storage notes: mockups are served from <code>/api/canva-templates/mockups/&lt;file&gt;</code>; PDFs from
              <code> /api/canva-templates/pdfs/{'{id}'} .pdf</code>. Files live under <code>./data/uploads/canva-templates/{'{mockups|pdfs}'}</code>.
            </div>
          </Alert>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mb: 1 }}>Templates</Typography>
      <Grid container spacing={2}>
        {templates.map(p => (
          <Grid item xs={12} key={p.id}>
            <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', width: '100%' }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>{p.title}</Typography>
                {p.canvaUseCopyUrl && <MuiLink href={p.canvaUseCopyUrl} target="_blank" rel="noreferrer">Canva link</MuiLink>}
                {p.mobileCanvaUseCopyUrl && (
                  <>
                    <br />
                    <MuiLink href={p.mobileCanvaUseCopyUrl} target="_blank" rel="noreferrer">Mobile Canva link</MuiLink>
                  </>
                )}
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
                {p.secondaryMockupUrl && (
                  <>
                    <br />
                    <MuiLink href={p.secondaryMockupUrl} target="_blank" rel="noreferrer">Secondary Mockup</MuiLink>
                  </>
                )}
                {p.mobileMockupUrl && (
                  <>
                    <br />
                    <MuiLink href={p.mobileMockupUrl} target="_blank" rel="noreferrer">Mobile Mockup</MuiLink>
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
