export interface EbookItem {
  id?: string;
  title: string;
  coverUrl: string;
  buyLink: string;
  description?: string;
}

export interface ContactLink {
  label: string;
  url: string;
}

export interface EbookContent {
  headerTitle: string; // e.g., "Bharat Prasad | Author"
  books: EbookItem[];
  about: string; // short bio
  newsletterEnabled: boolean;
  newsletterEndpoint?: string; // optional backend endpoint for subscriptions
  contacts: ContactLink[];
  updatedAt?: string;
}

export const defaultEbookContent: EbookContent = {
  headerTitle: 'Bharat Prasad | Author',
  books: [],
  about: '',
  newsletterEnabled: true,
  newsletterEndpoint: '/api/newsletter/subscribe',
  contacts: []
};
