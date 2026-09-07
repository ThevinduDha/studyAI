import { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Layers,
  Target,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

/**
 * Custom hook to animate numbers once on mount
 */
function useCountUp(targetNumber, duration = 800) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // If prefers-reduced-motion, skip animation
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(targetNumber);
      return;
    }

    if (typeof targetNumber !== 'number' || isNaN(targetNumber) || targetNumber <= 0) {
      setCount(targetNumber || 0);
      return;
    }

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easedProgress * targetNumber));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [targetNumber, duration]);

  return count;
}

function StatItem({ icon: Icon, colorClass, label, value, isPercentage, subtext, badgeText, badgeVariant }) {
  const animatedValue = useCountUp(typeof value === 'number' ? value : 0);

  return (
    <Card hoverable className="p-5 flex flex-col justify-between shadow-sm transition hover:border-indigo-500/30">
      <div className="flex items-center justify-between text-xs text-muted mb-3">
        <span className="font-medium text-xs text-muted">{label}</span>
        <div className={`p-2 rounded-xl ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-heading tracking-tight">
            {animatedValue}
            {isPercentage && '%'}
          </span>
          {badgeText && (
            <Badge variant={badgeVariant || 'default'} size="xs">
              {badgeText}
            </Badge>
          )}
        </div>

        {subtext && (
          <p className="text-xs text-muted mt-1.5 line-clamp-1">
            {subtext}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function DashboardStats({ enrolledCount = 0, analytics = null }) {
  const overview = analytics?.overview || {};
  const quizzesDone = overview.totalQuizzesCompleted || 0;
  const questionsSolved = overview.totalQuestionsAttempted || 0;
  const accuracy = overview.overallAccuracy || 0;

  const accuracyBadgeVariant =
    accuracy >= 80 ? 'emerald' : accuracy >= 60 ? 'amber' : accuracy > 0 ? 'rose' : 'default';
  const accuracyBadgeLabel =
    accuracy >= 80 ? 'Strong' : accuracy >= 60 ? 'Average' : accuracy > 0 ? 'Needs Focus' : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      <StatItem
        icon={BookOpen}
        colorClass="bg-indigo-500/10 text-indigo-500"
        label="Enrolled Modules"
        value={enrolledCount}
        subtext={enrolledCount > 0 ? 'Active registered curriculum' : 'No courses enrolled yet'}
      />

      <StatItem
        icon={Award}
        colorClass="bg-purple-500/10 text-purple-500"
        label="Quizzes Completed"
        value={quizzesDone}
        subtext={
          quizzesDone > 0
            ? `Average score: ${overview.averageQuizScore || 0} pts`
            : 'Take practice quizzes to test skills'
        }
      />

      <StatItem
        icon={Layers}
        colorClass="bg-cyan-500/10 text-cyan-500"
        label="Questions Solved"
        value={questionsSolved}
        subtext={
          questionsSolved > 0
            ? `${overview.totalCorrect || 0} correct · ${overview.totalIncorrect || 0} missed`
            : 'Practice items from lecture slides'
        }
      />

      <StatItem
        icon={Target}
        colorClass="bg-emerald-500/10 text-emerald-500"
        label="Overall Accuracy"
        value={accuracy}
        isPercentage={true}
        badgeText={accuracyBadgeLabel}
        badgeVariant={accuracyBadgeVariant}
        subtext={
          accuracy > 0
            ? `Best quiz: ${overview.bestQuizPercentage || 0}%`
            : 'Derived from verified attempts'
        }
      />
    </div>
  );
}
