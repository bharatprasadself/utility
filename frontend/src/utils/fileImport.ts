export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result || '').toString());
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

export const readMultipleTextFiles = async (files: FileList | File[]): Promise<Array<{ name: string; content: string }>> => {
  const list = Array.from(files as any as File[]);
  // sort by name for deterministic order
  list.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  const results = await Promise.all(list.map(async (f) => ({ name: f.name, content: await readTextFile(f) })));
  return results;
};

export const firstHeadingOrFilename = (name: string, content: string): string => {
  // Try to find first markdown heading like # Title or ## Title
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^\s{0,3}#{1,6}\s+(.*)$/);
    if (m) return m[1].trim();
  }
  // Fallback: filename w/o extension
  return name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
};

export const readImageAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result || '').toString());
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};
