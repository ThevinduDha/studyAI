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
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        <Award className="h-10 w-10 animate-bounce mx-auto text-indigo-500 mb-3" />
        <p className="text-sm">Calculating quiz results and performance analytics...</p>
      </div>
    );
  }

  if (error || !attemptData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-sm mb-4">
          {error || 'Could not load quiz attempt.'}
        </div>
        <Link
          to="/quizzes"
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition inline-block"
        >
          Return to Quizzes
        </Link>
      </div>
    );
  }

  const { attempt, results = [] } = attemptData;
  const isHighScorer = attempt.percentage >= 70;
  const isPassing = attempt.percentage >= 50;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🎉</span>
            <h1 className="text-2xl font-bold tracking-tight text-white">Quiz Complete!</h1>
          </div>
          <p className="text-sm text-slate-400">
            {attempt.module?.moduleCode} &bull; {attempt.quiz?.title || 'Practice Quiz'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quizzes')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try Another Quiz
          </button>
          <button
            onClick={() => navigate('/quiz-history')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <History className="h-3.5 w-3.5" />
            Quiz History
          </button>
        </div>
      </div>

      {/* Primary Score Banner */}
      <div
        className={`rounded-2xl border p-6 md:p-8 mb-8 text-center transition ${
          isHighScorer
            ? 'bg-emerald-950/30 border-emerald-800/60'
            : isPassing
            ? 'bg-indigo-950/30 border-indigo-800/60'
            : 'bg-rose-950/30 border-rose-800/60'
        }`}
      >
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-slate-900 border border-slate-800 mb-3">
          <Award
            className={`h-8 w-8 ${
              isHighScorer ? 'text-emerald-400' : isPassing ? 'text-indigo-400' : 'text-rose-400'
            }`}
          />
        </div>

        <div className="text-4xl font-extrabold text-white tracking-tight mb-1">
          {attempt.score} / {attempt.totalQuestions}
        </div>
        <div
          className={`text-lg font-bold mb-6 ${
            isHighScorer ? 'text-emerald-400' : isPassing ? 'text-indigo-400' : 'text-rose-400'
          }`}
        >
          {attempt.percentage}% Overall Accuracy
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Correct</span>
            <span className="text-base font-bold text-emerald-400 flex items-center justify-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              {attempt.correctAnswers}
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Incorrect</span>
            <span className="text-base font-bold text-rose-400 flex items-center justify-center gap-1">
              <XCircle className="h-4 w-4" />
              {attempt.incorrectAnswers}
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Unanswered</span>
            <span className="text-base font-bold text-slate-300">
              {Math.max(0, attempt.totalQuestions - attempt.answeredQuestions)}
            </span>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Time Elapsed</span>
            <span className="text-base font-bold text-slate-300 font-mono flex items-center justify-center gap-1">
              <Clock className="h-3.5 w-3.5 text-indigo-400" />
              {formatTimer(attempt.timeSpentSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          Detailed Question Review ({results.length})
        </h2>

        {results.map((item, idx) => {
          const isCorrect = item.isCorrect;
          const wasAnswered = Boolean(item.selectedAnswer && item.selectedAnswer.trim().length > 0);

          return (
            <div
              key={item.questionId || idx}
              className={`rounded-2xl border p-6 transition shadow-sm ${
                isCorrect
                  ? 'bg-slate-900/70 border-emerald-900/50'
                  : 'bg-slate-900/70 border-rose-900/50'
              }`}
            >
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-300 px-2.5 py-1 bg-slate-800 rounded-lg">
                    Question {idx + 1}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                      isCorrect
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Correct
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5" /> Incorrect
                      </>
                    )}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    Level {item.difficulty}
                  </span>
                  {item.topic && (
                    <span className="text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.topic}
                    </span>
                  )}
                </div>
              </div>

              {/* Question Prompt */}
              <p className="text-slate-100 font-medium text-base mb-5 leading-relaxed">
                {item.questionText}
              </p>

              {/* Answers Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                {/* User selection */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                    Your Answer:
                  </span>
                  <p
                    className={`text-sm font-medium ${
                      !wasAnswered
                        ? 'text-slate-500 italic'
                        : isCorrect
                        ? 'text-emerald-400'
                        : 'text-rose-400 line-through'
                    }`}
                  >
                    {wasAnswered ? item.selectedAnswer : 'Unanswered (Skipped)'}
                  </p>
                </div>

                {/* Expected solution */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 block mb-1">
                    Correct Answer:
                  </span>
                  <p className="text-sm font-semibold text-emerald-300">
                    {item.correctAnswer}
                  </p>
                </div>
              </div>

              {/* Grounded Explanation */}
              {item.explanation && (
                <div className="mb-4">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Explanation:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {item.explanation}
                  </p>
                </div>
              )}

              {/* Exam Clue & Trap */}
              {(item.examClue || item.commonTrap) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {item.examClue && (
                    <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-900/30 text-xs text-amber-200">
                      <span className="font-semibold text-amber-400 flex items-center gap-1 mb-1">
                        ⭐ Exam Clue
                      </span>
                      <p>{item.examClue}</p>
                    </div>
                  )}

                  {item.commonTrap && (
                    <div className="p-3 bg-rose-950/20 rounded-lg border border-rose-900/30 text-xs text-rose-200">
                      <span className="font-semibold text-rose-400 flex items-center gap-1 mb-1">
                        ⚠️ Common Exam Trap
                      </span>
                      <p>{item.commonTrap}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Source Attribution */}
              {Array.isArray(item.sourceChunks) && item.sourceChunks.length > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Source: {item.sourceChunks[0]?.documentName || 'Lecture Material'}</span>
                    <span>&bull;</span>
                    <span className="text-slate-400">Chunk #{item.sourceChunks[0]?.chunkIndex}</span>
                    {item.sourceChunks[0]?.pageStart && (
                      <>
                        <span>&bull;</span>
                        <span>Page {item.sourceChunks[0]?.pageStart}</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
