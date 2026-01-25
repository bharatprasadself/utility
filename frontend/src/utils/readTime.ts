// Estimate read time for markdown content.
// Strips common markdown artifacts and counts words.
// Default WPM comes from Vite env `VITE_READ_WPM` (if set), else 200.
export function getDefaultReadWpm(): number {
  const raw = (import.meta as any)?.env?.VITE_READ_WPM as string | undefined;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 200;
}

// Default code WPM comes from Vite env `VITE_READ_WPM_CODE` (if set), else 120.
export function getDefaultCodeReadWpm(): number {
  const raw = (import.meta as any)?.env?.VITE_READ_WPM_CODE as string | undefined;
  const n = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 120;
}

function countWords(s: string): number {
  const text = s.replace(/\r?\n+/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Compute read time for a markdown article.
 * By default excludes code; when enabled, counts code separately with configurable WPM.
 * You can enable code inclusion via options or env `VITE_READ_INCLUDE_CODE=true`.
 */
export function computeReadTime(
  markdown: string,
  wpm?: number,
  options?: { includeCode?: boolean; codeWpm?: number }
): string {
  if (!markdown) return '1 min read';
  const proseWpm = Math.max(1, wpm ?? getDefaultReadWpm());
  // Default to including code when env is not set; allow explicit override
  const includeCodeEnv = (import.meta as any)?.env?.VITE_READ_INCLUDE_CODE as string | undefined;
  const includeCode = options?.includeCode ?? (includeCodeEnv ? includeCodeEnv === 'true' : true);
  const codeWpm = Math.max(1, options?.codeWpm ?? getDefaultCodeReadWpm());

  let codeWords = 0;
  let working = markdown;

  // 1) Fenced code blocks ``` ... ```
  working = working.replace(/```[\s\S]*?```/g, (m) => {
    if (includeCode) codeWords += countWords(m.replace(/```/g, ''));
    return ' ';
  });

  // 2) Inline backticks `...` or ```...```
  working = working.replace(/`{1,3}([^`]*)`{1,3}/g, (_m, p1) => {
    if (includeCode) codeWords += countWords(String(p1));
    return ' ';
  });

  // 3) HTML <pre>...</pre> and <code>...</code>
  working = working.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, p1) => {
    if (includeCode) codeWords += countWords(String(p1));
    return ' ';
  });
  working = working.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, p1) => {
    if (includeCode) codeWords += countWords(String(p1));
    return ' ';
  });

  // 4) Indented code blocks (lines starting with 4 spaces or a tab)
  const lines = working.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^(?:\t| {4})/.test(lines[i])) {
      if (includeCode) codeWords += countWords(lines[i]);
      lines[i] = '';
    }
  }
  working = lines.join('\n');

  // Now strip markdown artifacts from prose
  let prose = working
    // images ![alt](url)
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ')
    // links [text](url) -> text
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
    // headings
    .replace(/^#{1,6}\s+/gm, '')
    // blockquotes
    .replace(/^>\s?/gm, '')
    // lists
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // html tags
    .replace(/<[^>]+>/g, ' ')
    // newlines -> spaces
    .replace(/\r?\n+/g, ' ')
    .trim();

  const proseWords = prose ? prose.split(/\s+/).filter(Boolean).length : 0;
  const totalMinutesFloat = includeCode
    ? proseWords / proseWpm + codeWords / codeWpm
    : proseWords / proseWpm;
  const minutes = Math.max(1, Math.ceil(totalMinutesFloat));
  return `${minutes} min read`;
}
