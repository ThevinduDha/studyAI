import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  History,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  RotateCw,
  PlusCircle,
  FileText
} from 'lucide-react';
import { quizService } from '../services/quiz.service.js';

export default function QuizHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await quizService.getAttemptHistory();
        setAttempts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load quiz history:', err);
        setError(err.response?.data?.error?.message || err.message || 'Failed to load quiz history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatTimer = (secs) => {
    if (!secs && secs !== 0) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <History className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Quiz History</h1>
          </div>
          <p className="text-sm text-slate-400">
            Track your past attempts, evaluate accuracy progression, and review detailed answer breakdowns.
          </p>
        </div>

        <button
          onClick={() => navigate('/quizzes')}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/20 transition flex items-center gap-1.5"
        >
          <PlusCircle className="h-4 w-4" />
          Create New Quiz
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center text-slate-500">
          <RotateCw className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-3" />
          <p className="text-sm">Loading your quiz history...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && attempts.length === 0 && (
        <div className="py-20 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
          <Award className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300 mb-1">No Quiz Attempts Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
            Test your lecture knowledge, practice realistic exam scenarios, and see where you can improve.
          </p>
          <Link
            to="/quizzes"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition inline-flex items-center gap-2"
          >
            <PlusCircle className="h-4 w-4" />
            Take Your First Quiz
          </Link>
        </div>
      )}

      {/* Attempts List */}
      {!loading && attempts.length > 0 && (
        <div className="space-y-4">
          {attempts.map((att) => {
            const isCompleted = att.status === 'completed';
            const isAbandoned = att.status === 'abandoned';
            const isHighScore = att.percentage >= 70;
            const isPass = att.percentage >= 50;

            return (
              <div
                key={att._id}
                onClick={() => {
                  if (isCompleted) navigate(`/quiz-results/${att._id}`);
                }}
                className={`bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                  isCompleted ? 'cursor-pointer' : ''
                }`}
              >
                {/* Left info */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                      {att.module?.moduleCode || 'Module'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {att.module?.moduleName}
                    </span>
                    {att.document?.originalName && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        &bull; <FileText className="h-3 w-3" /> {att.document.originalName}
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-white">
                    {att.quiz?.title || 'Practice Quiz'}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{formatDate(att.submittedAt || att.startedAt)}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatTimer(att.timeSpentSeconds)}
                    </span>
                    <span>&bull;</span>
                    <span>{att.totalQuestions} questions</span>
                  </div>
                </div>

                {/* Right score / action */}
                <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {isCompleted ? (
                    <div className="text-right">
                      <div
                        className={`text-base font-bold ${
                          isHighScore
                            ? 'text-emerald-400'
                            : isPass
                            ? 'text-indigo-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {att.score} / {att.totalQuestions} ({att.percentage}%)
                      </div>
                      <span className="text-xs text-slate-500">
                        {att.correctAnswers} correct, {att.incorrectAnswers} incorrect
                      </span>
                    </div>
                  ) : isAbandoned ? (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
                      Abandoned
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60">
                      In Progress
                    </span>
                  )}

                  {isCompleted && (
                    <div className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white transition">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
