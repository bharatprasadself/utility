import React, { useState, useRef, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Box,
  Container,
  Alert,
  Chip,
  IconButton,
  Checkbox,
  Tooltip,
  AccordionSummary,
  AccordionDetails,
  Accordion
} from '@mui/material';
import Paper from '@mui/material/Paper';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Advertisement from '../Advertisement';
import type { Article } from '../../types/Article';
import { ArticleCategory } from '../../types/Article';
import { ArticleService } from '../../services/article';
import { computeReadTime } from '../../utils/readTime';

interface ArticleLayoutProps {
  title: string;
  description: string;
  articles: Article[];
  isAdmin: boolean;
  handleEdit: (article: Article) => Promise<void>;
  handleDelete: (id: string) => void;
  handleCreate?: (articleData: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

// Local markdown preview styled similarly to Blogs, with heading size constraints
const MarkdownPreview: React.FC<{ content: string; hideLeadingH1?: boolean; stripFootnotes?: boolean }> = ({ content, hideLeadingH1 = false, stripFootnotes = false }) => {
  // Optionally remove a top-level H1 to avoid giant duplicate title
  let processed = hideLeadingH1 ? content.replace(/^\s*#\s+.*\n?/, '') : content;
  // When rendering short descriptions, footnote references like [^1] often have no local definitions;
  // strip them to avoid showing literal markers in previews.
  if (stripFootnotes) {
    // Remove definitions like: [^1]: some text
    processed = processed.replace(/^\s*\[\^[^\]]+\]:.*$/gm, '');
    // Remove references like: [^1]
    processed = processed.replace(/\[\^[^\]]+\]/g, '');
  }
  // Strip common inline HTML artifacts from pasted content (hidden spans, centered divs)
  processed = processed
    .replace(/<span[^>]*style=["'][^"']*display\s*:\s*none[^"']*["'][^>]*>.*?<\/span>/gis, '')
    .replace(/<div[^>]*align=["']center["'][^>]*>.*?<\/div>/gis, '');
  return (
    <Box sx={{
      '& hr': { my: 3, border: 'none', height: '1px', bgcolor: 'grey.300' },
      '& a': {
        color: 'primary.main',
        textDecoration: 'none',
        '&:hover': { textDecoration: 'underline' }
      },
  // Ensure transparent PNGs render over a light grey instead of default white card background
  '& img': { maxWidth: '100%', height: 'auto', borderRadius: 1, backgroundColor: 'grey.300' },
      '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
      '& th, & td': { border: '1px solid', borderColor: 'grey.300', p: 1, textAlign: 'left', verticalAlign: 'top' },
      '& thead th': { bgcolor: 'grey.100', fontWeight: 600 },
      '& blockquote': {
        borderLeft: '4px solid', borderColor: 'primary.main', pl: 2, py: 1, my: 2, bgcolor: 'grey.50', fontStyle: 'italic'
      },
      '& ul, & ol': { mb: 2, pl: 3 },
      '& li': { mb: 1 },
      '& code': { bgcolor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace' },
      // Make code blocks flush-left: remove left padding on the first line and entire block
      '& pre': {
        bgcolor: 'grey.100',
        py: 2,
        pr: 2,
        pl: 0,
        borderRadius: 1,
        overflowX: 'auto',
        textIndent: 0,
        m: 0
      },
      '& pre code': {
        display: 'block',
        m: 0,
        p: 0,
        textIndent: 0,
        // ensure no accidental leading indent from fonts/UA defaults
        marginLeft: 0,
        paddingLeft: 0,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
      }
    }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props: any) => (
            <Typography component="h1" variant="h4" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 700 }}>
              {props.children}
            </Typography>
          ),
          h2: (props: any) => (
            <Typography component="h2" variant="h5" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 700 }}>
              {props.children}
            </Typography>
          ),
          h3: (props: any) => (
            <Typography component="h3" variant="h6" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 700 }}>
              {props.children}
            </Typography>
          ),
          h4: (props: any) => (
            <Typography component="h4" variant="subtitle1" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 600 }}>
              {props.children}
            </Typography>
          ),
          h5: (props: any) => (
            <Typography component="h5" variant="subtitle2" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 600 }}>
              {props.children}
            </Typography>
          ),
          h6: (props: any) => (
            <Typography component="h6" variant="body1" sx={{ mt: 3, mb: 2, color: 'primary.main', fontWeight: 600 }}>
              {props.children}
            </Typography>
          ),
          p: (props: any) => (
            <Typography component="p" variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
              {props.children}
            </Typography>
          ),
          code: (props: any) => {
            const { inline, children } = props;
            const text = String(children ?? '').replace(/\n$/, '');
            if (inline || (!text.includes('\n'))) {
              return (
                <Box component="code" sx={{ bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 1, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace' }}>
                  {text}
                </Box>
              );
            }
            return (
              <Box sx={{ position: 'relative', my: 2 }}>
                <Box component="pre" sx={{ m: 0, py: 2, pr: 2, pl: 0, bgcolor: 'grey.100', borderRadius: 1, overflowX: 'auto', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, \"Liberation Mono\", monospace', fontSize: '0.9rem' }}>
                  <code>{text}</code>
                </Box>
                <Tooltip title="Copy">
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).catch(() => {});
                      }
                    }}
                    sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'grey.300', '&:hover': { bgcolor: 'grey.50' } }}
                    aria-label="Copy code"
                  >
                    <ContentCopyIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          },
          img: (props: any) => {
            const alt = props.alt as string | undefined;
            const src = props.src as string | undefined;
            return (
              <Box sx={{ my: 2, textAlign: 'center' }}>
                <img src={src} alt={alt} style={{ maxWidth: '100%', height: 'auto', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }} />
                {alt && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {alt}
                  </Typography>
                )}
              </Box>
            );
          },
          table: (props: any) => (
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', my: 2 }}>
              {props.children}
            </Box>
          ),
          thead: (props: any) => <Box component="thead">{props.children}</Box>,
          tbody: (props: any) => <Box component="tbody">{props.children}</Box>,
          tr: (props: any) => <Box component="tr">{props.children}</Box>,
          th: (props: any) => (
            <Box component="th" sx={{ border: '1px solid', borderColor: 'grey.300', p: 1, textAlign: 'left', bgcolor: 'grey.100', fontWeight: 600 }}>
              {props.children}
            </Box>
          ),
          td: (props: any) => (
            <Box component="td" sx={{ border: '1px solid', borderColor: 'grey.300', p: 1, textAlign: 'left', verticalAlign: 'top' }}>
              {props.children}
            </Box>
          )
        }}
      >
        {processed}
      </ReactMarkdown>
    </Box>
  );
};

