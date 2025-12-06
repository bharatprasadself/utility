import { Box, Typography, Paper, Button, Stack, TextField, Divider, List, ListItem, ListItemText, Switch, FormControlLabel, Tooltip } from '@mui/material';
import Advertisement from '../Advertisement';
import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { EbookProject, Chapter } from '@/types/ebook-writer';
import { emptyProject } from '@/types/ebook-writer';
import { readTextFile, readMultipleTextFiles, firstHeadingOrFilename, readImageAsDataUrl } from '@/utils/fileImport';
import { exportProjectToDocx } from '@/utils/docxExport';
import { EbookService } from '@/services/ebooks';
import type { EbookItem } from '@/types/Ebooks';

const EbookWriter = () => {
        // Draft ebooks state
        // Store both flat EbookItem[] for display and full EbookContentDto[] for loading all fields
        const [drafts, setDrafts] = useState<EbookItem[]>([]);
        const [draftContents, setDraftContents] = useState<any[]>([]);

        useEffect(() => {
          const fetchDrafts = async () => {
            try {
              const all = await EbookService.listAll();
              setDraftContents(all);
              // Build a map from book id to parent content
              const bookIdToParent: Record<string, any> = {};
              const items: EbookItem[] = [];
              (all as any[]).forEach((content: any) => {
                if (Array.isArray(content.books)) {
                  content.books.forEach((book: any) => {
                    items.push({ ...book, status: content.status || 'draft' });
                    if (book.id) bookIdToParent[book.id] = content;
                  });
                }
              });
              setDrafts(items.filter((b) => (b.status || 'draft') === 'draft'));
              setBookIdToParent(bookIdToParent);
            } catch (e) {
              // Optionally handle error
            }
          };
          fetchDrafts();
        }, []);

        // Map from book id to parent content
        const [bookIdToParent, setBookIdToParent] = useState<Record<string, any>>({});
      // Store uploaded file in state for admin draft upload
        // Store uploaded file in state for admin draft upload (removed unused coverFile)
    // Save as Draft handler
    const handleSaveDraft = async () => {
      setSavingDraft(true);
      setSaveDraftMsg(null);
      try {
        // Convert project to EbookContentDto shape
        const ebookContent: any = {
          id: project.id,
          headerTitle: project.title || '',
          books: [
            {
              id: project.bookId, // optional, if you want to track book id
              title: project.title || '',
              coverUrl: project.cover?.imageDataUrl || '',
              description: project.cover?.content || '',
              buyLink: '',
            }
          ],
          about: project.preface || '',
          newsletterEnabled: false,
          contacts: [],
          preface: project.preface || '',
          disclaimer: project.disclaimer || '',
          chapters: project.chapters || [],
        };
        if (project.id) {
          await EbookService.upsertContent(ebookContent);
          setSaveDraftMsg('Draft updated successfully!');
        } else {
          await EbookService.createContent(ebookContent);
          setSaveDraftMsg('Draft saved successfully!');
        }
      } catch (e: any) {
        setSaveDraftMsg('Failed to save draft.');
      } finally {
        setSavingDraft(false);
      }
    };
  // Auth context
  const { isAdmin } = useAuth();
  // Save as Draft state
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveDraftMsg, setSaveDraftMsg] = useState<string | null>(null);

  // State
  const [project, setProject] = useState<EbookProject>(emptyProject());
  const [tocLocked, setTocLocked] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);
  // Refs for file inputs
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  // Removed unused coverTextInputRef
  const prefaceInputRef = useRef<HTMLInputElement>(null);
  const disclaimerInputRef = useRef<HTMLInputElement>(null);
  const tocInputRef = useRef<HTMLInputElement>(null);
  const chaptersInputRef = useRef<HTMLInputElement>(null);

  // Helper to update cover
  const updateCover = (patch: Partial<EbookProject['cover']>) => {
    setProject(p => ({
      ...p,
      cover: { ...p.cover, ...patch },
      lastUpdated: new Date().toISOString(),
    }));
  };
  // Helpers
  const touch = (patch: Partial<EbookProject>) => setProject(p => ({ ...p, ...patch, lastUpdated: new Date().toISOString() }));
  const handleImportPreface = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ preface: content });
    if (prefaceInputRef.current) prefaceInputRef.current.value = '';
  };

  const handleImportDisclaimer = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ disclaimer: content });
    if (disclaimerInputRef.current) disclaimerInputRef.current.value = '';
  };

  const handleImportTOC = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    const lines = content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (tocLocked) return;
    touch({ toc: lines });
    if (tocInputRef.current) tocInputRef.current.value = '';
  };

  const handleImportChapters = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    const results = await readMultipleTextFiles(files);
    const chapters: Chapter[] = results.map(r => ({
      title: firstHeadingOrFilename(r.name, r.content),
      content: r.content,
      filename: r.name
    }));
    touch({ chapters });
    if (chaptersInputRef.current) chaptersInputRef.current.value = '';
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

  // Main layout (two-column, like Blog page)
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Box sx={{ p: 3, flexGrow: 1 }} ref={editorRef}>
        {/* Draft Ebooks List */}
        {drafts.length > 0 && (
          <Paper elevation={2} sx={{ mb: 4, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Draft Ebooks</Typography>
            <Stack spacing={2}>
              {drafts.map((ebook, idx) => {
                // Improved: Robustly find parent content for this book
                let parentContent = (ebook.id && bookIdToParent[ebook.id]) || null;
                if (!parentContent) {
                  // Fallback: try to find by matching title and coverUrl
                  parentContent = draftContents.find((content: any) =>
                    Array.isArray(content.books) && content.books.some((b: any) =>
                      b.title === ebook.title && b.coverUrl === ebook.coverUrl
                    )
                  ) || null;
                }
                if (!parentContent) {
                  // Fallback: try to find by matching just title
                  parentContent = draftContents.find((content: any) =>
                    Array.isArray(content.books) && content.books.some((b: any) => b.title === ebook.title)
                  ) || {};
                }
                // Defensive: ensure preface/disclaimer are always strings
                const preface = typeof parentContent.preface === 'string' ? parentContent.preface : '';
                const disclaimer = typeof parentContent.disclaimer === 'string' ? parentContent.disclaimer : '';
                return (
                  <Box key={ebook.id || ebook.title || idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #eee', borderRadius: 2, p: 2 }}>
                    <Box sx={{ width: 60, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 1, border: '1px solid #ccc', mr: 2 }}>
                      {ebook.coverUrl ? (
                        <img src={ebook.coverUrl} alt={ebook.title} style={{ width: 56, height: 76, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">No Cover</Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" fontWeight={600}>{ebook.title || <span style={{color:'#aaa'}}>Untitled</span>}</Typography>
                      <Typography variant="body2" color="text.secondary">Status: {ebook.status || 'draft'}</Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ ml: 2 }}
                      onClick={() => {
                        setProject(prev => ({
                          ...prev,
                          id: parentContent.id, // store DB row id for upsert
                          bookId: ebook.id, // optional, if you want to track book id
                          title: ebook.title || '',
                          cover: {
                            ...(prev.cover || {}),
                            imageDataUrl: ebook.coverUrl || '',
                          },
                          preface,
                          disclaimer,
                          chapters: Array.isArray(parentContent.chapters) ? parentContent.chapters : [],
                          status: ebook.status || 'draft',
                        }));
                        setTimeout(() => {
                          editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 100);
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        )}
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 2 }}>
          Ebook Writer
        </Typography>
        <Stack spacing={3}>

          {/* Title */}
          <TextField
            label="Ebook Title"
            fullWidth
            value={project.title}
            onChange={(e) => touch({ title: e.target.value })}
          />
                    {/* Upload Ebook Cover Section */}
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>Upload Ebook Cover</Typography>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                        {project.cover?.imageDataUrl && (
                          <img src={project.cover.imageDataUrl} alt="Cover Preview" style={{ maxHeight: 120, maxWidth: 90, borderRadius: 4, border: '1px solid #ccc' }} />
                        )}
                        <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => coverImageInputRef.current?.click()}>
                          Upload Cover Image
                        </Button>
                        <input ref={coverImageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImportCoverImage(e.target.files?.[0])} />
                      </Stack>
                      {project.cover?.imageDataUrl && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Cover image will be {isAdmin() ? 'saved to the database on Save as Draft' : 'included in the exported DOCX only'}.
                        </Typography>
                      )}
                    </Paper>
          

          {/* Preface & Disclaimer */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6">Preface</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => prefaceInputRef.current?.click()}>Import Preface</Button>
                  <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ preface: '' })}>Clear</Button>
                </Stack>
                <input ref={prefaceInputRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportPreface(e.target.files?.[0])} />
                <TextField
                  label="Preface"
                  fullWidth
                  multiline
                  minRows={2}
                  value={project.preface || ''}
                  onChange={e => touch({ preface: e.target.value })}
                />
              </Box>
              <Box>
                <Typography variant="h6">Disclaimer</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => disclaimerInputRef.current?.click()}>Import Disclaimer</Button>
                  <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ disclaimer: '' })}>Clear</Button>
                </Stack>
                <input ref={disclaimerInputRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportDisclaimer(e.target.files?.[0])} />
                <TextField
                  label="Disclaimer"
                  fullWidth
                  multiline
                  minRows={2}
                  value={project.disclaimer || ''}
                  onChange={e => touch({ disclaimer: e.target.value })}
                />
              </Box>
            </Stack>
          </Paper>

          {/* TOC Section */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6">Table of Contents</Typography>
              <FormControlLabel
                control={<Switch checked={tocLocked} onChange={e => setTocLocked(e.target.checked)} />}
                label="Lock TOC"
              />
              <Tooltip title="Import TOC from .txt file (one chapter per line)"><Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => tocInputRef.current?.click()}>Import TOC</Button></Tooltip>
              <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ toc: [] })}>Clear</Button>
              <input ref={tocInputRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportTOC(e.target.files?.[0])} />
              <Tooltip title="Generate TOC from chapters"><Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={generateTocFromChapters}>Generate from Chapters</Button></Tooltip>
              <Tooltip title="Sync TOC with chapters"><Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={syncTocWithChapters}>Sync with Chapters</Button></Tooltip>
            </Stack>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {project.toc.map((item, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Chapters Section */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6">Chapters</Typography>
              <Tooltip title="Import multiple .txt files as chapters"><Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => chaptersInputRef.current?.click()}>Import Chapters</Button></Tooltip>
              <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ chapters: [] })}>Clear</Button>
              <input ref={chaptersInputRef} type="file" accept=".txt" multiple style={{ display: 'none' }} onChange={e => handleImportChapters(e.target.files)} />
            </Stack>
            <Divider sx={{ my: 1 }} />
            <List>
              {project.chapters.map((chapter, idx) => (
                <ListItem key={idx} alignItems="flex-start">
                  <ListItemText
                    primary={<>
                      <TextField
                        label={`Chapter Title`}
                        value={chapter.title}
                        onChange={e => {
                          const chapters = [...project.chapters];
                          chapters[idx] = { ...chapters[idx], title: e.target.value };
                          touch({ chapters });
                        }}
                        sx={{ mb: 1 }}
                        fullWidth
                      />
                    </>}
                    secondary={<TextField
                      label="Content"
                      value={chapter.content}
                      onChange={e => {
                        const chapters = [...project.chapters];
                        chapters[idx] = { ...chapters[idx], content: e.target.value };
                        touch({ chapters });
                      }}
                      multiline
                      minRows={3}
                      fullWidth
                    />}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Export Section */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {isAdmin() && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleSaveDraft}
                disabled={savingDraft}
              >
                {savingDraft ? 'Saving...' : 'Save as Draft'}
              </Button>
            )}
            <Button
              variant="contained"
              color="primary"
              onClick={async () => {
                const blob = await exportProjectToDocx(project);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = (project.title ? project.title.replace(/[^a-z0-9]/gi, '_') : 'ebook') + '.docx';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }, 100);
              }}
            >
              Export as DOCX
            </Button>
          </Stack>
          {saveDraftMsg && (
            <Typography variant="body2" color={saveDraftMsg.includes('success') ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
              {saveDraftMsg}
            </Typography>
          )}
        </Stack>
      </Box>
      <Box
        sx={{
          marginTop: { xs: 2, md: 0 },
          ml: { md: 6 },
          alignSelf: 'flex-start',
          position: 'sticky',
          top: '5rem',
          width: '200px',
          display: 'flex',
          justifyContent: 'flex-end',
          mr: 1
        }}
      >
        <Advertisement />
      </Box>
    </Box>
  );
}
export default EbookWriter;
