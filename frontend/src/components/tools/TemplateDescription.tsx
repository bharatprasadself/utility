

import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '@/services/axiosConfig';
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
  // Multi-master mockup state
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<number|null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [editSuccess, setEditSuccess] = useState<string|null>(null);
  const [editError, setEditError] = useState<string|null>(null);
  const [isNew, setIsNew] = useState(false);

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
  const styles = ['Traditional', 'Minimal', 'Floral', 'Modern', 'Kids', 'Rustic', 'Boho', 'Cartoon'];
  const audiences = ['Kids', 'Adults', 'All'];
  const regions = ['India', 'Other Countries'];

  // Generate preview for the selected combination
  function getPreviewTitle() {
    return templateTitle
      .replace(/\{\{eventType\}\}/g, eventType)
      .replace(/\{\{style\}\}/g, style)
      .replace(/\{\{buyerPdfType\}\}/g, buyerPdfType);
  }

  function getPreviewBody() {
    let body = templateBody || '';
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

  // Fetch all template descriptions
  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/template-descriptions`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        // Select first by default if none selected
        if (data.length && selectedId == null) {
          handleSelect(data[0].id, data[0]);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line
  }, []);

  // Select a template for editing/viewing
  const [isBirthdayTemplate, setIsBirthdayTemplate] = useState(false);
  const [isWeddingTemplate, setIsWeddingTemplate] = useState(false);
  const handleSelect = (id: number|null, t?: any) => {
    setSelectedId(id);
    setIsNew(false);
    let name = '', title = '', desc = '';
    let birthday = false, wedding = false;
    if (t) {
      name = t.name || '';
      title = t.title || '';
      desc = t.description || '';
    } else if (id != null) {
      const found = templates.find(tmp => tmp.id === id);
      name = found?.name || '';
      title = found?.title || '';
      desc = found?.description || '';
    }
    setTemplateName(name);
    setTemplateTitle(title);
    setTemplateBody(desc);
    // Auto-select and disable logic for Birthday and Wedding
    birthday = typeof title === 'string' && title.toLowerCase().includes('birthday');
    wedding = typeof title === 'string' && title.toLowerCase().includes('wedding');
    setIsBirthdayTemplate(birthday);
    setIsWeddingTemplate(wedding);
    if (birthday) {
      setEventType('Birthday');
      setStyle('Kids');
      setAudience('Kids');
    } else if (wedding) {
      setEventType('Wedding');
      setStyle('Traditional');
      setAudience('Adults');
    }
    setEditSuccess(null);
    setEditError(null);
  };

  // Add new template mode
  const handleAddNew = () => {
    setSelectedId(null);
    setIsNew(true);
    setTemplateName('');
    setTemplateTitle('');
    setTemplateBody('');
    setEditSuccess(null);
    setEditError(null);
  };

  // Save (create or update)
  const handleSave = async () => {
    try {
      setEditError(null);
      setEditSuccess(null);
      const payload = { name: templateName, title: templateTitle, description: templateBody };
      let res;
      if (isNew) {
        res = await fetch(`${API_BASE_URL}/api/template-descriptions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else if (selectedId != null) {
        res = await fetch(`${API_BASE_URL}/api/template-descriptions/${selectedId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (res && res.ok) {
        setEditSuccess(isNew ? 'Template created.' : 'Template updated.');
        fetchTemplates();
      } else {
        setEditError('Failed to save template.');
      }
    } catch {
      setEditError('Failed to save template.');
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!selectedId) return;
    if (!window.confirm('Delete this template description?')) return;
    try {
      setEditError(null);
      setEditSuccess(null);
      const res = await fetch(`${API_BASE_URL}/api/template-descriptions/${selectedId}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        setEditSuccess('Template deleted.');
        setSelectedId(null);
        setIsNew(false);
        setTemplateName('');
        setTemplateTitle('');
        setTemplateBody('');
        fetchTemplates();
      } else {
        setEditError('Failed to delete template.');
      }
    } catch {
      setEditError('Failed to delete template.');
    }
  };

  if (!admin) {
    return <Alert severity="error">You do not have permission to view this page.</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Template Descriptions</Typography>
      <Grid container spacing={2} alignItems="stretch" sx={{ mb: 3, minHeight: 0, height: 'auto' }}>
        <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} ref={leftPaperRef}>
            <Stack spacing={2} direction="column" sx={{ width: '100%', flex: 1 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Templates</Typography>
              <Button variant="outlined" size="small" sx={{ mb: 1 }} onClick={handleAddNew}>Add New</Button>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="template-select-label">Select Template</InputLabel>
                <Select
                  labelId="template-select-label"
                  value={selectedId ?? ''}
                  label="Select Template"
                  onChange={e => {
                    const id = e.target.value ? Number(e.target.value) : null;
                    handleSelect(id);
                  }}
                >
                  {templates.map(t => (
                    <MenuItem key={t.id} value={t.id}>{t.name || t.title || `Template #${t.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {/* Existing filters */}
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="event-type-label">Event Type</InputLabel>
                <Select
                  labelId="event-type-label"
                  value={eventType}
                  label="Event Type"
                  onChange={e => setEventType(e.target.value)}
                  disabled={isBirthdayTemplate || isWeddingTemplate}
                >
                  {['Wedding', 'Reception', 'Birthday'].map(type => (
                    <MenuItem key={type} value={type}
                      disabled={
                        (isBirthdayTemplate && type !== 'Birthday') ||
                        (isWeddingTemplate && type === 'Birthday')
                      }
                    >
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
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
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="style-label">Style</InputLabel>
                <Select
                  labelId="style-label"
                  value={style}
                  label="Style"
                  onChange={e => setStyle(e.target.value)}
                  disabled={isBirthdayTemplate || isWeddingTemplate}
                >
                  {styles.map(s => (
                    <MenuItem key={s} value={s}
                      disabled={
                        (isBirthdayTemplate && s !== 'Kids') ||
                        (isWeddingTemplate && s === 'Kids')
                      }
                    >
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="audience-label">Audience</InputLabel>
                <Select
                  labelId="audience-label"
                  value={audience}
                  label="Audience"
                  onChange={e => {
                    const newAudience = e.target.value;
                    setAudience(newAudience);
                    if (newAudience === 'Kids') {
                      setEventType('Birthday');
                    }
                  }}
                  disabled={isBirthdayTemplate || isWeddingTemplate}
                >
                  {audiences.map(a => (
                    <MenuItem key={a} value={a}
                      disabled={
                        (isBirthdayTemplate && a !== 'Kids') ||
                        (isWeddingTemplate && a === 'Kids')
                      }
                    >
                      {a}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth sx={{ mb: 2 }}>
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
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={9} sx={{ display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }} ref={rightPaperRef}>
            <Stack spacing={2} sx={{ flex: 1, width: '100%' }}>
              {/* Template Title Preview Section */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>Preview Title:</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(getPreviewTitle());
                      }
                    }}
                  >
                    Copy Title
                  </Button>
                </Box>
                <Box sx={{ mt: 1, p: 1, border: '1px solid #ccc', borderRadius: 1, background: '#f9f9f9', fontFamily: 'inherit', fontSize: '1rem', wordBreak: 'break-word' }}>
                  {getPreviewTitle()}
                </Box>
              </Box>
              {/* Template Body Section */}
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
      <Typography variant="h6" sx={{ mt: 4 }}>{isNew ? 'Add New Template' : 'Edit Template'}</Typography>
      <Box sx={{ border: '1px solid #bbb', borderBottom: '2px solid #333', borderRadius: 1, mt: 1, p: 2, maxHeight: 400, minHeight: 300, overflowY: 'auto', background: '#fafbfc' }}>
        <TextField
          label="Template Name"
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          fullWidth
          sx={{ mb: 2, background: '#fff' }}
        />
        <TextField
          label="Template Title (with placeholders)"
          value={templateTitle}
          onChange={e => setTemplateTitle(e.target.value)}
          fullWidth
          sx={{ mb: 2, background: '#fff' }}
        />
        <TextField
          label="Template Body"
          value={templateBody}
          onChange={e => setTemplateBody(e.target.value)}
          fullWidth
          multiline
          minRows={10}
          sx={{ maxHeight: 230, overflowY: 'auto', background: '#fff' }}
        />
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleSave}>{isNew ? 'Create' : 'Save'}</Button>
          {!isNew && selectedId && <Button variant="outlined" color="error" onClick={handleDelete}>Delete</Button>}
        </Stack>
        {editError && <Alert severity="error" sx={{ mt: 2 }}>{editError}</Alert>}
        {editSuccess && <Alert severity="success" sx={{ mt: 2 }}>{editSuccess}</Alert>}
      </Box>
    </Box>
  );
}
