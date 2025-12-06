export type EbookStatus = 'draft' | 'published';
export interface EbookItem {
  id?: string; // internal book UUID
  rowId?: number; // database row id (ebooks_content.id)
  title: string;
  coverUrl: string;
  buyLink: string;
  description?: string;
  status?: EbookStatus;
}

export interface ContactLink {
  label: string;
  url: string;
}


import type { Chapter } from './ebook-writer';

export interface EbookContent {
  headerTitle: string; // e.g., "Bharat Prasad | Author"
  books: EbookItem[];
  about: string; // short bio
  newsletterEnabled: boolean;
  newsletterEndpoint?: string; // optional backend endpoint for subscriptions
  contacts: ContactLink[];
  updatedAt?: string;
  // Added for full draft support
  preface?: string;
  disclaimer?: string;
  chapters?: Chapter[];
}

export const defaultEbookContent: EbookContent = {
  headerTitle: 'Bharat Prasad | Author',
  books: [],
  about: '',
  newsletterEnabled: true,
  // Keep default aligned with backend: EbookController sets 
  // "/api/ebooks/newsletter/subscribe" by default
  newsletterEndpoint: '/api/ebooks/newsletter/subscribe',
  contacts: []
};
