import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Search,
  RefreshCw,
  Layers,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  BookOpen,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import moduleService from '../services/module.service.js';
import documentService from '../services/document.service.js';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';
import { DocumentChunksModal } from '../components/documents/DocumentChunksModal.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton, SkeletonGrid, SkeletonCard } from '../components/ui/Skeleton.jsx';

export default function AdminDocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialModuleId = searchParams.get('moduleId') || '';

  const [modules, setModules] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [inspectingDoc, setInspectingDoc] = useState(null);
  const [reEmbeddingId, setReEmbeddingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchCatalog = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [modulesRes, docsRes] = await Promise.all([
        moduleService.getAllModules(),
        documentService.getDocuments(selectedModuleId || undefined)
      ]);

      setModules(Array.isArray(modulesRes) ? modulesRes : []);
      setDocuments(Array.isArray(docsRes) ? docsRes : []);
    } catch (err) {
      console.error('Failed to load document catalog:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to load documents' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedModuleId]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleModuleChange = (moduleId) => {
    setSelectedModuleId(moduleId);
    if (moduleId) {
      setSearchParams({ moduleId });
    } else {
      setSearchParams({});
    }
  };

  const handleReEmbed = async (docId) => {
    setReEmbeddingId(docId);
    setFeedback(null);
    try {
      await documentService.reEmbedDocument(docId);
      setFeedback({ type: 'success', message: 'Re-embedding initiated. Document chunks updated.' });
      fetchCatalog(true);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to re-embed document' });
    } finally {
      setReEmbeddingId(null);
    }
  };

  const handleDelete = async (docId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This removes all vector embeddings and study data.`)) {
      return;
    }
    setDeletingId(docId);
    setFeedback(null);
    try {
      await documentService.deleteDocument(docId);
      setFeedback({ type: 'success', message: `"${name}" removed successfully.` });
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete document' });
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    const k = 1024;
    if (bytes < k) return `${bytes} B`;
    if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
    return `${(bytes / (k * k)).toFixed(1)} MB`;
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      search.trim() === '' ||
      doc.originalName?.toLowerCase().includes(search.toLowerCase()) ||
      doc.module?.moduleCode?.toLowerCase().includes(search.toLowerCase()) ||
      doc.module?.moduleName?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ready' && (doc.status === 'ready' || doc.status === 'processed')) ||
      (statusFilter === 'processing' && (doc.status === 'processing' || doc.status === 'uploaded')) ||
      (statusFilter === 'failed' && doc.status === 'failed');

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        <Skeleton height="h-28" className="w-full rounded-2xl" />
        <SkeletonGrid count={4} />
        <SkeletonCard className="h-96" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <PageHeader
        badge="Content Management"
        badgeVariant="purple"
        title="Lecture Document Library"
        icon={FileText}
        subtitle="Upload course PDFs, monitor vector embeddings and text chunking, and verify AI study readiness."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchCatalog(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={UploadCloud}
              onClick={() => setIsUploadOpen(true)}
            >
              Upload Lecture PDF
            </Button>
          </div>
        }
      />

      {/* Alert Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between transition ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters Toolbar */}
      <Card className="p-4 border border-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search */}
            <div className="w-full sm:w-64">
              <Input
                id="doc-search"
                icon={Search}
                placeholder="Search lectures..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Course Filter Dropdown */}
            <div className="w-full sm:w-64">
              <Select
                id="module-filter"
                value={selectedModuleId}
                onChange={(e) => handleModuleChange(e.target.value)}
              >
                <option value="">All Academic Courses</option>
                {modules.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.moduleCode} — {m.moduleName}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'text-muted hover:text-heading hover:bg-subtle'
              }`}
            >
              All ({documents.length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'ready'
                  ? 'bg-emerald-600 text-white'
                  : 'text-muted hover:text-heading hover:bg-subtle'
              }`}
            >
              Ready ({documents.filter((d) => d.status === 'ready' || d.status === 'processed').length})
            </button>
            <button
              onClick={() => setStatusFilter('processing')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'processing'
                  ? 'bg-amber-600 text-white'
                  : 'text-muted hover:text-heading hover:bg-subtle'
              }`}
            >
              Processing ({documents.filter((d) => d.status === 'processing' || d.status === 'uploaded').length})
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'failed'
                  ? 'bg-rose-600 text-white'
                  : 'text-muted hover:text-heading hover:bg-subtle'
              }`}
            >
              Failed ({documents.filter((d) => d.status === 'failed').length})
            </button>
          </div>
        </div>
      </Card>

      {/* Document Items List */}
      {filteredDocs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Documents Found"
          description={
            search || selectedModuleId || statusFilter !== 'all'
              ? 'No documents match your active filters.'
              : 'Upload course PDF lectures to get started with StudyAI vector indexing.'
          }
          actionLabel="Upload Lecture PDF"
          onAction={() => setIsUploadOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const isReady = doc.status === 'ready' || doc.status === 'processed';
            const isProcessing = doc.status === 'processing' || doc.status === 'uploaded';
            const isFailed = doc.status === 'failed';
            const isReEmbedding = reEmbeddingId === doc._id;
            const isDeleting = deletingId === doc._id;

            return (
              <Card
                key={doc._id}
                className="p-4 sm:p-5 border border-subtle hover:border-indigo-500/30 transition shadow-xs"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Document details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                      <FileText className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {doc.module?.moduleCode && (
                          <Badge variant="indigo" size="xs">
                            {doc.module.moduleCode}
                          </Badge>
                        )}
                        <h3 className="text-sm sm:text-base font-bold text-heading truncate">
                          {doc.originalName}
                        </h3>
                      </div>

                      {doc.module?.moduleName && (
                        <p className="text-xs text-muted truncate">
                          Course: {doc.module.moduleName}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-muted pt-1 flex-wrap">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        {doc.pageCount > 0 && <span>&bull; {doc.pageCount} pages</span>}
                        {doc.chunkCount !== undefined && (
                          <span className="text-indigo-400 font-medium">
                            &bull; {doc.chunkCount} chunks
                          </span>
                        )}
                        {doc.embeddedChunkCount !== undefined && doc.embeddedChunkCount > 0 && (
                          <span className="text-purple-400 font-medium">
                            &bull; {doc.embeddedChunkCount} embedded (768d)
                          </span>
                        )}
                        <span>
                          &bull;{' '}
                          {doc.createdAt
                            ? new Date(doc.createdAt).toLocaleDateString()
                            : 'Recently added'}
                        </span>
                      </div>

                      {isFailed && doc.processingError && (
                        <p className="text-xs text-rose-400 mt-1">
                          Failure reason: {doc.processingError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status and Admin Controls */}
                  <div className="flex items-center gap-2.5 self-end lg:self-center flex-wrap">
                    {isReady && (
                      <Badge variant="emerald" size="xs">
                        <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                        Ready for Study
                      </Badge>
                    )}
                    {isProcessing && (
                      <Badge variant="amber" size="xs">
                        <Clock className="h-3 w-3 mr-1 inline animate-spin" />
                        Processing Material
                      </Badge>
                    )}
                    {isFailed && (
                      <Badge variant="rose" size="xs">
                        <AlertTriangle className="h-3 w-3 mr-1 inline" />
                        Processing Failed
                      </Badge>
                    )}

                    {/* Inspect Chunks */}
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Layers}
                      onClick={() => setInspectingDoc(doc)}
                      title="Inspect dense text chunks and vector embeddings"
                    >
                      Inspect Chunks
                    </Button>

                    {/* Re-embed */}
                    <Button
                      variant="outline"
                      size="xs"
                      icon={RefreshCw}
                      onClick={() => handleReEmbed(doc._id)}
                      loading={isReEmbedding}
                      disabled={isReEmbedding}
                      title="Re-generate vector embeddings for all chunks"
                    >
                      Re-embed
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="dangerOutline"
                      size="xs"
                      icon={Trash2}
                      onClick={() => handleDelete(doc._id, doc.originalName)}
                      loading={isDeleting}
                      disabled={isDeleting}
                      title="Delete document and remove all vectors"
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Lecture PDF Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        initialModuleId={selectedModuleId}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchCatalog(true);
        }}
      />

      {/* Inspect Chunks Modal */}
      {inspectingDoc && (
        <DocumentChunksModal
          isOpen={!!inspectingDoc}
          document={inspectingDoc}
          canManage={true}
          onClose={() => setInspectingDoc(null)}
          onChunksUpdated={() => fetchCatalog(true)}
        />
      )}
    </div>
  );
}
