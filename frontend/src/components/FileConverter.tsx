import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography,
    CircularProgress,
    Alert,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { getConversionFormats, convertFile } from '../services/fileConverter';

const FileConverter: React.FC = () => {
    const [supportedFormats, setSupportedFormats] = useState<string[][]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sourceFormat, setSourceFormat] = useState<string>('');
    const [targetFormat, setTargetFormat] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<boolean>(false);

    useEffect(() => {
        loadSupportedFormats();
    }, []);

    const loadSupportedFormats = async () => {
        try {
            const formats = await getConversionFormats();
            setSupportedFormats(formats);
        } catch (err) {
            setError('Failed to load supported formats');
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFile(file);
            
            // Auto-detect format from file extension
            const extension = file.name.split('.').pop()?.toLowerCase() || '';
            if (extension) {
                setSourceFormat(extension);
            }
        }
    };

    const handleSourceFormatChange = (event: SelectChangeEvent<string>) => {
        setSourceFormat(event.target.value);
    };

    const handleTargetFormatChange = (event: SelectChangeEvent<string>) => {
        setTargetFormat(event.target.value);
    };

    const getTargetFormats = () => {
        if (!sourceFormat) return [];
        const formats = supportedFormats.find(format => format[0] === sourceFormat);
        return formats ? [formats[1]] : [];
    };

    const handleConvert = async () => {
        if (!selectedFile || !sourceFormat || !targetFormat) {
            setError('Please select a file and conversion formats');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const convertedFile = await convertFile(selectedFile, sourceFormat, targetFormat);
            
            // Create download link
            const filename = selectedFile.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat;
            const url = window.URL.createObjectURL(new Blob([convertedFile], { type: 'application/octet-stream' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            setSuccess(true);
            setSelectedFile(null); // Reset file selection
        } catch (err) {
            setError('Failed to convert file');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ py: 2 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" component="div" gutterBottom>
                    File Converter
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        File converted successfully!
                    </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant="outlined"
                        component="label"
                        startIcon={<FileUploadIcon />}
                        sx={{ width: '100%' }}
                    >
                        {selectedFile ? selectedFile.name : 'Choose File'}
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Button>

                    <FormControl fullWidth>
                        <InputLabel>Source Format</InputLabel>
                        <Select
                            value={sourceFormat}
                            label="Source Format"
                            onChange={handleSourceFormatChange}
                        >
                            {supportedFormats.map(format => (
                                <MenuItem key={format[0]} value={format[0]}>
                                    {format[0].toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Target Format</InputLabel>
                        <Select
                            value={targetFormat}
                            label="Target Format"
                            onChange={handleTargetFormatChange}
                        >
                            {getTargetFormats().map(format => (
                                <MenuItem key={format} value={format}>
                                    {format.toUpperCase()}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={handleConvert}
                        disabled={!selectedFile || !sourceFormat || !targetFormat || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
                    >
                        {loading ? 'Converting...' : 'Convert'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default FileConverter;