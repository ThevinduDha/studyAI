import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  Star,
  Bookmark,
  Lightbulb,
  RotateCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  Search,
  ChevronRight,
  Info,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { documentService } from '../services/document.service.js';
import { summaryService } from '../services/summary.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Select.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton.jsx';
import {
  GroundedBadge,
  AIStatusBadge,
  SourceCard,
  AIThinkingIndicator
} from '../components/ai/index.js';

export default function LectureSummariesPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(
    searchParams.get('module') || searchParams.get('moduleId') || ''
  );
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(
    searchParams.get('document') || searchParams.get('documentId') || ''
  );

  const [summary, setSummary] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [glossaryFilter, setGlossaryFilter] = useState('');

  // 1. Fetch modules on load
  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      try {
        if (isAdmin) {
          const allMods = await moduleService.getAllModules();
          setModules(allMods || []);
        } else {
          const enrolled = await moduleService.getEnrolledModules();
          setModules(enrolled || []);
        }
      } catch (err) {
        console.error('Failed to load course modules:', err);
        setError('Could not load course modules. Please refresh.');
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [isAdmin]);

  // 2. Fetch documents when module changes
  useEffect(() => {
    if (!selectedModule) {
      setDocuments([]);
      setSelectedDocument('');
      setSummary(null);
      return;
    }

    const fetchDocuments = async () => {
      setLoadingDocs(true);
      setSummary(null);
      try {
        const docs = await documentService.getDocuments(selectedModule);
        setDocuments(docs || []);
        const paramDoc = searchParams.get('document') || searchParams.get('documentId');
        if (paramDoc && docs && docs.some((d) => d._id === paramDoc)) {
          setSelectedDocument(paramDoc);
        } else if (docs && docs.length > 0) {
          setSelectedDocument(docs[0]._id);
        } else {
          setSelectedDocument('');
        }
      } catch (err) {
        console.error('Failed to load module documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [selectedModule, searchParams]);

  // 3. Check for existing summary when document changes
  useEffect(() => {
    if (!selectedDocument) {
      setSummary(null);
      return;
    }

    const checkExistingSummary = async () => {
      setCheckingExisting(true);
      setError('');
      try {
        const existing = await summaryService.getSummary(selectedDocument);
        setSummary(existing);
      } catch (err) {
        if (err.statusCode === 404 || err.code === 'SUMMARY_NOT_FOUND') {
          setSummary(null);
        } else {
          console.error('Failed to check existing summary:', err);
        }
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingSummary();
  }, [selectedDocument]);

  // Handle Generate
  const handleGenerate = async () => {
    if (!selectedDocument || generating) return;

    setGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await summaryService.generateSummary(selectedDocument);
      setSummary(result.summary);
      setSuccessMsg('Lecture summary synthesized successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.message || 'Failed to generate lecture summary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Handle Regenerate
  const handleRegenerate = async () => {
    if (!selectedDocument || generating) return;

    setGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await summaryService.regenerateSummary(selectedDocument);
      setSummary(result.summary);
      setSuccessMsg(`Summary updated to Version ${result.summary?.version || 1}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Regeneration failed:', err);
      setError(err.message || 'Failed to regenerate summary.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedModuleObj = modules.find((m) => m._id === selectedModule);
  const selectedDocObj = documents.find((d) => d._id === selectedDocument);

  // Filtered glossary definitions
  const filteredDefinitions = summary?.definitions
    ? summary.definitions.filter(
        (d) =>
          d.term.toLowerCase().includes(glossaryFilter.toLowerCase()) ||
          d.definition.toLowerCase().includes(glossaryFilter.toLowerCase())
      )
    : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <PageHeader
        badge="Phase 8"
        badgeVariant="indigo"
        title="Lecture Summaries"
        icon={FileText}
        subtitle="AI-generated summaries grounded in your lecture materials, tailored for high-yield exam revision."
        actions={
          <div className="flex items-center gap-2">
            <GroundedBadge label="Grounded in Lecture Material" size="md" variant="emerald" />
          </div>
        }
      />

      {/* Control Panel: Module & Document Selectors */}
      <Card className="p-5 shadow-sm border border-subtle">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              id="summary-module"
              label="Step 1: Course Module"
              icon={BookOpen}
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={loadingModules || generating}
            >
              <option value="">-- Choose an Enrolled Course Module --</option>
              {modules.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.moduleCode || m.code} — {m.moduleName || m.name}
                </option>
              ))}
            </Select>
            {loadingModules && (
              <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                Loading enrolled modules...
              </p>
            )}
          </div>

          <div>
            <Select
              id="summary-doc"
              label="Step 2: Lecture / Document"
              icon={FileText}
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              disabled={!selectedModule || loadingDocs || generating || documents.length === 0}
            >
              {!selectedModule ? (
                <option value="">First select a course module</option>
              ) : documents.length === 0 && !loadingDocs ? (
                <option value="">No lecture documents in this module</option>
              ) : (
                documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.originalName} ({d.chunkCount || 0} chunks)
                  </option>
                ))
              )}
            </Select>
            {loadingDocs && (
              <p className="text-xs text-muted mt-1.5 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
                Loading module documents...
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs sm:text-sm animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => summary ? handleRegenerate() : handleGenerate()}
            className="border-rose-500/30 text-rose-400 hover:bg-rose-500/20 shrink-0"
          >
            Try Again
          </Button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs sm:text-sm animate-fade-in shadow-xs">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Action / Status Card */}
      {selectedDocument && !checkingExisting && (
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-subtle shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-heading text-sm sm:text-base truncate" title={selectedDocObj?.originalName}>
                {selectedDocObj?.originalName || 'Selected Lecture Document'}
              </h3>
              <div className="text-xs text-muted mt-0.5 flex items-center gap-2 flex-wrap">
                {summary ? (
                  <>
                    <span className="text-emerald-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 inline" />
                      Summary Ready (Version {summary.version})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(summary.generatedAt).toLocaleDateString()}
                    </span>
                  </>
                ) : (
                  <span>No summary generated yet for this document.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {summary ? (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCw}
                onClick={handleRegenerate}
                loading={generating}
                title="Regenerate summary with latest document context"
              >
                {generating ? 'Regenerating...' : 'Regenerate Summary'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                icon={Sparkles}
                onClick={handleGenerate}
                loading={generating}
              >
                {generating ? 'Synthesizing...' : 'Generate Summary'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Premium Loading Skeleton */}
      {generating && (
        <div className="space-y-6 animate-fade-in">
          {/* Thinking Banner */}
          <div className="card-base border border-indigo-500/30 rounded-2xl p-6 text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 shadow-inner">
              <Sparkles className="h-7 w-7 animate-spin [animation-duration:3s]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-heading">
              Synthesizing Exam-Oriented Lecture Summary...
            </h3>
            <p className="text-xs text-muted max-w-lg mx-auto leading-relaxed">
              Extracting high-yield concepts, exam questions, technical definitions, and real citations directly from your enrolled lecture material.
            </p>
          </div>

          {/* Skeleton Layout matching final layout */}
          <Card className="p-6 space-y-4">
            <Skeleton height="h-6" className="w-1/3" />
            <Skeleton height="h-4" className="w-full" />
            <Skeleton height="h-4" className="w-5/6" />
            <Skeleton height="h-4" className="w-3/4" />
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard className="h-44" />
            <SkeletonCard className="h-44" />
          </div>
        </div>
      )}

      {/* Summary Content View */}
      {summary && !generating && (
        <div className="space-y-6 animate-slide-up">
          {/* Summary Hero Card */}
          <Card className="p-6 sm:p-7 border-indigo-500/25 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="indigo" size="xs">
                    Version {summary.version}
                  </Badge>
                  <Badge variant="emerald" size="xs">
                    Exam-Oriented
                  </Badge>
                  {selectedModuleObj && (
                    <Badge variant="purple" size="xs">
                      {selectedModuleObj.moduleCode || selectedModuleObj.code}
                    </Badge>
                  )}
                  {summary.sourceChunks && (
                    <Badge variant="outline" size="xs">
                      {summary.sourceChunks.length} Citations
                    </Badge>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-heading leading-snug">
                  {summary.title}
                </h2>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted pt-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                    Generated {new Date(summary.generatedAt).toLocaleString([], {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  <span>•</span>
                  <AIStatusBadge model={summary.model || 'gemini-2.5-flash'} />
                  <span>•</span>
                  <span className="text-emerald-400 font-medium">Verified Grounded</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="xs"
                icon={RotateCw}
                onClick={handleRegenerate}
                loading={generating}
                title="Regenerate summary with latest document context"
                className="shrink-0"
              >
                Regenerate
              </Button>
            </div>

            {/* Executive Overview */}
            <div className="pt-5 border-t border-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-2.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                Executive Overview
              </h3>
              <p className="text-sm sm:text-base text-body leading-relaxed whitespace-pre-line font-sans">
                {summary.overview}
              </p>
            </div>
          </Card>

          {/* Key Concepts Grid */}
          {summary.keyConcepts && summary.keyConcepts.length > 0 && (
            <Card className="p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-heading flex items-center gap-2">
                  <Layers className="h-4 w-4 text-indigo-400" />
                  Key Concepts ({summary.keyConcepts.length})
                </h3>
                <span className="text-xs text-muted">Core theoretical foundations</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl card-base border border-subtle hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 shadow-xs"
                  >
                    <div className="flex items-start gap-2.5 mb-2">
                      <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-heading text-sm leading-snug">
                        {concept.title}
                      </h4>
                    </div>
                    <p className="text-xs text-secondary leading-relaxed pl-8">
                      {concept.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Exam Focus & Important Points 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Focus (High Visual Priority) */}
            {summary.examFocus && summary.examFocus.length > 0 && (
              <Card className="p-6 space-y-4 border-amber-500/30 bg-amber-500/5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <Star className="h-4 w-4 fill-amber-400/20 text-amber-400" />
                    Exam Focus &amp; Likely Questions
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-amber-400/80 px-2 py-0.5 rounded-full bg-amber-400/10">
                    High Yield
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-body">
                  {summary.examFocus.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl card-base border border-amber-500/20 shadow-xs hover:border-amber-500/40 transition"
                    >
                      <span className="text-amber-400 font-bold mt-0.5 text-sm select-none">★</span>
                      <span className="leading-relaxed text-heading font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Essential Takeaways */}
            {summary.importantPoints && summary.importantPoints.length > 0 && (
              <Card className="p-6 space-y-4 border-emerald-500/30 bg-emerald-500/5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Essential Takeaways
                  </h3>
                  <span className="text-[10px] uppercase font-bold text-emerald-400/80 px-2 py-0.5 rounded-full bg-emerald-400/10">
                    Key Review
                  </span>
                </div>

                <ul className="space-y-2.5 text-xs text-body">
                  {summary.importantPoints.map((point, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl card-base border border-emerald-500/20 shadow-xs hover:border-emerald-500/40 transition"
                    >
                      <span className="text-emerald-400 font-bold mt-0.5 select-none">✓</span>
                      <span className="leading-relaxed text-heading">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Technical Definitions & Glossary */}
          {summary.definitions && summary.definitions.length > 0 && (
            <Card className="p-6 space-y-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-heading flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-indigo-400" />
                    Glossary &amp; Technical Definitions ({summary.definitions.length})
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    Precise academic definitions extracted directly from lecture text
                  </p>
                </div>

                {/* Optional Search Filter */}
                {summary.definitions.length > 3 && (
                  <div className="relative w-full sm:w-64">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={glossaryFilter}
                      onChange={(e) => setGlossaryFilter(e.target.value)}
                      placeholder="Filter definitions..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg input-base text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {(glossaryFilter ? filteredDefinitions : summary.definitions).map((d, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl card-base border border-subtle hover:border-indigo-500/40 transition shadow-xs"
                  >
                    <span className="font-semibold text-xs text-indigo-400 block mb-1">
                      {d.term}
                    </span>
                    <p className="text-xs text-secondary leading-relaxed">
                      {d.definition}
                    </p>
                  </div>
                ))}
              </div>

              {glossaryFilter && filteredDefinitions.length === 0 && (
                <p className="text-xs text-muted text-center py-4">
                  No definitions matching "{glossaryFilter}"
                </p>
              )}
            </Card>
          )}

          {/* Practical Examples & Case Studies */}
          {summary.examples && summary.examples.length > 0 && (
            <Card className="p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-heading flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Examples &amp; Case Studies
              </h3>
              <div className="space-y-2.5">
                {summary.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl card-base border border-subtle text-xs text-body leading-relaxed flex items-start gap-3 shadow-xs hover:border-amber-400/30 transition"
                  >
                    <span className="h-5 w-5 rounded-md bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold shrink-0 text-xs mt-0.5">
                      •
                    </span>
                    <span className="text-secondary">{ex}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Source Attribution & Citations */}
          {summary.sourceChunks && summary.sourceChunks.length > 0 && (
            <Card className="p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                    Grounded Source Material ({summary.sourceChunks.length} chunks synthesized)
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    Verified source citations from course slides and textbook chunks
                  </p>
                </div>
                <span className="text-[10px] text-muted">
                  Click citation to view passage
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {summary.sourceChunks.map((src, idx) => (
                  <SourceCard
                    key={idx}
                    source={src}
                    index={idx}
                  />
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Empty State when no document selected */}
      {!selectedDocument && !loadingModules && (
        <EmptyState
          icon={FileText}
          title="No Lecture Document Selected"
          description="Choose an enrolled course module and lecture document above to inspect or generate an exam-focused study summary."
        />
      )}
    </div>
  );
}
