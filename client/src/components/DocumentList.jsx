import { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import documentService from '../services/document.service.js';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import { Card } from './ui/Card.jsx';
import { Modal } from './ui/Modal.jsx';

/**
 * Format bytes to readable string (e.g. 1.4 MB, 512 KB)
 */
const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return 'Unknown size';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(1)} MB`;
};

export default function DocumentList({
  documents = [],
  loading = false,
  onRefresh,
  onDelete,
  onDeleteSuccess,
  canDelete = false,
  emptyMessage = 'No documents uploaded for this module yet.'
}) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Chunk inspection states (Phase 4 & 5)
  const [inspectingChunksDoc, setInspectingChunksDoc] = useState(null);
  const [chunksData, setChunksData] = useState({ chunks: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [embeddingStatusInfo, setEmbeddingStatusInfo] = useState(null);
  const [reEmbedding, setReEmbedding] = useState(false);

  const handleViewChunks = async (doc, page = 1) => {
    setActionError(null);
    setLoadingChunks(true);
    setInspectingChunksDoc(doc);
    try {
      const [data, embInfo] = await Promise.all([
        documentService.getDocumentChunks(doc._id, page, 5),
        canDelete
          ? documentService.getDocumentEmbeddingStatus(doc._id).catch(() => null)
          : Promise.resolve(null)
      ]);
      setChunksData(data);
      if (embInfo) {
        setEmbeddingStatusInfo(embInfo);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to load document chunks');
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleReEmbed = async (docId) => {
    if (!window.confirm('Regenerate 768-dimensional Gemini embeddings for all chunks of this document?')) return;
    setActionError(null);
    setReEmbedding(true);
    try {
      const result = await documentService.reEmbedDocument(docId);
      setEmbeddingStatusInfo(result);
      const refreshedChunks = await documentService.getDocumentChunks(docId, chunksData.pagination?.page || 1, 5);
      setChunksData(refreshedChunks);
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message || 'Failed to re-embed document');
    } finally {
      setReEmbedding(false);
    }
  };

  const handleViewText = async (doc) => {
    setActionError(null);
    setFetchingDetails(true);
    try {
      const fullDoc = await documentService.getDocument(doc._id);
      setSelectedDoc(fullDoc);
    } catch (err) {
      setActionError(err.message || 'Failed to load document text');
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleDelete = async (docId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    setActionError(null);
    setDeletingId(docId);
    try {
      await documentService.deleteDocument(docId);
      if (onDeleteSuccess) {
        onDeleteSuccess(docId);
      } else if (onDelete) {
        onDelete(docId);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status, errorMsg) => {
    switch (status) {
      case 'processed':
        return (
          <Badge variant="emerald" size="xs">
            <CheckCircle2 className="h-3 w-3 mr-1 inline" />
            Processed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="amber" size="xs">
            <Loader2 className="h-3 w-3 animate-spin mr-1 inline" />
            Extracting text...
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="rose" size="xs" title={errorMsg || 'Text extraction failed'}>
            <AlertCircle className="h-3 w-3 mr-1 inline" />
            Failed
          </Badge>
        );
      case 'uploaded':
      default:
        return (
          <Badge variant="cyan" size="xs">
            <Clock className="h-3 w-3 mr-1 inline" />
            Uploaded
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-500 hover:opacity-80 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header toolbar */}
      <div className="flex items-center justify-between text-xs text-muted pb-1">
        <span>{documents.length} document{documents.length === 1 ? '' : 's'} available</span>
        {onRefresh && (
          <Button
            variant="ghost"
            size="xs"
            icon={RefreshCw}
            onClick={onRefresh}
            disabled={loading}
            title="Refresh processing status"
          >
            <span>Refresh Status</span>
          </Button>
        )}
      </div>

      {loading && documents.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-muted">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
          <span className="text-xs">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-subtle p-8 text-center bg-card">
          <FileText className="h-8 w-8 text-muted mx-auto mb-2 opacity-50" />
          <p className="text-xs text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {documents.map((doc) => {
            const isDeleting = deletingId === doc._id;

            return (
              <Card
                key={doc._id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-indigo-500/30 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-xs font-semibold text-heading truncate max-w-sm" title={doc.originalName}>
                        {doc.originalName}
                      </h4>
                      {getStatusBadge(doc.status, doc.processingError)}
                    </div>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted flex-wrap">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.pageCount > 0 && <span>&bull; {doc.pageCount} pages</span>}
                      {doc.chunkCount !== undefined && doc.chunkCount > 0 && (
                        <span className="text-indigo-500 font-medium">&bull; {doc.chunkCount} chunks</span>
                      )}
                      {doc.embeddedChunkCount !== undefined && doc.embeddedChunkCount > 0 && (
                        <span className="text-purple-500 font-medium">&bull; {doc.embeddedChunkCount} embedded (768d)</span>
                      )}
                      <span>&bull; {new Date(doc.createdAt).toLocaleDateString()}</span>
                      {doc.module?.moduleCode && (
                        <Badge variant="indigo" size="xs">
                          {doc.module.moduleCode}
                        </Badge>
                      )}
                    </div>
                    {doc.status === 'failed' && doc.processingError && (
                      <p className="text-[11px] text-rose-500 mt-1">
                        Reason: {doc.processingError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {doc.status === 'processed' && (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={Eye}
                      onClick={() => handleViewText(doc)}
                      disabled={fetchingDetails}
                      title="Inspect extracted text for RAG"
                    >
                      <span>Extracted Text</span>
                    </Button>
                  )}

                  {doc.status === 'processed' && canDelete && (
                    <Button
                      variant="secondary"
                      size="xs"
                      icon={Layers}
                      onClick={() => handleViewChunks(doc, 1)}
                      title="Inspect structured document chunks (Phase 4 & 5)"
                    >
                      <span>Chunks {doc.chunkCount !== undefined ? `(${doc.chunkCount})` : ''}</span>
                    </Button>
                  )}

                  {canDelete && (
                    <Button
                      variant="dangerOutline"
                      size="xs"
                      icon={Trash2}
                      onClick={() => handleDelete(doc._id, doc.originalName)}
                      disabled={isDeleting}
                      loading={isDeleting}
                      title="Delete document"
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Extracted Text Modal */}
      {selectedDoc && (
        <Modal
          isOpen={Boolean(selectedDoc)}
          onClose={() => setSelectedDoc(null)}
          title={`Extracted Text: ${selectedDoc.originalName}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            <p className="text-xs text-muted">
              {selectedDoc.pageCount} pages &bull; {selectedDoc.extractedText?.length || 0} characters extracted
            </p>

            <div className="max-h-[50vh] overflow-y-auto font-mono text-xs text-body whitespace-pre-wrap card-base p-4 rounded-xl border border-subtle">
              {selectedDoc.extractedText || 'No text extracted from this document.'}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-subtle text-xs">
              <span className="text-muted text-[11px]">
                Grounding base for semantic chunking &amp; embeddings
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDoc(null)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Structured Chunks Modal (Phase 4 & Phase 5) */}
      {inspectingChunksDoc && (
        <Modal
          isOpen={Boolean(inspectingChunksDoc)}
          onClose={() => setInspectingChunksDoc(null)}
          title={`Document Chunks: ${inspectingChunksDoc.originalName}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-subtle">
              <div className="flex items-center gap-2">
                <Badge variant="indigo" size="xs">
                  <Layers className="h-3 w-3 mr-1 inline" />
                  Vector Chunks
                </Badge>
                {embeddingStatusInfo && (
                  <Badge variant="purple" size="xs">
                    {embeddingStatusInfo.model || 'gemini-embedding-2'} ({embeddingStatusInfo.dimensions || 768}d) &bull;{' '}
                    {embeddingStatusInfo.embeddedChunks}/{embeddingStatusInfo.totalChunks} embedded
                  </Badge>
                )}
              </div>

              {canDelete && (
                <Button
                  variant="outline"
                  size="xs"
                  icon={RefreshCw}
                  onClick={() => handleReEmbed(inspectingChunksDoc._id)}
                  loading={reEmbedding}
                  title="Regenerate 768-dim embeddings via Gemini"
                >
                  {reEmbedding ? 'Embedding...' : 'Re-embed'}
                </Button>
              )}
            </div>

            <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
              {loadingChunks ? (
                <div className="py-16 text-center text-muted flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading document chunks...</span>
                </div>
              ) : (chunksData.chunks || []).length === 0 ? (
                <div className="py-12 text-center text-muted text-xs">
                  No chunks generated for this document yet.
                </div>
              ) : (
                chunksData.chunks.map((chunk) => (
                  <Card
                    key={chunk._id}
                    className="p-4 transition hover:border-indigo-500/30"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-subtle">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="indigo" size="xs">
                          Chunk #{chunk.chunkIndex}
                        </Badge>
                        <span className="text-[11px] text-muted">
                          {chunk.characterCount} chars &bull; ~{chunk.tokenCount} tokens
                        </span>
                        {chunk.embeddingStatus === 'completed' && (
                          <Badge variant="emerald" size="xs">
                            768d Vector Ready
                          </Badge>
                        )}
                      </div>
                      <Badge variant="default" size="xs">
                        {chunk.metadata?.sourceType || 'pdf'}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-body whitespace-pre-wrap leading-relaxed">
                      {chunk.text}
                    </p>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-subtle text-xs">
              <span className="text-muted text-[11px]">
                Page {chunksData.pagination?.page || 1} of {chunksData.pagination?.totalPages || 1} (
                {chunksData.pagination?.total || 0} total chunks)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  icon={ChevronLeft}
                  disabled={loadingChunks || (chunksData.pagination?.page || 1) <= 1}
                  onClick={() => handleViewChunks(inspectingChunksDoc, (chunksData.pagination?.page || 1) - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={
                    loadingChunks ||
                    (chunksData.pagination?.page || 1) >= (chunksData.pagination?.totalPages || 1)
                  }
                  onClick={() => handleViewChunks(inspectingChunksDoc, (chunksData.pagination?.page || 1) + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1 inline" />
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
