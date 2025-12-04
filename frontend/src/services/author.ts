import axiosInstance from '@/services/axiosConfig';

import type { ContactLink } from '@/types/Ebooks';
export interface AuthorData {
  id?: number;
  name: string;
  bio: string;
  contactEmail?: string;
  profileImageUrl?: string;
  contacts?: ContactLink[];
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = '/api/author';

export const AuthorService = {
  async get(): Promise<AuthorData | null> {
    try {
      const res = await axiosInstance.get<AuthorData>(API_BASE);
      return res.data;
    } catch {
      return null;
    }
  },
  async save(author: AuthorData): Promise<AuthorData> {
    const res = await axiosInstance.post<AuthorData>(API_BASE, author);
    return res.data;
  },
};
