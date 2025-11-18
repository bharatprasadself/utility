import { Box, Typography, Paper, Button, Stack, TextField, Divider, List, ListItem, ListItemText, Switch, FormControlLabel, Tooltip } from '@mui/material';
import { useRef, useState } from 'react';
import type { EbookProject, Chapter, EbookCover } from '@/types/ebook-writer';
import { emptyProject } from '@/types/ebook-writer';
import { readTextFile, readMultipleTextFiles, firstHeadingOrFilename, readImageAsDataUrl } from '@/utils/fileImport';
import { exportProjectToDocx } from '@/utils/docxExport';

const EbookWriter = () => {
  const [project, setProject] = useState<EbookProject>(emptyProject());
  const [tocLocked, setTocLocked] = useState<boolean>(false);

  // file input refs (hidden)
  const prefaceInputRef = useRef<HTMLInputElement>(null);
  const disclaimerInputRef = useRef<HTMLInputElement>(null);
  const tocInputRef = useRef<HTMLInputElement>(null);
  const chaptersInputRef = useRef<HTMLInputElement>(null);
  const coverTextInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  const touch = (patch: Partial<EbookProject>) => setProject(p => ({ ...p, ...patch, lastUpdated: new Date().toISOString() }));

  // Import handlers
  const handleImportPreface = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ preface: content });
  };
  const handleImportDisclaimer = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ disclaimer: content });
  };
  const handleImportTOC = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    const lines = content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (tocLocked) return; // respect lock
    touch({ toc: lines });
  };
  const handleImportChapters = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const results = await readMultipleTextFiles(files);
    const chapters: Chapter[] = results.map(r => ({
      title: firstHeadingOrFilename(r.name, r.content),
      content: r.content,
      filename: r.name
    }));
    // Derive TOC only if none exists and not locked
    const toc = (!tocLocked && project.toc.length === 0) ? chapters.map(c => c.title) : project.toc;
    touch({ chapters, toc });
  };

  const updateCover = (patch: Partial<EbookCover>) => setProject(p => ({ ...p, cover: { ...(p.cover || { title: '' }), ...patch }, lastUpdated: new Date().toISOString() }));

  const handleImportCoverText = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    updateCover({ content });
  };

  const handleImportCoverImage = async (file?: File) => {
    if (!file) return;
    const dataUrl = await readImageAsDataUrl(file);
    updateCover({ imageDataUrl: dataUrl });
  };

  const generateTocFromChapters = () => {
    if (tocLocked) { alert('TOC is locked. Unlock to regenerate.'); return; }
    const newToc = project.chapters.map(c => c.title);
    const same = project.toc.join('|') === newToc.join('|');
    if (!same && project.toc.length > 0) {
      const ok = window.confirm('Replace current TOC with chapter titles?');
      if (!ok) return;
    }
    touch({ toc: newToc });
  };

  const syncTocWithChapters = () => {
    if (tocLocked) { alert('TOC is locked. Unlock to sync.'); return; }
    const existing = [...project.toc];
    const chapterTitles = project.chapters.map(c => c.title);
    const missing = chapterTitles.filter(t => !existing.includes(t));
    const merged = existing.concat(missing);
    touch({ toc: merged });
  };

  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (project.title || 'ebook-project') + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsDocx = async () => {
    const blob = await exportProjectToDocx(project);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (project.title || 'ebook') + '.docx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear helpers per section
  const clearPreface = () => touch({ preface: '' });
  const clearDisclaimer = () => touch({ disclaimer: '' });
  const clearChapters = () => touch({ chapters: [] });
  const clearTOC = () => { if (!tocLocked) touch({ toc: [] }); };
  const clearCoverImage = () => updateCover({ imageDataUrl: undefined });
  const clearCoverText = () => updateCover({ content: '' });

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Ebook Writer
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Ebook Title"
            fullWidth
            value={project.title}
            onChange={(e) => touch({ title: e.target.value })}
          />

          <Divider textAlign="left">Import Sections</Divider>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} useFlexGap flexWrap="wrap">
            {/* 1) Cover Image first */}
            <input ref={coverImageInputRef} type="file" accept="image/*" hidden onChange={(e) => handleImportCoverImage(e.target.files?.[0])} />
            <Button variant="outlined" onClick={() => coverImageInputRef.current?.click()}>Import Cover Image</Button>

            {/* 2) Cover Text next (only when no image) */}
            {!project.cover?.imageDataUrl && (
              <>
                <input ref={coverTextInputRef} type="file" accept=".md,.txt" hidden onChange={(e) => handleImportCoverText(e.target.files?.[0])} />
                <Button variant="outlined" onClick={() => coverTextInputRef.current?.click()}>Import Cover Text (.md/.txt)</Button>
              </>
            )}

            <input ref={prefaceInputRef} type="file" accept=".md,.txt" hidden onChange={(e) => handleImportPreface(e.target.files?.[0])} />
            <Button variant="outlined" onClick={() => prefaceInputRef.current?.click()}>Import Preface (.md/.txt)</Button>

            <input ref={disclaimerInputRef} type="file" accept=".md,.txt" hidden onChange={(e) => handleImportDisclaimer(e.target.files?.[0])} />
            <Button variant="outlined" onClick={() => disclaimerInputRef.current?.click()}>Import Disclaimer (.md/.txt)</Button>

            <input ref={tocInputRef} type="file" accept=".md,.txt" hidden onChange={(e) => handleImportTOC(e.target.files?.[0])} />
            <Tooltip title={tocLocked ? 'Unlock TOC to import/replace' : ''}>
              <span>
                <Button variant="outlined" onClick={() => tocInputRef.current?.click()} disabled={tocLocked}>Import TOC (.md/.txt)</Button>
              </span>
            </Tooltip>

            <input ref={chaptersInputRef} type="file" accept=".md,.txt" multiple hidden onChange={(e) => handleImportChapters(e.target.files)} />
            <Button variant="contained" onClick={() => chaptersInputRef.current?.click()}>Import Chapters (multi-file)</Button>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button onClick={generateTocFromChapters} disabled={project.chapters.length === 0}>Generate TOC from Chapters</Button>
            <Button onClick={syncTocWithChapters} disabled={project.chapters.length === 0}>Sync TOC with Chapters</Button>
            <FormControlLabel control={<Switch checked={tocLocked} onChange={(e) => setTocLocked(e.target.checked)} />} label="Lock TOC" />
            <Button color="success" variant="outlined" onClick={exportAsJson}>Export Project (JSON)</Button>
            <Button color="primary" variant="contained" onClick={exportAsDocx}>Export DOCX</Button>
            <Button color="warning" onClick={() => setProject(emptyProject())}>Clear</Button>
          </Stack>

          <Divider textAlign="left">Cover</Divider>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" variant="outlined" onClick={clearCoverImage} disabled={!project.cover?.imageDataUrl}>Clear Cover Image</Button>
            <Button size="small" variant="outlined" onClick={clearCoverText} disabled={!project.cover?.content || !!project.cover?.imageDataUrl}>Clear Cover Text</Button>
          </Stack>
          <Stack spacing={2}>
            <TextField
              label="Cover Title"
              value={project.cover?.title || ''}
              onChange={(e) => updateCover({ title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Cover Subtitle"
              value={project.cover?.subtitle || ''}
              onChange={(e) => updateCover({ subtitle: e.target.value })}
              fullWidth
            />
            {project.cover?.imageDataUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary">Cover Image Preview</Typography>
                <Box sx={{ mt: 1 }}>
                  <img src={project.cover.imageDataUrl} alt="Cover" style={{ maxWidth: '100%', height: 'auto', borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </Box>
              </Box>
            )}
            {!project.cover?.imageDataUrl && (
              <TextField
                label="Cover Text"
                value={project.cover?.content || ''}
                onChange={(e) => updateCover({ content: e.target.value })}
                minRows={3}
                placeholder="Optional cover text (markdown or plain)."
                multiline fullWidth
              />
            )}
            {project.cover?.imageDataUrl && (
              <Typography variant="caption" color="text.secondary">
                Cover text is hidden because a cover image is provided.
              </Typography>
            )}
          </Stack>

          <Divider textAlign="left">Preface</Divider>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" variant="outlined" onClick={clearPreface} disabled={!project.preface}>Clear Preface</Button>
          </Stack>
          <TextField
            value={project.preface}
            onChange={(e) => touch({ preface: e.target.value })}
            minRows={5}
            placeholder="Imported preface will appear here..."
            multiline fullWidth
          />

          <Divider textAlign="left">Disclaimer</Divider>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" variant="outlined" onClick={clearDisclaimer} disabled={!project.disclaimer}>Clear Disclaimer</Button>
          </Stack>
          <TextField
            value={project.disclaimer}
            onChange={(e) => touch({ disclaimer: e.target.value })}
            minRows={4}
            placeholder="Imported disclaimer will appear here..."
            multiline fullWidth
          />

          <Divider textAlign="left">Chapters ({project.chapters.length})</Divider>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" variant="outlined" onClick={clearChapters} disabled={project.chapters.length === 0}>Clear Chapters</Button>
          </Stack>
          {project.chapters.length === 0 ? (
            <Typography variant="body2" color="text.secondary">No chapters imported yet.</Typography>
          ) : (
            <List dense>
              {project.chapters.map((c, idx) => (
                <ListItem key={idx} alignItems="flex-start" disableGutters sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={`${idx + 1}. ${c.title}`}
                    secondary={c.filename}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Divider textAlign="left">Table of Contents</Divider>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Tooltip title={tocLocked ? 'Unlock TOC to clear' : ''}>
              <span>
                <Button size="small" variant="outlined" onClick={clearTOC} disabled={project.toc.length === 0 || tocLocked}>Clear TOC</Button>
              </span>
            </Tooltip>
          </Stack>
          {project.toc.length === 0 ? (
            <Typography variant="body2" color="text.secondary">TOC empty. Import a TOC file or generate from chapters.</Typography>
          ) : (
            <List dense>
              {project.toc.map((t, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
                  <ListItemText primary={`${i + 1}. ${t}`} />
                </ListItem>
              ))}
            </List>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default EbookWriter;
