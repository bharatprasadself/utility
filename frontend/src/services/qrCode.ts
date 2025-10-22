import axios from './axiosConfig';

export interface QRCodeRequest {
    content: string;
    width?: number;
    height?: number;
}

export const generateQRCode = async (request: QRCodeRequest): Promise<Blob> => {
    const response = await axios.post('/api/qrcode/generate', request, {
        responseType: 'blob'
    });
    return response.data;
};