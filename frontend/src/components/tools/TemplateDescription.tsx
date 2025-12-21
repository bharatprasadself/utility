

import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Button, TextField, Stack, Grid, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function TemplateDescription() {
  // State variables
  const [buyerPdfType, setBuyerPdfType] = useState('Print Only');
  const buyerPdfTypes = ['Print Only', 'Mobile & Print', 'Invite Suite'];
  const leftPaperRef = useRef<HTMLDivElement>(null);
  const rightPaperRef = useRef<HTMLDivElement>(null);
  const [eventType, setEventType] = useState('Wedding');
  const [style, setStyle] = useState('Traditional');
  const [audience, setAudience] = useState('All');
  const [region, setRegion] = useState('India');
  const [masterTemplateBody, setMasterTemplateBody] = useState('');
  const [masterEditSuccess, setMasterEditSuccess] = useState<string|null>(null);
  const [masterEditError, setMasterEditError] = useState<string|null>(null);

  // Use ResizeObserver for dynamic height sync
  useEffect(() => {
    if (!leftPaperRef.current || !rightPaperRef.current) return;
    const updateHeight = () => {



    };
    updateHeight();
    const leftObserver = new window.ResizeObserver(updateHeight);
    const rightObserver = new window.ResizeObserver(updateHeight);
    leftObserver.observe(leftPaperRef.current);
    rightObserver.observe(rightPaperRef.current);
    return () => {
      leftObserver.disconnect();
      rightObserver.disconnect();
    };
  }, [eventType, style, audience, region]);


  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const styles = ['Traditional', 'Minimal', 'Floral', 'Modern', 'Kids', 'Other'];
  const audiences = ['Kids', 'Adults', 'All'];
  const regions = ['India', 'Other Countries'];

  // Generate preview for the selected combination
  function getPreviewBody() {
    let body = masterTemplateBody || '';
    // Dynamically generate WHAT YOU WILL RECEIVE section
    let whatYouReceive = '';
    if (buyerPdfType === 'Invite Suite') {
      whatYouReceive =
        '• Editable {{eventType}} Invitation – Canva Template\n' +
        '• RSVP Card – Canva Template\n' +
        '• Details Card – Canva Template\n' +
        '• Buyer PDF with Canva access link & instructions';
    } else if (buyerPdfType === 'Mobile & Print' || buyerPdfType === 'Print & Mobile') {
      whatYouReceive =
        '• Editable {{eventType}} Invitation – Canva Template\n' +
        '• Mobile Version – Canva Template\n' +
        '• Buyer PDF with Canva access link & instructions';
    } else {
      whatYouReceive =
        '• Editable {{eventType}} Invitation – Canva Template\n' +
        '• Buyer PDF with Canva access link & instructions';
    }
    body = body.replace(/WHAT YOU WILL RECEIVE \(\{\{buyerPdfType\}\}\)[\s\S]*?(-{10,}|EDITING DETAILS)/, (match: any) => {
      const nextSection = match.match(/(-{10,}|EDITING DETAILS)/);
      return `WHAT YOU WILL RECEIVE (${buyerPdfType})\n\n${whatYouReceive}\n\n${nextSection ? nextSection[0] : ''}`;
    });
    function getRegionDisplay(region: string) {
      return region === "India" ? "Indian celebrations" : "worldwide use";
    }
    body = body.replace(/\{\{eventType\}\}/g, eventType)
      .replace(/\{\{style\}\}/g, style)
      .replace(/\{\{audience\}\}/g, audience)
      .replace(/\{\{buyerPdfType\}\}/g, buyerPdfType)
      .replace(/\{\{region\}\}/g, getRegionDisplay(region));
    return body;
  }

  // Save only the master template (with placeholders)
  // ...existing code...


  // Fetch master template body
  const fetchMasterTemplate = async () => {
    try {
      const res = await fetch('/api/template-descriptions/master');
      if (res.ok) {
        const data = await res.json();
        setMasterTemplateBody(data.templateBody || '');
      }
    } catch {}
  };

  useEffect(() => {
    fetchMasterTemplate();
  }, []);

  if (!admin) {
    return <Alert severity="error">You do not have permission to view this page.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Template Description</Typography>
      <Grid container spacing={2} alignItems="stretch" sx={{ mb: 3, minHeight: 0, height: 'auto' }}>
        <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} ref={leftPaperRef}>
            <Stack spacing={2} direction="column" sx={{ width: '100%', flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Keyword Filter</Typography>
              <Grid container spacing={2} sx={{ width: '100%' }}>
                {/* Master Template Dropdown */}
                <Grid item xs={12}>
                    {/* Master template selection dropdown removed: only a single master template is supported. */}
                </Grid>
                {/* Existing filters */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="event-type-label">Event Type</InputLabel>
                    <Select
                      labelId="event-type-label"
                      value={eventType}
                      label="Event Type"
                      onChange={e => setEventType(e.target.value)}
                    >
                      {['Wedding', 'Reception', 'Birthday'].map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="buyer-pdf-type-label">Buyer PDF Type</InputLabel>
                    <Select
                      labelId="buyer-pdf-type-label"
                      value={buyerPdfType}
                      label="Buyer PDF Type"
                      onChange={e => setBuyerPdfType(e.target.value)}
                    >
                      {buyerPdfTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="style-label">Style</InputLabel>
                    <Select
                      labelId="style-label"
                      value={style}
                      label="Style"
                      onChange={e => setStyle(e.target.value)}
                    >
                      {styles.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="audience-label">Audience</InputLabel>
                    <Select
                      labelId="audience-label"
                      value={audience}
                      label="Audience"
                      onChange={e => setAudience(e.target.value)}
                    >
                      {audiences.map(a => (
                        <MenuItem key={a} value={a}>{a}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="region-label">Region</InputLabel>
                    <Select
                      labelId="region-label"
                      value={region}
                      label="Region"
                      onChange={e => setRegion(e.target.value)}
                    >
                      {regions.map(r => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Grid item xs={12}></Grid>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} ref={rightPaperRef}>
            <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
              <Box sx={{ minHeight: 200, maxHeight: 500, overflowY: 'auto', width: '100%', border: '1px solid #ccc', borderRadius: 2, p: 2, background: '#fff', boxSizing: 'border-box' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', fontSize: '1rem' }}>{getPreviewBody()}</pre>
              </Box>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(getPreviewBody());
                  }
                }}
              >
                Copy Description
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h6" sx={{ mt: 4 }}>Edit Master Template</Typography>
      <Box sx={{ border: '1px solid #bbb', borderBottom: '2px solid #333', borderRadius: 1, mt: 1, p: 2 }}>
        <TextField
          label="Master Template Body"
          value={masterTemplateBody}
          onChange={e => setMasterTemplateBody(e.target.value)}
          fullWidth
          multiline
          minRows={10}
        />
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={async () => {
            try {
              const res = await fetch('/api/template-descriptions/master', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateBody: masterTemplateBody })
              });
              if (res.ok) {
                setMasterEditSuccess('Master template updated.');
              } else {
                setMasterEditError('Failed to update master template.');
              }
            } catch {
              setMasterEditError('Failed to update master template.');
            }
          }}
        >
          Save Master Template
        </Button>
        {masterEditError && <Alert severity="error" sx={{ mt: 2 }}>{masterEditError}</Alert>}
        {masterEditSuccess && <Alert severity="success" sx={{ mt: 2 }}>{masterEditSuccess}</Alert>}
      </Box>

      {/* No Add/Edit Template form: only master template editing and preview/copy UI remain */}

      {/* Edit section removed: unified with Add/Edit form above */}
    </Box>
  );
}
