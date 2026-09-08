import { useState } from 'react';
import {
  FileText,
  Layers,
  BookOpen,
  Trash2,
  Eye,
  Sparkles,
  Calendar
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { DocumentStatusBadge } from './DocumentStatusBadge.jsx';
import { StudyToolbar } from './StudyToolbar.jsx';

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

/**
 * DocumentCard
 * Premium lecture document card with metadata, status indicators, and study actions.
 */
export function DocumentCard({
  document,
  onStudy,
  onInspectChunks,
  onDelete,
  canManage = false,
  isDeleting = false,
  className = ''
}) {
  const isProcessed = document.status === 'processed';
  const moduleId = document.moduleId || document.module?._id || document.module;
  const moduleCode = document.module?.moduleCode;

  return (
    <Card
      className={`p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xs border border-subtle hover:border-indigo-500/40 transition group ${className}`}
    >
      <div className="space-y-3">
        {/* Top bar: Module code & status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {moduleCode && (
              <Badge variant="indigo" size="xs">
                {moduleCode}
              </Badge>
            )}
            <DocumentStatusBadge
              status={document.status}
              errorMsg={document.processingError}
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <Calendar className="h-3 w-3 inline mr-0.5" />
            <span>
              {document.createdAt
                ? new Date(document.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'Recent'}
            </span>
          </div>
        </div>

        {/* Document Title & Icon */}
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 shrink-0 group-hover:scale-105 transition">
            <FileText className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className="text-xs sm:text-sm font-bold text-heading truncate leading-snug"
              title={document.originalName}
            >
              {document.originalName}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-muted mt-1 flex-wrap">
              <span>{formatFileSize(document.fileSize)}</span>
              {document.pageCount > 0 && <span>&bull; {document.pageCount} pages</span>}
              {canManage && document.chunkCount !== undefined && document.chunkCount > 0 && (
                <span className="text-indigo-400 font-medium">
                  &bull; {document.chunkCount} chunks
                </span>
              )}
              {canManage && document.embeddedChunkCount !== undefined && document.embeddedChunkCount > 0 && (
                <span className="text-purple-400 font-medium">
                  &bull; {document.embeddedChunkCount} embedded (768d)
                </span>
              )}
            </div>

            {document.status === 'failed' && document.processingError && (
              <p className="text-[11px] text-rose-400 mt-1.5 leading-tight">
                Error: {document.processingError}
              </p>
            )}
          </div>
        </div>

        {/* Study Quick Actions (when processed) */}
        {isProcessed && (
          <div className="pt-2 border-t border-subtle">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted block mb-1.5">
              Study Lecture:
            </span>
            <StudyToolbar
              moduleId={moduleId}
              documentId={document._id}
              variant="compact"
            />
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-subtle">
        <div className="flex items-center gap-2">
          {isProcessed && onStudy && (
            <Button
              variant="primary"
              size="xs"
              icon={Eye}
              onClick={() => onStudy(document)}
              title="Open lecture study view"
            >
              Study
            </Button>
          )}

          {canManage && isProcessed && onInspectChunks && (
            <Button
              variant="outline"
              size="xs"
              icon={Layers}
              onClick={() => onInspectChunks(document)}
              title="Inspect structured chunks"
            >
              Chunks {document.chunkCount !== undefined ? `(${document.chunkCount})` : ''}
            </Button>
          )}
        </div>

        {canManage && onDelete && (
          <Button
            variant="dangerOutline"
            size="xs"
            icon={Trash2}
            onClick={() => onDelete(document._id, document.originalName)}
            disabled={isDeleting}
            loading={isDeleting}
            title="Delete lecture document"
          />
        )}
      </div>
    </Card>
  );
}

export default DocumentCard;
