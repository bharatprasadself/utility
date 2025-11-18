export interface Chapter {
  title: string;
  content: string;
  filename?: string;
}

export interface EbookCover {
  title: string;
  subtitle?: string;
  imageDataUrl?: string; // base64 data URL for a cover image
  content?: string;      // optional cover page markdown/text
}

export interface EbookProject {
  title: string;
  cover: EbookCover;
  preface: string;
  disclaimer: string;
  toc: string[]; // list of chapter titles or headings
  chapters: Chapter[];
  lastUpdated: string; // ISO timestamp
}

export const emptyProject = (): EbookProject => ({
  title: '',
  cover: { title: '', subtitle: '', imageDataUrl: undefined, content: '' },
  preface: '',
  disclaimer: '',
  toc: [],
  chapters: [],
  lastUpdated: new Date().toISOString()
});
