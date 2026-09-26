import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  Printer, 
  Download, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Layout, 
  RefreshCw, 
  Terminal, 
  Calendar,
  Layers,
  ChevronRight,
  BookOpen,
  Cpu
} from 'lucide-react';

interface ArticleSection {
  id: string;
  heading: string;
  content: string;
  tag?: string;
}

interface NewsletterModel {
  id: string;
  title: string;
  subtitle: string;
  issueNumber: string;
  template: 'modern' | 'corporate' | 'campus' | 'minimal';
  publishDate: string;
  sourceDocName: string;
  highlights: string[];
  sections: ArticleSection[];
  footerNote: string;
  stats: {
    wordCount: number;
    estimatedReadTime: string;
    sectionCount: number;
  };
  createdAt: string;
}

interface HealthData {
  status: string;
  service: string;
  commit: string;
  timestamp: string;
}

export default function App() {
  const [newsletters, setNewsletters] = useState<NewsletterModel[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'editor' | 'preview' | 'archive' | 'devops'>('create');
  const [selectedNewsletter, setSelectedNewsletter] = useState<NewsletterModel | null>(null);
  const [healthInfo, setHealthInfo] = useState<HealthData | null>(null);

  // Form input state
  const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
  const [pastedText, setPastedText] = useState<string>(`# Annual Department Circular: School of Computer Science & Engineering
## Commissioning of Next-Generation DevOps Sandbox
MIT World Peace University has officially inaugurated the state-of-the-art Cloud Computing & DevOps testing sandbox.
The dedicated cluster facilitates high-velocity CI/CD deployments and real-world microservice container orchestration.

- High-speed 10Gbps interconnected nodes with Linux workstations
- Direct continuous deployment pipelines connected to cloud staging instances
- Enhanced observability metrics and automated linting harnesses

## Guidelines for CCA 2 Project Submissions
All student engineering teams must adhere to standard version control practices. Every deployment artifact must be accompanied by an automated test suite, Docker container specifications, and an active health probe.`);
  const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'corporate' | 'campus' | 'minimal'>('campus');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editor editable state
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editTemplate, setEditTemplate] = useState<'modern' | 'corporate' | 'campus' | 'minimal'>('campus');
  const [editHighlights, setEditHighlights] = useState<string[]>([]);
  const [editSections, setEditSections] = useState<ArticleSection[]>([]);
  const [editFooter, setEditFooter] = useState('');

  // Fetch initial data
  const fetchNewsletters = async () => {
    try {
      const res = await fetch('/api/newsletters');
      if (res.ok) {
        const data = await res.json();
        setNewsletters(data);
        if (data.length > 0 && !selectedNewsletter) {
          setSelectedNewsletter(data[0]);
        }
      }
    } catch {
      // Offline fallback
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        setHealthInfo(data);
      }
    } catch {
      setHealthInfo({
        status: 'local',
        service: 'docnews',
        commit: 'local',
        timestamp: new Date().toISOString(),
      });
    }
  };

  useEffect(() => {
    fetchNewsletters();
    fetchHealth();
  }, []);

  const handleCreateNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('template', selectedTemplate);

      if (inputMode === 'upload') {
        if (!uploadedFile) {
          throw new Error('Please select a .docx, .md, or .txt file to upload.');
        }
        formData.append('documentFile', uploadedFile);
      } else {
        if (!pastedText.trim()) {
          throw new Error('Please paste your document text or syllabus brief.');
        }
        formData.append('pastedText', pastedText);
      }

      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate newsletter');
      }

      setNewsletters((prev) => [data.newsletter, ...prev]);
      loadIntoEditor(data.newsletter);
      setSuccessMessage('Document successfully processed into structured newsletter!');
      setActiveTab('editor');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred during conversion');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadIntoEditor = (nl: NewsletterModel) => {
    setSelectedNewsletter(nl);
    setEditTitle(nl.title);
    setEditSubtitle(nl.subtitle);
    setEditTemplate(nl.template);
    setEditHighlights([...nl.highlights]);
    setEditSections([...nl.sections]);
    setEditFooter(nl.footerNote);
  };

  const handleSaveEditor = async () => {
    if (!selectedNewsletter) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/newsletters/${selectedNewsletter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          subtitle: editSubtitle,
          template: editTemplate,
          highlights: editHighlights,
          sections: editSections,
          footerNote: editFooter,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes');

      setSelectedNewsletter(data.newsletter);
      setNewsletters((prev) => prev.map((n) => (n.id === data.newsletter.id ? data.newsletter : n)));
      setSuccessMessage('Newsletter updated successfully!');
      setActiveTab('preview');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating newsletter');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved newsletter?')) return;
    try {
      const res = await fetch(`/api/newsletters/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNewsletters((prev) => prev.filter((n) => n.id !== id));
        if (selectedNewsletter?.id === id) {
          setSelectedNewsletter(newsletters.find((n) => n.id !== id) || null);
        }
      }
    } catch {
      alert('Failed to delete newsletter');
    }
  };

  // Theme styling configurations
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'corporate':
        return {
          wrapper: 'bg-slate-50 text-slate-900 border-t-8 border-indigo-900',
          accent: 'text-indigo-950',
          badge: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
          highlightBox: 'bg-indigo-50/70 border-l-4 border-indigo-600 text-indigo-950',
          divider: 'border-slate-300',
          card: 'bg-white border border-slate-200 shadow-sm',
        };
      case 'modern':
        return {
          wrapper: 'bg-gradient-to-b from-blue-50/50 to-white text-slate-900 border-t-8 border-sky-500',
          accent: 'text-sky-900',
          badge: 'bg-sky-500 text-white font-medium',
          highlightBox: 'bg-sky-50 border-l-4 border-sky-500 text-sky-950',
          divider: 'border-sky-100',
          card: 'bg-white border border-sky-100 shadow-md',
        };
      case 'minimal':
        return {
          wrapper: 'bg-white text-stone-900 border-t-4 border-stone-800',
          accent: 'text-stone-900',
          badge: 'bg-stone-100 text-stone-700 border border-stone-300',
          highlightBox: 'bg-stone-50 border-l-2 border-stone-500 text-stone-800',
          divider: 'border-stone-200',
          card: 'bg-white border border-stone-200',
        };
      case 'campus':
      default:
        return {
          wrapper: 'bg-amber-50/30 text-slate-900 border-t-8 border-red-800',
          accent: 'text-red-950',
          badge: 'bg-red-800 text-white font-semibold',
          highlightBox: 'bg-amber-100/60 border-l-4 border-amber-600 text-amber-950',
          divider: 'border-amber-200',
          card: 'bg-white border border-amber-200 shadow-sm',
        };
    }
  };

  const currentTheme = selectedNewsletter ? getThemeClasses(selectedNewsletter.template) : getThemeClasses('campus');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
                  DOCNEWS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  CCA 2 Project
                </span>
              </div>
              <p className="text-xs text-slate-400">Document to Structured Newsletter Converter</p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>Convert</span>
            </button>

            <button
              onClick={() => {
                if (selectedNewsletter) {
                  loadIntoEditor(selectedNewsletter);
                  setActiveTab('editor');
                } else if (newsletters.length > 0) {
                  loadIntoEditor(newsletters[0]);
                  setActiveTab('editor');
                } else {
                  setActiveTab('create');
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>Editor</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Eye className="h-4 w-4" />
              <span>Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'archive'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Saved ({newsletters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('devops')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'devops'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-indigo-300 hover:bg-indigo-950/60'
              }`}
            >
              <Cpu className="h-4 w-4" />
              <span className="hidden md:inline">DevOps Pipeline</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Banner Alert if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-200">×</button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200">×</button>
          </div>
        )}

        {/* TAB 1: CONVERT & DOCUMENT EXTRACTION */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Input Form Column */}
            <div className="lg:col-span-8 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                    Document Ingestion & Generation
                  </h2>
                  <p className="text-xs text-slate-400">Select your document source and choose a visual layout template.</p>
                </div>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setInputMode('paste')}
                    className={`px-3 py-1 rounded-md font-medium transition ${
                      inputMode === 'paste' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('upload')}
                    className={`px-3 py-1 rounded-md font-medium transition ${
                      inputMode === 'upload' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Upload File (.docx/.md)
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateNewsletter} className="space-y-6">
                {inputMode === 'paste' ? (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Document Content (Markdown, Circular Text, or Notes)
                    </label>
                    <textarea
                      rows={10}
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="# Enter Document Title\n## Section 1 Heading\nDocument paragraphs and key points..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                      Upload Document (.docx, .md, or .txt)
                    </label>
                    <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-900/50 transition">
                      <UploadCloud className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                      <input
                        type="file"
                        accept=".docx,.md,.txt"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadedFile(e.target.files[0]);
                          }
                        }}
                        className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Supports Microsoft Word (.docx via Mammoth extraction) and Markdown (.md)
                      </p>
                      {uploadedFile && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-900/40 text-blue-200 text-xs border border-blue-700">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                          Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Template Selection */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                    Select Newsletter Template
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'campus', name: 'Campus', desc: 'University editorial style', color: 'border-red-600 bg-red-950/20' },
                      { id: 'corporate', name: 'Corporate', desc: 'Executive navy & sharp lines', color: 'border-indigo-600 bg-indigo-950/20' },
                      { id: 'modern', name: 'Modern', desc: 'Clean sky-blue layout', color: 'border-sky-500 bg-sky-950/20' },
                      { id: 'minimal', name: 'Minimal', desc: 'Monochrome typographic format', color: 'border-stone-400 bg-stone-900' },
                    ].map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id as 'modern' | 'corporate' | 'campus' | 'minimal')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                          selectedTemplate === tpl.id
                            ? `${tpl.color} ring-2 ring-blue-500/50`
                            : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-sm text-white">{tpl.name}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{tpl.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      Parsing & Synthesizing Newsletter...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Generate Structured Newsletter
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Sidebar Guide & Academic Context */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  Deterministic Engine Logic
                </h3>
                <ul className="text-xs text-slate-400 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                    <span><strong>Headline Derivation:</strong> Extracts H1/Title from `# ` or top uppercase sentence.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                    <span><strong>Sections:</strong> Splits document by H2 (`## `) or colon headers into discrete story modules.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                    <span><strong>Highlights:</strong> Filters bullet points (`- `, `* `) into high-impact key summaries.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                    <span><strong>DOCX Handling:</strong> `mammoth` streams raw paragraphs safely without external services.</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Layout className="h-4 w-4 text-amber-400" />
                  CCA 2 Assignment Rubrics
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  This project fulfills the individual DevOps coursework requirements for MIT World Peace University:
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Dynamic Express backend with stored state</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Forms with server-side mutations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>JSON API & <code>/health</code> probe with Commit ID</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Automated tests (node:test) & Docker ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NEWSLETTER EDITOR */}
        {activeTab === 'editor' && selectedNewsletter && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-blue-400" />
                  Newsletter Content & Section Editor
                </h2>
                <p className="text-xs text-slate-400">
                  Modify headlines, add/remove highlights, and edit section paragraphs before previewing.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="h-4 w-4" />
                  View Preview
                </button>
                <button
                  onClick={handleSaveEditor}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save & Apply Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Newsletter Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle / Edition Tagline</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
                />
              </div>
            </div>

            {/* Template Selector in Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Active Visual Theme</label>
              <div className="flex gap-2">
                {(['campus', 'corporate', 'modern', 'minimal'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditTemplate(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize border transition ${
                      editTemplate === t
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlights Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Executive Highlights (Bullet summaries)
              </label>
              <div className="space-y-2">
                {editHighlights.map((hl, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={hl}
                      onChange={(e) => {
                        const newHl = [...editHighlights];
                        newHl[idx] = e.target.value;
                        setEditHighlights(newHl);
                      }}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setEditHighlights(editHighlights.filter((_, i) => i !== idx))}
                      className="p-2 text-red-400 hover:bg-slate-800 rounded-lg text-xs"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditHighlights([...editHighlights, 'New bulletin announcement'])}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  + Add Highlight Point
                </button>
              </div>
            </div>

            {/* Story Sections */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Article Sections & Body Paragraphs
              </label>
              <div className="space-y-4">
                {editSections.map((sec, idx) => (
                  <div key={sec.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Section #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditSections(editSections.filter((s) => s.id !== sec.id))}
                        className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove Section
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="Tag (e.g., Campus, Lab)"
                        value={sec.tag || ''}
                        onChange={(e) => {
                          const updated = [...editSections];
                          updated[idx].tag = e.target.value;
                          setEditSections(updated);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                      <input
                        type="text"
                        placeholder="Section Heading"
                        value={sec.heading}
                        onChange={(e) => {
                          const updated = [...editSections];
                          updated[idx].heading = e.target.value;
                          setEditSections(updated);
                        }}
                        className="sm:col-span-2 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                      />
                    </div>

                    <textarea
                      rows={4}
                      value={sec.content}
                      onChange={(e) => {
                        const updated = [...editSections];
                        updated[idx].content = e.target.value;
                        setEditSections(updated);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setEditSections([
                      ...editSections,
                      {
                        id: `sec-${Date.now()}`,
                        heading: 'New Focus Area',
                        content: 'Insert content extracted from document or authored directly.',
                        tag: 'General',
                      },
                    ])
                  }
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                >
                  + Add Article Section
                </button>
              </div>
            </div>

            {/* Footer Text */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Footer Attribution</label>
              <input
                type="text"
                value={editFooter}
                onChange={(e) => setEditFooter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL NEWSLETTER PREVIEW */}
        {activeTab === 'preview' && selectedNewsletter && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Current Theme:</span>
                <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-bold text-xs uppercase border border-blue-500/30">
                  {selectedNewsletter.template}
                </span>
                <span className="text-xs text-slate-500">• {selectedNewsletter.stats.estimatedReadTime}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    loadIntoEditor(selectedNewsletter);
                    setActiveTab('editor');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Newsletter
                </button>

                <a
                  href={`/api/newsletters/${selectedNewsletter.id}/export-html`}
                  download
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export HTML
                </a>

                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Save PDF
                </button>
              </div>
            </div>

            {/* Newsletter Container - Print styled */}
            <div
              id="newsletter-print-area"
              className={`max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl shadow-2xl transition-all ${currentTheme.wrapper}`}
            >
              <div className="flex items-center justify-between pb-4 border-b mb-6 border-slate-200">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentTheme.badge}`}>
                  {selectedNewsletter.template} THEME • {selectedNewsletter.issueNumber}
                </span>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {selectedNewsletter.publishDate}
                  </span>
                  <span>Source: {selectedNewsletter.sourceDocName}</span>
                </div>
              </div>

              <div className="mb-6">
                <h1 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight ${currentTheme.accent}`}>
                  {selectedNewsletter.title}
                </h1>
                <p className="text-base text-slate-600 mt-2 font-medium">
                  {selectedNewsletter.subtitle}
                </p>
              </div>

              {/* Highlights Box */}
              {selectedNewsletter.highlights.length > 0 && (
                <div className={`p-5 rounded-xl mb-8 ${currentTheme.highlightBox}`}>
                  <h3 className="text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Key Bullet Highlights
                  </h3>
                  <ul className="space-y-1.5 text-sm">
                    {selectedNewsletter.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="font-bold shrink-0">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sections Layout */}
              <div className="space-y-8">
                {selectedNewsletter.sections.map((sec, idx) => (
                  <article key={sec.id} className="prose prose-slate max-w-none">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {sec.tag || `Story 0${idx + 1}`}
                      </span>
                    </div>
                    <h2 className={`text-xl sm:text-2xl font-bold tracking-tight mb-3 ${currentTheme.accent}`}>
                      {sec.heading}
                    </h2>
                    <div className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                      {sec.content}
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer */}
              <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
                <p className="font-medium text-slate-500">{selectedNewsletter.footerNote}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Generated via DOCNEWS Engine • CCA 2 Build • Running Commit SHA: {healthInfo?.commit || 'local'}
                </p>
              </footer>
            </div>
          </div>
        )}

        {/* TAB 4: SAVED NEWSLETTERS ARCHIVE */}
        {activeTab === 'archive' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-400" />
                  Saved Newsletters Repository ({newsletters.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Dynamic server-side registry. You can inspect, preview, edit, or remove stored issues.
                </p>
              </div>
              <button
                onClick={fetchNewsletters}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {newsletters.length === 0 ? (
              <div className="text-center py-16 bg-slate-950/40 rounded-2xl border border-slate-800">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300">No Newsletters Stored Yet</h3>
                <p className="text-xs text-slate-500 mt-1">Convert a document to start populating your archive.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold"
                >
                  Create First Issue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsletters.map((nl) => (
                  <div
                    key={nl.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {nl.template}
                        </span>
                        <span className="text-[11px] text-slate-500">{nl.publishDate}</span>
                      </div>
                      <h3 className="font-bold text-base text-white leading-snug line-clamp-2">{nl.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{nl.subtitle}</p>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{nl.stats.sectionCount} Sections</span>
                        <span>{nl.stats.wordCount} words</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedNewsletter(nl);
                            setActiveTab('preview');
                          }}
                          className="p-1.5 text-blue-400 hover:bg-slate-800 rounded-lg text-xs"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            loadIntoEditor(nl);
                            setActiveTab('editor');
                          }}
                          className="p-1.5 text-slate-300 hover:bg-slate-800 rounded-lg text-xs"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <a
                          href={`/api/newsletters/${nl.id}/export-html`}
                          download
                          className="p-1.5 text-emerald-400 hover:bg-slate-800 rounded-lg text-xs"
                          title="Download HTML"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>

                      <button
                        onClick={() => handleDelete(nl.id)}
                        className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg text-xs"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DEVOPS & CI/CD RUNTIME INSPECTION */}
        {activeTab === 'devops' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
                <Cpu className="h-5 w-5 text-indigo-400" />
                DevOps Health Check & CI/CD Telemetry
              </h2>
              <p className="text-xs text-slate-400 mb-6">
                Active server status, live Git Commit SHA, and academic CI/CD verification endpoints.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase font-semibold">Health Status</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" /> {healthInfo?.status || 'Active'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Endpoint: GET /health</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase font-semibold">Git Commit SHA</div>
                  <div className="text-2xl font-mono font-black text-indigo-300 mt-1">
                    {healthInfo?.commit || 'local'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">From: RENDER_GIT_COMMIT / GIT_SHA</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400 uppercase font-semibold">Saved Records</div>
                  <div className="text-2xl font-black text-blue-400 mt-1">
                    {newsletters.length} Newsletters
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Endpoint: GET /api/newsletters</div>
                </div>
              </div>

              {/* Pipeline Flow Visualization */}
              <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
                  GitHub Actions Pipeline Architecture
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                  <div className="w-full md:w-auto p-3 rounded-lg bg-slate-800 text-center font-medium border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Step 1</div>
                    <div className="font-bold text-white">git push</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-blue-950/60 text-center font-medium border border-blue-800">
                    <div className="text-blue-300 text-[10px]">CI Quality Gate</div>
                    <div className="font-bold text-white">Lint & node:test</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-indigo-950/60 text-center font-medium border border-indigo-800">
                    <div className="text-indigo-300 text-[10px]">Container Gate</div>
                    <div className="font-bold text-white">Docker Build & Smoke</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-emerald-950/60 text-center font-medium border border-emerald-800">
                    <div className="text-emerald-300 text-[10px]">CD Release</div>
                    <div className="font-bold text-white">Render Deploy Hook</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-slate-800 text-center font-medium border border-slate-700">
                    <div className="text-slate-400 text-[10px]">Verification</div>
                    <div className="font-bold text-emerald-400">Live URL (with Commit)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* University & Git Commit Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>MIT World Peace University • Department of Computer Engineering and Technology</span>
            <span className="hidden sm:inline"> • Cloud Computing and DevOps (CSE30040)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
              commit {healthInfo?.commit || 'local'}
            </span>
            <span className="text-[11px] text-emerald-500 font-medium">● Healthy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
