
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Alert, CircularProgress, Select, MenuItem, FormControl } from '@mui/material';
import axios, { API_BASE_URL } from '@/services/axiosConfig';


const TemplateMockupSetUI: React.FC = () => {

  // New: Style selection (used for upload and listing)
  const [selectedStyle, setSelectedStyle] = useState<string>('wedding');

  // For adding a new mockup when list is empty
  const [newMockupFile, setNewMockupFile] = useState<File | null>(null);
  const [addingNew, setAddingNew] = useState(false);
    // Handler for uploading a new mockup when list is empty
    const handleAddNewMockup = async () => {
      if (!newMockupFile) return;
      setAddingNew(true);
      setUploadSuccess(null);
      setUploadError(null);
      const formData = new FormData();
      formData.append('file', newMockupFile);
      // Add mockupType field (dynamic: mobile, secondary, or primary)
      let mockupType = 'primary';
      const nameLc = newMockupFile.name.toLowerCase();
      if (nameLc.includes('mobile')) mockupType = 'mobile';
      else if (nameLc.includes('secondary')) mockupType = 'secondary';
      formData.append('mockupType', mockupType);
      // Include event style to segregate storage by style on backend
      formData.append('style', selectedStyle);
      try {
        await axios.post('/api/mockup-upload/master', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadSuccess(`Uploaded successfully!`);
        setNewMockupFile(null);
        // Reset file input value to allow re-uploading the same file if needed
        const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
        if (fileInput) fileInput.value = '';
        // Refresh the list
        axios.get('/api/master-mockups').then(res => {
          const allNames = [...(res.data.primary || []), ...(res.data.mobile || [])];
          setMasterMockups(allNames);
          if (allNames.length > 0) setSelectedMockup(allNames[0]);
        });
      } catch (err: any) {
        setUploadError(`Failed to upload`);
      } finally {
        setAddingNew(false);
      }
    };
  // Removed unused uploading state
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
    // Upload handler for each mockup
  // Removed unused handleUploadMockup
  const [masterMockups, setMasterMockups] = useState<string[]>([]);
  const [selectedMockup, setSelectedMockup] = useState<string | null>(null);
    // Fetch master mockups on mount
    useEffect(() => {
      axios.get('/api/master-mockups', { params: { style: selectedStyle } }).then(res => {
        let allNames: string[] = [];
        if (Array.isArray(res.data)) {
          allNames = res.data.filter((v: any) => typeof v === 'string');
        } else if (typeof res.data === 'object' && res.data !== null) {
          Object.values(res.data).forEach(val => {
            if (Array.isArray(val)) {
              allNames.push(...val.filter((v: any) => typeof v === 'string'));
            }
          });
        }
        // Remove duplicates and falsy values
        allNames = Array.from(new Set(allNames)).filter(Boolean);
        setMasterMockups(allNames);
        if (allNames.length > 0) setSelectedMockup(allNames[0]);
        else setSelectedMockup(null);
      }).catch(() => {
        setMasterMockups([]);
        setSelectedMockup(null);
      });
    }, [selectedStyle]);
  const [productFile, setProductFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [selectedMockupUrl, setSelectedMockupUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load selected mockup image when dropdown changes
  useEffect(() => {
    if (selectedMockup) {
      setSelectedMockupUrl(`${API_BASE_URL}/api/master-mockups/${encodeURIComponent(selectedMockup)}`);
    } else {
      setSelectedMockupUrl(null);
    }
    // Clear resultUrl when selectedMockup changes
    setResultUrl(null);
  }, [selectedMockup]);

  // Removed unused handleUploadFileChange
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProductFile(e.target.files[0]);
    }
  };


  const handleMerge = async () => {
    if (!selectedMockup || !productFile) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      // Fetch the selected mockup image as a Blob
      const mockupResponse = await fetch(`${API_BASE_URL}/api/master-mockups/${encodeURIComponent(selectedMockup)}`);
      if (!mockupResponse.ok) throw new Error('Failed to fetch mockup image.');
      const mockupBlob = await mockupResponse.blob();
      const formData = new FormData();
      formData.append('mockup', mockupBlob, selectedMockup);
      formData.append('product', productFile);
      // Add mockupType for backend logic (dynamic: mobile, secondary, or primary)
      let derivedMockupType = 'primary';
      const selectedMockupLc = selectedMockup.toLowerCase();
      if (selectedMockupLc.includes('mobile')) derivedMockupType = 'mobile';
      else if (selectedMockupLc.includes('secondary')) derivedMockupType = 'secondary';
      formData.append('mockupType', derivedMockupType);
      // Extract version from master mockup filename (e.g., V1, V2, V3). Do not send to backend.
      let version = 'V1';
      const versionMatch = selectedMockup.match(/v\d+/i);
      if (versionMatch) {
        version = versionMatch[0].toUpperCase();
      }
      // Add style parameter from dropdown
      formData.append('style', selectedStyle);
      // Store for download filename
      setMergedMockupType(derivedMockupType);
      const res = await axios.post('/api/mockup-image/merge', formData, {
        responseType: 'blob',
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const blob = new Blob([res.data], { type: 'image/png' });
      const url = window.URL.createObjectURL(blob);
      setResultUrl(url);

      // Try to read filename from Content-Disposition; else compute locally
      const cd = (res.headers && (res.headers['content-disposition'] as string)) || '';
      let serverName: string | null = null;
      if (cd) {
        const match = cd.match(/filename="?([^";]+)"?/i);
        if (match && match[1]) serverName = match[1];
      }

      const base = deriveBaseNameFromMockup(selectedMockup);
      const roleLabel = roleLabelFromType(derivedMockupType);
      const variantLabel = (version || 'V1').toUpperCase();
      const indexLabel = extractIndexFromProduct(productFile.name);
      const nsIndex = `NSL${indexLabel}`;
      const computedName = baseContainsRoleToken(base, roleLabel)
        ? `${base}_${variantLabel}_${nsIndex}.png`
        : `${base}_${roleLabel}_${variantLabel}_${nsIndex}.png`;
      setDownloadName(serverName || computedName);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to merge images.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    let fileName = downloadName || (() => {
      const type = mergedMockupType || 'primary';
      return 'Mockup_Image_' + type.charAt(0).toUpperCase() + type.slice(1) + '.png';
    })();
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  // New: Download selected master mockup in new tab
  const handleDownloadSelectedMockup = () => {
    if (!selectedMockupUrl || !selectedMockup) return;
    const a = document.createElement('a');
    a.href = selectedMockupUrl;
    a.download = selectedMockup;
    a.target = '_blank'; // Open in new tab if browser allows, but still trigger download
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  // Track merged mockup type for download filename
  const [mergedMockupType, setMergedMockupType] = useState<string>('primary');
  const [downloadName, setDownloadName] = useState<string | null>(null);

  function sanitizeForFile(s: string | null | undefined): string {
    const fallback = 'Mockup_Image';
    if (!s) return fallback;
    const r = s.trim().replace(/\s+/g, '_').replace(/[^A-Za-z0-9_\-]/g, '');
    return r.length ? r : fallback;
  }
  function deriveBaseNameFromMockup(name: string): string {
    const noExt = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;
    let stripped = noExt.replace(/_(?:[PM])\d+$/i, '');
    stripped = stripped.replace(/_V\d+$/i, '');
    return sanitizeForFile(stripped || noExt);
  }
  function roleLabelFromType(mockupType: string): string {
    const mt = (mockupType || '').toLowerCase();
    if (mt === 'mobile') return 'Mobile';
    if (mt === 'secondary') return 'Secondary';
    return 'Primary';
  }
  function baseContainsRoleToken(base: string, roleLabel: string): boolean {
    if (!base || !roleLabel) return false;
    return base.split('_').some(t => t.toLowerCase() === roleLabel.toLowerCase());
  }
  function extractIndexFromProduct(filename: string): string {
    const noExt = filename && filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : (filename || '');
    const m = noExt.match(/(\d+)$/);
    if (m && m[1]) {
      const d = m[1];
      return d.length === 1 ? '0' + d : d;
    }
    return '01';
  }

    return (
  <Box
    display="flex"
    flexDirection={{ xs: 'column', md: 'row' }}
    justifyContent="center"
    alignItems="flex-start"
    mt={6}
  >
    {/* LEFT COLUMN */}
    <Box sx={{ width: 600, minWidth: 400, maxWidth: 700, mr: { md: 4, xs: 0 } }}>
      {/* Controls */}
      <Box
        width="100%"
        p={3}
        boxShadow={2}
        borderRadius={2}
        bgcolor="#fff"
        mb={{ xs: 3, md: 0 }}
      >
      <Typography variant="h5" gutterBottom>
          Mockup Image Merger
        </Typography>
                {/* Style selection dropdown */}
                <Box mb={2}>
                  <Typography variant="subtitle1">Select Event Style</Typography>
                  <FormControl fullWidth>
                    <Select
                      value={selectedStyle}
                      onChange={e => setSelectedStyle(e.target.value as string)}
                    >
                      <MenuItem value="wedding">Wedding</MenuItem>
                      <MenuItem value="birthday">Birthday</MenuItem>
                      <MenuItem value="anniversary">Anniversary</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
        

        {/* Dropdown */}
        <Box mb={2}>
          <Typography variant="subtitle1">Select Master Mockup</Typography>          
          <Select
            fullWidth
            value={selectedMockup || ''}
            onChange={e => setSelectedMockup(e.target.value as string)}
            displayEmpty
          >
            {masterMockups.map(name => (
              <MenuItem key={name} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </Box>




        {/* Product upload */}
        <Box mb={2}>
          <Button variant="outlined" component="label" sx={{ mb: 2 }}>
            Select Product Image
            <input type="file" hidden accept="image/*" onChange={handleProductChange} />
          </Button>
          {productFile && <Typography>{productFile.name}</Typography>}
        </Box>

        <Button
          variant="contained"
          disabled={!selectedMockup || !productFile || loading}
          onClick={handleMerge}
          startIcon={loading ? <CircularProgress size={18} /> : undefined}
          sx={{ mb: 2 }}
        >
          Merge & Preview
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          onClick={handleDownload}
          disabled={!resultUrl}
          sx={{ mb: 2 }}
        >
          Download Mockup
        </Button>
        {/* New: Download selected master mockup button */}
        <Button
          variant="outlined"
          color="primary"
          onClick={handleDownloadSelectedMockup}
          disabled={!selectedMockupUrl}
          sx={{ mb: 2, ml: 2 }}
        >
          Download Selected Master Mockup
        </Button>

        {error && <Alert severity="error">{error}</Alert>}
      </Box>

      {/* Upload / Update Master Mockups */}
      <Box
        width="100%"
        p={3}
        boxShadow={2}
        borderRadius={2}
        bgcolor="#f9f9f9"
        mt={2}
      >
        <Typography variant="h6">Upload / Update Master Mockups</Typography>
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <Button variant="outlined" component="label" disabled={addingNew}>
            Select File
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={e => setNewMockupFile(e.target.files?.[0] || null)}
            />
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!newMockupFile || addingNew}
            onClick={handleAddNewMockup}
          >
            {addingNew ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>
        {newMockupFile && (
          <Typography variant="body2" sx={{ mt: 1, ml: 1 }}>
            {newMockupFile.name}
          </Typography>
        )}
        {uploadSuccess && <Alert severity="success" sx={{ mt: 2 }}>{uploadSuccess}</Alert>}
        {uploadError && <Alert severity="error" sx={{ mt: 2 }}>{uploadError}</Alert>}
      </Box>
    </Box>

    {/* RIGHT COLUMN */}
    {selectedMockupUrl && !resultUrl && (
      <Box p={3} boxShadow={2} borderRadius={2} bgcolor="#fff">
        <Typography>Selected Mockup Preview</Typography>
        <img src={selectedMockupUrl} key={selectedMockupUrl} style={{ maxWidth: '100%' }} />
      </Box>
    )}

    {resultUrl && (
      <Box p={3} boxShadow={2} borderRadius={2} bgcolor="#fff">
        <Typography>
          {mergedMockupType === 'mobile'
            ? 'Mobile Mockup Image Preview'
            : mergedMockupType === 'secondary'
            ? 'Secondary Mockup Image Preview'
            : 'Primary Mockup Image Preview'}
        </Typography>
        <img src={resultUrl} style={{ maxWidth: '100%' }} />
      </Box>
    )}
  </Box>
);
}
export default TemplateMockupSetUI;
