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
  id?: number; // DB row id for upsert
  bookId?: string; // optional, for tracking book id
  title: string;
  cover: EbookCover;
  preface: string;
  disclaimer: string;
  chapterIdeas?: string; // optional: initial brain dump of chapter ideas
  researchNotes?: string; // optional: raw research notes pasted from Perplexity
  dataStatsExamples?: string; // optional: data points, statistics, and concrete examples
  personalThoughts?: string; // optional: author's vision, experience, and perspective
  questionsForNotebookLm?: string[]; // optional: prompts for NotebookLM, one per item
  toc: string[]; // list of chapter titles or headings
  chapters: Chapter[];
  lastUpdated: string; // ISO timestamp
}

export const emptyProject = (): EbookProject => ({
  id: undefined,
  bookId: undefined,
  title: '',
  cover: { title: '', subtitle: '', imageDataUrl: undefined, content: '' },
  preface: '',
  disclaimer: '',
  chapterIdeas: '',
  researchNotes: '',
  dataStatsExamples: '',
  personalThoughts: '',
  questionsForNotebookLm: [],
  toc: [],
  chapters: [],
  lastUpdated: new Date().toISOString()
});
