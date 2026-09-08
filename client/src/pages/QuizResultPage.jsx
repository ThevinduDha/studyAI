import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  History,
  FileText,
  AlertTriangle,
  Lightbulb,
  Check,
  X,
  ChevronRight,
  BookOpen,
  BarChart3,
  LayoutDashboard,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { quizService } from '../services/quiz.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { GroundedBadge, SourceCard } from '../components/ai/index.js';
import { QuizScoreRing, QuizStatCard } from '../components/quiz/index.js';

export default function QuizResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await quizService.getAttempt(attemptId);
        setAttemptData(data);
      } catch (err) {
        console.error('Failed to load quiz results:', err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to load quiz results.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const formatTimer = (secs) => {
    if (!secs && secs !== 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
        <SkeletonCard className="h-56" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
        <Card className="p-6 space-y-4 border border-rose-500/25">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-heading">Failed to Load Quiz Attempt</h3>
          <p className="text-rose-400 text-xs">{error || 'Could not find attempt record.'}</p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/quizzes')}
            >
              Return to Quizzes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { attempt, results = [] } = attemptData;
  const percentage = Math.round(attempt.percentage || 0);
  const isHighScorer = percentage >= 70;
  const isPassing = percentage >= 50;

  // Performance message classification
  let performanceTitle = 'Keep Practicing 💪';
  let performanceSubtitle = 'Review the missed concepts and exam traps below to boost your accuracy.';
  let themeColor = 'border-rose-500/30 bg-rose-500/5';

  if (isHighScorer) {
    performanceTitle = 'Excellent Performance! 🎉';
    performanceSubtitle = 'Outstanding mastery of lecture concepts and exam-level scenarios.';
    themeColor = 'border-emerald-500/30 bg-emerald-500/5';
  } else if (isPassing) {
    performanceTitle = 'Good Progress! 👍';
    performanceSubtitle = 'Solid foundation. Focus on the high-yield tips to achieve top marks.';
    themeColor = 'border-indigo-500/30 bg-indigo-500/5';
  }

  const unansweredCount = Math.max(0, attempt.totalQuestions - (attempt.answeredQuestions || 0));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <PageHeader
        badge="Performance Report"
        badgeVariant={isHighScorer ? 'emerald' : isPassing ? 'indigo' : 'rose'}
        title="Quiz Evaluation Report"
        subtitle={`${attempt.module?.moduleCode || 'Module'} • ${attempt.quiz?.title || 'Practice Test'} • Completed on ${new Date(attempt.submittedAt || attempt.createdAt).toLocaleDateString()}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => navigate('/quizzes')}
            >
              Take Another Quiz
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={History}
              onClick={() => navigate('/quiz-history')}
            >
              Quiz History
            </Button>
          </div>
        }
      />

      {/* Primary Score Hero Card with Circular SVG Ring */}
      <Card
        className={`p-6 sm:p-8 shadow-sm border ${themeColor} relative overflow-hidden`}
      >
        {isHighScorer && (
          <div className="absolute top-3 right-3 text-emerald-400/20">
            <Sparkles className="h-16 w-16" />
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Circular Score Visualizer */}
          <div className="flex items-center justify-center shrink-0">
            <QuizScoreRing
              percentage={percentage}
              score={attempt.score}
              total={attempt.totalQuestions}
              size={140}
              strokeWidth={11}
            />
          </div>

          {/* Performance Summary Text */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Badge
                variant={isHighScorer ? 'emerald' : isPassing ? 'indigo' : 'rose'}
                size="sm"
              >
                {percentage}% Accuracy
              </Badge>
              <GroundedBadge label="Verified Evaluation" size="xs" variant="emerald" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-heading tracking-tight">
              {performanceTitle}
            </h2>

            <p className="text-xs sm:text-sm text-secondary leading-relaxed max-w-lg">
              {performanceSubtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-muted pt-1">
              <span>Course: <strong className="text-heading">{attempt.module?.moduleCode || 'Module'}</strong></span>
              <span>•</span>
              <span>Time Spent: <strong className="text-heading font-mono">{formatTimer(attempt.timeSpentSeconds)}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <QuizStatCard
          icon={CheckCircle2}
          label="Correct"
          value={attempt.correctAnswers}
          variant="emerald"
        />
        <QuizStatCard
          icon={XCircle}
          label="Incorrect"
          value={attempt.incorrectAnswers}
          variant="rose"
        />
        <QuizStatCard
          icon={HelpCircle}
          label="Unanswered"
          value={unansweredCount}
          variant="default"
        />
        <QuizStatCard
          icon={Clock}
          label="Time Spent"
          value={formatTimer(attempt.timeSpentSeconds)}
          variant="indigo"
        />
      </div>

      {/* Action Shortcut Bar */}
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs border border-subtle">
        <div className="flex items-center gap-2 text-xs text-muted">
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          <span>Need deeper analytics on your weak topics?</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            icon={BarChart3}
            onClick={() => navigate('/analytics')}
          >
            View Full Analytics
          </Button>
          <Button
            variant="ghost"
            size="xs"
            icon={LayoutDashboard}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </Card>

      {/* Detailed Question Review List */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <h3 className="text-base font-bold text-heading flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            Detailed Question Review ({results.length})
          </h3>
          <span className="text-xs text-muted">
            Click citations to inspect lecture passages
          </span>
        </div>

        {results.map((item, idx) => {
          const isCorrect = item.isCorrect;
          const wasAnswered = Boolean(item.selectedAnswer && item.selectedAnswer.trim().length > 0);

          return (
            <Card
              key={item.questionId || idx}
              className={`p-6 transition-all duration-150 shadow-xs border ${
                isCorrect ? 'border-emerald-500/30' : 'border-rose-500/30'
              }`}
            >
              {/* Question Header Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-heading px-2.5 py-1 card-base border border-subtle rounded-lg shadow-xs">
                    Question {idx + 1}
                  </span>
                  <Badge variant={isCorrect ? 'emerald' : 'rose'} size="xs">
                    {isCorrect ? (
                      <>
                        <Check className="h-3 w-3 mr-1 inline stroke-[3]" /> Correct
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1 inline stroke-[3]" /> Incorrect
                      </>
                    )}
                  </Badge>
                  <Badge variant="default" size="xs">
                    Level {item.difficulty}
                  </Badge>
                  {item.topic && (
                    <Badge variant="purple" size="xs">
                      {item.topic}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Question Prompt */}
              <h4 className="text-heading font-semibold text-base sm:text-lg mb-5 leading-relaxed">
                {item.questionText}
              </h4>

              {/* Answers Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-xl card-base border border-subtle shadow-inner">
                {/* Student's answer */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                    Your Submitted Answer:
                  </span>
                  <div
                    className={`text-xs sm:text-sm font-medium p-2.5 rounded-lg ${
                      !wasAnswered
                        ? 'bg-subtle text-muted italic'
                        : isCorrect
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 line-through'
                    }`}
                  >
                    {wasAnswered ? item.selectedAnswer : 'Skipped (Unanswered)'}
                  </div>
                </div>

                {/* Correct solution */}
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                    Correct Model Answer:
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-emerald-400 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    {item.correctAnswer}
                  </div>
                </div>
              </div>

              {/* Grounded Explanation */}
              {item.explanation && (
                <div className="mb-4 space-y-1">
                  <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
                    Academic Explanation:
                  </span>
                  <p className="text-xs sm:text-sm text-body leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              )}

              {/* Exam Clue & Trap */}
              {(item.examClue || item.commonTrap) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {item.examClue && (
                    <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/25 text-xs text-amber-300 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-amber-400">
                        ⭐ High-Yield Exam Clue
                      </span>
                      <p className="leading-relaxed">{item.examClue}</p>
                    </div>
                  )}

                  {item.commonTrap && (
                    <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/25 text-xs text-rose-300 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-rose-400">
                        ⚠️ Common Exam Trap
                      </span>
                      <p className="leading-relaxed">{item.commonTrap}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Source Attribution using SourceCard */}
              {Array.isArray(item.sourceChunks) && item.sourceChunks.length > 0 && (
                <div className="pt-3 border-t border-subtle space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                    Grounded Lecture Citations:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.sourceChunks.map((src, sIdx) => (
                      <SourceCard
                        key={sIdx}
                        source={src}
                        index={sIdx}
                      />
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
