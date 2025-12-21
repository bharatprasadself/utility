
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
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  // Add/Edit mode state for unified form
  const [editTemplateId, setEditTemplateId] = useState<number|null>(null);
  const [masterEditSuccess, setMasterEditSuccess] = useState<string|null>(null);
  const [masterEditError, setMasterEditError] = useState<string|null>(null);
  const [region, setRegion] = useState('India');
  // Dropdown for selecting master template
  const [selectedMasterId, setSelectedMasterId] = useState<number|null>(null);

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

  // API helpers
  // Find the template for the current filter combination
  function findTemplateForFilters() {
    return allTemplates.find(t =>
      t.eventType === eventType &&
      t.style === style &&
      t.audience === audience &&
      t.buyerPdfType === buyerPdfType &&
      t.region === region
    );
  }

  // Generate preview for the selected combination
  function getPreviewBody() {
    // If a master template is selected, use it for preview (with placeholders replaced)
    let template = null;
    if (selectedMasterId) {
      template = allTemplates.find(t => t.id === selectedMasterId);
    } else {
      template = findTemplateForFilters();
    }
    if (!template) return 'No template for this combination.';
    let body = template.templateBody || '';
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


  // Fetch all master template variations
  const fetchAllTemplates = async () => {
    try {
      const res = await fetch('/api/template-descriptions');
      if (res.ok) {
        setAllTemplates(await res.json());
      }
    } catch {}
  };

  // Add new master template variation

  // Delete a master template variation

  // State for new template variation
  function defaultNewTemplate() {
    return {
      templateBody: ''
    };
  }
  const [newTemplate, setNewTemplate] = useState(defaultNewTemplate());



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
      <Grid container spacing={2} alignItems="stretch" sx={{ mb: 3, minHeight: 0, height: 'auto' }}>
        <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} ref={leftPaperRef}>
            <Stack spacing={2} direction="column" sx={{ width: '100%', flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Keyword Filter</Typography>
              <Grid container spacing={2} sx={{ width: '100%' }}>
                {/* Master Template Dropdown */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="master-template-label">Select Master Template</InputLabel>
                    <Select
                      labelId="master-template-label"
                      value={selectedMasterId ?? ''}
                      label="Select Master Template"
                      onChange={e => {
                        const id = e.target.value === '' ? null : Number(e.target.value);
                        setSelectedMasterId(id);
                        // Do not load the selected master template into the Add/Edit Template box
                      }}
                    >
                      <MenuItem value="">-- None --</MenuItem>
                      {allTemplates.map(t => (
                        <MenuItem key={t.id} value={t.id}>Template #{t.id}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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

      <Typography variant="h6" sx={{ mt: 4 }}>Master Template Variations</Typography>
      <Box sx={{
        maxHeight: 320,
        border: '1px solid #bbb',
        borderBottom: '2px solid #333',
        borderRadius: 1,
        mt: 1,
        position: 'relative',
        pb: 0,
        minHeight: 120,
      }}>
        {selectedMasterId ? (
          <>
            <Box sx={{
              maxHeight: 264,
              overflow: 'auto',
              pr: 1,
              pb: 7,
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: 6, border: '1px solid #eee' }}>Template Body</th>
                  </tr>
                </thead>
                <tbody>
                  {allTemplates.filter(t => t.id === selectedMasterId).map(t => (
                    <tr key={t.id}>
                      <td style={{ padding: 6, border: '1px solid #eee' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{t.templateBody}</pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
            {/* Edit button absolutely at the bottom, outside scrollable area */}
            {allTemplates.some(t => t.id === selectedMasterId) && (
              <Box sx={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                background: '#fff',
                zIndex: 2,
                p: 1,
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'flex-start',
              }}>
                <Button size="small" variant="outlined" onClick={() => {
                  const t = allTemplates.find(t => t.id === selectedMasterId);
                  if (t) {
                    setNewTemplate({ templateBody: t.templateBody });
                    setEditTemplateId(t.id);
                    setMasterEditSuccess(null);
                    setMasterEditError(null);
                  }
                }}>Edit</Button>
              </Box>
            )}
          </>
        ) : (
          <Typography sx={{ p: 2 }} color="text.secondary">Select a Master Template to view its details.</Typography>
        )}
      </Box>

      {/* Unified Add/Edit Template form */}
      <Box sx={{ mt: 3, mb: 2, border: '1px solid #eee', borderRadius: 1, p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>{editTemplateId ? 'Edit Template' : 'Add Template'} for Current Filters</Typography>
        <TextField
          label="Template Body"
          value={newTemplate.templateBody}
          onChange={e => setNewTemplate(nt => ({ ...nt, templateBody: e.target.value }))}
          fullWidth
          multiline
          minRows={4}
          size="small"
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={async () => {
              if (editTemplateId) {
                // Edit mode: update existing
                try {
                  const res = await fetch(`/api/template-descriptions/${editTemplateId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      eventType,
                      style,
                      audience,
                      buyerPdfType,
                      region,
                      templateBody: newTemplate.templateBody
                    })
                  });
                  if (res.ok) {
                    setMasterEditSuccess('Template updated.');
                    setNewTemplate(defaultNewTemplate());
                    setEditTemplateId(null);
                    fetchAllTemplates();
                  } else {
                    setMasterEditError('Failed to update template.');
                  }
                } catch {
                  setMasterEditError('Failed to update template.');
                }
              } else {
                // Add mode: create new
                try {
                  const res = await fetch('/api/template-descriptions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      eventType,
                      style,
                      audience,
                      buyerPdfType,
                      region,
                      templateBody: newTemplate.templateBody
                    })
                  });
                  if (res.ok) {
                    setMasterEditSuccess('New template added.');
                    setNewTemplate(defaultNewTemplate());
                    fetchAllTemplates();
                  } else {
                    setMasterEditError('Failed to add template.');
                  }
                } catch {
                  setMasterEditError('Failed to add template.');
                }
              }
            }}
          >
            {editTemplateId ? 'Update Template' : 'Add Template'}
          </Button>
          {editTemplateId && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                setEditTemplateId(null);
                setNewTemplate(defaultNewTemplate());
                setMasterEditError(null);
                setMasterEditSuccess(null);
              }}
            >
              Cancel
            </Button>
          )}
        </Stack>
        {masterEditError && <Alert severity="error" sx={{ mt: 2 }}>{masterEditError}</Alert>}
        {masterEditSuccess && <Alert severity="success" sx={{ mt: 2 }}>{masterEditSuccess}</Alert>}
      </Box>

      {/* Edit section removed: unified with Add/Edit form above */}
    </Box>
  );
}
