import type { EbookContent } from '@/types/Ebooks';
import axiosInstance from './axiosConfig';
import publicApi from './publicApi';

const PUBLIC_BASE = '/api/ebooks';
const ADMIN_BASE = '/api/admin/ebooks';

// Fallback local storage key for demo/offline
const LS_KEY = 'ebook_content_cache_v1';

const loadFromLocal = (): EbookContent | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as EbookContent) : null;
  } catch {
    return null;
  }
};

const saveToLocal = (content: EbookContent) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(content));
  } catch {}
};

export const EbookService = {
  // Public read
  async getContent(): Promise<EbookContent> {
    try {
      const res = await publicApi.get<EbookContent>(PUBLIC_BASE);
      const content = res.data;
      saveToLocal(content);
      return content;
    } catch (err) {
      // Fallback to local cache for demo/dev
      const cached = loadFromLocal();
      if (cached) return cached;
      throw err;
    }
  },

  // Admin upsert
  async upsertContent(content: EbookContent): Promise<EbookContent> {
    try {
      const res = await axiosInstance.post<EbookContent>(ADMIN_BASE, content);
      saveToLocal(res.data);
      return res.data;
    } catch (err) {
      // As a last resort (dev/demo), persist locally
      saveToLocal(content);
      return content;
    }
  },

  // Newsletter signup (public)
  async subscribeNewsletter(email: string, endpointOverride?: string): Promise<{ success: boolean }>{
    try {
      const endpoint = endpointOverride || `${PUBLIC_BASE}/newsletter/subscribe`;
      const res = await publicApi.post(endpoint, { email });
      return { success: res.status >= 200 && res.status < 300 };
    } catch {
      // Best-effort demo fallback
      return { success: true };
    }
  },

  // Admin: upload cover image
  async uploadCover(file: File): Promise<string> {
    const form = new FormData();
    form.append('file', file);
    const res = await axiosInstance.post<{ url: string }>(`/api/admin/ebooks/upload-cover`, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return (res.data as any).url || (res as any).data?.url; // be tolerant to typing
  }
};

export default EbookService;
