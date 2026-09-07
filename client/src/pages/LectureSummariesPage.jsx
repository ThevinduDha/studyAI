import { useState, useEffect } from 'react';
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
  ChevronRight,
  Info
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

export default function LectureSummariesPage() {
  const { user, isAdmin } = useAuth();

  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');

  const [summary, setSummary] = useState(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
        if (docs && docs.length > 0) {
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
  }, [selectedModule]);

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
      setSuccessMsg('Lecture summary generated successfully!');
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
      setSuccessMsg(`Summary regenerated! Updated to Version ${result.summary?.version || 1}.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Regeneration failed:', err);
      setError(err.message || 'Failed to regenerate summary.');
    } finally {
      setGenerating(false);
    }
  };

  const selectedDocObj = documents.find((d) => d._id === selectedDocument);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Phase 8"
        badgeVariant="indigo"
        title="Lecture Summaries"
        icon={FileText}
        subtitle="AI-powered exam-oriented study summaries strictly grounded in your course materials."
        actions={
          <Badge variant="emerald" size="md">
            <ShieldCheck className="h-3.5 w-3.5 mr-1 inline" />
            Zero-Hallucination Grounded
          </Badge>
        }
      />

      {/* Control Panel: Module & Document Selectors */}
      <Card className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Select
              id="summary-module"
              label="1. Select Course Module"
              icon={BookOpen}
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={loadingModules || generating}
            >
              <option value="">-- Choose an Enrolled Module --</option>
              {modules.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.code || m.moduleCode} — {m.name || m.moduleName}
                </option>
              ))}
            </Select>
            {loadingModules && (
              <p className="text-xs text-muted mt-1.5">Loading enrolled modules...</p>
            )}
          </div>

          <div>
            <Select
              id="summary-doc"
              label="2. Select Lecture / Document"
              icon={FileText}
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              disabled={!selectedModule || loadingDocs || generating || documents.length === 0}
            >
              {!selectedModule ? (
                <option value="">First select a module above</option>
              ) : documents.length === 0 && !loadingDocs ? (
                <option value="">No documents uploaded for this module</option>
              ) : (
                documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.originalName} ({d.chunkCount || 0} chunks)
                  </option>
                ))
              )}
            </Select>
            {loadingDocs && (
              <p className="text-xs text-muted mt-1.5">Loading module documents...</p>
            )}
          </div>
        </div>
      </Card>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-sm">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Action / Status Card */}
      {selectedDocument && !checkingExisting && (
        <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 flex-shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-heading text-sm">
                {selectedDocObj?.originalName || 'Selected Lecture'}
              </h3>
              <div className="text-xs text-muted mt-0.5">
                {summary ? (
                  <span className="text-emerald-500 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 inline" /> Summary available (Version {summary.version}) &bull; Generated {new Date(summary.generatedAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span>No summary generated yet for this document.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {summary ? (
              <Button
                variant="outline"
                size="sm"
                icon={RotateCw}
                onClick={handleRegenerate}
                loading={generating}
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
                {generating ? 'Generating Summary...' : 'Generate Summary'}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Loading Skeleton */}
      {generating && (
        <Card className="p-8 space-y-6 text-center animate-pulse">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
              <Sparkles className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-heading">
              Synthesizing Exam-Oriented Lecture Summary
            </h3>
            <p className="text-xs text-muted max-w-md">
              Extracting key concepts, important points, likely exam questions, definitions, and application citations directly from the lecture material...
            </p>
          </div>
          <div className="space-y-3 max-w-2xl mx-auto pt-4">
            <Skeleton height="h-4" className="w-3/4 mx-auto" />
            <Skeleton height="h-4" className="w-5/6 mx-auto" />
            <Skeleton height="h-4" className="w-2/3 mx-auto" />
          </div>
        </Card>
      )}

      {/* Summary Content View */}
      {summary && !generating && (
        <div className="space-y-6 animate-slide-up">
          {/* Summary Header Card */}
          <Card className="p-6 border-indigo-500/30 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" size="xs">
                    Version {summary.version}
                  </Badge>
                  <Badge variant="emerald" size="xs">
                    Exam Focus
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-heading mt-2">
                  {summary.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Generated: {new Date(summary.generatedAt).toLocaleString()}
                  </span>
                  <span>&bull;</span>
                  <span>Model: <code className="text-indigo-500 font-mono">{summary.model}</code></span>
                  <span>&bull;</span>
                  <span className="text-emerald-500 font-medium">Status: {summary.status}</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="xs"
                icon={RotateCw}
                onClick={handleRegenerate}
                loading={generating}
                title="Regenerate summary with latest document context"
              >
                Regenerate
              </Button>
            </div>

            {/* Overview */}
            <div className="mt-6 pt-5 border-t border-subtle">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 mb-2.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                Executive Overview
              </h3>
              <p className="text-sm text-body leading-relaxed whitespace-pre-line">
                {summary.overview}
              </p>
            </div>
          </Card>

          {/* Key Concepts */}
          {summary.keyConcepts && summary.keyConcepts.length > 0 && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-heading flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-500" />
                Key Concepts ({summary.keyConcepts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl card-base border border-subtle hover:border-indigo-500/40 transition shadow-sm"
                  >
                    <div className="flex items-center gap-2 font-semibold text-heading text-sm mb-1.5">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-500 text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span>{concept.title}</span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed pl-7">
                      {concept.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Exam Focus & Important Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Focus */}
            {summary.examFocus && summary.examFocus.length > 0 && (
              <Card className="p-6 space-y-3 border-amber-500/30">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-amber-500/20" />
                  Exam Focus &amp; Likely Questions
                </h3>
                <ul className="space-y-2.5 text-xs text-body">
                  {summary.examFocus.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-amber-500 font-bold mt-0.5">★</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Important Points */}
            {summary.importantPoints && summary.importantPoints.length > 0 && (
              <Card className="p-6 space-y-3 border-emerald-500/30">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Essential Takeaways
                </h3>
                <ul className="space-y-2.5 text-xs text-body">
                  {summary.importantPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Technical Definitions */}
          {summary.definitions && summary.definitions.length > 0 && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-heading flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-indigo-500" />
                Glossary &amp; Technical Definitions ({summary.definitions.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.definitions.map((d, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl card-base border border-subtle shadow-sm">
                    <span className="font-semibold text-xs text-indigo-500 block mb-1">
                      {d.term}
                    </span>
                    <p className="text-xs text-muted leading-relaxed">
                      {d.definition}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Practical Examples */}
          {summary.examples && summary.examples.length > 0 && (
            <Card className="p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-heading flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Examples &amp; Case Studies
              </h3>
              <div className="space-y-2">
                {summary.examples.map((ex, idx) => (
                  <div key={idx} className="p-3 rounded-xl card-base border border-subtle text-xs text-body leading-relaxed flex items-start gap-2.5 shadow-sm">
                    <span className="text-yellow-500 font-bold">•</span>
                    <span>{ex}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Source Attribution & Citations */}
          {summary.sourceChunks && summary.sourceChunks.length > 0 && (
            <Card className="p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Grounded Source Material ({summary.sourceChunks.length} chunks synthesized)
              </h3>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {summary.sourceChunks.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg card-base border border-subtle text-[11px] text-body shadow-sm"
                  >
                    <FileText className="h-3 w-3 text-indigo-500" />
                    <span className="font-medium text-heading">{src.documentName || 'Lecture'}</span>
                    <span className="text-muted">&bull;</span>
                    <span>Chunk #{src.chunkIndex}</span>
                    {src.pageStart !== null && (
                      <>
                        <span className="text-muted">&bull;</span>
                        <span>
                          p. {src.pageStart}
                          {src.pageEnd && src.pageEnd !== src.pageStart ? `–${src.pageEnd}` : ''}
                        </span>
                      </>
                    )}
                    {src.sectionHeading && (
                      <>
                        <span className="text-muted">&bull;</span>
                        <span className="text-muted italic max-w-[120px] truncate">
                          {src.sectionHeading}
                        </span>
                      </>
                    )}
                  </div>
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
          title="No Lecture Selected"
          description="Choose an enrolled course module and a lecture above to view or generate an exam-focused study summary."
        />
      )}
    </div>
  );
}
