import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, List, ListItem, Input, Alert } from '@mui/material';
import axios from '@/services/axiosConfig';

const MasterTemplateMockupEditor: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const res = await axios.get('/api/mockup-upload/master');
      setImages(res.data);
    } catch (err) {
      setImages([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    setSuccess(null);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      await axios.post('/api/mockup-upload/master', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Master template mockup image saved.');
      setSelectedFile(null);
      fetchImages();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box mt={4}>
      <Typography variant="h6" gutterBottom>
        Edit & Save Master Template Mockup Images
      </Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Input type="file" onChange={handleFileChange} disabled={uploading} />
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={uploading || !selectedFile}
          sx={{ ml: 2 }}
        >
          {uploading ? 'Saving...' : 'Save'}
        </Button>
      </Paper>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <Typography variant="subtitle1">Current Master Mockup Images:</Typography>
      <List>
        {images.map((img, idx) => (
          <ListItem key={idx}>{img}</ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MasterTemplateMockupEditor;
