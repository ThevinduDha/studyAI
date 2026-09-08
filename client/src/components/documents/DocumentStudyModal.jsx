import { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  Layers,
  ZoomIn,
  ZoomOut,
  X
} from 'lucide-react';
import { Modal } from '../ui/Modal.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { DocumentStatusBadge } from './DocumentStatusBadge.jsx';
import { StudyToolbar } from './StudyToolbar.jsx';

/**
 * DocumentStudyModal
 * Interactive academic reader and study hub for an ingested lecture document.
 */
export function DocumentStudyModal({
  isOpen,
  onClose,
  document,
  moduleCode,
  moduleName
}) {
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState('text-xs'); // 'text-xs' | 'text-sm'

  if (!isOpen || !document) return null;

  const handleCopyText = async () => {
    if (!document.extractedText) return;
    try {
      await navigator.clipboard.writeText(document.extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy text error:', err);
    }
  };

  const charCount = document.extractedText?.length || 0;
  const wordCount = document.extractedText
    ? document.extractedText.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.originalName}
      description={`Lecture Material • ${moduleCode || document.module?.moduleCode || 'Course Document'}`}
      maxWidth="max-w-4xl"
      footer={
        <div className="flex items-center justify-between w-full text-xs">
          <span className="text-muted text-[11px]">
            Grounding base for semantic chunking, embeddings, and AI synthesis
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Study View
          </Button>
        </div>
      }
    >
      <div className="space-y-5 animate-fade-in">
        {/* Study Hub Banner */}
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  Active Study Workspace
                </span>
                <DocumentStatusBadge status={document.status} errorMsg={document.processingError} />
              </div>
              <h3 className="text-sm font-bold text-heading">
                {document.originalName}
              </h3>
              <p className="text-xs text-muted mt-0.5">
                {moduleName || document.module?.moduleName || 'Course Material'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              {document.pageCount > 0 && (
                <Badge variant="default" size="xs">
                  {document.pageCount} Pages
                </Badge>
              )}
              {document.chunkCount !== undefined && document.chunkCount > 0 && (
                <Badge variant="indigo" size="xs">
                  <Layers className="h-3 w-3 mr-1 inline" />
                  {document.chunkCount} Chunks
                </Badge>
              )}
              {document.embeddedChunkCount !== undefined && document.embeddedChunkCount > 0 && (
                <Badge variant="purple" size="xs">
                  <Sparkles className="h-3 w-3 mr-1 inline" />
                  768d Vector Ready
                </Badge>
              )}
            </div>
          </div>

          {/* Connected Learning Actions */}
          <div className="pt-2 border-t border-indigo-500/20">
            <span className="text-[11px] font-semibold text-muted block mb-2">
              Launch Learning Experience For This Lecture:
            </span>
            <StudyToolbar
              moduleId={document.moduleId || document.module?._id || document.module}
              documentId={document._id}
              variant="compact"
            />
          </div>
        </div>

        {/* Reader Controls & Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted pb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-heading">Extracted Lecture Text</span>
              <span>&bull;</span>
              <span>{charCount.toLocaleString()} chars</span>
              <span>&bull;</span>
              <span>~{wordCount.toLocaleString()} words</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Font size toggle */}
              <div className="flex items-center bg-subtle rounded-lg p-0.5 border border-subtle">
                <button
                  type="button"
                  onClick={() => setFontSize('text-xs')}
                  className={`px-2 py-0.5 text-[11px] rounded font-medium transition cursor-pointer ${
                    fontSize === 'text-xs'
                      ? 'bg-card text-heading shadow-xs'
                      : 'text-muted hover:text-heading'
                  }`}
                  title="Standard font size"
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize('text-sm')}
                  className={`px-2 py-0.5 text-xs rounded font-bold transition cursor-pointer ${
                    fontSize === 'text-sm'
                      ? 'bg-card text-heading shadow-xs'
                      : 'text-muted hover:text-heading'
                  }`}
                  title="Larger font size"
                >
                  A+
                </button>
              </div>

              <Button
                variant="ghost"
                size="xs"
                icon={copied ? Check : Copy}
                onClick={handleCopyText}
                title="Copy entire extracted text"
              >
                <span>{copied ? 'Copied' : 'Copy All'}</span>
              </Button>
            </div>
          </div>

          {/* Reader Viewport */}
          <div className="max-h-[50vh] overflow-y-auto card-base p-5 rounded-2xl border border-subtle bg-subtle/20">
            <p className={`font-mono ${fontSize} text-body leading-relaxed whitespace-pre-wrap select-text`}>
              {document.extractedText || 'No text content extracted for this document yet.'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default DocumentStudyModal;
