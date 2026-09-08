import React from 'react';
import { Sparkles, Brain, Lightbulb, ArrowRight, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { AIStatusBadge, GroundedBadge, AIThinkingIndicator } from '../ai/index.js';

/**
 * AIStudyAdvisorCard
 *
 * Strategic revision recommendations grounded strictly in verified analytics.
 * Supports on-demand AI insight generation with deterministic fallbacks.
 */
export function AIStudyAdvisorCard({
  recommendations = [],
  aiAdvice = null,
  loadingAi = false,
  onGetAiAdvice,
  className = ''
}) {
  const activeAdviceList = aiAdvice?.advice?.length > 0 ? aiAdvice.advice : recommendations;
  const isAiGenerated = aiAdvice?.source === 'ai';

  return (
    <Card
      className={`p-5 sm:p-6 flex flex-col justify-between shadow-sm border border-indigo-500/25 bg-gradient-to-br from-indigo-500/5 via-canvas to-canvas ${className}`}
    >
      <div className="space-y-4">
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-heading">
              AI Study Advisor
            </span>
          </div>

          <Button
            variant="outline"
            size="xs"
            icon={loadingAi ? RefreshCw : Brain}
            onClick={onGetAiAdvice}
            loading={loadingAi}
            title="Generate personalized AI advice from your analytics"
          >
            {loadingAi ? 'Analyzing...' : isAiGenerated ? 'Regenerate Advice' : 'AI Advice'}
          </Button>
        </div>

        {/* Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {isAiGenerated ? (
            <>
              <Badge variant="indigo" size="xs">
                AI Synthesized
              </Badge>
              <AIStatusBadge model="Gemini" status="verified" />
            </>
          ) : (
            <Badge variant="emerald" size="xs">
              Deterministic Analytics
            </Badge>
          )}
          <GroundedBadge label="Grounded in Quiz Records" size="xs" variant="emerald" />
        </div>

        {/* Subtitle */}
        <h3 className="text-sm sm:text-base font-bold text-heading">
          Strategic Action Plan
        </h3>

        {/* Loading State */}
        {loadingAi && (
          <AIThinkingIndicator
            title="Synthesizing personalized study advice..."
            subtitle="Evaluating weak topics, error volume, and difficulty pacing to generate high-yield recommendations."
          />
        )}

        {/* Advice List */}
        {!loadingAi && (
          <div className="space-y-2.5 pt-1">
            {activeAdviceList.slice(0, 4).map((rec, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl card-base border border-subtle text-xs text-body shadow-xs leading-relaxed"
              >
                <div className="h-5 w-5 rounded-md bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  {idx + 1}
                </div>
                <span className="font-medium text-secondary">{rec}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="mt-5 pt-3.5 border-t border-subtle flex items-center justify-between text-xs">
        <span className="text-[11px] text-muted">Ready to practice?</span>
        <a
          href="/quizzes"
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
        >
          Start Practice Quiz <ArrowRight className="h-3 w-3" />
        </a>
      </div>
    </Card>
  );
}

export default AIStudyAdvisorCard;
