import React from 'react';
import { ArrowUpRight, Sparkles } from 'lucide-react';

/**
 * SuggestedPrompt
 *
 * Clickable prompt chip that fills the assistant question input and triggers submission.
 */
export function SuggestedPrompt({
  prompt,
  onClick,
  category = null,
  icon: Icon = Sparkles,
  disabled = false
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick && onClick(prompt)}
      disabled={disabled}
      className="group w-full text-left p-3 rounded-xl card-base border border-subtle hover:border-indigo-500/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-xs flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="h-6 w-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
          <Icon className="h-3 w-3" />
        </div>

        <div className="min-w-0">
          {category && (
            <span className="text-[10px] font-medium text-muted uppercase tracking-wider block">
              {category}
            </span>
          )}
          <span className="text-xs text-body group-hover:text-heading font-medium truncate block">
            {prompt}
          </span>
        </div>
      </div>

      <ArrowUpRight className="h-3.5 w-3.5 text-muted group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
    </button>
  );
}

export default SuggestedPrompt;
