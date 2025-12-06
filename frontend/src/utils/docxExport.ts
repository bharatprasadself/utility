import { AlignmentType, Document, HeadingLevel, ImageRun, Packer, Paragraph, TextRun } from 'docx';
import type { EbookProject } from '@/types/ebook-writer';

function dataUrlToUint8Array(dataUrl?: string): Uint8Array | undefined {
  if (!dataUrl) return undefined;
  const base64 = dataUrl.split(',')[1];
  if (!base64) return undefined;
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function textToParagraphs(text?: string): Paragraph[] {
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const paras: Paragraph[] = [];
  let buffer: string[] = [];
  const flush = () => {
    if (buffer.length) {
      paras.push(new Paragraph({ children: [new TextRun(buffer.join('\n'))] }));
      buffer = [];
    }
  };
  for (const line of lines) {
    if (/^\s*$/.test(line)) { flush(); continue; }
    const h1 = line.match(/^\s{0,3}#\s+(.*)$/);
    const h2 = line.match(/^\s{0,3}##\s+(.*)$/);
    const h3 = line.match(/^\s{0,3}###\s+(.*)$/);
    if (h1) { flush(); paras.push(new Paragraph({ text: h1[1], heading: HeadingLevel.HEADING_1 })); continue; }
    if (h2) { flush(); paras.push(new Paragraph({ text: h2[1], heading: HeadingLevel.HEADING_2 })); continue; }
    if (h3) { flush(); paras.push(new Paragraph({ text: h3[1], heading: HeadingLevel.HEADING_3 })); continue; }
    buffer.push(line);
  }
  flush();
  return paras;
}

export async function exportProjectToDocx(project: EbookProject): Promise<Blob> {
  const sections: { children: Paragraph[] }[] = [];

  // Cover
  const coverChildren: Paragraph[] = [];
  if (project.title) {
    // Use HEADING_1 for broad compatibility; some themes don't define TITLE
    coverChildren.push(new Paragraph({ text: project.title, heading: HeadingLevel.HEADING_1, spacing: { after: 200 } }));
  }
  if (project.cover?.subtitle) {
    coverChildren.push(new Paragraph({ text: project.cover.subtitle, heading: HeadingLevel.HEADING_2, spacing: { after: 400 } }));
  }
  const imgBytes = dataUrlToUint8Array(project.cover?.imageDataUrl);
  if (imgBytes) {
    try {
      const image = new ImageRun({ data: imgBytes, transformation: { width: 600, height: 800 } });
      coverChildren.push(new Paragraph({ children: [image], alignment: AlignmentType.CENTER }));
    } catch {
      // ignore image errors and continue with text-only cover
    }
  }
  if (!imgBytes) {
    coverChildren.push(...textToParagraphs(project.cover?.content));
  }
  if (coverChildren.length) { sections.push({ children: coverChildren }); }

  // Preface
  if (project.preface) {
    sections.push({
      children: [
        new Paragraph({ text: 'Preface', heading: HeadingLevel.HEADING_1 }),
        ...textToParagraphs(project.preface),
      ],
    });
  }

  // Disclaimer
  if (project.disclaimer) {
    sections.push({
      children: [
        new Paragraph({ text: 'Disclaimer', heading: HeadingLevel.HEADING_1 }),
        ...textToParagraphs(project.disclaimer),
      ],
    });
  }

  // TOC (simple list)
  if (project.toc?.length) {
    sections.push({
      children: [
        new Paragraph({ text: 'Table of Contents', heading: HeadingLevel.HEADING_1 }),
        ...project.toc.map((t, i) => new Paragraph({ text: `${i + 1}. ${t}` })),
      ],
    });
  }

  // Chapters
  if (project.chapters?.length) {
    for (const ch of project.chapters) {
      sections.push({
        children: [
          new Paragraph({ text: ch.title || 'Chapter', heading: HeadingLevel.HEADING_1 }),
          ...textToParagraphs(ch.content),
        ],
      });
    }
  }

  // Fallback if nothing was added
  if (sections.length === 0) { sections.push({ children: [new Paragraph('No content')] }); }

  const doc = new Document({
    creator: 'Utility Zone',
    description: 'Ebook export',
    title: project.title || 'Ebook',
    sections,
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
