import { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  FileText,
  Sliders,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { documentService } from '../services/document.service.js';
import { searchRetrieval } from '../services/retrieval.service.js';

export default function SemanticSearchPage() {
  const { user, isAdmin } = useAuth();

  const [question, setQuestion] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [topK, setTopK] = useState(5);

  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState('');
  const [searchResponse, setSearchResponse] = useState(null);

  // Fetch available modules on mount
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
        console.error('Failed to load modules for search:', err);
        setError('Could not load course modules. Please refresh.');
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [isAdmin]);

  // Fetch documents whenever selected module changes
  useEffect(() => {
    if (!selectedModule) {
      setDocuments([]);
      setSelectedDocument('');
      return;
    }

    const fetchDocuments = async () => {
      setLoadingDocs(true);
      try {
        const docs = await documentService.getDocuments(selectedModule);
        setDocuments(docs || []);
      } catch (err) {
        console.error('Failed to load documents for module:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [selectedModule]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Please enter a question or search query.');
      return;
    }

    setError('');
    setLoading(true);
    setSearchResponse(null);

    try {
      const response = await searchRetrieval({
        question: question.trim(),
        moduleId: selectedModule || undefined,
        documentId: selectedDocument || undefined,
        topK
      });

      setSearchResponse(response);
    } catch (err) {
      setError(err.message || 'Retrieval failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Phase 6
          </span>
          <span className="text-xs text-slate-400 font-mono">
            MongoDB Atlas $vectorSearch • Cosine Similarity
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
          <Search className="h-7 w-7 text-indigo-400" />
          Knowledge Search
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Perform dense vector semantic retrieval on course lecture chunks. The query is converted into a 768-dimensional embedding using Google Gemini (<code className="text-slate-300">gemini-embedding-2</code>) and matched using cosine similarity in Atlas Vector Search.
        </p>
      </div>

      {/* Scope Notice */}
      {!isAdmin && modules.length === 0 && !loadingModules && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">No Enrolled Modules</p>
            <p className="text-xs text-amber-300/80 mt-0.5">
              You are not enrolled in any modules yet. As a student, semantic retrieval is strictly scoped to your enrolled courses. Please visit Course Modules and enroll in a course to search its materials.
            </p>
          </div>
        </div>
      )}

      {/* Search Input Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 backdrop-blur-sm">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Question Textarea */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="search-question" className="block text-sm font-medium text-slate-200">
                Search Question or Academic Concept
              </label>
              <span className={`text-xs ${question.length > 1900 ? 'text-amber-400' : 'text-slate-500'}`}>
                {question.length} / 2000 chars
              </span>
            </div>
            <textarea
              id="search-question"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the difference between supervised and unsupervised learning algorithms?"
              maxLength={2000}
              className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/60 transition resize-y"
              required
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/60">
            {/* Module Filter */}
            <div>
              <label htmlFor="search-module" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                Filter by Module {isAdmin ? '(Optional)' : ''}
              </label>
              <select
                id="search-module"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={loadingModules || modules.length === 0}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">
                  {isAdmin ? 'All Modules (Global Scope)' : 'All Enrolled Modules'}
                </option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.moduleCode} — {m.moduleName}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Filter */}
            <div>
              <label htmlFor="search-document" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-indigo-400" />
                Filter by Document (Optional)
              </label>
              <select
                id="search-document"
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                disabled={!selectedModule || loadingDocs || documents.length === 0}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              >
                <option value="">
                  {!selectedModule
                    ? 'Select a module first'
                    : documents.length === 0
                    ? 'No documents found'
                    : 'All Documents in Module'}
                </option>
                {documents.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.originalName} ({doc.chunkCount} chunks)
                  </option>
                ))}
              </select>
            </div>

            {/* Top-K Selector */}
            <div>
              <label htmlFor="search-topk" className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                  Top-K Results
                </span>
                <span className="font-mono text-indigo-400 font-bold">{topK}</span>
              </label>
              <input
                type="range"
                id="search-topk"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>1 chunk</span>
                <span>Default: 5</span>
                <span>20 chunks</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading || (!isAdmin && modules.length === 0)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Searching Atlas Vector Index...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search Knowledge Base</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Retrieval Results Section */}
      {searchResponse && (
        <div className="space-y-6 animate-fadeIn">
          {/* Results Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-200">
                Found {searchResponse.count} relevant {searchResponse.count === 1 ? 'chunk' : 'chunks'}
              </span>
              <span>for query</span>
              <span className="text-indigo-300 italic max-w-xs sm:max-w-md truncate">
                "{searchResponse.question}"
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Ranked strictly by cosine similarity score
            </div>
          </div>

          {/* No Results Message */}
          {searchResponse.results.length === 0 && (
            <div className="text-center py-12 px-4 rounded-2xl bg-slate-900/40 border border-slate-800">
              <Info className="h-8 w-8 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No Matching Chunks Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No indexed chunks matched your search criteria. Ensure that documents have completed embeddings, or expand your search scope.
              </p>
            </div>
          )}

          {/* Chunks List */}
          <div className="space-y-4">
            {searchResponse.results.map((result, idx) => (
              <div
                key={result.chunkId}
                className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700 transition space-y-3"
              >
                {/* Header: Score, Document, Module */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Rank Badge */}
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[11px] font-semibold">
                      #{idx + 1}
                    </span>

                    {/* Module Code Badge */}
                    {result.moduleCode && (
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-medium text-[11px] border border-indigo-500/30">
                        {result.moduleCode}
                      </span>
                    )}

                    {/* Document Title */}
                    <span className="font-semibold text-slate-200 flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      {result.documentName}
                    </span>

                    {/* Chunk Index */}
                    <span className="text-slate-400 text-[11px]">
                      (Chunk #{result.chunkIndex})
                    </span>
                  </div>

                  {/* Similarity Score */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold">
                    <span>Relevance:</span>
                    <span>{typeof result.score === 'number' ? result.score.toFixed(4) : result.score}</span>
                  </div>
                </div>

                {/* Metadata details */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 border-b border-slate-800/60 pb-2">
                  {result.metadata?.pageStart && (
                    <span>
                      Pages: {result.metadata.pageStart}
                      {result.metadata.pageEnd && result.metadata.pageEnd !== result.metadata.pageStart
                        ? `–${result.metadata.pageEnd}`
                        : ''}
                    </span>
                  )}
                  {result.metadata?.sectionHeading && (
                    <span>Section: {result.metadata.sectionHeading}</span>
                  )}
                  <span>Characters: {result.characterCount}</span>
                  <span>Tokens: ~{result.tokenCount}</span>
                </div>

                {/* Chunk Text Passage */}
                <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/50">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                    {result.text}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Phase 7 Preview Note */}
          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-indigo-300/80 flex items-start gap-2.5">
            <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
            <div>
              <span className="font-semibold text-indigo-200">Phase 6 Strict Scope: </span>
              These retrieved chunks represent the exact grounded context that will be injected into Gemini prompts during Phase 7 for RAG answer synthesis and source citations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
