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
  onDeleteSuccess,
  canDelete = false,
  emptyMessage = 'No documents uploaded for this module yet.'
}) {
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Chunk inspection states (Phase 4)
  const [inspectingChunksDoc, setInspectingChunksDoc] = useState(null);
  const [chunksData, setChunksData] = useState({ chunks: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loadingChunks, setLoadingChunks] = useState(false);

  const handleViewChunks = async (doc, page = 1) => {
    setActionError(null);
    setLoadingChunks(true);
    setInspectingChunksDoc(doc);
    try {
      const data = await documentService.getDocumentChunks(doc._id, page, 5);
      setChunksData(data);
    } catch (err) {
      setActionError(err.message || 'Failed to load document chunks');
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleViewText = async (doc) => {
    setActionError(null);
    setFetchingDetails(true);
    try {
      // Fetch full document with extractedText
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
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/50 text-emerald-300 border border-emerald-800/60">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            Processed
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-950/50 text-amber-300 border border-amber-800/60">
            <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
            Extracting text...
          </span>
        );
      case 'failed':
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-950/50 text-red-300 border border-red-800/60"
            title={errorMsg || 'Text extraction failed'}
          >
            <AlertCircle className="h-3 w-3 text-red-400" />
            Failed
          </span>
        );
      case 'uploaded':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-950/50 text-blue-300 border border-blue-800/60">
            <Clock className="h-3 w-3 text-blue-400" />
            Uploaded
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Header toolbar */}
      <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
        <span>{documents.length} document{documents.length === 1 ? '' : 's'} available</span>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition cursor-pointer disabled:opacity-50"
            title="Refresh processing status"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        )}
      </div>

      {loading && documents.length === 0 ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
          <span className="text-xs">Loading documents...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-800 p-8 text-center bg-[#090d16]/40">
          <FileText className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {documents.map((doc) => {
            const isDeleting = deletingId === doc._id;

            return (
              <div
                key={doc._id}
                className="rounded-lg border border-slate-800/90 bg-[#090d16]/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400 shrink-0 mt-0.5">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-xs font-semibold text-white truncate max-w-sm" title={doc.originalName}>
                        {doc.originalName}
                      </h4>
                      {getStatusBadge(doc.status, doc.processingError)}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.pageCount > 0 && <span>&bull; {doc.pageCount} pages</span>}
                      {doc.chunkCount !== undefined && doc.chunkCount > 0 && (
                        <span className="text-indigo-400 font-medium">&bull; {doc.chunkCount} chunks</span>
                      )}
                      <span>&bull; Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                      {doc.module?.moduleCode && (
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300">
                          {doc.module.moduleCode}
                        </span>
                      )}
                    </div>
                    {doc.status === 'failed' && doc.processingError && (
                      <p className="text-[11px] text-red-400/90 mt-1">
                        Reason: {doc.processingError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {doc.status === 'processed' && (
                    <button
                      onClick={() => handleViewText(doc)}
                      disabled={fetchingDetails}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                      title="Inspect extracted text for RAG"
                    >
                      <Eye className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Extracted Text</span>
                    </button>
                  )}

                  {doc.status === 'processed' && canDelete && (
                    <button
                      onClick={() => handleViewChunks(doc, 1)}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/60 transition cursor-pointer"
                      title="Inspect structured document chunks (Phase 4)"
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Chunks {doc.chunkCount !== undefined ? `(${doc.chunkCount})` : ''}</span>
                    </button>
                  )}

                  {canDelete && (
                    <button
                      onClick={() => handleDelete(doc._id, doc.originalName)}
                      disabled={isDeleting}
                      className="p-1.5 rounded-md bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 transition cursor-pointer disabled:opacity-50"
                      title="Delete document"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extracted Text Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[85vh] rounded-xl border border-slate-800 bg-[#0e1526] p-6 shadow-2xl flex flex-col relative">
            <button
              onClick={() => setSelectedDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  {selectedDoc.module?.moduleCode || 'Module Document'}
                </span>
                <span className="text-xs text-slate-400">
                  {selectedDoc.pageCount} pages &bull; {selectedDoc.extractedText?.length || 0} characters
                </span>
              </div>
              <h3 className="text-base font-bold text-white truncate max-w-lg">{selectedDoc.originalName}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ingested plain text extracted from PDF. This sanitized corpus serves as the grounding baseline for Phase 4 chunking.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border border-slate-800/80 bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-500 selection:text-white">
              {selectedDoc.extractedText || '(No text content extracted from this document)'}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-4 text-xs">
              <span className="text-slate-500 text-[11px]">
                Ready for Phase 4 semantic chunking &amp; sliding overlap
              </span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Structured Chunks Modal (Phase 4) */}
      {inspectingChunksDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-3xl w-full max-h-[90vh] rounded-2xl border border-slate-800 bg-[#0c1222] p-6 shadow-2xl flex flex-col relative">
            <button
              onClick={() => setInspectingChunksDoc(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  <Layers className="h-3 w-3" />
                  Phase 4 Chunks
                </span>
                <span className="text-xs text-slate-400">
                  Total: {chunksData.pagination?.total || 0} chunks &bull; Default target: ~900 words &bull; ~150 words overlap
                </span>
              </div>
              <h3 className="text-base font-bold text-white truncate max-w-xl">
                {inspectingChunksDoc.originalName}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {loadingChunks ? (
                <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading document chunks...</span>
                </div>
              ) : (chunksData.chunks || []).length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No chunks generated for this document yet.
                </div>
              ) : (
                chunksData.chunks.map((chunk) => (
                  <div
                    key={chunk._id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                          Chunk #{chunk.chunkIndex}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {chunk.characterCount} chars &bull; ~{chunk.tokenCount} tokens (est)
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {chunk.metadata?.sourceType || 'pdf'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {chunk.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 mt-4 text-xs">
              <span className="text-slate-400 text-[11px]">
                Page {chunksData.pagination?.page || 1} of {chunksData.pagination?.totalPages || 1} (
                {chunksData.pagination?.total || 0} total chunks)
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={loadingChunks || (chunksData.pagination?.page || 1) <= 1}
                  onClick={() => handleViewChunks(inspectingChunksDoc, (chunksData.pagination?.page || 1) - 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  disabled={
                    loadingChunks ||
                    (chunksData.pagination?.page || 1) >= (chunksData.pagination?.totalPages || 1)
                  }
                  onClick={() => handleViewChunks(inspectingChunksDoc, (chunksData.pagination?.page || 1) + 1)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
