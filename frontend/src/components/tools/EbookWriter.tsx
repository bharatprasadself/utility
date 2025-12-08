import { Box, Typography, Paper, Button, Stack, TextField, Divider, List, ListItem, ListItemText, Switch, FormControlLabel, Tooltip, Collapse } from '@mui/material';
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
  const { isAdmin } = useAuth();
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveDraftMsg, setSaveDraftMsg] = useState<string | null>(null);
  const [project, setProject] = useState<EbookProject>(emptyProject());
  const [tocLocked, setTocLocked] = useState<boolean>(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const prefaceInputRef = useRef<HTMLInputElement>(null);
  const disclaimerInputRef = useRef<HTMLInputElement>(null);
  const chapterIdeasRef = useRef<HTMLInputElement>(null);
  const researchNotesRef = useRef<HTMLInputElement>(null);
  const dataStatsExamplesRef = useRef<HTMLInputElement>(null);
  const personalThoughtsRef = useRef<HTMLInputElement>(null);
  const questionsImportRef = useRef<HTMLInputElement>(null);
  const tocInputRef = useRef<HTMLInputElement>(null);
  const chaptersInputRef = useRef<HTMLInputElement>(null);

  const [newQuestion, setNewQuestion] = useState<string>('');
  const [showResearchIdeation, setShowResearchIdeation] = useState<boolean>(true);
  const [showTocAdvanced, setShowTocAdvanced] = useState<boolean>(false);

  // Draft ebooks state
  const [drafts, setDrafts] = useState<EbookItem[]>([]);
  const [draftContents, setDraftContents] = useState<any[]>([]);
  const [bookIdToParent, setBookIdToParent] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const all = await EbookService.listAll();
        setDraftContents(all);
        const bookIdToParentLocal: Record<string, any> = {};
        const items: EbookItem[] = [];
        (all as any[]).forEach((content: any) => {
          if (Array.isArray(content.books)) {
            content.books.forEach((book: any) => {
              items.push({ ...book, status: content.status || 'draft' });
              if (book.id) bookIdToParentLocal[book.id] = content;
            });
          }
        });
        setDrafts(items.filter((b) => (b.status || 'draft') === 'draft'));
        setBookIdToParent(bookIdToParentLocal);
      } catch {
        // ignore errors from drafts fetch
      }
    };
    fetchDrafts();
  }, []);

  const updateCover = (patch: Partial<EbookProject['cover']>) => {
    setProject(p => ({
      ...p,
      cover: { ...p.cover, ...patch },
      lastUpdated: new Date().toISOString(),
    }));
  };
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
  const handleImportChapterIdeas = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ chapterIdeas: content });
    if (chapterIdeasRef.current) chapterIdeasRef.current.value = '';
  };
  const handleImportResearchNotes = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ researchNotes: content });
    if (researchNotesRef.current) researchNotesRef.current.value = '';
  };
  const handleImportDataStatsExamples = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ dataStatsExamples: content });
    if (dataStatsExamplesRef.current) dataStatsExamplesRef.current.value = '';
  };
  const handleImportPersonalThoughts = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    touch({ personalThoughts: content });
    if (personalThoughtsRef.current) personalThoughtsRef.current.value = '';
  };
  const handleImportQuestions = async (file?: File) => {
    if (!file) return;
    const content = await readTextFile(file);
    const lines = content.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    touch({ questionsForNotebookLm: lines });
    if (questionsImportRef.current) questionsImportRef.current.value = '';
  };
  const addQuestion = () => {
    const q = newQuestion.trim();
    if (!q) return;
    const current = project.questionsForNotebookLm || [];
    touch({ questionsForNotebookLm: [...current, q] });
    setNewQuestion('');
  };
  const removeQuestion = (idx: number) => {
    const current = [...(project.questionsForNotebookLm || [])];
    current.splice(idx, 1);
    touch({ questionsForNotebookLm: current });
  };
  const useQuestionsTemplate = () => {
    const template = [
      'Create a 10-chapter outline using the research above.',
      'Rewrite the digital product chapter in a friendly teaching tone.',
      'Summarize all research into a clean introduction.',
      'Draft a 30-day action plan chapter.'
    ];
    touch({ questionsForNotebookLm: template });
  };
  const copyAllQuestions = async () => {
    const txt = (project.questionsForNotebookLm || []).join('\n');
    try { await navigator.clipboard.writeText(txt); } catch {}
  };
  const exportQuestionsTxt = () => {
    const txt = (project.questionsForNotebookLm || []).join('\n');
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (project.title ? project.title.replace(/[^a-z0-9]/gi, '_') : 'questions') + '_notebooklm.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 100);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
      <Box sx={{ p: 3, flexGrow: 1 }} ref={editorRef}>
        {drafts.length > 0 && (
          <Paper elevation={2} sx={{ mb: 4, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Draft Ebooks</Typography>
            <Stack spacing={2}>
              {drafts.map((ebook, idx) => {
                let parentContent = (ebook.id && bookIdToParent[ebook.id]) || null;
                if (!parentContent) {
                  parentContent = draftContents.find((content: any) =>
                    Array.isArray(content.books) && content.books.some((b: any) =>
                      b.title === ebook.title && b.coverUrl === ebook.coverUrl
                    )
                  ) || null;
                }
                if (!parentContent) {
                  parentContent = draftContents.find((content: any) =>
                    Array.isArray(content.books) && content.books.some((b: any) => b.title === ebook.title)
                  ) || {};
                }
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
                          id: parentContent.id,
                          bookId: ebook.id,
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
          {/* How to Use (Workflow) */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6">How to Use</Typography>
              <Button variant="text" size="small" onClick={() => setShowTocAdvanced(v => !v)}>
                {/* reuse a simple toggle state; alternately add a dedicated one */}
                {showTocAdvanced ? 'Hide' : 'Show'}
              </Button>
            </Stack>
            <Collapse in={showTocAdvanced}>
              <List dense>
                <ListItem><ListItemText primary="1) Review Drafts: Load an existing draft from the top list if available." /></ListItem>
                <ListItem><ListItemText primary="2) Set Title & Cover: Enter the ebook title and upload a cover image." /></ListItem>
                <ListItem><ListItemText primary="3) Preface: Import or write the preface to introduce the book." /></ListItem>
                <ListItem><ListItemText primary="4) Research & Ideation: Import notes, ideas, data, and personal thoughts to guide writing." /></ListItem>
                <ListItem><ListItemText primary="5) Questions for NotebookLM: Add or import prompts to generate outlines or drafts." /></ListItem>
                <ListItem><ListItemText primary="6) Table of Contents: Generate from chapters or sync with chapter titles; lock when finalized." /></ListItem>
                <ListItem><ListItemText primary="7) Chapters: Import multiple .txt files or edit titles and content directly." /></ListItem>
                <ListItem><ListItemText primary="8) Save/Export: Admins can Save as Draft to the database; export DOCX to download the final ebook." /></ListItem>
              </List>
            </Collapse>
          </Paper>
          <TextField
            label="Ebook Title"
            fullWidth
            value={project.title}
            onChange={(e) => touch({ title: e.target.value })}
          />

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
                  minRows={4}
                  value={project.preface || ''}
                  onChange={e => touch({ preface: e.target.value })}
                />
              </Box>

              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="h6">Research & Ideation</Typography>
                  <Button variant="text" size="small" onClick={() => setShowResearchIdeation(v => !v)}>
                    {showResearchIdeation ? 'Hide' : 'Show'}
                  </Button>
                </Stack>
                <Collapse in={showResearchIdeation}>
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Chapter Ideas</Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => chapterIdeasRef.current?.click()}>Import Chapter Ideas</Button>
                        <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ chapterIdeas: '' })}>Clear</Button>
                      </Stack>
                      <input ref={chapterIdeasRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportChapterIdeas(e.target.files?.[0])} />
                      <TextField
                        label="Chapter Ideas"
                        fullWidth
                        multiline
                        minRows={3}
                        placeholder="Dump raw ideas, bullets, and notes – we’ll shape them into chapters later."
                        value={project.chapterIdeas || ''}
                        onChange={e => touch({ chapterIdeas: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Research Notes</Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => researchNotesRef.current?.click()}>Import Research Notes</Button>
                        <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ researchNotes: '' })}>Clear</Button>
                      </Stack>
                      <input ref={researchNotesRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportResearchNotes(e.target.files?.[0])} />
                      <TextField
                        label="Research Notes (Paste everything from AI research here)"
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Paste raw research outputs, citations, links, and summaries from Perplexity or other tools."
                        value={project.researchNotes || ''}
                        onChange={e => touch({ researchNotes: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Data, Stats, and Examples</Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => dataStatsExamplesRef.current?.click()}>Import Data/Stats/Examples</Button>
                        <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ dataStatsExamples: '' })}>Clear</Button>
                      </Stack>
                      <input ref={dataStatsExamplesRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportDataStatsExamples(e.target.files?.[0])} />
                      <TextField
                        label="Data, Stats, and Examples"
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Collect key numbers, evidence, case studies, and illustrative examples to strengthen arguments."
                        value={project.dataStatsExamples || ''}
                        onChange={e => touch({ dataStatsExamples: e.target.value })}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Personal Thoughts (Your Vision/Experience)</Typography>
                      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => personalThoughtsRef.current?.click()}>Import Personal Thoughts</Button>
                        <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ personalThoughts: '' })}>Clear</Button>
                      </Stack>
                      <input ref={personalThoughtsRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportPersonalThoughts(e.target.files?.[0])} />
                      <TextField
                        label="Personal Thoughts (Your Vision/Experience)"
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Write your perspective, lived experience, and vision that ties the research and data together."
                        value={project.personalThoughts || ''}
                        onChange={e => touch({ personalThoughts: e.target.value })}
                      />
                    </Box>
                  </Stack>
                </Collapse>
              </Box>

              {/* Questions for NotebookLM */}
              <Box>
                <Typography variant="h6">Questions for NotebookLM</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 1 }}>
                  <TextField
                    label="Add a question"
                    value={newQuestion}
                    onChange={e => setNewQuestion(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQuestion(); } }}
                    fullWidth
                  />
                  <Button variant="contained" onClick={addQuestion}>Add</Button>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                  <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => questionsImportRef.current?.click()}>Import .txt</Button>
                  <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={useQuestionsTemplate}>Use Template</Button>
                  <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ questionsForNotebookLm: [] })}>Clear</Button>
                  <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={copyAllQuestions}>Copy All</Button>
                  <Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={exportQuestionsTxt}>Export .txt</Button>
                </Stack>
                <input ref={questionsImportRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportQuestions(e.target.files?.[0])} />
                <List dense>
                  {(project.questionsForNotebookLm || []).map((q, idx) => (
                    <ListItem key={idx} secondaryAction={<Button size="small" color="error" onClick={() => removeQuestion(idx)}>Remove</Button>}>
                      <ListItemText primary={`${idx + 1}. ${q}`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Stack>
          </Paper>

          {/* Table of Contents */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="h6">Table of Contents</Typography>
              <FormControlLabel
                control={<Switch checked={tocLocked} onChange={e => setTocLocked(e.target.checked)} />}
                label="Lock TOC"
              />
              <Button variant="outlined" size="small" color="error" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => touch({ toc: [] })}>Clear</Button>
              <input ref={tocInputRef} type="file" accept=".txt" style={{ display: 'none' }} onChange={e => handleImportTOC(e.target.files?.[0])} />
              <Tooltip title="Generate TOC from chapters"><Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={generateTocFromChapters}>Generate from Chapters</Button></Tooltip>
              <Tooltip title="Sync TOC with chapters"><Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={syncTocWithChapters}>Sync with Chapters</Button></Tooltip>
              <Button variant="text" size="small" onClick={() => setShowTocAdvanced(v => !v)}>{showTocAdvanced ? 'Hide Advanced' : 'Show Advanced'}</Button>
            </Stack>
            <Collapse in={showTocAdvanced}>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Tooltip title="Import TOC from .txt file (one chapter per line)"><Button variant="outlined" size="small" sx={{ borderWidth: 2, borderStyle: 'solid' }} onClick={() => tocInputRef.current?.click()}>Import TOC</Button></Tooltip>
              </Stack>
            </Collapse>
            <Divider sx={{ my: 1 }} />
            <List dense>
              {project.toc.map((item, idx) => (
                <ListItem key={idx}>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Chapters */}
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

          {/* Actions */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {isAdmin() && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={async () => {
                  setSavingDraft(true);
                  setSaveDraftMsg(null);
                  try {
                    const ebookContent: any = {
                      id: project.id,
                      headerTitle: project.title || '',
                      books: [
                        {
                          id: project.bookId,
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
                  } catch {
                    setSaveDraftMsg('Failed to save draft.');
                  } finally {
                    setSavingDraft(false);
                  }
                }}
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
      {/* Sidebar Ad */}
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
};

export default EbookWriter;

              