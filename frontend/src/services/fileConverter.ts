import axios from './axiosConfig';

export const getConversionFormats = async () => {
    const response = await axios.get('/api/converter/supported-formats');
    return response.data;
};

export const convertFile = async (file: File, sourceFormat: string, targetFormat: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sourceFormat', sourceFormat);
    formData.append('targetFormat', targetFormat);

    const response = await axios.post('/api/converter/convert', formData, {
        responseType: 'blob',
        headers: {
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/octet-stream',
        },
        transformRequest: [(data) => {
            return data; // Do not transform the FormData
        }],
    });

    return response.data;
};