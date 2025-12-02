import { Box, Typography, Button, Link as MuiLink, FormControl, InputLabel, Select, MenuItem, TextField, Input, Alert, CircularProgress } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useEffect, useState, useRef } from 'react';
import { generateBuyerPdf, uploadMockup } from '@/services/templates';
import { useAuth } from '../contexts/AuthContext';


const CanvaTemplates = () => {
  const { isAdmin } = useAuth();
  // Admin view: show template management as before
  // const [templates, setTemplates] = useState<Template[]>([]);
  // const [loading, setLoading] = useState(false);
  // PDF type selection for Buyer PDF
  const [pdfType, setPdfType] = useState<'print-mobile' | 'print-only' | 'wedding-set'>('print-mobile');
  const handlePdfTypeChange = (event: SelectChangeEvent) => {
    setPdfType(event.target.value as 'print-mobile' | 'print-only' | 'wedding-set');
  };

  // Public form state
  const [title, setTitle] = useState('');
  const [mockup, setMockup] = useState<File | null>(null);
  const [secondaryMockup, setSecondaryMockup] = useState<File | null>(null);
  const [mobileMockup, setMobileMockup] = useState<File | null>(null);
  const [canvaLink, setCanvaLink] = useState('');
  const [mobileCanvaLink, setMobileCanvaLink] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rsvpCanvaLink, setRsvpCanvaLink] = useState('');
  const [detailCardCanvaLink, setDetailCardCanvaLink] = useState('');

  useEffect(() => {
    if (isAdmin()) {
      // const fetchTemplates = async () => {
      //   setLoading(true);
      //   try {
      //     const data = await listTemplates();
      //     setTemplates(data);
      //   } finally {
      //     setLoading(false);
      //   }
      // };
      // fetchTemplates();
    }
  }, [isAdmin]);

  // Admin: generate PDF for template
  // const handleGeneratePdf = async (id: number) => {
  //   setLoading(true);
  //   try {
  //     const pdfUrl = await generateBuyerPdf(id, pdfType);
  //     const resolveUrl = (u?: string): string | undefined => {
  //       if (!u) return undefined;
  //       return u.startsWith('http') ? u : `${API_BASE_URL}${u}`;
  //     };
  //     const full = resolveUrl(pdfUrl);
  //     if (full) {
  //       const bust = full.includes('?') ? `${full}&v=${Date.now()}` : `${full}?v=${Date.now()}`;
  //       window.open(bust, '_blank');
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Public: handle form submit
  const handlePublicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResultUrl(null);
    setFormLoading(true);
    try {
      // Upload images if present
      let mockupUrl = '';
      let secondaryMockupUrl = '';
      let mobileMockupUrl = '';
      if (mockup) mockupUrl = await uploadMockup(mockup);
      if (secondaryMockup) secondaryMockupUrl = await uploadMockup(secondaryMockup);
      if (mobileMockup) mobileMockupUrl = await uploadMockup(mobileMockup);
      // Compose payload for PDF generation
      const payload: any = {
        title,
        pdfType,
        mockupUrl,
        secondaryMockupUrl,
        mobileMockupUrl,
        canvaUseCopyUrl: canvaLink,
        mobileCanvaUseCopyUrl: mobileCanvaLink,
        rsvpCanvaUseCopyUrl: rsvpCanvaLink,
        detailCardCanvaUseCopyUrl: detailCardCanvaLink
      };
      // Remove empty fields
      Object.keys(payload).forEach(k => (payload[k] === '' || payload[k] === undefined) && delete payload[k]);
      // Call backend (simulate with templateId: 0, backend should handle public)
      const pdfUrl = await generateBuyerPdf(0, pdfType); // You may need to adjust backend to accept payload
      setResultUrl(pdfUrl);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to generate PDF');
    } finally {
      setFormLoading(false);
    }
  };

 // Public user view: show Buyer PDF generator form
  return (
    <Box sx={{ py: 4, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>Online Buyer PDF Generator</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>Fill out the form below to generate a Buyer PDF. Required fields depend on the PDF type you select.</Typography>
      <form onSubmit={handlePublicSubmit}>
        <FormControl fullWidth sx={{ mb: 2 }}>
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
            <MenuItem value="wedding-set">Full Wedding Set (Invitation + RSVP + Details)</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth required sx={{ mb: 2 }} />
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Mockup Image (required)</Typography>
          <Input type="file" inputRef={fileInputRef} onChange={e => {
            const file = (e.target as HTMLInputElement).files?.[0] || null;
            setMockup(file);
          }} required />
        </Box>
        {(pdfType === 'print-mobile' || pdfType === 'wedding-set') && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Mobile Mockup Image</Typography>
            <Input type="file" onChange={e => {
              const file = (e.target as HTMLInputElement).files?.[0] || null;
              setMobileMockup(file);
            }} />
          </Box>
        )}
        {(pdfType === 'wedding-set') && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Secondary Mockup Image</Typography>
            <Input type="file" onChange={e => {
              const file = (e.target as HTMLInputElement).files?.[0] || null;
              setSecondaryMockup(file);
            }} />
          </Box>
        )}
         <TextField label="Canva Link" value={canvaLink} onChange={e => setCanvaLink(e.target.value)} fullWidth sx={{ mb: 2 }} />
         {(pdfType === 'print-mobile' || pdfType === 'wedding-set') && (
           <TextField label="Mobile Canva Link" value={mobileCanvaLink} onChange={e => setMobileCanvaLink(e.target.value)} fullWidth sx={{ mb: 2 }} />
         )}
         {pdfType === 'wedding-set' && (
           <>
             <TextField label="RSVP Canva Link" value={rsvpCanvaLink} onChange={e => setRsvpCanvaLink(e.target.value)} fullWidth sx={{ mb: 2 }} />
             <TextField label="Detail Card Canva Link" value={detailCardCanvaLink} onChange={e => setDetailCardCanvaLink(e.target.value)} fullWidth sx={{ mb: 2 }} />
           </>
         )}
        {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
        <Button type="submit" variant="contained" color="primary" disabled={formLoading} fullWidth>
          {formLoading ? <CircularProgress size={24} /> : 'Generate Buyer PDF'}
        </Button>
      </form>
      {resultUrl && (
        <Alert severity="success" sx={{ mt: 3 }}>
          PDF generated! <MuiLink href={resultUrl} target="_blank" rel="noreferrer">Download Buyer PDF</MuiLink>
        </Alert>
      )}
    </Box>
  );
};

export default CanvaTemplates;
