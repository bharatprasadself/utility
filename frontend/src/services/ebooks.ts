import type { EbookStatus, EbookItem } from '@/types/Ebooks';
import type { EbookContent } from '@/types/Ebooks';
import axiosInstance from './axiosConfig';
import publicApi from './publicApi';

const PUBLIC_BASE = '/api/ebooks';
const ADMIN_BASE = '/api/admin/ebooks';
const ITEMS_BASE = '/api/ebooks/items';

// Fallback local storage key for demo/offline
const LS_KEY = 'ebook_content_cache_v1';

// Removed unused loadFromLocal helper (was not referenced)

const saveToLocal = (content: EbookContent) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(content));
  } catch {}
};

// Utility to generate a UUID (RFC4122 v4)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Ensure every book has a unique id
function ensureBookIds(content: EbookContent): EbookContent {
  return {
    ...content,
    books: (content.books || []).map((book) => ({
      ...book,
      id: book.id || generateUUID(),
    })),
  };
}

export const EbookService = {
  // Per-ebook items (admin)
  async listItems(): Promise<EbookItem[]> {
    const res = await axiosInstance.get<EbookItem[]>(ITEMS_BASE);
    return res.data as any;
  },
  async listPublishedItems(): Promise<EbookItem[]> {
    const res = await publicApi.get<EbookItem[]>(`${ITEMS_BASE}/published`);
    return res.data as any;
  },
  async getItem(id: number): Promise<EbookItem> {
    const res = await axiosInstance.get<EbookItem>(`${ITEMS_BASE}/${id}`);
    return res.data as any;
  },
  async createItem(book: EbookItem): Promise<EbookItem> {
    const res = await axiosInstance.post<EbookItem>(ITEMS_BASE, book as any);
    return res.data as any;
  },
  async updateItem(id: number, book: EbookItem): Promise<EbookItem> {
    const res = await axiosInstance.put<EbookItem>(`${ITEMS_BASE}/${id}`, book as any);
    return res.data as any;
  },
  async deleteItem(id: number): Promise<void> {
    await axiosInstance.delete(`${ITEMS_BASE}/${id}`);
  },
  // Admin: delete a book by DB row ID
  async deleteBook(rowId: number): Promise<void> {
    await axiosInstance.delete(`${ADMIN_BASE}/${rowId}`);
  },
  // Admin: create new ebook content (always insert)
  async createContent(content: EbookContent): Promise<EbookContent> {
    const fixed = ensureBookIds(content);
    const res = await axiosInstance.post<EbookContent>(`${ADMIN_BASE}/create`, fixed);
    saveToLocal(res.data);
    return res.data;
  },
  // Admin: list all ebooks
  async listAll(): Promise<any[]> {
    const res = await axiosInstance.get<any[]>(`${ADMIN_BASE}/all`);
    return res.data;
  },

  // Admin: update ebook status
  async updateStatus(id: string, status: EbookStatus): Promise<EbookItem> {
    const res = await axiosInstance.patch<EbookItem>(`${ADMIN_BASE}/${id}/status`, { status });
    return res.data;
  },
  // Public read
  async getContent(): Promise<EbookContent> {
    const res = await publicApi.get<EbookContent>(PUBLIC_BASE);
    return res.data;
  },

  // Admin upsert
  async upsertContent(content: EbookContent): Promise<EbookContent> {
    try {
      const fixed = ensureBookIds(content);
      const res = await axiosInstance.put<EbookContent>(ADMIN_BASE, fixed);
      saveToLocal(res.data);
      return res.data;
    } catch (e: any) {
      throw new Error(e?.response?.data?.message || 'Failed to save');
    }
  },

  // Newsletter signup (public)
  async subscribeNewsletter(email: string, endpointOverride?: string): Promise<{ success: boolean; status?: string; message?: string }> {
    try {
      const endpoint = endpointOverride || `${PUBLIC_BASE}/newsletter/subscribe`;
      const res = await publicApi.post(endpoint, { email });
      const data = res.data as any;
      return {
        success: res.status >= 200 && res.status < 300,
        status: data?.status,
        message: data?.message
      };
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Subscription failed';
      return { success: false, message: msg };
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
  },

  // Admin: send newsletter to all active subscribers
  async sendNewsletter(subject: string, htmlBody: string): Promise<{ success: boolean; recipients?: number; message?: string }>{
    try {
      const res = await axiosInstance.post(`/api/admin/ebooks/newsletter/send`, { subject, htmlBody }, { timeout: 60000 });
      return { success: res.status === 202 || (res.status >= 200 && res.status < 300), recipients: (res.data as any).recipients };
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to send newsletter';
      return { success: false, message: msg };
    }
  }
};

export default EbookService;
