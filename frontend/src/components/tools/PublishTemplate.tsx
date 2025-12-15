import { MenuItem, Select, InputLabel, FormControl, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { SelectChangeEvent } from '@mui/material';
import { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, CircularProgress, Grid, Stack, TextField, FormLabel, AlertTitle } from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/services/axiosConfig';
import { listTemplates, publishTemplate, generateBuyerPdf } from '../../services/templates';
import type { Template } from '../../services/templates';

export default function PublishTemplate() {
  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [canvaUrl, setCanvaUrl] = useState('');
  const [mobileCanvaUrl, setMobileCanvaUrl] = useState('');
  const [rsvpCanvaUrl, setRsvpCanvaUrl] = useState('');
  const [detailCardCanvaUrl, setDetailCardCanvaUrl] = useState('');
  const [mockupFile, setMockupFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState<string>('');
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [secondaryUrl, setSecondaryUrl] = useState<string>('');
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobileUrl, setMobileUrl] = useState<string>('');
  const [etsyUrl, setEtsyUrl] = useState<string>('');
  const [editId, setEditId] = useState<number | null>(null);
  const [publishingId, setPublishingId] = useState<number | null>(null);
  const [generatingPdfId, setGeneratingPdfId] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  // Per-template PDF type selection
  const [pdfTypeById, setPdfTypeById] = useState<Record<number, 'print-mobile' | 'print-only' | 'wedding-set'>>({});
  const getPdfTypeFor = (id: number): 'print-mobile' | 'print-only' | 'wedding-set' => pdfTypeById[id] || 'print-mobile';
  const [publicDescription, setPublicDescription] = useState<string>('');
  // Create-form specific PDF type selector (since global was removed)
  const [createPdfType, setCreatePdfType] = useState<'print-mobile' | 'print-only' | 'wedding-set'>('print-mobile');
  // Removed global handler; each row controls its own type

  // Normalize server/DB values (e.g., PRINT_MOBILE) into UI values (print-mobile)
  const normalizePdfType = (val?: string | null): 'print-mobile' | 'print-only' | 'wedding-set' => {
    if (!val) return 'print-mobile';
    const v = String(val).toUpperCase().replace(/\s+/g, '');
    if (v === 'PRINT_ONLY' || v === 'PRINT-ONLY') return 'print-only';
    if (v === 'WEDDING_SET' || v === 'WEDDING-SET') return 'wedding-set';
    // default and also covers PRINT_MOBILE/PRINT-MOBILE
    return 'print-mobile';
  };

  const refresh = async () => {
    try {
      setError(null);
      const data = await listTemplates();
      setTemplates(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load templates');
    }
  };

  useEffect(() => {
    refresh();
    // Auto-generate title for new template
    if (editId == null) {
      import('../../services/templates').then(m => m.getNextTemplateTitle()).then(setTitle).catch(() => setTitle(''));
    }
    // eslint-disable-next-line
  }, []);

  // When editing a template, keep the selected Buyer PDF Type in sync with the row map
  useEffect(() => {
    if (editId != null) {
      setPdfTypeById(prev => ({ ...prev, [editId]: createPdfType }));
    }
  }, [editId, createPdfType]);

  const handleUploadMockup = async () => {
    if (!mockupFile) return;
    try {
      setLoading(true);
      const url = await import('../../services/templates').then(m => m.uploadMockup(mockupFile));
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
      const url = await import('../../services/templates').then(m => m.uploadMockup(secondaryFile));
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
      const url = await import('../../services/templates').then(m => m.uploadMockup(mobileFile));
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
      const { createTemplate, getNextTemplateTitle } = await import('../../services/templates');
        const p = await createTemplate({
          title: title.trim(),
          publicDescription: publicDescription.trim() || undefined,
          canvaUseCopyUrl: canvaUrl.trim(),
          mobileCanvaUseCopyUrl: mobileCanvaUrl.trim(),
          rsvpCanvaUseCopyUrl: rsvpCanvaUrl.trim() || undefined,
          detailCardCanvaUseCopyUrl: detailCardCanvaUrl.trim() || undefined,
          mockupUrl: mockupUrl.trim() || undefined,
          secondaryMockupUrl: secondaryUrl.trim() || undefined,
          mobileMockupUrl: mobileUrl.trim() || undefined,
          etsyListingUrl: etsyUrl.trim() || undefined,
          buyerPdfType: createPdfType,
          status: 'draft'
        });
      await refresh(); // Ensure DB is up-to-date before getting next title
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
      setPublicDescription('');
      setSuccess(`Template created (id=${p.id})`);
    } catch (e: any) {
      setError(e.message || 'Create failed');
    } finally {
      setLoading(false);
    }
  };

    const startEdit = (t: Template) => {
    setEditId(t.id);
    setTitle(t.title || '');
    setCanvaUrl(t.canvaUseCopyUrl || '');
    setMobileCanvaUrl(t.mobileCanvaUseCopyUrl || '');
    setRsvpCanvaUrl(t.rsvpCanvaUseCopyUrl || '');
    setDetailCardCanvaUrl(t.detailCardCanvaUseCopyUrl || '');
    setMockupUrl(t.mockupUrl || '');
    setSecondaryUrl(t.secondaryMockupUrl || '');
    setMobileUrl(t.mobileMockupUrl || '');
    setEtsyUrl(t.etsyListingUrl || '');
    setPublicDescription((t as any).publicDescription || '');
    setMockupFile(null);
      // Initialize Buyer PDF Type selector: prefer server value (normalized), else per-row map (also normalized)
      const serverType = normalizePdfType((t as any).buyerPdfType as string | undefined);
      const fallbackType = normalizePdfType(getPdfTypeFor(t.id));
      setCreatePdfType(serverType || fallbackType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this template? This will also remove its generated buyer PDF.')) return;
    try {
      setLoading(true);
      setError(null);
      const { deleteTemplate } = await import('../../services/templates');
      await deleteTemplate(id);
      cancelEdit();
      setSuccess('Template deleted');
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
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
      const { updateTemplate } = await import('../../services/templates');
        await updateTemplate(editId, {
          title: title.trim(),
          publicDescription: publicDescription.trim() || undefined,
          canvaUseCopyUrl: canvaUrl.trim(),
          mobileCanvaUseCopyUrl: mobileCanvaUrl.trim() || undefined,
          rsvpCanvaUseCopyUrl: rsvpCanvaUrl.trim() || undefined,
          detailCardCanvaUseCopyUrl: detailCardCanvaUrl.trim() || undefined,
          mockupUrl: mockupUrl.trim() || undefined,
          secondaryMockupUrl: secondaryUrl.trim() || undefined,
          mobileMockupUrl: mobileUrl.trim() || undefined,
          etsyListingUrl: etsyUrl.trim() || undefined,
          buyerPdfType: createPdfType,
          status: 'draft'
        });
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
      setPublicDescription('');
      setSuccess('Template updated');
      await refresh();
    } catch (e: any) {
      setError(e.message || 'Update failed');
    } finally {
      setLoading(false);
    }
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
    setPublicDescription('');
  };

  // (Removed duplicate useEffect)

  const handlePublish = async (id: number) => {
    setPublishingId(id);
    setError(null);
    setSuccess(null);
    try {
      await publishTemplate(id);
      setSuccess('Template published successfully.');
      await refresh();
    } catch {
      setError('Failed to publish template.');
    } finally {
      setPublishingId(null);
    }
  };

  const handleGeneratePdf = async (id: number) => {
    setGeneratingPdfId(id);
    setPdfError(null);
    setSuccess(null);
    try {
      const url = await generateBuyerPdf(id, getPdfTypeFor(id));
      setSuccess('Buyer PDF generated successfully.');
      // Open the PDF in a new browser tab
      if (url) {
        window.open(url, '_blank');
      }
      await refresh();
    } catch (e: any) {
      setPdfError(e.message || 'Failed to generate Buyer PDF.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  if (!admin) {
    return <Alert severity="error">You do not have permission to publish templates.</Alert>;
  }

  const resolveUrl = (u?: string): string | undefined => {
    if (!u) return undefined;
    return u.startsWith('http') ? u : `${API_BASE_URL}${u}`;
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Publish Templates</Typography>
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
                    sx={{ minWidth: 320, mb: 1.25 }}
                  />
                </Grid>
                {/* Buyer PDF Type in its own grid row */}
                <Grid item xs={12}>
                  <FormControl fullWidth sx={{ minWidth: 320, mb: 1 }}>
                    <InputLabel id="create-pdf-type">Buyer PDF Type</InputLabel>
                    <Select
                      labelId="create-pdf-type"
                      id="create-pdf-type-select"
                      value={createPdfType}
                      label="Buyer PDF Type"
                      onChange={(e: SelectChangeEvent) => setCreatePdfType(e.target.value as 'print-mobile' | 'print-only' | 'wedding-set')}
                    >
                      <MenuItem value="print-mobile">Print & Mobile</MenuItem>
                      <MenuItem value="print-only">Print only</MenuItem>
                      <MenuItem value="wedding-set">Full Wedding Set</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {/* Canva URL in separate grid row */}
                <Grid item xs={12}>
                  <TextField
                    label="Canva ‘Use a Copy’ URL (5 X 7 in)"
                    value={canvaUrl}
                    onChange={(e) => setCanvaUrl(e.target.value)}
                    fullWidth
                    sx={{ minWidth: 320, mb: 1 }}
                  />
                </Grid>
                {(createPdfType === 'print-mobile' || createPdfType === 'wedding-set') && (
                  <Grid item xs={12}>
                    <TextField
                      label="Mobile Canva ‘Use a Copy’ URL (1080 X 1920 px)"
                      value={mobileCanvaUrl}
                      onChange={(e) => setMobileCanvaUrl(e.target.value)}
                      fullWidth
                      sx={{ minWidth: 320, mb: 1 }}
                    />
                  </Grid>
                )}
                {createPdfType === 'wedding-set' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        label="RSVP Canva ‘Use a Copy’ URL"
                        value={rsvpCanvaUrl}
                        onChange={(e) => setRsvpCanvaUrl(e.target.value)}
                        fullWidth
                        sx={{ minWidth: 320, mb: 1 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Detail Card Canva ‘Use a Copy’ URL"
                        value={detailCardCanvaUrl}
                        onChange={(e) => setDetailCardCanvaUrl(e.target.value)}
                        fullWidth
                        sx={{ minWidth: 320, mb: 1 }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
              <Grid container alignItems="center" sx={{ width: '100%', mb: 1.25 }}>
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
                    <Typography variant="body2" sx={{ ml: 2 }}>
                      {mockupFile.name}
                    </Typography>
                  )}
                </Grid>
              </Grid>
              <Grid container alignItems="center" sx={{ width: '100%', mb: 1.25 }}>
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
              <Grid container alignItems="center" sx={{ width: '100%', mb: 1.25 }}>
                {(createPdfType !== 'print-only') && (
                  <>
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
                  </>
                )}
              </Grid>
              <TextField
                label="Etsy listing URL"
                value={etsyUrl}
                onChange={e => setEtsyUrl(e.target.value)}
                  sx={{ minWidth: 320, mb: 1 }}
              />
              <TextField
                    label="Public Description (optional)"
                    helperText="Shown on Shop and used in Buyer PDF heading. Leave blank to auto-derive."
                    value={publicDescription}
                    onChange={e => setPublicDescription(e.target.value)}
                    fullWidth
                    multiline
                    minRows={2}
                    sx={{ minWidth: 320, mb: 1.25 }}
                  />
              

              {/* Removed duplicate PDF type selector and unclosed FormControl */}
              <Button
                variant="contained"
                color="success"
                onClick={editId == null ? handleCreate : handleUpdate}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                Save Draft
              </Button>
              {editId != null && (
                <Button variant="text" color="inherit" onClick={cancelEdit} disabled={loading} sx={{ ml: 2, mt: 2 }}>
                  Cancel
                </Button>
              )}
              {loading && <CircularProgress size={24} />}
              {(mockupUrl || secondaryUrl || mobileUrl) && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>Uploaded mockup URL: {mockupUrl}</Typography>
              )}
              {secondaryUrl && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>Secondary mockup URL: {secondaryUrl}</Typography>
              )}
              {mobileUrl && (
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>Mobile mockup URL: {mobileUrl}</Typography>
              )}
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Alert severity="success" sx={{ height: '100%', width: '100%', alignItems: 'flex-start', p: 2 }}>
            <AlertTitle>End‑to‑end workflow</AlertTitle>
            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li style={{ marginBottom: 8 }}>
                <strong>Design in Canva</strong>: finish your design and make sure you can copy a <em>Template / Use this template</em> link
                (Share → More/Template link → Copy).
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Create the template entry here</strong>: enter a Title, paste the Canva link, and upload mockups.
                Use <em>Upload Mockup</em> for the primary, plus optional <em>Upload Secondary</em> and <em>Upload Mobile</em>.
                Optionally add your Etsy listing URL. Click <em>Save Template</em>.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Generate the Buyer PDF (4 pages)</strong>: from the list below, click <em>Buyer PDF</em>.
                The PDF includes: Cover (primary mockup), Canva Access (button + QR, included items, secondary mockup),
                How to Edit (step‑by‑step with mobile mockup), and License & Support. A shop logo is used when present
                at <code>./data/uploads/branding/shop-logo.(png|jpg|jpeg)</code>.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Verify and publish</strong>: open the generated PDF to confirm links, QR, and images.
                Share the PDF link in order confirmations or your storefront. The public catalog shows the Etsy link when set.
              </li>
              <li style={{ marginBottom: 8 }}>
                <strong>Maintain</strong>: use <em>Edit</em> to update fields (re‑generate the PDF after changes if needed) or <em>Delete</em>
                to remove the template and its associated PDF and mockup files.
              </li>
            </ol>
            <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.6)' }}>
              Storage notes: mockups are served from <code>/api/canva-templates/mockups/&lt;file&gt;</code>; PDFs from
              <code> /api/canva-templates/pdfs/{'{id}'} .pdf</code>. Files live under <code>./data/uploads/canva-templates/{'{mockups|pdfs}'} </code>.
            </div>
          </Alert>
        </Grid>
      </Grid>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {pdfError && <Alert severity="error" sx={{ mb: 2 }}>{pdfError}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Mockup</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>PDF Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((t: Template) => (
                <TableRow key={t.id}>
                  <TableCell>{t.title}</TableCell>
                  <TableCell>{t.mockupUrl ? <a href={resolveUrl(t.mockupUrl)} target="_blank" rel="noopener noreferrer">View</a> : '-'}</TableCell>
                  <TableCell>{t.status === 'published' ? 'Published' : 'Draft'}</TableCell>
                  <TableCell>
                    {(() => {
                      const rowType = normalizePdfType((t as any).buyerPdfType as string | undefined) || normalizePdfType(getPdfTypeFor(t.id));
                      return rowType === 'print-mobile' ? 'Print & Mobile' : rowType === 'print-only' ? 'Print only' : 'Full Wedding Set';
                    })()}
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Button
                          variant="contained"
                          color="secondary"
                          disabled={!!generatingPdfId}
                          onClick={() => handleGeneratePdf(t.id)}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                        >
                          {generatingPdfId === t.id ? <CircularProgress size={20} /> : 'Buyer PDF'}
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          disabled={!!publishingId}
                          onClick={() => handlePublish(t.id)}
                          sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                        >
                          {publishingId === t.id ? <CircularProgress size={20} /> : 'Publish'}
                        </Button>
                        <Tooltip title="Edit">
                          <span>
                            <IconButton
                              color="info"
                              onClick={() => startEdit(t)}
                              disabled={loading}
                              size="medium"
                              sx={{ borderRadius: 2 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(t.id)}
                              disabled={loading}
                              size="medium"
                              sx={{ borderRadius: 2 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
