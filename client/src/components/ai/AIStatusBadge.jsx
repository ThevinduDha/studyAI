import React from 'react';
import { Sparkles, Cpu } from 'lucide-react';

/**
 * AIStatusBadge
 *
 * Displays lightweight, truthful AI model and version metadata
 * without exposing internal keys or sensitive config.
 */
export function AIStatusBadge({
  model = 'Gemini',
  version = null,
  status = 'verified',
  className = ''
}) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium card-base border border-subtle text-muted ${className}`}
    >
      <Cpu className="h-3 w-3 text-indigo-400" />
      <span className="text-secondary font-mono">{model}</span>
      {version && (
        <>
          <span className="text-muted/40">•</span>
          <span className="text-indigo-400 font-semibold">v{version}</span>
        </>
      )}
      {status === 'verified' && (
        <>
          <span className="text-muted/40">•</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-[10px]">Active</span>
        </>
      )}
    </div>
  );
}

export default AIStatusBadge;
