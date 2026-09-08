import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Layers,
  Sparkles,
  Bot,
  Copy,
  Check,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * SearchResultCard
 * Displays dense vector retrieval search result with relevance score and Ask AI CTA.
 */
export function SearchResultCard({
  result,
  rank,
  query,
  onAskAI,
  className = ''
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result?.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  const handleAskAI = () => {
    if (onAskAI) {
      onAskAI(result);
      return;
    }

    const params = new URLSearchParams();
    if (result.moduleId) params.set('module', result.moduleId);
    if (result.documentId) params.set('document', result.documentId);
    if (query) params.set('q', query);

    navigate(`/assistant?${params.toString()}`);
  };

  const metadata = result.metadata || {};
  const scoreFormatted = typeof result.score === 'number' ? result.score.toFixed(4) : result.score;

  return (
    <Card
      className={`p-5 space-y-3.5 shadow-xs border border-subtle hover:border-indigo-500/40 transition ${className}`}
    >
      {/* Top row: Rank, Module, Document, Relevance */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {rank !== undefined && (
            <span className="px-2 py-0.5 rounded-md card-base text-heading font-mono text-[11px] font-bold border border-subtle">
              #{rank}
            </span>
          )}

          {result.moduleCode && (
            <Badge variant="indigo" size="xs">
              {result.moduleCode}
            </Badge>
          )}

          <span className="font-semibold text-heading flex items-center gap-1.5 truncate max-w-xs sm:max-w-md">
            <FileText className="h-3.5 w-3.5 text-muted shrink-0" />
            <span className="truncate">{result.documentName}</span>
          </span>

          <span className="text-muted text-[11px]">
            (Chunk #{result.chunkIndex})
          </span>
        </div>

        <Badge variant="emerald" size="xs" className="font-mono">
          <Sparkles className="h-2.5 w-2.5 mr-1 inline text-emerald-400" />
          Relevance: {scoreFormatted}
        </Badge>
      </div>

      {/* Metadata tags */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted border-b border-subtle pb-2.5">
        {metadata.pageStart && (
          <span>
            Pages: {metadata.pageStart}
            {metadata.pageEnd && metadata.pageEnd !== metadata.pageStart ? `–${metadata.pageEnd}` : ''}
          </span>
        )}
        {metadata.sectionHeading && (
          <span className="font-medium text-heading">
            Section: {metadata.sectionHeading}
          </span>
        )}
        <span>{result.characterCount || result.text?.length || 0} chars</span>
        <span>~{result.tokenCount || Math.round((result.text?.length || 0) / 4)} tokens</span>
      </div>

      {/* Excerpt Passage */}
      <div className="card-base rounded-xl p-4 border border-subtle bg-subtle/25">
        <p className="text-xs sm:text-sm text-body leading-relaxed whitespace-pre-wrap select-text">
          {result.text}
        </p>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between gap-3 pt-1 text-xs">
        <Button
          variant="ghost"
          size="xs"
          icon={copied ? Check : Copy}
          onClick={handleCopy}
          className="text-muted hover:text-heading"
        >
          <span>{copied ? 'Copied Snippet' : 'Copy Passage'}</span>
        </Button>

        <Button
          variant="primary"
          size="xs"
          icon={Bot}
          onClick={handleAskAI}
          title="Ask AI study assistant about this lecture excerpt"
        >
          <span>Ask AI About This</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
        </Button>
      </div>
    </Card>
  );
}

export default SearchResultCard;
