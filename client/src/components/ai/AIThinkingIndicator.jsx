import React from 'react';
import { Sparkles, Compass } from 'lucide-react';

/**
 * AIThinkingIndicator
 *
 * Professional loading state for AI processing.
 * Communicates search and synthesis without implying hidden internal reasoning.
 */
export function AIThinkingIndicator({
  title = 'AI is analyzing your lecture material...',
  subtitle = 'Retrieving relevant passages from course documents & synthesizing grounded answer.',
  className = ''
}) {
  return (
    <div
      className={`card-base border border-indigo-500/20 rounded-2xl p-4 sm:p-5 shadow-sm max-w-xl animate-fade-in ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3.5">
        {/* Pulsing Icon Halo */}
        <div className="relative flex items-center justify-center shrink-0">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
            <Sparkles className="h-4 w-4 animate-spin [animation-duration:3s]" />
          </div>
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
          </span>
        </div>

        {/* Content & Animated Dots */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-heading tracking-wide">
              {title}
            </h4>
            {/* 3-dot pulse wave */}
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-bounce" />
            </div>
          </div>

          <p className="text-[11px] text-muted leading-relaxed">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIThinkingIndicator;
