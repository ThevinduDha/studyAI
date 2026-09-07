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

  // 3. Check for existing summary when document changes (WITHOUT triggering generation)
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
        // 404 indicates no summary exists yet - expected normal state
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                Lecture Summaries
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                  Phase 8
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                AI-powered exam-oriented study summaries strictly grounded in your course materials
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
            <ShieldCheck className="h-3.5 w-3.5" />
            Zero-Hallucination Grounded
          </span>
        </div>
      </div>

      {/* Control Panel: Module & Document Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 shadow-sm">
        {/* Module Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            1. Select Course Module
          </label>
          <div className="relative">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={loadingModules || generating}
              className="w-full appearance-none bg-slate-800/90 border border-slate-700 text-slate-200 text-sm rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 transition"
            >
              <option value="">-- Choose an Enrolled Module --</option>
              {modules.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.code || m.moduleCode} — {m.name || m.moduleName}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <ChevronRight className="h-4 w-4 rotate-90" />
            </div>
          </div>
          {loadingModules && (
            <p className="text-xs text-slate-500 mt-1">Loading enrolled modules...</p>
          )}
        </div>

        {/* Document Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            2. Select Lecture / Document
          </label>
          <div className="relative">
            <select
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              disabled={!selectedModule || loadingDocs || generating || documents.length === 0}
              className="w-full appearance-none bg-slate-800/90 border border-slate-700 text-slate-200 text-sm rounded-lg px-3.5 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 disabled:opacity-50 transition"
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
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <ChevronRight className="h-4 w-4 rotate-90" />
            </div>
          </div>
          {loadingDocs && (
            <p className="text-xs text-slate-500 mt-1">Loading module documents...</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
          <p>{error}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-sm">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-400" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Action / Status Card */}
      {selectedDocument && !checkingExisting && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
              <FileText className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                {selectedDocObj?.originalName || 'Selected Lecture'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {summary ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 inline" /> Summary available (Version {summary.version}) &bull; Generated {new Date(summary.generatedAt).toLocaleDateString()}
                  </span>
                ) : (
                  <span>No summary generated yet for this document.</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {summary ? (
              <button
                onClick={handleRegenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 hover:border-slate-600 transition disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Regenerating...' : 'Regenerate Summary'}
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm shadow-indigo-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating Summary...' : 'Generate Summary'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {generating && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8 space-y-6 text-center animate-pulse">
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Sparkles className="h-8 w-8 animate-spin" />
            </div>
            <h3 className="text-lg font-semibold text-slate-200">
              Synthesizing Exam-Oriented Lecture Summary
            </h3>
            <p className="text-xs text-slate-400 max-w-md">
              Extracting key concepts, important points, likely exam questions, definitions, and application citations directly from the lecture material...
            </p>
          </div>
          <div className="space-y-3 max-w-2xl mx-auto pt-4">
            <div className="h-4 bg-slate-800 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-slate-800 rounded w-5/6 mx-auto"></div>
            <div className="h-4 bg-slate-800 rounded w-2/3 mx-auto"></div>
          </div>
        </div>
      )}

      {/* Summary Content View */}
      {summary && !generating && (
        <div className="space-y-6">
          {/* Summary Header Card */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/60">
                  Version {summary.version} &bull; Exam Focus
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2">
                  {summary.title}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    Generated: {new Date(summary.generatedAt).toLocaleString()}
                  </span>
                  <span>&bull;</span>
                  <span>Model: <code className="text-indigo-300">{summary.model}</code></span>
                  <span>&bull;</span>
                  <span className="text-emerald-400 font-medium">Status: {summary.status}</span>
                </div>
              </div>

              <button
                onClick={handleRegenerate}
                disabled={generating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex-shrink-0 cursor-pointer"
                title="Regenerate summary with latest document context"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>

            {/* Overview */}
            <div className="mt-6 pt-5 border-t border-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-2.5">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                Executive Overview
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {summary.overview}
              </p>
            </div>
          </div>

          {/* Key Concepts */}
          {summary.keyConcepts && summary.keyConcepts.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-400" />
                Key Concepts ({summary.keyConcepts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.keyConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-indigo-500/40 transition"
                  >
                    <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm mb-1.5">
                      <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-bold">
                        {idx + 1}
                      </span>
                      {concept.title}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed pl-7">
                      {concept.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exam Focus & Important Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Focus */}
            {summary.examFocus && summary.examFocus.length > 0 && (
              <div className="bg-slate-900/70 border border-amber-900/40 rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                  Exam Focus &amp; Likely Questions
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  {summary.examFocus.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-amber-950/20 border border-amber-800/30">
                      <span className="text-amber-400 font-bold mt-0.5">★</span>
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important Points */}
            {summary.importantPoints && summary.importantPoints.length > 0 && (
              <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-6 space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Essential Takeaways
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-200">
                  {summary.importantPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2 rounded-lg bg-emerald-950/20 border border-emerald-800/30">
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Technical Definitions */}
          {summary.definitions && summary.definitions.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-indigo-400" />
                Glossary &amp; Technical Definitions ({summary.definitions.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.definitions.map((d, idx) => (
                  <div key={idx} className="p-3.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                    <span className="font-semibold text-xs text-indigo-300 block mb-1">
                      {d.term}
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {d.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Practical Examples */}
          {summary.examples && summary.examples.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-400" />
                Examples &amp; Case Studies
              </h3>
              <div className="space-y-2">
                {summary.examples.map((ex, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                    <span className="text-yellow-400 font-bold">•</span>
                    <span>{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Attribution & Citations */}
          {summary.sourceChunks && summary.sourceChunks.length > 0 && (
            <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                Grounded Source Material ({summary.sourceChunks.length} chunks synthesized)
              </h3>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {summary.sourceChunks.map((src, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300"
                  >
                    <FileText className="h-3 w-3 text-indigo-400" />
                    <span className="font-medium text-slate-200">{src.documentName || 'Lecture'}</span>
                    <span className="text-slate-500">&bull;</span>
                    <span>Chunk #{src.chunkIndex}</span>
                    {src.pageStart !== null && (
                      <>
                        <span className="text-slate-500">&bull;</span>
                        <span>
                          p. {src.pageStart}
                          {src.pageEnd && src.pageEnd !== src.pageStart ? `–${src.pageEnd}` : ''}
                        </span>
                      </>
                    )}
                    {src.sectionHeading && (
                      <>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-400 italic max-w-[120px] truncate">
                          {src.sectionHeading}
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State when no document selected */}
      {!selectedDocument && !loadingModules && (
        <div className="text-center py-16 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/20">
          <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No Lecture Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Choose an enrolled course module and a lecture above to view or generate an exam-focused study summary.
          </p>
        </div>
      )}
    </div>
  );
}
