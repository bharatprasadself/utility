
import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Button, TextField, Stack, Grid, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function TemplateDescription() {
  // State variables
  const [buyerPdfType, setBuyerPdfType] = useState('Print Only');
  const buyerPdfTypes = ['Print Only', 'Mobile & Print', 'Invite Suite'];
  const leftPaperRef = useRef<HTMLDivElement>(null);
  const rightPaperRef = useRef<HTMLDivElement>(null);
  // const [balancedHeight, setBalancedHeight] = useState<number|undefined>(undefined); // unused
  const [eventType, setEventType] = useState('Wedding');
  const [style, setStyle] = useState('Traditional');
  const [audience, setAudience] = useState('All');
  const [templateBody, setTemplateBody] = useState('');
  // const [templateId, setTemplateId] = useState<number|null>(null); // unused
  // const [loading, setLoading] = useState(false); // unused
  // ...existing code...
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [masterEditValue, setMasterEditValue] = useState('');
  const [masterEditId, setMasterEditId] = useState<number|null>(null);
  const [masterEditSaving, setMasterEditSaving] = useState(false);
  const [masterEditSuccess, setMasterEditSuccess] = useState<string|null>(null);
  const [masterEditError, setMasterEditError] = useState<string|null>(null);
  const [region, setRegion] = useState('India');

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
  }, [eventType, style, audience, region, error, success, templateBody]);


  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const styles = ['Traditional', 'Minimal', 'Floral', 'Modern', 'Kids', 'Other'];
  const audiences = ['Kids', 'Adults', 'All'];
  const regions = ['India', 'Other Countries'];

  // API helpers
  // Fetch the master template and substitute placeholders dynamically
  const fetchTemplate = async (eventType: string, style: string, audience: string, buyerPdfTypeOverride?: string, _regionOverride?: string) => {

    setError(null);
    setSuccess(null);
    setTemplateBody('');

    try {
      const res = await fetch('/api/template-descriptions');
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          let body = data[0].templateBody || '';
          // Dynamically generate WHAT YOU WILL RECEIVE section
          let whatYouReceive = '';
          const pdfType = buyerPdfTypeOverride || buyerPdfType;
          if (pdfType === 'Invite Suite') {
            whatYouReceive =
              '• Editable {{eventType}} Invitation – Canva Template\n' +
              '• RSVP Card – Canva Template\n' +
              '• Details Card – Canva Template\n' +
              '• Buyer PDF with Canva access link & instructions';
          } else if (pdfType === 'Mobile & Print' || pdfType === 'Print & Mobile') {
            whatYouReceive =
              '• Editable {{eventType}} Invitation – Canva Template\n' +
              '• Mobile Version – Canva Template\n' +
              '• Buyer PDF with Canva access link & instructions';
          } else {
            whatYouReceive =
              '• Editable {{eventType}} Invitation – Canva Template\n' +
              '• Buyer PDF with Canva access link & instructions';
          }
          // Replace the WHAT YOU WILL RECEIVE section
          body = body.replace(/WHAT YOU WILL RECEIVE \(\{\{buyerPdfType\}\}\)[\s\S]*?(-{10,}|EDITING DETAILS)/, (match: string) => {
            // Keep the dashed line or next section header
            const nextSection = match.match(/(-{10,}|EDITING DETAILS)/);
            return `WHAT YOU WILL RECEIVE (${pdfType})\n\n${whatYouReceive}\n\n${nextSection ? nextSection[0] : ''}`;
          });
          // Replace placeholders for preview only
          function getRegionDisplay(region: string) {
            return region === "India" ? "Indian celebrations" : "worldwide use";
          }
          body = body.replace(/\{\{eventType\}\}/g, eventType)
            .replace(/\{\{style\}\}/g, style)
            .replace(/\{\{audience\}\}/g, audience)
            .replace(/\{\{buyerPdfType\}\}/g, pdfType)
            .replace(/\{\{region\}\}/g, getRegionDisplay(region));
          
          setTemplateBody(body);

        } else {
          setTemplateBody('');

        }
      }
    } catch (e: any) {
      setError('Failed to load template');
    } finally {

    }
  };

  // Save only the master template (with placeholders)
  // ...existing code...


  // Only show the master template in the list
  const fetchAllTemplates = async () => {
    try {
      const res = await fetch('/api/template-descriptions');
      if (res.ok) {
        setAllTemplates(await res.json());
      }
    } catch {}
  };

  // Load template when dropdowns change
  useEffect(() => {
    fetchTemplate(eventType, style, audience, buyerPdfType, region);
  }, [eventType, style, audience, buyerPdfType, region]);

  // Optionally, you may want to fetch template when region changes as well, if region is part of template logic

  useEffect(() => {
    fetchAllTemplates();
  }, []);

  if (!admin) {
    return <Alert severity="error">You do not have permission to view this page.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Template Description</Typography>
      <Grid container spacing={2} alignItems="stretch" sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, minHeight: 500, maxHeight: 500 }} ref={leftPaperRef}>
            <Stack spacing={2} direction="column" sx={{ width: '100%' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Keyword Filter</Typography>
              <Grid container spacing={2} sx={{ width: '100%' }}>
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
              {/* Update/Save button removed as saving is not required */}
              <Grid item xs={12}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
              </Grid>
            </Grid>
            </Stack>
          </Paper>
        </Grid>
            <Grid item xs={12} md={9}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, minHeight: 500, maxHeight: 500, display: 'flex', flexDirection: 'column' }} ref={rightPaperRef}>
            <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
              <Box sx={{ height: 400, overflowY: 'auto', width: '100%', border: '1px solid #ccc', borderRadius: 2, p: 2, background: '#fff', boxSizing: 'border-box' }}>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, fontFamily: 'inherit', fontSize: '1rem' }}>{templateBody}</pre>
              </Box>
              <Button
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(templateBody);
                  }
                }}
              >
                Copy Description
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ mt: 4 }}>Master Template (with placeholders)</Typography>
      <Box sx={{ maxHeight: 280, overflow: 'auto', border: '1px solid #bbb', borderBottom: '2px solid #333', borderRadius: 1, mt: 1, pb: 3 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 6, border: '1px solid #eee' }}>Template Body</th>
              <th style={{ padding: 6, border: '1px solid #eee' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTemplates.map(t => (
              <tr key={t.id}>
                <td style={{ padding: 6, border: '1px solid #eee' }}>
                  <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{t.templateBody}</pre>
                </td>
                <td style={{ padding: 6, border: '1px solid #eee' }}>
                  <Button size="small" variant="outlined" onClick={() => {
                    setMasterEditValue(t.templateBody);
                    setMasterEditId(t.id);
                    setMasterEditSuccess(null);
                    setMasterEditError(null);
                  }}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      {masterEditId !== null && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1">Edit Master Template (with placeholders)</Typography>
          <TextField
            label="Master Template Body"
            value={masterEditValue}
            onChange={e => setMasterEditValue(e.target.value)}
            multiline
            minRows={10}
            fullWidth
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={async () => {
              setMasterEditSaving(true);
              setMasterEditSuccess(null);
              setMasterEditError(null);
              try {
                // Find the master template object to get all required fields
                const masterTemplate = allTemplates.find(t => t.id === masterEditId);
                const payload = masterTemplate ? {
                  eventType: masterTemplate.eventType || '{{eventType}}',
                  style: masterTemplate.style || '{{style}}',
                  audience: masterTemplate.audience || '{{audience}}',
                  buyerPdfType: masterTemplate.buyerPdfType || '{{buyerPdfType}}',
                  region: masterTemplate.region || '{{region}}',
                  templateBody: masterEditValue
                } : {
                  eventType: '{{eventType}}',
                  style: '{{style}}',
                  audience: '{{audience}}',
                  buyerPdfType: '{{buyerPdfType}}',
                  region: '{{region}}',
                  templateBody: masterEditValue
                };
                const res = await fetch(`/api/template-descriptions/${masterEditId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                });
                if (res.ok) {
                  setMasterEditSuccess('Master template updated successfully.');
                  fetchAllTemplates();
                  fetchTemplate(eventType, style, audience, buyerPdfType, region);
                } else {
                  setMasterEditError('Failed to update master template.');
                }
              } catch {
                setMasterEditError('Failed to update master template.');
              } finally {
                setMasterEditSaving(false);
              }
            }}
            disabled={masterEditSaving}
          >
            {masterEditSaving ? 'Saving...' : 'Save'}
          </Button>
          {masterEditSuccess && <Alert severity="success" sx={{ mt: 2 }}>{masterEditSuccess}</Alert>}
          {masterEditError && <Alert severity="error" sx={{ mt: 2 }}>{masterEditError}</Alert>}
        </Box>
      )}
    </Box>
  );
}
