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
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Select.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

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
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Phase 6 Retrieval"
        badgeVariant="indigo"
        title="Knowledge Search"
        icon={Search}
        subtitle="Perform dense vector semantic retrieval on course lecture chunks using 768-dimensional Gemini embeddings and MongoDB Atlas Vector Search."
      />

      {/* Scope Notice */}
      {!isAdmin && modules.length === 0 && !loadingModules && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">No Enrolled Modules</p>
            <p className="text-xs opacity-90 mt-0.5">
              You are not enrolled in any modules yet. As a student, semantic retrieval is strictly scoped to your enrolled courses. Please visit Course Modules and enroll in a course to search its materials.
            </p>
          </div>
        </div>
      )}

      {/* Search Input Card */}
      <Card className="p-6 shadow-md">
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Question Textarea */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="search-question" className="block text-sm font-medium text-heading">
                Search Question or Academic Concept
              </label>
              <span className={`text-xs ${question.length > 1900 ? 'text-amber-500' : 'text-muted'}`}>
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
              className="w-full p-4 rounded-xl input-base text-sm resize-y"
              required
            />
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-subtle">
            {/* Module Filter */}
            <div>
              <Select
                id="search-module"
                label={`Filter by Module ${isAdmin ? '(Optional)' : ''}`}
                icon={BookOpen}
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                disabled={loadingModules || modules.length === 0}
              >
                <option value="">
                  {isAdmin ? 'All Modules (Global Scope)' : 'All Enrolled Modules'}
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
                label="Filter by Document (Optional)"
                icon={FileText}
                value={selectedDocument}
                onChange={(e) => setSelectedDocument(e.target.value)}
                disabled={!selectedModule || loadingDocs || documents.length === 0}
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
              </Select>
            </div>

            {/* Top-K Selector */}
            <div>
              <label htmlFor="search-topk" className="block text-xs font-medium text-muted mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sliders className="h-3.5 w-3.5 text-indigo-500" />
                  Top-K Results
                </span>
                <span className="font-mono text-indigo-500 font-bold">{topK}</span>
              </label>
              <input
                type="range"
                id="search-topk"
                min={1}
                max={20}
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-subtle rounded-lg"
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
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Search}
              disabled={loading || (!isAdmin && modules.length === 0)}
              loading={loading}
            >
              {loading ? 'Searching Atlas Vector Index...' : 'Search Knowledge Base'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Retrieval Results Section */}
      {searchResponse && (
        <div className="space-y-6 animate-slide-up">
          {/* Results Summary Bar */}
          <Card className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-muted shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-heading">
                Found {searchResponse.count} relevant {searchResponse.count === 1 ? 'chunk' : 'chunks'}
              </span>
              <span>for query</span>
              <span className="text-indigo-500 italic max-w-xs sm:max-w-md truncate">
                "{searchResponse.question}"
              </span>
            </div>
            <div className="text-[11px] text-muted">
              Ranked strictly by cosine similarity score
            </div>
          </Card>

          {/* No Results Message */}
          {searchResponse.results.length === 0 && (
            <EmptyState
              icon={Info}
              title="No Matching Chunks Found"
              description="No indexed chunks matched your search criteria. Ensure that documents have completed embeddings, or expand your search scope."
            />
          )}

          {/* Chunks List */}
          <div className="space-y-4">
            {searchResponse.results.map((result, idx) => (
              <Card
                key={result.chunkId}
                className="p-5 hover:border-indigo-500/40 transition space-y-3 shadow-sm"
              >
                {/* Header: Score, Document, Module */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md card-base text-heading font-mono text-[11px] font-semibold border border-subtle">
                      #{idx + 1}
                    </span>

                    {result.moduleCode && (
                      <Badge variant="indigo" size="xs">
                        {result.moduleCode}
                      </Badge>
                    )}

                    <span className="font-semibold text-heading flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-muted" />
                      {result.documentName}
                    </span>

                    <span className="text-muted text-[11px]">
                      (Chunk #{result.chunkIndex})
                    </span>
                  </div>

                  {/* Similarity Score */}
                  <Badge variant="emerald" size="xs">
                    Relevance: {typeof result.score === 'number' ? result.score.toFixed(4) : result.score}
                  </Badge>
                </div>

                {/* Metadata details */}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted border-b border-subtle pb-2">
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
                <div className="card-base rounded-xl p-4 border border-subtle">
                  <p className="text-xs sm:text-sm text-body leading-relaxed font-sans whitespace-pre-wrap">
                    {result.text}
                  </p>
                </div>
              </Card>
            ))}
          </div>

          {/* Scope Note */}
          <div className="p-4 rounded-xl card-base border border-indigo-500/30 text-xs text-body flex items-start gap-2.5 shadow-sm">
            <Info className="h-4 w-4 shrink-0 text-indigo-500 mt-0.5" />
            <div>
              <span className="font-semibold text-heading">Grounded Retrieval Scope: </span>
              These retrieved chunks represent the exact grounded context that is injected into Gemini prompts during Study Assistant and Exam Generation for accurate answer synthesis and citations.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
