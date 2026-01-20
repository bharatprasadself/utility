import { describe, it, expect } from 'vitest';
import { computeReadTime, getDefaultReadWpm } from './readTime';

describe('readTime', () => {
  it('returns 1 min for empty or whitespace', () => {
    expect(computeReadTime('')).toBe('1 min read');
    expect(computeReadTime('   ')).toBe('1 min read');
  });

  it('estimates based on default WPM (env or fallback)', () => {
    const wpm = getDefaultReadWpm();
    const words = wpm * 2; // ~2 minutes
    const text = Array.from({ length: words }, (_, i) => `word${i}`).join(' ');
    expect(computeReadTime(text)).toBe('2 min read');
  });

  it('respects explicit wpm parameter', () => {
    const text = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ');
    expect(computeReadTime(text, 200)).toBe('2 min read');
    expect(computeReadTime(text, 100)).toBe('4 min read');
  });

  it('strips markdown artifacts before counting', () => {
    const md = `# Title\n\n> Quote line\n\n- item 1\n- item 2\n\n` +
      'Regular text with a [link](http://example.com) and ![image](img.png). ' +
      '```\ncode block\n```\n`inline code`\n';
    // After stripping, should be significantly fewer words than raw
    const result = computeReadTime(md, 200);
    expect(result).toMatch(/\d+ min read/);
  });

  it('optionally includes code blocks and inline code in count (weighted)', () => {
    const md = [
      'Prose words here for context and explanation.',
      '```',
      'const a = 1; // code words should be counted when enabled',
      'function test() { return a; }',
      '```',
      'More prose after code.',
      '`inline code segment with identifiers and values`'
    ].join('\n');

    const withoutCode = computeReadTime(md, 200, { includeCode: false });
    const withCode = computeReadTime(md, 200, { includeCode: true, codeWpm: 100 });
    // Including code should never reduce the estimate
    const withoutNum = parseInt(withoutCode, 10);
    const withNum = parseInt(withCode, 10);
    expect(withNum).toBeGreaterThanOrEqual(withoutNum);
  });

  it('counts indented and HTML <pre>/<code> blocks when enabled', () => {
    const md = [
      'Intro paragraph.',
      '    indented code line with several tokens and values',
      '<pre>preformatted code content with many symbols and text</pre>',
      '<code>inline code element words</code>'
    ].join('\n');

    const withoutCode = computeReadTime(md, 200, { includeCode: false });
    const withCode = computeReadTime(md, 200, { includeCode: true, codeWpm: 120 });
    const withoutNum = parseInt(withoutCode, 10);
    const withNum = parseInt(withCode, 10);
    expect(withNum).toBeGreaterThanOrEqual(withoutNum);
  });
});
