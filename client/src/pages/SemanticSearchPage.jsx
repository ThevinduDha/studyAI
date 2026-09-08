import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  ArrowRight,
  Loader2,
  HelpCircle,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { documentService } from '../services/document.service.js';
import { searchRetrieval } from '../services/retrieval.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Select.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SearchResultCard } from '../components/search/index.js';

const SUGGESTED_QUERIES = [
  'Supervised vs unsupervised learning algorithms',
  'Cache coherence and memory hierarchy',
  'Dijkstra algorithm time complexity',
  'Database normalization and third normal form'
];

export default function SemanticSearchPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();

  const [question, setQuestion] = useState(searchParams.get('q') || '');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(
    searchParams.get('module') || searchParams.get('moduleId') || ''
  );
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(
    searchParams.get('document') || searchParams.get('documentId') || ''
  );
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
        // If searchParams had a document that belongs to this module, keep it
        const paramDoc = searchParams.get('document') || searchParams.get('documentId');
        if (paramDoc && docs.some((d) => d._id === paramDoc)) {
          setSelectedDocument(paramDoc);
        }
      } catch (err) {
        console.error('Failed to load documents for module:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [selectedModule, searchParams]);

  // Auto-search if q is provided in URL
  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    if (queryFromUrl && !searchResponse && !loading) {
      executeSearch(queryFromUrl);
    }
  }, [searchParams]);

  const executeSearch = async (queryString) => {
    const textToSearch = queryString || question;
    if (!textToSearch.trim()) {
      setError('Please enter an academic concept or question to search.');
      return;
    }

    setError('');
    setLoading(true);
    setSearchResponse(null);

    try {
      const response = await searchRetrieval({
        question: textToSearch.trim(),
        moduleId: selectedModule || undefined,
        documentId: selectedDocument || undefined,
        topK
      });

      setSearchResponse(response);
    } catch (err) {
      setError(err.message || 'Semantic search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch();
  };

  const handleApplySuggestion = (suggested) => {
    setQuestion(suggested);
    executeSearch(suggested);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        badge="Dense Vector Retrieval"
        badgeVariant="indigo"
        title="Search Your Lecture Knowledge"
        icon={Search}
        subtitle="Find academic concepts across your course literature using 768-dimensional Gemini embeddings and MongoDB Atlas Vector Search."
      />

      {/* Scope Notice for students without enrollments */}
      {!isAdmin && modules.length === 0 && !loadingModules && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs flex items-start gap-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-heading">No Enrolled Courses Found</p>
            <p className="leading-relaxed">
              As a student, semantic retrieval is strictly scoped to your enrolled courses. Please visit the Course Library to enroll in courses and access their searchable literature.
            </p>
          </div>
        </div>
      )}

      {/* Search Input Card */}
      <Card className="p-6 shadow-xs border border-subtle">
        <form onSubmit={handleSearch} className="space-y-5">
          {/* Query Input */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="search-question" className="block text-xs font-bold uppercase tracking-wider text-heading">
                Academic Query or Question
              </label>
              <span className={`text-[11px] ${question.length > 1900 ? 'text-amber-400' : 'text-muted'}`}>
                {question.length} / 2000 chars
              </span>
            </div>
            <textarea
              id="search-question"
              rows={3}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is the fundamental difference between dynamic programming and divide-and-conquer approaches?"
              maxLength={2000}
              className="w-full p-4 rounded-2xl input-base text-sm resize-y font-sans leading-relaxed"
              required
            />
          </div>

          {/* Quick suggestions if initial state */}
          {!searchResponse && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted">
              <span className="flex items-center gap-1 font-semibold text-heading text-[11px]">
                <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                Try searching:
              </span>
              {SUGGESTED_QUERIES.map((sq, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplySuggestion(sq)}
                  className="px-2.5 py-1 rounded-lg card-base border border-subtle hover:border-indigo-500/40 text-muted hover:text-heading transition text-[11px] cursor-pointer"
                >
                  "{sq}"
                </button>
              ))}
            </div>
          )}

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-subtle">
            {/* Module Filter */}
            <div>
              <Select
                id="search-module"
                label={`Scope by Course ${isAdmin ? '(Optional)' : ''}`}
                icon={BookOpen}
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={loadingModules || modules.length === 0}
              >
                <option value="">
                  {isAdmin ? 'All Courses (Global Scope)' : 'All Enrolled Courses'}
                </option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.moduleCode} — {m.moduleName}
                  </option>
                ))}
              </Select>
            </div>

            {/* Document Filter */}
            <div>
              <Select
                id="search-document"
                label="Scope by Lecture Document (Optional)"
                icon={FileText}
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                disabled={!selectedModule || loadingDocs || documents.length === 0}
              >
                <option value="">
                  {!selectedModule
                    ? 'Select a course first'
                    : documents.length === 0
                    ? 'No documents found'
                    : 'All Documents in Course'}
                </option>
                {documents.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.originalName} ({doc.chunkCount} chunks)
                  </option>
                ))}
              </Select>
            </div>

            {/* Top-K Slider */}
            <div>
              <label htmlFor="search-topk" className="block text-xs font-medium text-muted mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                  Top-K Passages
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
                className="w-full accent-indigo-500 cursor-pointer h-2 bg-subtle rounded-lg mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted mt-1">
                <span>1 chunk</span>
                <span>Default: 5</span>
                <span>20 chunks</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-2 border-t border-subtle">
            <span className="text-muted text-[11px]">
              Retrieves dense vector chunks using cosine similarity
            </span>

            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={loading ? Loader2 : Search}
              disabled={loading || (!isAdmin && modules.length === 0)}
              loading={loading}
            >
              {loading ? 'Searching Vector Index...' : 'Search Knowledge Base'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Loading Skeleton */}
      {loading && !searchResponse && (
        <div className="space-y-4 animate-fade-in">
          <div className="p-4 rounded-xl card-base border border-subtle flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            <span className="text-xs text-muted">Scanning MongoDB Atlas 768-dimensional vector index...</span>
          </div>
        </div>
      )}

      {/* Retrieval Results Section */}
      {searchResponse && (
        <div className="space-y-6 animate-slide-up">
          {/* Results Summary Bar */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted shadow-xs border border-subtle">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-heading">
                Found {searchResponse.count} relevant {searchResponse.count === 1 ? 'passage' : 'passages'}
              </span>
              <span>for query</span>
              <span className="text-indigo-400 italic max-w-xs sm:max-w-md truncate">
                "{searchResponse.question}"
              </span>
            </div>
            <div className="text-[11px] text-muted">
              Ranked strictly by cosine similarity score
            </div>
          </Card>

          {/* No Results Message */}
          {searchResponse.results.length === 0 ? (
            <EmptyState
              icon={Info}
              title="No Matching Lecture Chunks Found"
              description="No indexed chunks matched your search criteria. Ensure that course documents have completed embeddings, or expand your search query."
            />
          ) : (
            /* Results List */
            <div className="space-y-4">
              {searchResponse.results.map((result, idx) => (
                <SearchResultCard
                  key={result.chunkId || idx}
                  result={result}
                  rank={idx + 1}
                  query={searchResponse.question}
                />
              ))}
            </div>
          )}

          {/* Grounding Scope Footer Notice */}
          <div className="p-4 rounded-2xl card-base border border-indigo-500/25 text-xs text-body flex items-start gap-3 shadow-xs">
            <Info className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold text-heading">Grounded Retrieval Scope: </span>
              These retrieved passages represent the exact grounded context that is injected into Gemini prompts during Study Assistant conversations and Exam Question generation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
