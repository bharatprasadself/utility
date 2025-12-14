// Publish a template (set status to 'published')
export const publishTemplate = async (id: number): Promise<void> => {
  await axiosInstance.post(`/api/admin/canva-templates/${id}/publish`);
};
import axiosInstance from './axiosConfig';
export interface Template {
  id: number;
  title: string;
  publicDescription?: string;
  canvaUseCopyUrl?: string;
  mobileCanvaUseCopyUrl?: string;
  mockupUrl?: string;
  secondaryMockupUrl?: string;
  rsvpCanvaUseCopyUrl?: string;
  detailCardCanvaUseCopyUrl?: string;
  mobileMockupUrl?: string;
  buyerPdfUrl?: string;
  etsyListingUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

export const listTemplates = async (): Promise<Template[]> => {
  const res = await axiosInstance.get<Template[]>('/api/admin/canva-templates');
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

export const createTemplate = async (payload: { title: string; publicDescription?: string; canvaUseCopyUrl?: string; mobileCanvaUseCopyUrl?: string; rsvpCanvaUseCopyUrl?: string; detailCardCanvaUseCopyUrl?: string; mockupUrl?: string; secondaryMockupUrl?: string; mobileMockupUrl?: string; etsyListingUrl?: string; status?: string }): Promise<Template> => {
  const res = await axiosInstance.post<Template>('/api/admin/canva-templates', payload);
  return res.data;
};

export const generateBuyerPdf = async (templateId: number, pdfType?: 'print-mobile' | 'print-only' | 'wedding-set'): Promise<string> => {
  const res = await axiosInstance.post<{ success: boolean; buyerPdfUrl: string }>(
    '/api/admin/canva-templates/generate-buyer-pdf',
    null,
    {
      params: pdfType ? { templateId, pdfType } : { templateId },
      // PDF generation can take longer with large images; extend timeout for this request
      timeout: 60000
    }
  );
  const url = res.data.buyerPdfUrl;
  // Ensure absolute URL when backend returns a relative path (e.g., behind context path/proxy)
  if (url && !/^https?:\/\//i.test(url)) {
    const base = (await import('./axiosConfig')).API_BASE_URL as string;
    return base ? `${base}${url}` : url;
  }
  return url;
};

export interface PublicTemplate {
  id: number;
  title: string;
  publicDescription?: string;
  mockupUrl?: string;
  etsyListingUrl?: string;
}

export const listPublicTemplates = async (): Promise<PublicTemplate[]> => {
  const res = await axiosInstance.get<PublicTemplate[]>('/api/canva-templates');
  return res.data;
};

export const updateTemplate = async (
  id: number,
  payload: { title?: string; publicDescription?: string; canvaUseCopyUrl?: string; mobileCanvaUseCopyUrl?: string; rsvpCanvaUseCopyUrl?: string; detailCardCanvaUseCopyUrl?: string; mockupUrl?: string; secondaryMockupUrl?: string; mobileMockupUrl?: string; etsyListingUrl?: string; buyerPdfUrl?: string; status?: string }
): Promise<Template> => {
  const res = await axiosInstance.put<Template>(`/api/admin/canva-templates/${id}`, payload);
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
