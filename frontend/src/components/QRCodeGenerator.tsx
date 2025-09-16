import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Container,
    Paper,
    TextField,
    Typography,
    Slider,
    Stack,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
} from '@mui/material';
import QrCodeIcon from '@mui/icons-material/QrCode';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { generateQRCode } from '../services/qrCode';

const QRCodeGenerator: React.FC = () => {
    const [content, setContent] = useState<string>('');
    const [size, setSize] = useState<number>(300);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [copied, setCopied] = useState<boolean>(false);

    const handleContentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setContent(event.target.value);
    };

    const handleSizeChange = (_event: Event, newValue: number | number[]) => {
        setSize(newValue as number);
    };

    const handleCopyContent = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const generateCode = async () => {
        if (!content) {
            setError('Please enter some content for the QR code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const qrCodeBlob = await generateQRCode({
                content,
                width: size,
                height: size
            });

            // Create URL for preview
            if (qrCodeUrl) {
                URL.revokeObjectURL(qrCodeUrl);
            }
            const newUrl = URL.createObjectURL(qrCodeBlob);
            setQrCodeUrl(newUrl);

        } catch (err) {
            setError('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (qrCodeUrl) {
            const link = document.createElement('a');
            link.href = qrCodeUrl;
            link.download = 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // Cleanup URL on component unmount
    useEffect(() => {
        return () => {
            if (qrCodeUrl) {
                URL.revokeObjectURL(qrCodeUrl);
            }
        };
    }, [qrCodeUrl]);

    return (
        <Container maxWidth="sm" sx={{ py: 2 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" component="div" gutterBottom>
                    QR Code Generator
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {copied && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Content copied to clipboard!
                    </Alert>
                )}

                <TextField
                    fullWidth
                    label="Content for QR Code"
                    multiline
                    rows={4}
                    value={content}
                    onChange={handleContentChange}
                    placeholder="Enter text, URL, or any content to generate QR code"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton
                                    onClick={handleCopyContent}
                                    edge="end"
                                    title="Copy content"
                                >
                                    <ContentCopyIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                <Box>
                    <Typography gutterBottom>
                        QR Code Size: {size}x{size} pixels
                    </Typography>
                    <Slider
                        value={size}
                        onChange={handleSizeChange}
                        min={100}
                        max={1000}
                        step={50}
                        marks={[
                            { value: 100, label: '100px' },
                            { value: 500, label: '500px' },
                            { value: 1000, label: '1000px' },
                        ]}
                        valueLabelDisplay="auto"
                    />
                </Box>

                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        onClick={generateCode}
                        disabled={!content || loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <QrCodeIcon />}
                        fullWidth
                    >
                        {loading ? 'Generating...' : 'Generate QR Code'}
                    </Button>

                    {qrCodeUrl && (
                        <Button
                            variant="outlined"
                            onClick={handleDownload}
                            startIcon={<DownloadIcon />}
                            fullWidth
                        >
                            Download
                        </Button>
                    )}
                </Stack>

                {qrCodeUrl && (
                    <Box
                        sx={{
                            mt: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            bgcolor: 'white',
                            p: 2,
                            borderRadius: 1,
                            boxShadow: 1
                        }}
                    >
                        <img
                            src={qrCodeUrl}
                            alt="Generated QR Code"
                            style={{
                                maxWidth: '100%',
                                height: 'auto'
                            }}
                        />
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default QRCodeGenerator;