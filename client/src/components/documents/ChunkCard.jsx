import { useState } from 'react';
import { Copy, Check, Layers, Sparkles, FileText } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * ChunkCard
 * Displays a structured lecture chunk with academic metadata and clean typography.
 */
export function ChunkCard({ chunk, index, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!chunk?.text) return;
    try {
      await navigator.clipboard.writeText(chunk.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const chunkIdx = chunk.chunkIndex !== undefined ? chunk.chunkIndex : (index !== undefined ? index + 1 : 1);
  const metadata = chunk.metadata || {};

  return (
    <Card className={`p-4 transition hover:border-indigo-500/40 space-y-3 ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-subtle">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="indigo" size="xs">
            <Layers className="h-3 w-3 mr-1 inline shrink-0" />
            Chunk #{chunkIdx}
          </Badge>

          {metadata.sectionHeading && (
            <span className="text-[11px] font-semibold text-heading truncate max-w-xs">
              § {metadata.sectionHeading}
            </span>
          )}

          {metadata.pageStart && (
            <span className="text-[11px] text-muted">
              p. {metadata.pageStart}
              {metadata.pageEnd && metadata.pageEnd !== metadata.pageStart ? `–${metadata.pageEnd}` : ''}
            </span>
          )}

          <span className="text-[11px] text-muted font-mono">
            {chunk.characterCount || chunk.text?.length || 0} chars &bull; ~{chunk.tokenCount || Math.round((chunk.text?.length || 0) / 4)} tokens
          </span>

          {chunk.embeddingStatus === 'completed' && (
            <Badge variant="emerald" size="xs">
              <Sparkles className="h-2.5 w-2.5 mr-1 inline text-emerald-400" />
              768d Vector Ready
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="xs"
          icon={copied ? Check : Copy}
          onClick={handleCopy}
          title="Copy chunk text snippet"
          className="text-muted hover:text-heading"
        >
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>

      {/* Chunk Passage */}
      <div className="card-base rounded-xl p-3.5 border border-subtle bg-subtle/30">
        <p className="font-mono text-xs sm:text-[13px] text-body leading-relaxed whitespace-pre-wrap select-text">
          {chunk.text}
        </p>
      </div>
    </Card>
  );
}

export default ChunkCard;