// ArticleCard component for rendering individual articles
interface ArticleCardProps {
  article: Article;
  isAdmin: boolean;
  expandedArticles: Set<string>;
  toggleArticleContent: (id: string) => void;
  openEditDialog: (article: Article) => void;
  setConfirmDelete: (id: string) => void;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  isAdmin,
  expandedArticles,
  toggleArticleContent,
  openEditDialog,
  setConfirmDelete,
  selected = false,
  onToggleSelect
}) => (
  <Card
    sx={{
      borderRadius: 2,
      boxShadow: 1,
      border: '1px solid',
      borderColor: 'divider',
      '&:hover': {
        boxShadow: 2
      }
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {isAdmin && onToggleSelect && (
          <Checkbox
            checked={!!selected}
            onChange={() => onToggleSelect(article.id)}
            inputProps={{ 'aria-label': `select-${article.id}` }}
          />
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 0 }}>
            {article.title}
          </Typography>
          {article.status === 'DRAFT' && (
            <Chip label="Draft" size="small" color="warning" variant="outlined" />
          )}
        </Box>
        {article.header && (
          <Chip label={article.header} size="small" color="secondary" variant="outlined" sx={{ ml: 1 }} />
        )}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
          {article.category}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          • {article.readTime || computeReadTime(article.content)}
        </Typography>
        {isAdmin && (
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button
              startIcon={<EditIcon />}
              onClick={() => openEditDialog(article)}
              color="success"
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 1,
                fontWeight: 500,
                px: 2,
                py: 0.75,
                boxShadow: 1,
                letterSpacing: 0.3,
                '&:hover': { boxShadow: 2 }
              }}
            >
              Update
            </Button>
            <Button
              startIcon={<DeleteIcon />}
              onClick={() => setConfirmDelete(article.id)}
              color="error"
              variant="contained"
              size="small"
              sx={{
                textTransform: 'none',
                borderRadius: 1,
                fontWeight: 500,
                px: 2,
                py: 0.75,
                boxShadow: 1,
                letterSpacing: 0.3,
                '&:hover': { boxShadow: 2 }
              }}
            >
              Delete
            </Button>
          </Box>
        )}
      </Box>
      <Box sx={{ position: 'relative' }}>
        {article.content && (
          expandedArticles.has(article.id) ? (
            <Box>
              <MarkdownPreview content={article.content} hideLeadingH1 />
              <Button
                color="primary"
                onClick={() => toggleArticleContent(article.id)}
                endIcon={<ExpandLessIcon fontSize="small" />}
                sx={{
                  textTransform: 'none',
                  mt: 2,
                  fontWeight: 'medium',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Show Less
              </Button>
            </Box>
          ) : (
            <Box>
              <MarkdownPreview
                content={article.content.slice(0, 200) + (article.content.length > 200 ? '...' : '')}
                hideLeadingH1
              />
              <Button
                color="primary"
                onClick={() => toggleArticleContent(article.id)}
                endIcon={<ExpandMoreIcon fontSize="small" />}
                sx={{
                  textTransform: 'none',
                  mt: 1,
                  fontWeight: 'medium',
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Read More
              </Button>
            </Box>
          )
        )}
      </Box>
    </CardContent>
  </Card>
);

const ArticleLayout: React.FC<ArticleLayoutProps> = ({
  title,
  description,
  articles,
  isAdmin,
  handleEdit,
  handleDelete,
  handleCreate
}) => {
  // Contextual default tags based on category (used when creating a new article)
  const getDefaultTagsForCategory = (category?: ArticleCategory | string): string[] => {
    switch (category) {
      case ArticleCategory.SPRING_BOOT:
      case 'SPRING_BOOT':
        return ['Spring Boot'];
      case ArticleCategory.REACT:
      case 'REACT':
        return ['React'];
      case ArticleCategory.JAVA:
      case 'JAVA':
        return ['Java'];
      case ArticleCategory.POSTGRESQL:
      case 'POSTGRESQL':
        return ['PostgreSQL'];
      case ArticleCategory.DOCKER:
      case 'DOCKER':
        return ['Docker'];
      case ArticleCategory.MICROSERVICES:
      case 'MICROSERVICES':
        return ['Microservices'];
      default:
        return [];
    }
  };
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>(articles);
  const [viewDrafts, setViewDrafts] = useState<boolean>(false);
  const inferredCategory = (displayedArticles.length > 0 ? displayedArticles[0].category : (articles[0]?.category)) as ArticleCategory | undefined;
  const defaultTags = useMemo(() => getDefaultTagsForCategory(inferredCategory), [inferredCategory]);
  // Local state for dialogs and form fields
  const [open, setOpen] = useState(false);
  const [editArticleId, setEditArticleId] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [tagsInput, setTagsInput] = useState<string[]>(defaultTags);
  const [readTimeInput, setReadTimeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false); // Add loading state for delete action
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // File import helpers
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importedFileName, setImportedFileName] = useState<string>('');
  const contentTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  // Track which articles have their content expanded
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  // Track which tag groups are expanded (for organizing articles by tags)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Group input for create/edit dialog
  const [headerInput, setHeaderInput] = useState<string>('');
  // Selection for bulk group assignment
  const [selectedArticlesSet, setSelectedArticlesSet] = useState<Set<string>>(new Set());
  const [bulkHeaderDialogOpen, setBulkHeaderDialogOpen] = useState(false);
  const [bulkHeaderValue, setBulkHeaderValue] = useState('');

  const toggleSelectArticle = (id: string) => {
    setSelectedArticlesSet(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const applyHeaderToSelected = async (header: string) => {
    if (!handleEdit) return;
    const ids = Array.from(selectedArticlesSet);
    try {
      // update UI immediately for snappy feedback
      setDisplayedArticles(prev => prev.map(a => ids.includes(a.id) ? { ...a, header } : a));
      await Promise.all(ids.map(async (id) => {
        const article = displayedArticles.find(a => a.id === id) || articles.find(a => a.id === id);
        if (article) {
          await handleEdit({ ...article, header });
        }
      }));
      // refresh
      if (isAdmin) {
        if (viewDrafts) await loadDrafts(); else await loadPublished();
      }
      setSelectedArticlesSet(new Set());
      setBulkHeaderValue('');
      setBulkHeaderDialogOpen(false);
    } catch (e: any) {
      console.error('Failed to apply group to selected articles:', e);
      setError(e?.message || 'Failed to assign group to selected articles');
    }
  };

  // Helper function to group articles by their primary tag
  // Group articles by `header` (admin-assigned group) if present, otherwise by primary tag.
  // Returns a groups map and ungrouped array for items without tags/header.
  const groupArticlesByTag = (articlesData: Article[]) => {
    const groups: Record<string, Article[]> = {};
    const ungrouped: Article[] = [];

    articlesData.forEach(article => {
      const headerGroup = (article as any).header?.toString().trim();
      const primaryTag = article.tags && article.tags.length > 0 ? article.tags[0] : null;
      const groupKey = headerGroup || primaryTag;

      if (groupKey) {
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(article);
      } else {
        ungrouped.push(article);
      }
    });

    return { groups, ungrouped };
  };

  // Toggle group collapse state
  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prevState => {
      const newState = new Set(prevState);
      if (newState.has(groupName)) {
        newState.delete(groupName);
      } else {
        newState.add(groupName);
      }
      return newState;
    });
  };

  // Keep displayed list in sync with incoming props only when viewing published
  React.useEffect(() => {
    if (!viewDrafts) {
      setDisplayedArticles(articles);
    }
  }, [articles, viewDrafts]);

  const loadPublished = async () => {
    try {
      if (!inferredCategory) {
        setDisplayedArticles(articles);
        return;
      }
      const resp = await ArticleService.getArticlesByCategory(inferredCategory);
      setDisplayedArticles(resp.data);
    } catch (e) {
      setDisplayedArticles(articles);
    }
  };

  const loadDrafts = async () => {
    try {
      const resp = await ArticleService.getDrafts();
      const cat = inferredCategory;
      const data = Array.isArray(resp.data) ? resp.data : [];
      setDisplayedArticles(cat ? data.filter(a => a.category === cat) : data);
    } catch (e) {
      // If drafts fetch fails, keep current list
    }
  };

  // Content size checks (soft 250KB, hard 1MB)
  const SOFT_LIMIT = 250 * 1024; // 250KB
  const HARD_LIMIT = 1024 * 1024; // 1MB
  const contentBytes = typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(contentInput).length : contentInput.length;
  const overSoft = contentBytes > SOFT_LIMIT;
  const overHard = contentBytes > HARD_LIMIT;

  // Function to open edit mode for a specific article
  const openEditDialog = (article: Article) => {
    setEditArticleId(article.id);
    setTitleInput(article.title || '');
    setContentInput(article.content || '');
    setTagsInput(article.tags || getDefaultTagsForCategory(article.category));
    setReadTimeInput(article.readTime || '');
    setHeaderInput(article.header || '');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditArticleId(null);
    setTitleInput('');
    setContentInput('');
    setTagsInput(defaultTags); // Reset to contextual default tags
    setReadTimeInput('');
    setHeaderInput('');
    setError('');
    setImportedFileName('');
  };

  const handleMarkdownImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.md')) {
      // Use existing error alert area instead of blocking alert
      setError('Please select a Markdown (.md) file');
      return;
    }
    if (file.size > HARD_LIMIT) {
      setError('Selected file exceeds the 1 MB limit. Please choose a smaller Markdown file.');
      e.target.value = '';
      return;
    }
    try {
      // Helper: extract first H1 and return cleaned body without that heading
      const splitMdHeading = (md: string): { heading: string | null; body: string } => {
        const normalized = md.replace(/^\uFEFF/, ''); // strip BOM if present
        const lines = normalized.split(/\r?\n/);
        let i = 0;
        // Skip YAML frontmatter if present
        if (lines[i]?.trim() === '---') {
          i++;
          while (i < lines.length && lines[i].trim() !== '---') i++;
          if (i < lines.length) i++; // skip closing '---'
        }
        // Skip leading blank lines
        while (i < lines.length && lines[i].trim() === '') i++;
        if (i < lines.length && /^#\s*/.test(lines[i])) { // accept optional space after '#'
          const heading = lines[i].replace(/^#\s*/, '').trim();
          i++;
          // Skip a single blank line after the heading if present
          if (i < lines.length && lines[i].trim() === '') i++;
          const body = lines.slice(i).join('\n').replace(/^\s+/, '');
          return { heading, body };
        }
        return { heading: null, body: normalized };
      };

      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) || '';
        const { heading, body } = splitMdHeading(text);
        if (!titleInput && heading) {
          setTitleInput(heading);
        }
        setContentInput(body || text);
        setImportedFileName(file.name);
        // Compute read time primarily
        setReadTimeInput(computeReadTime(body || text));
      };
      reader.readAsText(file);
    } finally {
      // allow re-selecting the same file
      e.target.value = '';
    }
  };
  
  // Toggle content expansion for an article
  const toggleArticleContent = (articleId: string) => {
    setExpandedArticles(prevState => {
      const newState = new Set(prevState);
      if (newState.has(articleId)) {
        newState.delete(articleId);
      } else {
        newState.add(articleId);
      }
      return newState;
    });
  };

  // Removed generic handleSubmit; we now always save via explicit Draft/Publish buttons

  const handleSubmitWithStatus = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!titleInput?.trim() || !contentInput?.trim()) {
      setError('Title and content are required');
      return;
    }
    if (overHard) {
      setError('Content exceeds the 1 MB limit. Please reduce the size before saving.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const categoryValue = articles.length > 0 ? articles[0].category : ArticleCategory.SPRING_BOOT;
      const baseData = {
        title: titleInput.trim(),
        content: contentInput,
        tags: tagsInput.length ? tagsInput : getDefaultTagsForCategory(categoryValue),
        // Use computed read-time primarily; allow admin override if they changed readTimeInput
        readTime: (readTimeInput && readTimeInput.trim()) || computeReadTime(contentInput),
        category: categoryValue,
        header: headerInput && headerInput.trim() ? headerInput.trim() : undefined,
        status
      } as const;

      if (editArticleId) {
        const articleToEdit = displayedArticles.find(a => a.id === editArticleId) || articles.find(a => a.id === editArticleId);
        if (articleToEdit && handleEdit) {
          await handleEdit({
            ...articleToEdit,
            ...baseData,
            description: articleToEdit.description
          });
          // update local UI immediately
          setDisplayedArticles(prev => prev.map(a => a.id === editArticleId ? { ...a, ...baseData, description: articleToEdit.description } : a));
        } else {
          setError('Could not find article to edit');
        }
      } else if (handleCreate) {
        await handleCreate({
          ...baseData,
          description: ''
        } as any);
        // optimistic add - refresh will run shortly
        setDisplayedArticles(prev => [{
          id: `new-${Date.now()}`,
          title: baseData.title,
          description: '',
          content: baseData.content,
          tags: baseData.tags as string[],
          readTime: baseData.readTime,
          category: baseData.category as ArticleCategory,
          status: baseData.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          header: baseData.header
        }, ...prev]);
      }
      handleClose();
      // refresh current view after save/publish
      if (isAdmin) {
        if (status === 'DRAFT' || viewDrafts) {
          await loadDrafts();
        } else {
          await loadPublished();
        }
      }
    } catch (error: any) {
      console.error('Error saving with status:', error);
      setError(error?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, px: 0, width: '100%' }}>
      <Container
        maxWidth="md"
        sx={{
          mt: 4,
          mb: 4,
          flexGrow: 1,
          minWidth: 0
        }}
      >
        <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header Section (styled like Blogs) */}
        <Box sx={{ mb: 4, width: '100%' }}>
          <Box sx={{ width: '100%' }}>
            <Typography variant="h4" gutterBottom sx={{ mb: 2, fontWeight: 'bold', color: '#1976d2' }}>
              {title}
            </Typography>
            <Box sx={{ mb: 2 }}>
              <MarkdownPreview content={description} stripFootnotes />
            </Box>
            {isAdmin && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  mb: 2,
                  flexWrap: 'nowrap'
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    px: 1,
                    py: 0.5,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    flexShrink: 0
                  }}
                >
                  Admin
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                  <Button
                    variant={viewDrafts ? 'outlined' : 'contained'}
                    color="secondary"
                    onClick={async () => { setViewDrafts(false); await loadPublished(); }}
                    sx={{
                      textTransform: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Published
                  </Button>
                  <Button
                    variant={viewDrafts ? 'contained' : 'outlined'}
                    color="secondary"
                    onClick={async () => { setViewDrafts(true); await loadDrafts(); }}
                    sx={{
                      textTransform: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Drafts
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => {
                      // Ensure fresh create mode and clear any stale edit state
                      setEditArticleId(null);
                      setTitleInput('');
                      setContentInput('');
                      setTagsInput(defaultTags);
                      setReadTimeInput('');
                      setError('');
                      setImportedFileName('');
                      setHeaderInput('');
                      setOpen(true);
                    }}
                    startIcon={<EditIcon />}
                    sx={{
                      borderRadius: 2,
                      boxShadow: 2,
                      textTransform: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    New Article
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setBulkHeaderDialogOpen(true)}
                    disabled={selectedArticlesSet.size === 0}
                    sx={{ ml: 1, textTransform: 'none' }}
                  >
                    Assign Group
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
          
          <Box sx={{ borderTop: '2px solid #e0e0e0', mt: 1 }} />
          
          
          
          
          
          
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: 2
              }}
              onClose={() => setError('')}
            >
              {error}
            </Alert>
          )}
        </Box>
        {/* Empty-state when there are no articles to show */}
        {displayedArticles.length === 0 && (
          <Box sx={{ my: 2 }}>
            <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>
              No articles found for this category.
            </Alert>
            {isAdmin && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setEditArticleId(null);
                  setTitleInput('');
                  setContentInput('');
                  setTagsInput(defaultTags);
                  setReadTimeInput('');
                  setError('');
                  setImportedFileName('');
                  setHeaderInput('');
                  setOpen(true);
                }}
                startIcon={<EditIcon />}
                sx={{ borderRadius: 2, boxShadow: 2, textTransform: 'none' }}
              >
                Create First Article
              </Button>
            )}
          </Box>
        )}

        {/* Articles list - now organized by tag groups with collapsible sections */}
        <Box>
          {(() => {
            const { groups, ungrouped } = groupArticlesByTag(displayedArticles);
            const sortedGroupNames = Object.keys(groups).sort();

            return (
              <Stack spacing={2}>
                {/* Render grouped articles */}
                {sortedGroupNames.map((groupName) => (
                  <Accordion
                    key={groupName}
                    defaultExpanded={!collapsedGroups.has(groupName)}
                    onChange={() => toggleGroupCollapse(groupName)}
                    sx={{
                      borderRadius: 2,
                      boxShadow: 1,
                      '&:before': { display: 'none' },
                      '&.Mui-expanded': { m: 0 },
                      '&:hover': { boxShadow: 2 }
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        p: 0,
                        minHeight: 56,
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        '& .MuiAccordionSummary-content': {
                          margin: 0,
                          alignItems: 'center',
                          gap: 1,
                          py: 1.5,
                          px: 2
                        },
                        '& .MuiAccordionSummary-expandIconWrapper': {
                          color: 'primary.main'
                        },
                        '&:hover': { boxShadow: 2 }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                          {groupName}
                        </Typography>
                        {/* Removed group count chip for cleaner header display */}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, bgcolor: 'background.paper' }}>
                      <Stack spacing={2} sx={{ p: 2 }}>
                        {groups[groupName].map((article) => (
                          <ArticleCard
                            key={article.id}
                            article={article}
                            isAdmin={isAdmin}
                            expandedArticles={expandedArticles}
                            toggleArticleContent={toggleArticleContent}
                            openEditDialog={openEditDialog}
                            setConfirmDelete={setConfirmDelete}
                            selected={selectedArticlesSet.has(article.id)}
                            onToggleSelect={toggleSelectArticle}
                          />
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}

                {/* Render ungrouped articles */}
                {ungrouped.length > 0 && (
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2, mb: 0, color: '#2c3e50' }}>
                      Other Articles
                    </Typography>
                    {ungrouped.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isAdmin={isAdmin}
                        expandedArticles={expandedArticles}
                        toggleArticleContent={toggleArticleContent}
                        openEditDialog={openEditDialog}
                        setConfirmDelete={setConfirmDelete}
                        selected={selectedArticlesSet.has(article.id)}
                        onToggleSelect={toggleSelectArticle}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            );
          })()}
        </Box>

        {/* Old non-grouped rendering - removed, using grouped version above */}
        <Stack spacing={2} sx={{ display: 'none' }}>
          {displayedArticles.map((article) => (
            <Card key={article.id} sx={{
              borderRadius: 2,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50', mb: 0 }}>
                    {article.title}
                  </Typography>
                  {article.status === 'DRAFT' && (
                    <Chip label="Draft" size="small" color="warning" variant="outlined" />
                  )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                    {article.category}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • {article.readTime || computeReadTime(article.content)}
                  </Typography>
                  {isAdmin && (
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => openEditDialog(article)}
                        color="success"
                        variant="contained"
                        size="small"
                        sx={{
                          textTransform: 'none',
                          borderRadius: 1,
                          fontWeight: 500,
                          px: 2,
                          py: 0.75,
                          boxShadow: 1,
                          letterSpacing: 0.3,
                          '&:hover': { boxShadow: 2 }
                        }}
                      >
                        Update
                      </Button>
                      <Button
                        startIcon={<DeleteIcon />}
                        onClick={() => setConfirmDelete(article.id)}
                        color="error"
                        variant="contained"
                        size="small"
                        sx={{
                          textTransform: 'none',
                          borderRadius: 1,
                          fontWeight: 500,
                          px: 2,
                          py: 0.75,
                          boxShadow: 1,
                          letterSpacing: 0.3,
                          '&:hover': { boxShadow: 2 }
                        }}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Box>
                <Box sx={{ position: 'relative' }}>

                  {article.content && (
                    expandedArticles.has(article.id) ? (
                      <Box>
                        <MarkdownPreview content={article.content} hideLeadingH1 />
                        <Button
                          color="primary"
                          onClick={() => toggleArticleContent(article.id)}
                          endIcon={<ExpandLessIcon fontSize="small" />}
                          sx={{ 
                            textTransform: 'none',
                            mt: 2,
                            fontWeight: 'medium',
                            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          Show Less
                        </Button>
                      </Box>
                    ) : (
                      <Box>
                        <MarkdownPreview content={article.content.slice(0, 200) + (article.content.length > 200 ? '...' : '')} hideLeadingH1 />
                        <Button
                          color="primary"
                          onClick={() => toggleArticleContent(article.id)}
                          endIcon={<ExpandMoreIcon fontSize="small" />}
                          sx={{ 
                            textTransform: 'none',
                            mt: 1,
                            fontWeight: 'medium',
                            '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                          }}
                        >
                          Read More
                        </Button>
                      </Box>
                    )
                  )}
                </Box>
                {/* Action buttons now inline with category/read time above; bottom bar removed */}
              </CardContent>
            </Card>
          ))}
  </Stack>
  </Paper>
  {/* Bulk group assignment dialog */}
  <Dialog open={bulkHeaderDialogOpen} onClose={() => setBulkHeaderDialogOpen(false)} maxWidth="xs" fullWidth>
    <DialogTitle>Assign Group to Selected Articles</DialogTitle>
    <DialogContent>
      <TextField
        label="Group"
        value={bulkHeaderValue}
        onChange={(e) => setBulkHeaderValue(e.target.value)}
        fullWidth
        variant="outlined"
        placeholder="Enter group name to apply to selected articles"
        sx={{ mt: 1 }}
      />
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Selected: {selectedArticlesSet.size}</Typography>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button onClick={() => setBulkHeaderDialogOpen(false)}>Cancel</Button>
      <Button
        variant="contained"
        onClick={() => applyHeaderToSelected(bulkHeaderValue)}
        disabled={!bulkHeaderValue.trim() || selectedArticlesSet.size === 0}
      >
        Apply
      </Button>
    </DialogActions>
  </Dialog>
  {/* Dialogs for create/edit and delete */}
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 3
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'grey.50', px: 3, py: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              {editArticleId ? 'Edit Article' : 'Create New Article'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Stack spacing={3}>
              {error && (
                <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: 1 }}>
                  {error}
                </Alert>
              )}
              <TextField
                label="Title"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                fullWidth
                required
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
              <TextField
                label="Group (optional)"
                value={headerInput}
                onChange={(e) => setHeaderInput(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="Group name for this article"
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 1 },
                  mt: 1
                }}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <TextField
                  label="Content (Markdown supported)"
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  multiline
                  rows={6}
                  fullWidth
                  variant="outlined"
                  placeholder="# Heading\n\nParagraph text\n\n- List item\n- Another item"
                  inputRef={contentTextAreaRef}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    },
                    '& .MuiInputBase-input, & .MuiInputBase-inputMultiline': {
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
                      fontSize: '0.95rem',
                      lineHeight: 1.6
                    }
                  }}
                />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, pt: 0.5 }}>
                  <input
                    type="file"
                    accept=".md"
                    onChange={handleMarkdownImport}
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                  />
                  <Tooltip title="Import Markdown (.md)">
                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Import markdown"
                      sx={{
                        bgcolor: 'primary.main',
                        color: '#fff',
                        '&:hover': { bgcolor: 'primary.dark' },
                        boxShadow: 1
                      }}
                    >
                      <UploadFileIcon />
                    </IconButton>
                  </Tooltip>
                  {importedFileName && (
                    <Tooltip title="Clear imported content">
                      <IconButton
                        onClick={() => { setContentInput(''); setImportedFileName(''); }}
                        aria-label="Clear imported markdown"
                        sx={{
                          bgcolor: 'error.main',
                          color: '#fff',
                          '&:hover': { bgcolor: 'error.dark' },
                          boxShadow: 1
                        }}
                      >
                        <ClearIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              {importedFileName && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <UploadFileIcon fontSize="small" /> Imported from: {importedFileName}
                </Typography>
              )}
              {/* Toolbar: helpers on the left, size on the right */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                <Stack direction="row" spacing={1}>
                  <Button
                    onClick={() => {
                      const textArea = contentTextAreaRef.current;
                      const start = textArea ? textArea.selectionStart : contentInput.length;
                      const end = textArea ? textArea.selectionEnd : contentInput.length;
                      let divider = '\n---\n';
                      if (!contentInput.endsWith('\n\n')) {
                        divider = '\n\n' + divider;
                      }
                      if (!contentInput.substring(end).startsWith('\n')) {
                        divider = divider + '\n';
                      }
                      const newContent = contentInput.substring(0, start) + divider + contentInput.substring(end);
                      setContentInput(newContent);
                      setTimeout(() => {
                        if (textArea) {
                          const newPosition = start + divider.length;
                          textArea.focus();
                          textArea.selectionStart = textArea.selectionEnd = newPosition;
                        }
                      }, 0);
                    }}
                    variant="text"
                    size="small"
                  >
                    Insert Divider
                  </Button>
                  <Button
                    onClick={() => {
                      const textArea = contentTextAreaRef.current;
                      if (!textArea) return;
                      const start = textArea.selectionStart;
                      const end = textArea.selectionEnd;
                      const selectedText = contentInput.substring(start, end);
                      const newContent = contentInput.substring(0, start) + '**' + (selectedText || '') + '**' + contentInput.substring(end);
                      setContentInput(newContent);
                      setTimeout(() => {
                        textArea.focus();
                        if (selectedText) {
                          textArea.selectionStart = textArea.selectionEnd = start + selectedText.length + 4;
                        } else {
                          textArea.selectionStart = textArea.selectionEnd = start + 2;
                        }
                      }, 0);
                    }}
                    variant="text"
                    size="small"
                  >
                    Bold Text
                  </Button>
                  <Button
                    onClick={() => {
                      const ta = contentTextAreaRef.current;
                      if (!ta) return;
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const selected = contentInput.substring(start, end);
                      // If nothing selected, insert a starter list item on new line
                      if (!selected) {
                        const insert = (contentInput.endsWith('\n') ? '' : '\n') + '- ';
                        const updated = contentInput.substring(0, start) + insert + contentInput.substring(end);
                        setContentInput(updated);
                        setTimeout(() => {
                          ta.focus();
                          const pos = start + insert.length;
                          ta.selectionStart = ta.selectionEnd = pos;
                        }, 0);
                        return;
                      }
                      const lines = selected.split(/\r?\n/);
                      const transformed = lines.map(l => {
                        const trimmed = l.replace(/^\s+/, '');
                        if (/^(?:- |\* |\d+\. )/.test(trimmed)) return l; // already a list-ish
                        return (l ? '- ' + trimmed : l);
                      }).join('\n');
                      const updated = contentInput.substring(0, start) + transformed + contentInput.substring(end);
                      setContentInput(updated);
                      setTimeout(() => {
                        ta.focus();
                        ta.selectionStart = start;
                        ta.selectionEnd = start + transformed.length;
                      }, 0);
                    }}
                    variant="text"
                    size="small"
                  >
                    Bulleted List
                  </Button>
                  <Button
                    onClick={() => {
                      const ta = contentTextAreaRef.current;
                      if (!ta) return;
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const selected = contentInput.substring(start, end);
                      if (!selected) {
                        const insert = (contentInput.endsWith('\n') ? '' : '\n') + '1. ';
                        const updated = contentInput.substring(0, start) + insert + contentInput.substring(end);
                        setContentInput(updated);
                        setTimeout(() => {
                          ta.focus();
                          const pos = start + insert.length;
                          ta.selectionStart = ta.selectionEnd = pos;
                        }, 0);
                        return;
                      }
                      const lines = selected.split(/\r?\n/);
                      let counter = 1;
                      const transformed = lines.map(l => {
                        const trimmed = l.replace(/^\s+/, '');
                        if (/^(?:- |\* |\d+\. )/.test(trimmed)) return l; // already list-like
                        const prefix = (trimmed.length > 0) ? (counter++ + '. ') : '';
                        return prefix + trimmed;
                      }).join('\n');
                      const updated = contentInput.substring(0, start) + transformed + contentInput.substring(end);
                      setContentInput(updated);
                      setTimeout(() => {
                        ta.focus();
                        ta.selectionStart = start;
                        ta.selectionEnd = start + transformed.length;
                      }, 0);
                    }}
                    variant="text"
                    size="small"
                  >
                    Numbered List
                  </Button>
                </Stack>
                <Typography variant="caption" color={overHard ? 'error.main' : overSoft ? 'warning.main' : 'text.secondary'}>
                  Size: {formatBytes(contentBytes)}{overHard ? ' (over 1 MB limit)' : overSoft ? ' (getting large)' : ''}
                </Typography>
              </Box>

              {overHard && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 1 }}>
                  Content exceeds the 1 MB limit. Please remove images/sections or split into multiple articles.
                </Alert>
              )}
              {!overHard && overSoft && (
                <Alert severity="warning" sx={{ mt: 1, borderRadius: 1 }}>
                  Your content is getting large (over 250 KB). Consider trimming or splitting for faster loads.
                </Alert>
              )}

              {/* Preview section like Blogs */}
              {contentInput && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Preview
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{ p: 2, minHeight: '200px', bgcolor: 'grey.50' }}
                  >
                    <MarkdownPreview content={contentInput} />
                  </Paper>
                </Box>
              )}
              <TextField
                label="Read Time (e.g., '5 min read')"
                value={readTimeInput}
                onChange={(e) => setReadTimeInput(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder="5 min read"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1
                  }
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    // Recompute using current content, including code when enabled
                    const recomputed = computeReadTime(contentInput);
                    setReadTimeInput(recomputed);
                  }}
                >
                  Recompute Read Time (include code if enabled)
                </Button>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setReadTimeInput('')}
                >
                  Clear
                </Button>
              </Box>
              {/* Admin Published/Drafts toggle lives in header; no toggle inside dialog */}
              <Box>
                <TextField
                  label="Tags (comma separated)"
                  placeholder="Spring, REST, API"
                  fullWidth
                  variant="outlined"
                  // Display current tags as comma-separated string in the input field
                  value={tagsInput.join(', ')}
                  onChange={(e) => {
                    const tagInput = e.target.value;
                    const tagArray = tagInput
                      .split(',')
                      .map(tag => tag.trim())
                      .filter(tag => tag.length > 0);
                    setTagsInput(tagArray);
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {tagsInput.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag} 
                      size="small" 
                      onDelete={() => {
                        setTagsInput(tagsInput.filter((_, i) => i !== index));
                      }} 
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0', gap: 1, flexWrap: 'wrap' }}>
            <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            {isAdmin && (
              <>
                <Button
                  onClick={() => handleSubmitWithStatus('DRAFT')}
                  variant="contained"
                  color="secondary"
                  disabled={loading || !titleInput?.trim() || !contentInput?.trim() || overHard}
                  sx={{ borderRadius: 1 }}
                >
                  {loading ? 'Saving...' : editArticleId ? 'Save Draft' : 'Save as Draft'}
                </Button>
                <Button
                  onClick={() => handleSubmitWithStatus('PUBLISHED')}
                  variant="contained"
                  color="success"
                  disabled={loading || !titleInput?.trim() || !contentInput?.trim() || overHard}
                  sx={{ borderRadius: 1 }}
                >
                  {loading ? 'Saving...' : 'Publish'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
        <Dialog
          open={confirmDelete !== null}
          onClose={() => setConfirmDelete(null)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 3
            }
          }}
        >
          <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', bgcolor: 'error.light', color: 'error.contrastText', px: 3, py: 2 }}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ px: 3, py: 3 }}>
            <Typography>
              Are you sure you want to delete this article? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button onClick={() => setConfirmDelete(null)} variant="outlined" sx={{ borderRadius: 1 }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmDelete) {
                  setDeleteLoading(true);
                  // Call handleDelete and then close the dialog regardless of success/failure
                  Promise.resolve(handleDelete(confirmDelete))
                    .finally(() => {
                      setDeleteLoading(false);
                      setConfirmDelete(null); // Close the dialog after confirming delete
                    });
                }
              }}
              color="error"
              variant="contained"
              disabled={deleteLoading}
              sx={{ borderRadius: 1, px: 3 }}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
      <Box
  sx={{
    marginTop: '0',
    ml: 6,
    alignSelf: 'flex-start',
    position: 'sticky',
    top: '5rem',
    width: '200px',  // Match the ad's width to reduce space
    display: 'flex',  // Enable flexbox for alignment
    justifyContent: 'flex-end',  // Push ad to the right
    mr: 1,  // Optional: Small right margin for slight spacing from the border
  }}
>
  <Advertisement />
</Box>
      </Box>  
  );
};

// Helper to format bytes nicely
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

export default ArticleLayout;