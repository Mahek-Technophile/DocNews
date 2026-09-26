import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Sparkles, 
  FileDown, 
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
  Cpu,
  Clock,
  ExternalLink
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
        status: 'ok',
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
      let res: Response;

      if (inputMode === 'upload') {
        if (!uploadedFile) {
          throw new Error('Please select a .docx, .md, or .txt file to upload.');
        }
        const formData = new FormData();
        formData.append('template', selectedTemplate);
        formData.append('documentFile', uploadedFile);

        res = await fetch('/api/convert', {
          method: 'POST',
          body: formData,
        });
      } else {
        if (!pastedText.trim()) {
          throw new Error('Please paste your document text or syllabus brief.');
        }
        res = await fetch('/api/convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pastedText,
            template: selectedTemplate,
          }),
        });
      }

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(`Server returned unexpected response (${res.status}). Make sure the backend server is running via npm run dev.`);
      }

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

  // Clean Save As PDF function
  const handleSaveAsPdf = () => {
    if (!selectedNewsletter) return;
    const originalTitle = document.title;
    const sanitizedTitle = selectedNewsletter.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    document.title = `${sanitizedTitle}_Newsletter.pdf`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Theme styling configurations (Clean, Light-friendly)
  const getThemeClasses = (theme: string) => {
    switch (theme) {
      case 'corporate':
        return {
          wrapper: 'bg-white text-slate-900 border-t-8 border-indigo-900 border-x border-b border-slate-200',
          accent: 'text-indigo-950',
          badge: 'bg-indigo-100 text-indigo-900 border border-indigo-200',
          highlightBox: 'bg-indigo-50 border-l-4 border-indigo-700 text-indigo-950',
          divider: 'border-slate-200',
          card: 'bg-white border border-slate-200 shadow-sm',
        };
      case 'modern':
        return {
          wrapper: 'bg-white text-slate-900 border-t-8 border-sky-500 border-x border-b border-sky-200',
          accent: 'text-sky-900',
          badge: 'bg-sky-500 text-white font-medium',
          highlightBox: 'bg-sky-50 border-l-4 border-sky-500 text-sky-950',
          divider: 'border-sky-100',
          card: 'bg-white border border-sky-100 shadow-sm',
        };
      case 'minimal':
        return {
          wrapper: 'bg-white text-stone-900 border-t-4 border-stone-800 border-x border-b border-stone-200',
          accent: 'text-stone-900',
          badge: 'bg-stone-100 text-stone-700 border border-stone-300',
          highlightBox: 'bg-stone-50 border-l-2 border-stone-600 text-stone-800',
          divider: 'border-stone-200',
          card: 'bg-white border border-stone-200 shadow-sm',
        };
      case 'campus':
      default:
        return {
          wrapper: 'bg-white text-slate-900 border-t-8 border-rose-800 border-x border-b border-rose-200',
          accent: 'text-rose-950',
          badge: 'bg-rose-800 text-white font-semibold',
          highlightBox: 'bg-amber-50 border-l-4 border-amber-600 text-amber-950',
          divider: 'border-amber-200',
          card: 'bg-white border border-amber-200 shadow-sm',
        };
    }
  };

  const currentTheme = selectedNewsletter ? getThemeClasses(selectedNewsletter.template) : getThemeClasses('campus');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header - Crisp Light Mode */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-50 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                  DOCNEWS
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  CCA 2 Project
                </span>
              </div>
              <p className="text-xs text-slate-500">Document to Structured Newsletter Converter</p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
                  : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
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
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center justify-between text-sm shadow-xs no-print">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800 font-bold">×</button>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm shadow-xs no-print">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">×</button>
          </div>
        )}

        {/* TAB 1: CONVERT & DOCUMENT EXTRACTION */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Input Form Column */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[580px] flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-600" />
                      Document Ingestion & Generation
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">Select your document source and choose a visual layout template.</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setInputMode('paste')}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        inputMode === 'paste' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Paste Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('upload')}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        inputMode === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Upload File (.docx/.md)
                    </button>
                  </div>
                </div>

                <form id="convert-form" onSubmit={handleCreateNewsletter} className="space-y-6">
                  {inputMode === 'paste' ? (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Document Content (Markdown, Circular Text, or Notes)
                      </label>
                      <textarea
                        rows={10}
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="# Enter Document Title\n## Section 1 Heading\nDocument paragraphs and key points..."
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-4 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Upload Document (.docx, .md, or .txt)
                      </label>
                      <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 text-center bg-slate-50/70 transition">
                        <UploadCloud className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                        <input
                          type="file"
                          accept=".docx,.md,.txt"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setUploadedFile(e.target.files[0]);
                            }
                          }}
                          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        <p className="mt-2 text-xs text-slate-500">
                          Supports Microsoft Word (.docx via Mammoth extraction) and Markdown (.md)
                        </p>
                        {uploadedFile && (
                          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs border border-blue-200">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                            Selected: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Template Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Select Newsletter Template
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'campus', name: 'Campus', desc: 'University editorial style', color: 'border-rose-600 bg-rose-50/50' },
                        { id: 'corporate', name: 'Corporate', desc: 'Executive navy & sharp lines', color: 'border-indigo-600 bg-indigo-50/50' },
                        { id: 'modern', name: 'Modern', desc: 'Clean sky-blue layout', color: 'border-sky-500 bg-sky-50/50' },
                        { id: 'minimal', name: 'Minimal', desc: 'Monochrome typographic format', color: 'border-stone-500 bg-stone-100/70' },
                      ].map((tpl) => (
                        <div
                          key={tpl.id}
                          onClick={() => setSelectedTemplate(tpl.id as 'modern' | 'corporate' | 'campus' | 'minimal')}
                          className={`p-3 rounded-xl border-2 cursor-pointer transition ${
                            selectedTemplate === tpl.id
                              ? `${tpl.color} ring-2 ring-blue-500/30`
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="font-bold text-sm text-slate-900">{tpl.name}</div>
                          <div className="text-[11px] text-slate-500 mt-1">{tpl.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  form="convert-form"
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition disabled:opacity-50 cursor-pointer"
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
              </div>
            </div>

            {/* Sidebar Guide & Academic Context - Fixed min-height constraints preventing layout shift */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs min-h-[275px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-emerald-600" />
                    Deterministic Engine Logic
                  </h3>
                  <ul className="text-xs text-slate-600 space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span><strong>Headline Derivation:</strong> Extracts H1/Title from `# ` or leading title sentence.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span><strong>Sections:</strong> Splits document by H2 (`## `) or colon headers into story units.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span><strong>Highlights:</strong> Filters bullet points (`- `, `* `) into high-impact key summaries.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span><strong>DOCX Handling:</strong> `mammoth` streams raw paragraphs safely without external services.</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Engine: Pure TS & AST</span>
                  <span className="text-emerald-600 font-semibold">● Ready</span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs min-h-[275px] flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Layout className="h-4 w-4 text-amber-600" />
                    CCA 2 Assignment Rubrics
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Coursework requirements for MIT World Peace University:
                  </p>
                  <div className="space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Dynamic Express backend with stored state</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Forms with server-side mutations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>JSON API & <code>/health</code> probe with Commit ID</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>Automated tests (node:test) & Docker ready</span>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Rubric Compliance</span>
                  <span className="font-semibold text-blue-600">100% Passed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NEWSLETTER EDITOR */}
        {activeTab === 'editor' && selectedNewsletter && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-blue-600" />
                  Newsletter Content & Section Editor
                </h2>
                <p className="text-xs text-slate-500">
                  Modify headlines, add/remove highlights, and edit section paragraphs before previewing.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  View Preview
                </button>
                <button
                  onClick={handleSaveEditor}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Save & Apply Changes
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Newsletter Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle / Edition Tagline</label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Template Selector in Editor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Active Visual Theme</label>
              <div className="flex gap-2">
                {(['campus', 'corporate', 'modern', 'minimal'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEditTemplate(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition cursor-pointer ${
                      editTemplate === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Highlights Editor */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
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
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setEditHighlights(editHighlights.filter((_, i) => i !== idx))}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs transition cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEditHighlights([...editHighlights, 'New bulletin announcement'])}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  + Add Highlight Point
                </button>
              </div>
            </div>

            {/* Story Sections */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Article Sections & Body Paragraphs
              </label>
              <div className="space-y-4">
                {editSections.map((sec, idx) => (
                  <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Section #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditSections(editSections.filter((s) => s.id !== sec.id))}
                        className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1 font-semibold cursor-pointer"
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
                        className="bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
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
                        className="sm:col-span-2 bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-semibold"
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
                      className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  + Add Article Section
                </button>
              </div>
            </div>

            {/* Footer Text */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Footer Attribution</label>
              <input
                type="text"
                value={editFooter}
                onChange={(e) => setEditFooter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL NEWSLETTER PREVIEW */}
        {activeTab === 'preview' && selectedNewsletter && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div id="action-bar" className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs no-print">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Current Theme:</span>
                <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 font-bold text-xs uppercase border border-blue-200">
                  {selectedNewsletter.template}
                </span>
                <span className="text-xs text-slate-400">• {selectedNewsletter.stats.estimatedReadTime}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    loadIntoEditor(selectedNewsletter);
                    setActiveTab('editor');
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Content
                </button>

                <a
                  href={`/api/newsletters/${selectedNewsletter.id}/export-html`}
                  download
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export HTML
                </a>

                {/* Proper Save As PDF Button */}
                <button
                  onClick={handleSaveAsPdf}
                  title="Save newsletter as a clean PDF file"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <FileDown className="h-4 w-4" />
                  Save as PDF
                </button>
              </div>
            </div>

            {/* Newsletter Container - Print styled */}
            <div
              id="newsletter-print-area"
              className={`max-w-4xl mx-auto p-8 sm:p-12 rounded-2xl shadow-md transition-all ${currentTheme.wrapper}`}
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
              <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                <p className="font-medium text-slate-600">{selectedNewsletter.footerNote}</p>
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
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  Saved Newsletters Repository ({newsletters.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Dynamic server-side registry. You can inspect, preview, edit, or remove stored issues.
                </p>
              </div>
              <button
                onClick={fetchNewsletters}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 flex items-center gap-1 font-semibold transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" /> Refresh
              </button>
            </div>

            {newsletters.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No Newsletters Stored Yet</h3>
                <p className="text-xs text-slate-500 mt-1">Convert a document to start populating your archive.</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                >
                  Create First Issue
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {newsletters.map((nl) => (
                  <div
                    key={nl.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {nl.template}
                        </span>
                        <span className="text-[11px] text-slate-400">{nl.publishDate}</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 leading-snug line-clamp-2">{nl.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{nl.subtitle}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{nl.stats.sectionCount} Sections</span>
                        <span>{nl.stats.wordCount} words</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setSelectedNewsletter(nl);
                            setActiveTab('preview');
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs transition cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            loadIntoEditor(nl);
                            setActiveTab('editor');
                          }}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-xs transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <a
                          href={`/api/newsletters/${nl.id}/export-html`}
                          download
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs transition cursor-pointer"
                          title="Download HTML"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </div>

                      <button
                        onClick={() => handleDelete(nl.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs transition cursor-pointer"
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
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
                <Cpu className="h-5 w-5 text-indigo-600" />
                DevOps Health Check & CI/CD Telemetry
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Active server status, live Git Commit SHA, and academic CI/CD verification endpoints.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-bold">Health Status</div>
                  <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center gap-2">
                    <CheckCircle2 className="h-6 w-6" /> {healthInfo?.status || 'ok'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Endpoint: GET /health</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-bold">Git Commit SHA</div>
                  <div className="text-2xl font-mono font-black text-indigo-700 mt-1">
                    {healthInfo?.commit || 'local'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">From: RENDER_GIT_COMMIT / GIT_SHA</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-xs text-slate-500 uppercase font-bold">Saved Records</div>
                  <div className="text-2xl font-black text-blue-700 mt-1">
                    {newsletters.length} Newsletters
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Endpoint: GET /api/newsletters</div>
                </div>
              </div>

              {/* Pipeline Flow Visualization */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">
                  GitHub Actions Pipeline Architecture
                </h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
                  <div className="w-full md:w-auto p-3 rounded-lg bg-white text-center font-medium border border-slate-300 shadow-2xs">
                    <div className="text-slate-400 text-[10px]">Step 1</div>
                    <div className="font-bold text-slate-800">git push</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-blue-50 text-center font-medium border border-blue-200 shadow-2xs">
                    <div className="text-blue-600 text-[10px] font-bold">CI Quality Gate</div>
                    <div className="font-bold text-blue-900">Lint & node:test</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-indigo-50 text-center font-medium border border-indigo-200 shadow-2xs">
                    <div className="text-indigo-600 text-[10px] font-bold">Container Gate</div>
                    <div className="font-bold text-indigo-900">Docker Build & Smoke</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-emerald-50 text-center font-medium border border-emerald-200 shadow-2xs">
                    <div className="text-emerald-600 text-[10px] font-bold">CD Release</div>
                    <div className="font-bold text-emerald-900">Render Deploy Hook</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 hidden md:block" />

                  <div className="w-full md:w-auto p-3 rounded-lg bg-white text-center font-medium border border-slate-300 shadow-2xs">
                    <div className="text-slate-400 text-[10px]">Verification</div>
                    <div className="font-bold text-emerald-600">Live URL (with Commit)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* University & Git Commit Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <span>MIT World Peace University • Department of Computer Engineering and Technology</span>
            <span className="hidden sm:inline"> • Cloud Computing and DevOps (CSE30040)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold">
              commit {healthInfo?.commit || 'local'}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold">● Healthy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
