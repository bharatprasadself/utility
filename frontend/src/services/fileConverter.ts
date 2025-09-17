import axiosInstance from './axiosConfig';

import { isAxiosError } from 'axios';

export interface ConversionFormat {
    sourceFormat: string;
    targetFormats: string[];
}

interface ConversionFormatsResponse {
    supportedFormats: ConversionFormat[];
}

interface ConversionError extends Error {
    status?: number;
    statusText?: string;
    responseData?: unknown;
}

const readBlobAsText = async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
};

export const getConversionFormats = async (): Promise<ConversionFormatsResponse> => {
    try {
        const response = await axiosInstance.get<ConversionFormatsResponse>('/api/converter/supported-formats');
        
        if (!response.data?.supportedFormats?.length) {
            console.error('Invalid response from server:', response.data);
            throw new Error('Invalid response format from server');
        }
        
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            console.error('Failed to fetch conversion formats:', {
                status: error.response?.status,
                message: error.message,
                data: error.response?.data
            });
            throw new Error(`Failed to fetch supported formats: ${error.message}`);
        }
        
        // For unknown errors
        const err = error instanceof Error ? error : new Error('Unknown error occurred');
        throw new Error(`Failed to fetch supported formats: ${err.message}`);
    }
};

export const convertFile = async (file: File, sourceFormat: string, targetFormat: string): Promise<Blob> => {
    // Validate input
    if (!file) throw new Error('No file selected');
    if (!file.size) throw new Error('File is empty');
    if (!sourceFormat) throw new Error('Source format is required');
    if (!targetFormat) throw new Error('Target format is required');

    // Create form data
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('sourceFormat', sourceFormat);
    formData.append('targetFormat', targetFormat);

    // Log request details
    console.log('Sending file conversion request:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sourceFormat,
        targetFormat
    });

    try {
        const response = await axiosInstance.post<Blob>('/api/converter/convert', formData, {
            responseType: 'blob',
            headers: {
                'Accept': 'application/octet-stream'
            }
        });

        if (!response.data) {
            throw new Error('No data received from server');
        }

        return response.data;
    } catch (error) {
        const conversionError = new Error('File conversion failed') as ConversionError;
        
        if (isAxiosError(error)) {
            if (error.response) {
                conversionError.status = error.response.status;
                conversionError.statusText = error.response.statusText;
                
                if (error.response.data instanceof Blob) {
                    try {
                        const text = await readBlobAsText(error.response.data);
                        const errorDetails = JSON.parse(text);
                        console.error('Conversion error details:', errorDetails);
                        conversionError.responseData = errorDetails;
                    } catch (parseError) {
                        console.error('Could not parse error response blob');
                    }
                } else {
                    conversionError.responseData = error.response.data;
                }

                console.error('File conversion failed:', {
                    fileName: file.name,
                    fileSize: file.size,
                    status: error.response.status,
                    statusText: error.response.statusText
                });
            } else if (error.request) {
                console.error('No response received:', error.message);
            } else {
                console.error('Error setting up request:', error.message);
            }
        } else {
            // For non-Axios errors
            const err = error instanceof Error ? error : new Error('Unknown error occurred');
            console.error('Unexpected error during file conversion:', {
                fileName: file.name,
                fileSize: file.size,
                error: err.message
            });
        }
        
        throw conversionError;
    }
};