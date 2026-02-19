
import { useState } from 'react';
import { Box, Typography, Button, Paper, Stack, TextField, MenuItem, Select, InputLabel, FormControl, Alert, CircularProgress, Grid, AlertTitle, FormLabel } from '@mui/material';
import { generateBuyerPdf } from '../../services/templates';

export default function BuyerPdfTool() {
  const [pdfType, setPdfType] = useState<'print-mobile' | 'print-only' | 'invite-suite' | 'corporate-bundle'>('print-mobile');
  const [title, setTitle] = useState('');
  const [canvaUrl, setCanvaUrl] = useState('');
  const [mobileCanvaUrl, setMobileCanvaUrl] = useState('');
  const [rsvpCanvaUrl, setRsvpCanvaUrl] = useState('');
  const [detailCardCanvaUrl, setDetailCardCanvaUrl] = useState('');
  const [mockupFile, setMockupFile] = useState<File | null>(null);
  const [mockupUrl, setMockupUrl] = useState('');
  const [secondaryFile, setSecondaryFile] = useState<File | null>(null);
  const [secondaryUrl, setSecondaryUrl] = useState('');
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobileUrl, setMobileUrl] = useState('');
  // Etsy URL state removed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handlePdfTypeChange = (event: any) => {
    setPdfType(event.target.value);
  };

  const handleUploadMockup = async () => {
    if (!mockupFile) return;
    try {
      setLoading(true);
      setError(null);
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
      setError(null);
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
      setError(null);
      const url = await import('../../services/templates').then(m => m.uploadMockup(mobileFile));
      setMobileUrl(url);
      setSuccess('Mobile mockup uploaded');
    } catch (e: any) {
      setError(e.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPdfUrl(null);
    try {
      const url = await generateBuyerPdf(0, pdfType as 'print-mobile' | 'print-only' | 'invite-suite' | 'corporate-bundle'); // 0 = dummy id
      setPdfUrl(url);
      setSuccess('Buyer PDF generated!');
    } catch (e: any) {
      setError(e.message || 'Failed to generate Buyer PDF.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Online Buyer PDF Generator</Typography>
      <Grid container spacing={2} alignItems="stretch" sx={{ mb: 3 }}>
        <Grid item xs={12} md={6} sx={{ display: 'flex' }}>
          <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', minWidth: 380 }}>
            <Stack spacing={2} direction="column">
              <TextField
                label="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel id="pdf-type-label">Buyer PDF Type</InputLabel>
                <Select
                  labelId="pdf-type-label"
                  id="pdf-type-select"
                  value={pdfType}
                  label="Buyer PDF Type"
                  onChange={handlePdfTypeChange}
                >
                  <MenuItem value="print-mobile">Print + Mobile (default)</MenuItem>
                  <MenuItem value="print-only">Print-only</MenuItem>
                  <MenuItem value="invite-suite">Invite Suite (Invitation + RSVP + Details)</MenuItem>
                  <MenuItem value="corporate-bundle">Corporate Bundle</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Canva ‘Use a Copy’ URL (5 X 7 in)"
                value={canvaUrl}
                onChange={e => setCanvaUrl(e.target.value)}
                fullWidth
              />
              {(pdfType === 'print-mobile' || pdfType === 'invite-suite' || pdfType === 'corporate-bundle') && (
                <TextField
                  label="Mobile Canva ‘Use a Copy’ URL (1080 X 1920 px)"
                  value={mobileCanvaUrl}
                  onChange={e => setMobileCanvaUrl(e.target.value)}
                  fullWidth
                />
              )}
              {pdfType === 'invite-suite' && (
                <>
                  <TextField
                    label="RSVP Canva ‘Use a Copy’ URL"
                    value={rsvpCanvaUrl}
                    onChange={e => setRsvpCanvaUrl(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Detail Card Canva ‘Use a Copy’ URL"
                    value={detailCardCanvaUrl}
                    onChange={e => setDetailCardCanvaUrl(e.target.value)}
                    fullWidth
                  />
                </>
              )}
              <Box>
                <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Primary mockup</FormLabel>
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
              </Box>
              <Box>
                <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Secondary mockup (optional)</FormLabel>
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
              </Box>
              {(pdfType !== 'print-only') && (
                <Box>
                  <FormLabel sx={{ fontWeight: 600, mb: 1, display: 'block' }}>Mobile mockup (optional)</FormLabel>
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
                </Box>
              )}
              {/* Etsy listing URL field removed as requested */}
              <Button
                variant="contained"
                color="success"
                onClick={handleGeneratePdf}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Generate Buyer PDF'}
              </Button>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              {success && pdfUrl && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success} <a href={pdfUrl} target="_blank" rel="noopener noreferrer">Download PDF</a>
                </Alert>
              )}
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
          <Alert severity="success" sx={{ height: '100%', width: '100%', alignItems: 'flex-start' }}>
            <AlertTitle>End‑to‑end workflow</AlertTitle>
            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
              <li>
                <strong>Design in Canva</strong>: finish your design and make sure you can copy a <em>Template / Use this template</em> link (Share → More/Template link → Copy).
              </li>
              <li>
                <strong>Fill out the form</strong>: enter a Title, paste the Canva link, and provide mockup URLs. Optionally add your Etsy listing URL. Click <em>Generate Buyer PDF</em>.
              </li>
              <li>
                <strong>Download the PDF (4 pages)</strong>: after generation, click the download link to get your Buyer PDF. The PDF includes: Cover (primary mockup), Canva Access (button + QR, included items, secondary mockup), How to Edit (step‑by‑step with mobile mockup), and License & Support.
              </li>
              <li>
                <strong>Share</strong>: send the PDF to your buyers or use it in your storefront.
              </li>
            </ol>
            <div style={{ marginTop: 8, color: 'rgba(0,0,0,0.6)' }}>
              <strong>Note:</strong> This tool does not save your data or files. All fields are required unless marked optional.
            </div>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
}
