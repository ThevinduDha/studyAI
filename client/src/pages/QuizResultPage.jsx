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
  BookOpen
} from 'lucide-react';
import { quizService } from '../services/quiz.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';

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
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
        <Card className="p-6 space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <p className="text-rose-500 text-sm">{error || 'Could not load quiz attempt.'}</p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/quizzes')}
          >
            Return to Quizzes
          </Button>
        </Card>
      </div>
    );
  }

  const { attempt, results = [] } = attemptData;
  const isHighScorer = attempt.percentage >= 70;
  const isPassing = attempt.percentage >= 50;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        badge="Performance Report"
        badgeVariant={isHighScorer ? 'emerald' : isPassing ? 'indigo' : 'rose'}
        title="Quiz Complete! 🎉"
        subtitle={`${attempt.module?.moduleCode || 'Module'} • ${attempt.quiz?.title || 'Practice Quiz'}`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RotateCcw}
              onClick={() => navigate('/quizzes')}
            >
              Try Another Quiz
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

      {/* Primary Score Banner */}
      <Card
        className={`p-6 md:p-8 text-center transition shadow-md ${
          isHighScorer
            ? 'border-emerald-500/40 bg-emerald-500/5'
            : isPassing
            ? 'border-indigo-500/40 bg-indigo-500/5'
            : 'border-rose-500/40 bg-rose-500/5'
        }`}
      >
        <div className="inline-flex items-center justify-center p-3 rounded-2xl card-base border border-subtle mb-3 shadow-inner">
          <Award
            className={`h-8 w-8 ${
              isHighScorer ? 'text-emerald-500' : isPassing ? 'text-indigo-500' : 'text-rose-500'
            }`}
          />
        </div>

        <div className="text-4xl sm:text-5xl font-extrabold text-heading tracking-tight mb-1">
          {attempt.score} / {attempt.totalQuestions}
        </div>
        <div
          className={`text-lg font-bold mb-6 ${
            isHighScorer ? 'text-emerald-500' : isPassing ? 'text-indigo-500' : 'text-rose-500'
          }`}
        >
          {attempt.percentage}% Overall Accuracy
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
          <div className="p-3 card-base rounded-xl border border-subtle shadow-sm">
            <span className="text-xs text-muted block mb-1">Correct</span>
            <span className="text-base font-bold text-emerald-500 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {attempt.correctAnswers}
            </span>
          </div>

          <div className="p-3 card-base rounded-xl border border-subtle shadow-sm">
            <span className="text-xs text-muted block mb-1">Incorrect</span>
            <span className="text-base font-bold text-rose-500 flex items-center justify-center gap-1">
              <XCircle className="h-4 w-4" />
              {attempt.incorrectAnswers}
            </span>
          </div>

          <div className="p-3 card-base rounded-xl border border-subtle shadow-sm">
            <span className="text-xs text-muted block mb-1">Unanswered</span>
            <span className="text-base font-bold text-heading">
              {Math.max(0, attempt.totalQuestions - attempt.answeredQuestions)}
            </span>
          </div>

          <div className="p-3 card-base rounded-xl border border-subtle shadow-sm">
            <span className="text-xs text-muted block mb-1">Time Elapsed</span>
            <span className="text-base font-bold text-heading font-mono flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5 text-indigo-500" />
              {formatTimer(attempt.timeSpentSeconds)}
            </span>
          </div>
        </div>
      </Card>

      {/* Detailed Question Review List */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold text-heading flex items-center gap-2 border-b border-subtle pb-3">
          <BookOpen className="h-4 w-4 text-indigo-500" />
          Detailed Question Review ({results.length})
        </h2>

        {results.map((item, idx) => {
          const isCorrect = item.isCorrect;
          const wasAnswered = Boolean(item.selectedAnswer && item.selectedAnswer.trim().length > 0);

          return (
            <Card
              key={item.questionId || idx}
              className={`p-6 transition shadow-sm ${
                isCorrect
                  ? 'border-emerald-500/30'
                  : 'border-rose-500/30'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-heading px-2.5 py-1 card-base border border-subtle rounded-lg">
                    Question {idx + 1}
                  </span>
                  <Badge variant={isCorrect ? 'emerald' : 'rose'} size="sm">
                    {isCorrect ? (
                      <>
                        <Check className="h-3 w-3 mr-1 inline" /> Correct
                      </>
                    ) : (
                      <>
                        <X className="h-3 w-3 mr-1 inline" /> Incorrect
                      </>
                    )}
                  </Badge>
                  <Badge variant="default" size="sm">
                    Level {item.difficulty}
                  </Badge>
                  {item.topic && (
                    <Badge variant="purple" size="sm">
                      {item.topic}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Question Prompt */}
              <p className="text-heading font-medium text-base mb-5 leading-relaxed">
                {item.questionText}
              </p>

              {/* Answers Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-xl card-base border border-subtle shadow-inner">
                {/* User selection */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted block mb-1">
                    Your Answer:
                  </span>
                  <p
                    className={`text-sm font-medium ${
                      !wasAnswered
                        ? 'text-muted italic'
                        : isCorrect
                        ? 'text-emerald-500'
                        : 'text-rose-500 line-through'
                    }`}
                  >
                    {wasAnswered ? item.selectedAnswer : 'Unanswered (Skipped)'}
                  </p>
                </div>

                {/* Expected solution */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500 block mb-1">
                    Correct Answer:
                  </span>
                  <p className="text-sm font-semibold text-emerald-500">
                    {item.correctAnswer}
                  </p>
                </div>
              </div>

              {/* Grounded Explanation */}
              {item.explanation && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1">
                    Explanation:
                  </span>
                  <p className="text-xs text-body leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              )}

              {/* Exam Clue & Trap */}
              {(item.examClue || item.commonTrap) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {item.examClue && (
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-500">
                      <span className="font-semibold flex items-center gap-1 mb-1">
                        ⭐ Exam Clue
                      </span>
                      <p>{item.examClue}</p>
                    </div>
                  )}

                  {item.commonTrap && (
                    <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-500">
                      <span className="font-semibold flex items-center gap-1 mb-1">
                        ⚠️ Common Exam Trap
                      </span>
                      <p>{item.commonTrap}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Source Attribution */}
              {Array.isArray(item.sourceChunks) && item.sourceChunks.length > 0 && (
                <div className="pt-3 border-t border-subtle">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Source: {item.sourceChunks[0]?.documentName || 'Lecture Material'}</span>
                    <span>&bull;</span>
                    <span className="text-heading font-mono">Chunk #{item.sourceChunks[0]?.chunkIndex}</span>
                    {item.sourceChunks[0]?.pageStart && (
                      <>
                        <span>&bull;</span>
                        <span>Page {item.sourceChunks[0]?.pageStart}</span>
                      </>
                    )}
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
