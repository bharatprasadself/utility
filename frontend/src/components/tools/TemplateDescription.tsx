
import { useState, useEffect, useRef } from 'react';
import { Box, Typography, Alert, FormControl, InputLabel, Select, MenuItem, Button, TextField, Stack, Grid, Paper } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export default function TemplateDescription() {
  // State variables
  const [buyerPdfType] = useState('Print Only');
  const buyerPdfTypes = ['Print Only', 'Mobile & Print', 'Invite Suite'];
  const leftPaperRef = useRef<HTMLDivElement>(null);
  const rightPaperRef = useRef<HTMLDivElement>(null);
  const [balancedHeight, setBalancedHeight] = useState<number|undefined>(undefined);
  const [eventType, setEventType] = useState('Wedding');
  const [style, setStyle] = useState('Traditional');
  const [audience, setAudience] = useState('All');
  const [templateBody, setTemplateBody] = useState('');
  const [templateId, setTemplateId] = useState<number|null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [allTemplates, setAllTemplates] = useState<any[]>([]);
  const [region] = useState('India');

  // Use ResizeObserver for dynamic height sync
  useEffect(() => {
    if (!leftPaperRef.current || !rightPaperRef.current) return;
    const updateHeight = () => {
      const left = leftPaperRef.current?.offsetHeight || 0;
      const right = rightPaperRef.current?.offsetHeight || 0;
      const max = Math.max(left, right);
      setBalancedHeight(max > 0 ? max : undefined);
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
  }, [eventType, style, audience, region, saving, error, success, templateBody]);


  const { isAdmin } = useAuth();
  const admin = isAdmin();
  const styles = ['Traditional', 'Minimal', 'Floral', 'Modern', 'Kids', 'Other'];
  const audiences = ['Kids', 'Adults', 'All'];
  const regions = ['India', 'Other Countries'];

  // API helpers
  const fetchTemplate = async (eventType: string, style: string, audience: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setTemplateBody('');
    setTemplateId(null);
    try {
      const res = await fetch(`/api/template-descriptions/search?eventType=${encodeURIComponent(eventType)}&style=${encodeURIComponent(style)}&audience=${encodeURIComponent(audience)}`);
      if (res.ok) {
        const data = await res.json();
        setTemplateBody(data.templateBody || '');
        setTemplateId(data.id);
      } else {
        setTemplateBody('');
        setTemplateId(null);
      }
    } catch (e: any) {
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        eventType, style, audience, templateBody, buyerPdfType
      };
      let res;
      if (templateId) {
        res = await fetch(`/api/template-descriptions/${templateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/template-descriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      if (res.ok) {
        setSuccess('Template saved');
        fetchAllTemplates();
        fetchTemplate(eventType, style, audience);
      } else {
        setError('Failed to save template');
      }
    } catch (e: any) {
      setError('Failed to save template');
    } finally {
      setSaving(false);
    }
  };


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
    fetchTemplate(eventType, style, audience);
  }, [eventType, style, audience]);

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
        <Grid item xs={12} md={6}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, minHeight: balancedHeight }} ref={leftPaperRef}>
            <Stack spacing={2} direction="column" sx={{ width: '100%' }}>
              <Grid container spacing={2} sx={{ width: '100%' }}>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled>
                    <InputLabel id="event-type-label">Event Type</InputLabel>
                    <Select
                      labelId="event-type-label"
                      value={eventType}
                      label="Event Type"
                      onChange={() => {}}
                    >
                      {['Wedding', 'Reception', 'Birthday'].map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled>
                    <InputLabel id="buyer-pdf-type-label">Buyer PDF Type</InputLabel>
                    <Select
                      labelId="buyer-pdf-type-label"
                      value={buyerPdfType}
                      label="Buyer PDF Type"
                      onChange={() => {}}
                    >
                      {buyerPdfTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled>
                    <InputLabel id="style-label">Style</InputLabel>
                    <Select
                      labelId="style-label"
                      value={style}
                      label="Style"
                      onChange={() => {}}
                    >
                      {styles.map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled>
                    <InputLabel id="audience-label">Audience</InputLabel>
                    <Select
                      labelId="audience-label"
                      value={audience}
                      label="Audience"
                      onChange={() => {}}
                    >
                      {audiences.map(a => (
                        <MenuItem key={a} value={a}>{a}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth disabled>
                    <InputLabel id="region-label">Region</InputLabel>
                    <Select
                      labelId="region-label"
                      value={region}
                      label="Region"
                      onChange={() => {}}
                    >
                      {regions.map(r => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button variant="contained" onClick={saveTemplate} disabled={saving || loading || !templateId}>
                    {saving ? 'Saving...' : 'Update'}
                  </Button>
                  {templateId && (
                    <Typography variant="body2" color="success.main">Record already exists</Typography>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}
              </Grid>
            </Grid>
            </Stack>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ width: '100%', alignItems: 'flex-start', p: 2, minHeight: balancedHeight }} ref={rightPaperRef}>
            <Stack spacing={2}>
              <TextField
                label="Template Body (use {{eventType}}, {{style}}, {{audience}} as placeholders)"
                value={templateBody}
                onChange={e => setTemplateBody(e.target.value)}
                multiline
                minRows={18}
                fullWidth
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Import Template
                  <input
                    type="file"
                    accept=".txt"
                    hidden
                    onChange={async (e) => {
                      const file = e.target.files && e.target.files[0];
                      if (file) {
                        const text = await file.text();
                        setTemplateBody(text);
                      }
                    }}
                  />
                </Button>
                <Typography variant="body2" color="text.secondary">.txt file</Typography>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
      <Typography variant="h6" sx={{ mt: 4 }}>All Templates</Typography>
      <Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, mt: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: 6, border: '1px solid #eee' }}>Event Type</th>
              <th style={{ padding: 6, border: '1px solid #eee' }}>Style</th>
              <th style={{ padding: 6, border: '1px solid #eee' }}>Audience</th>
              <th style={{ padding: 6, border: '1px solid #eee' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allTemplates.map(t => (
              <tr key={t.id}>
                <td style={{ padding: 6, border: '1px solid #eee' }}>{t.eventType}</td>
                <td style={{ padding: 6, border: '1px solid #eee' }}>{t.style}</td>
                <td style={{ padding: 6, border: '1px solid #eee' }}>{t.audience}</td>
                <td style={{ padding: 6, border: '1px solid #eee' }}>
                  <Button size="small" variant="outlined" onClick={() => {
                    setEventType(t.eventType);
                    setStyle(t.style);
                    setAudience(t.audience);
                  }}>Edit</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Box>
  );
}
