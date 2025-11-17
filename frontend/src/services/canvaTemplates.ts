import axiosInstance from './axiosConfig';

export interface CanvaTemplate {
  id: number;
  title: string;
  canvaUseCopyUrl?: string;
  mobileCanvaUseCopyUrl?: string;
  mockupUrl?: string;
  secondaryMockupUrl?: string;
  mobileMockupUrl?: string;
  buyerPdfUrl?: string;
  etsyListingUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const listTemplates = async (): Promise<CanvaTemplate[]> => {
  const res = await axiosInstance.get<CanvaTemplate[]>('/api/admin/canva-templates');
  return res.data;
};

export const uploadMockup = async (file: File): Promise<string> => {
  const form = new FormData();
  form.append('file', file);
  const res = await axiosInstance.post<{ url: string }>(
    '/api/admin/canva-templates/upload-mockup',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data.url;
};

export const createTemplate = async (payload: { title: string; canvaUseCopyUrl?: string; mobileCanvaUseCopyUrl?: string; mockupUrl?: string; secondaryMockupUrl?: string; mobileMockupUrl?: string; etsyListingUrl?: string; }): Promise<CanvaTemplate> => {
  const res = await axiosInstance.post<CanvaTemplate>('/api/admin/canva-templates', payload);
  return res.data;
};

export const generateBuyerPdf = async (templateId: number): Promise<string> => {
  const res = await axiosInstance.post<{ success: boolean; buyerPdfUrl: string }>(
    '/api/admin/canva-templates/generate-buyer-pdf',
    null,
    {
      params: { templateId },
      // PDF generation can take longer with large images; extend timeout for this request
      timeout: 60000
    }
  );
  return res.data.buyerPdfUrl;
};

export interface PublicCanvaTemplate {
  id: number;
  title: string;
  mockupUrl?: string;
  etsyListingUrl?: string;
}

export const listPublicTemplates = async (): Promise<PublicCanvaTemplate[]> => {
  const res = await axiosInstance.get<PublicCanvaTemplate[]>('/api/canva-templates');
  return res.data;
};

export const updateTemplate = async (
  id: number,
  payload: { title?: string; canvaUseCopyUrl?: string; mobileCanvaUseCopyUrl?: string; mockupUrl?: string; secondaryMockupUrl?: string; mobileMockupUrl?: string; etsyListingUrl?: string; buyerPdfUrl?: string }
): Promise<CanvaTemplate> => {
  const res = await axiosInstance.put<CanvaTemplate>(`/api/admin/canva-templates/${id}`, payload);
  return res.data;
};

export const deleteTemplate = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/api/admin/canva-templates/${id}`);
};

export const getNextTemplateTitle = async (): Promise<string> => {
  const res = await axiosInstance.get<{ title: string }>(
    '/api/admin/canva-templates/next-title'
  );
  return res.data.title;
};
