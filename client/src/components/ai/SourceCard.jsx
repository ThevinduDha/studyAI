import React, { useState } from 'react';
import { FileText, Bookmark, Hash, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

/**
 * SourceCard
 *
 * Visually secondary, elegant citation card displaying real metadata
 * for retrieved lecture chunks without exposing internal vectors or embeddings.
 */
export function SourceCard({ source, index = 0, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!source) return null;

  const docName = source.documentName || source.title || 'Course Lecture';
  const moduleCode = source.moduleCode || null;
  const chunkNum = source.chunkIndex !== undefined && source.chunkIndex !== null
    ? source.chunkIndex
    : index + 1;
  const hasPages = source.pageStart !== undefined && source.pageStart !== null;
  const pageLabel = hasPages
    ? `p. ${source.pageStart}${source.pageEnd && source.pageEnd !== source.pageStart ? `–${source.pageEnd}` : ''}`
    : null;
  const sectionHeading = source.sectionHeading || null;
  const score = typeof source.relevanceScore === 'number'
    ? Math.round(source.relevanceScore * 100)
    : null;
  const snippet = source.text || source.snippet || source.content || null;

  return (
    <div
      className={`rounded-xl card-base border border-subtle transition-all duration-200 text-xs ${
        expanded ? 'border-indigo-500/40 shadow-sm' : 'hover:border-indigo-500/30'
      }`}
    >
      {/* Header / Clickable trigger */}
      <div
        className="p-3 flex items-center justify-between gap-2 cursor-pointer select-none"
        onClick={() => snippet && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <FileText className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-heading truncate max-w-[220px]" title={docName}>
                {docName}
              </span>
              {moduleCode && (
                <Badge variant="indigo" size="xs">
                  {moduleCode}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5">
              <span className="flex items-center gap-0.5">
                <Hash className="h-3 w-3 text-muted" />
                Chunk {chunkNum}
              </span>
              {pageLabel && (
                <>
                  <span>•</span>
                  <span>{pageLabel}</span>
                </>
              )}
              {sectionHeading && (
                <>
                  <span>•</span>
                  <span className="italic truncate max-w-[130px]" title={sectionHeading}>
                    § {sectionHeading}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {score !== null && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
              {score}% Match
            </span>
          )}
          {snippet && (
            <button
              type="button"
              className="text-muted hover:text-heading p-1 transition"
              aria-label={expanded ? 'Collapse citation' : 'Expand citation'}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable Snippet Body */}
      {expanded && snippet && (
        <div className="px-3 pb-3 pt-1 border-t border-subtle/50 text-[11px] text-secondary leading-relaxed bg-canvas/40 rounded-b-xl animate-fade-in">
          <p className="italic text-muted line-clamp-4 font-serif">
            "{snippet}"
          </p>
        </div>
      )}
    </div>
  );
}

export default SourceCard;
