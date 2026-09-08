import { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { ChunkCard } from './ChunkCard.jsx';
import documentService from '../../services/document.service.js';

/**
 * DocumentChunksModal
 * Inspection modal for structured dense vector chunks and embedding status.
 */
export function DocumentChunksModal({
  isOpen,
  onClose,
  document,
  canManage = false,
  onChunksUpdated
}) {
  const [chunksData, setChunksData] = useState({ chunks: [], pagination: { page: 1, totalPages: 1, total: 0 } });
  const [loading, setLoading] = useState(false);
  const [embeddingStatus, setEmbeddingStatus] = useState(null);
  const [reEmbedding, setReEmbedding] = useState(false);
  const [error, setError] = useState(null);

  const fetchChunks = async (page = 1) => {
    if (!document?._id) return;
    setLoading(true);
    setError(null);
    try {
      const [chunksRes, embStatusRes] = await Promise.all([
        documentService.getDocumentChunks(document._id, page, 6),
        canManage
          ? documentService.getDocumentEmbeddingStatus(document._id).catch(() => null)
          : Promise.resolve(null)
      ]);

      setChunksData(chunksRes || { chunks: [], pagination: { page: 1, totalPages: 1, total: 0 } });
      if (embStatusRes) {
        setEmbeddingStatus(embStatusRes);
      }
    } catch (err) {
      console.error('Failed to load chunks:', err);
      setError(err.message || 'Could not load document chunks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && document?._id) {
      fetchChunks(1);
    }
  }, [isOpen, document?._id]);

  const handleReEmbed = async () => {
    if (!document?._id) return;
    if (!window.confirm('Regenerate 768-dimensional Gemini embeddings for all chunks in this document?')) return;
    setReEmbedding(true);
    setError(null);
    try {
      const result = await documentService.reEmbedDocument(document._id);
      setEmbeddingStatus(result);
      await fetchChunks(chunksData.pagination?.page || 1);
      if (onChunksUpdated) onChunksUpdated();
    } catch (err) {
      console.error('Re-embed failed:', err);
      setError(err.message || 'Embedding regeneration failed.');
    } finally {
      setReEmbedding(false);
    }
  };

  if (!isOpen || !document) return null;

  const { page = 1, totalPages = 1, total = 0 } = chunksData.pagination || {};

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Lecture Chunks: ${document.originalName}`}
      description="Inspect structured text segments and dense vector embedding metadata"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <span className="text-muted text-[11px]">
            Page {page} of {totalPages} ({total} total chunks)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={ChevronLeft}
              disabled={loading || page <= 1}
              onClick={() => fetchChunks(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={loading || page >= totalPages}
              onClick={() => fetchChunks(page + 1)}
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1 inline" />
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 animate-fade-in">
        {/* Status Bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl bg-subtle/50 border border-subtle">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <Badge variant="indigo" size="xs">
              <Layers className="h-3 w-3 mr-1 inline" />
              {total} Text Chunks
            </Badge>

            {embeddingStatus && (
              <Badge variant="purple" size="xs">
                <Sparkles className="h-3 w-3 mr-1 inline" />
                {embeddingStatus.model || 'gemini-embedding-2'} &bull;{' '}
                {embeddingStatus.dimensions || 768}d &bull;{' '}
                {embeddingStatus.embeddedChunks}/{embeddingStatus.totalChunks} embedded
              </Badge>
            )}
          </div>

          {canManage && (
            <Button
              variant="outline"
              size="xs"
              icon={RefreshCw}
              onClick={handleReEmbed}
              loading={reEmbedding}
              disabled={reEmbedding}
              title="Regenerate Gemini embeddings"
            >
              {reEmbedding ? 'Embedding...' : 'Re-embed Chunks'}
            </Button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Chunk List */}
        <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-muted gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
              <span className="text-xs">Loading structured chunks...</span>
            </div>
          ) : chunksData.chunks.length === 0 ? (
            <div className="py-16 text-center text-muted text-xs card-base rounded-2xl border border-dashed border-subtle">
              No chunks generated for this lecture document yet.
            </div>
          ) : (
            chunksData.chunks.map((chunk, idx) => (
              <ChunkCard
                key={chunk._id || idx}
                chunk={chunk}
                index={(page - 1) * 6 + idx}
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

export default DocumentChunksModal;
