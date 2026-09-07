import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Award,
  BookOpen,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  RotateCw,
  Sparkles,
  Layers,
  History,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { documentService } from '../services/document.service.js';
import { questionService } from '../services/question.service.js';
import { quizService } from '../services/quiz.service.js';

export default function QuizPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { quizId, attemptId } = useParams();

  // Mode: 'configure' | 'active'
  const [mode, setMode] = useState('configure');

  // Configuration state
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [questionType, setQuestionType] = useState('ALL');
  const [difficulty, setDifficulty] = useState('ALL');
  const [count, setCount] = useState(5);
  const [availableQuestionsCount, setAvailableQuestionsCount] = useState(null);

  // Active Quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentAttempt, setCurrentAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: answerString }
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Loading & feedback states
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [checkingBank, setCheckingBank] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch modules on load
  useEffect(() => {
    const fetchModules = async () => {
      setLoadingModules(true);
      try {
        if (isAdmin) {
          const allMods = await moduleService.getAllModules();
          setModules(allMods || []);
        } else {
          const enrolled = await moduleService.getEnrolledModules();
          setModules(enrolled || []);
        }
      } catch (err) {
        console.error('Failed to load modules:', err);
        setError('Could not load course modules.');
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [isAdmin]);

  // 2. Fetch documents when module changes
  useEffect(() => {
    if (!selectedModule) {
      setDocuments([]);
      setSelectedDocument('');
      setAvailableQuestionsCount(null);
      return;
    }

    const fetchDocs = async () => {
      setLoadingDocs(true);
      try {
        const docs = await documentService.getDocuments(selectedModule);
        setDocuments(docs || []);
      } catch (err) {
        console.error('Failed to load module documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [selectedModule]);

  // 3. Check available questions count in Question Bank
  useEffect(() => {
    if (!selectedModule) {
      setAvailableQuestionsCount(null);
      return;
    }

    const checkAvailable = async () => {
      setCheckingBank(true);
      try {
        let list = [];
        if (selectedDocument) {
          list = await questionService.getQuestionsByDocument(selectedDocument, {
            questionType: questionType !== 'ALL' ? questionType : undefined,
            difficulty: difficulty !== 'ALL' ? difficulty : undefined
          });
        } else {
          list = await questionService.getQuestionsByModule(selectedModule, {
            questionType: questionType !== 'ALL' ? questionType : undefined,
            difficulty: difficulty !== 'ALL' ? difficulty : undefined
          });
        }
        setAvailableQuestionsCount(Array.isArray(list) ? list.length : 0);
      } catch (err) {
        console.error('Failed to check questions count:', err);
        setAvailableQuestionsCount(null);
      } finally {
        setCheckingBank(false);
      }
    };

    checkAvailable();
  }, [selectedModule, selectedDocument, questionType, difficulty]);

  // 4. Timer effect for active quiz
  useEffect(() => {
    let timer = null;
    if (mode === 'active' && currentAttempt && currentAttempt.status === 'in_progress') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [mode, currentAttempt]);

  // Handle Start Quiz
  const handleStartQuiz = async (e) => {
    if (e) e.preventDefault();
    if (!selectedModule) {
      setError('Please select a course module first.');
      return;
    }

    setStarting(true);
    setError('');

    try {
      // 1. Create quiz definition
      const createRes = await quizService.createQuiz({
        moduleId: selectedModule,
        documentId: selectedDocument || undefined,
        questionType,
        difficulty,
        count: Number(count),
        randomized: true
      });

      const newQuiz = createRes.quiz;

      // 2. Start attempt
      const startRes = await quizService.startQuiz(newQuiz._id);
      setActiveQuiz(newQuiz);
      setCurrentAttempt(startRes.attempt);
      setQuestions(startRes.questions || []);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setElapsedSeconds(0);
      setMode('active');
    } catch (err) {
      console.error('Failed to start quiz:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to start quiz.');
    } finally {
      setStarting(false);
    }
  };

  // Handle Option Select
  const handleSelectOption = (questionId, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option
    }));
  };

  // Handle Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!currentAttempt) return;

    setSubmitting(true);
    setError('');

    try {
      const answersPayload = Object.entries(selectedAnswers).map(([qId, ans]) => ({
        questionId: qId,
        selectedAnswer: ans
      }));

      const result = await quizService.submitQuiz(currentAttempt._id, answersPayload);
      // Navigate to detailed result review page
      navigate(`/quiz-results/${currentAttempt._id}`);
    } catch (err) {
      console.error('Submit failed:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to submit quiz.');
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  // Handle Abandon Quiz
  const handleAbandonQuiz = async () => {
    if (!window.confirm('Are you sure you want to abandon this quiz attempt? Your progress will not be saved.')) return;
    try {
      await quizService.abandonAttempt(currentAttempt._id);
      setMode('configure');
      setActiveQuiz(null);
      setCurrentAttempt(null);
      setQuestions([]);
    } catch (err) {
      console.error('Abandon failed:', err);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).filter((k) => selectedAnswers[k]?.trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Award className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">AI Quiz System</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800">
              Phase 10
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Interactive, timed practice tests with server-evaluated grading and exam preparation analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/quiz-history')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition flex items-center gap-1.5"
          >
            <History className="h-3.5 w-3.5 text-indigo-400" />
            My Quiz History
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">
            &times;
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODE 1: QUIZ CONFIGURATION */}
      {/* ------------------------------------------------------------ */}
      {mode === 'configure' && (
        <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 md:p-8 shadow-sm">
          <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Configure Your Practice Quiz
          </h2>

          <form onSubmit={handleStartQuiz} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Module Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Course Module *</label>
                {loadingModules ? (
                  <div className="h-10 bg-slate-800/50 animate-pulse rounded-lg border border-slate-700/50" />
                ) : (
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  >
                    <option value="">-- Select Module --</option>
                    {modules.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.moduleCode} — {m.moduleName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Lecture Document Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Lecture Document (Optional)</label>
                {loadingDocs ? (
                  <div className="h-10 bg-slate-800/50 animate-pulse rounded-lg border border-slate-700/50" />
                ) : (
                  <select
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    disabled={!selectedModule || documents.length === 0}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                  >
                    <option value="">All Lecture Documents in Module</option>
                    {documents.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.originalName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Question Type</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                >
                  <option value="ALL">All Types (Mixed Quiz)</option>
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="SCENARIO">Scenario-Based</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                >
                  <option value="ALL">All Levels (Adaptive)</option>
                  <option value="2">Level 2 — Basic Understanding</option>
                  <option value="3">Level 3 — Moderate / Application</option>
                  <option value="4">Level 4 — Advanced / Scenario</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Number of Questions</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                />
              </div>

              {/* Available Questions Indicator */}
              <div className="flex flex-col justify-center">
                <span className="text-xs font-medium text-slate-400 mb-2">Question Bank Availability</span>
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                  <span className="text-slate-400">Available matching items:</span>
                  {checkingBank ? (
                    <RotateCw className="h-4 w-4 animate-spin text-indigo-400" />
                  ) : availableQuestionsCount !== null ? (
                    <span
                      className={`font-semibold px-2 py-0.5 rounded ${
                        availableQuestionsCount >= count
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                      }`}
                    >
                      {availableQuestionsCount} {availableQuestionsCount === 1 ? 'question' : 'questions'}
                    </span>
                  ) : (
                    <span className="text-slate-600">Select module to check</span>
                  )}
                </div>
              </div>
            </div>

            {/* Warning if insufficient */}
            {availableQuestionsCount !== null && availableQuestionsCount < count && (
              <div className="p-3 bg-amber-950/30 rounded-xl border border-amber-900/40 text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  Only <strong>{availableQuestionsCount}</strong> questions are currently generated in the Question Bank for these filters. Please select up to {availableQuestionsCount} questions or visit the <strong>Exam Questions</strong> generator to create more items.
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={
                  starting ||
                  !selectedModule ||
                  (availableQuestionsCount !== null && availableQuestionsCount < count)
                }
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
              >
                {starting ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    Preparing Quiz...
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4" />
                    Start Practice Quiz
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODE 2: ACTIVE QUIZ */}
      {/* ------------------------------------------------------------ */}
      {mode === 'active' && questions.length > 0 && currentQ && (
        <div className="space-y-6">
          {/* Top Bar: Progress & Timer */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-md border border-indigo-800/60">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-xs text-slate-400">
                Answered: <strong className="text-slate-200">{answeredCount}</strong> / {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Elapsed Timer */}
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>

              {/* Abandon button */}
              <button
                onClick={handleAbandonQuiz}
                className="text-xs text-slate-500 hover:text-red-400 transition"
              >
                Abandon Quiz
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {currentQ.questionType}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                Difficulty Level {currentQ.difficulty}
              </span>
              {currentQ.topic && (
                <span className="text-xs text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  Topic: {currentQ.topic}
                </span>
              )}
            </div>

            {/* Question Text */}
            <h3 className="text-lg font-medium text-slate-100 mb-6 leading-relaxed">
              {currentQ.questionText}
            </h3>

            {/* Options for MCQ / Scenario MCQ / TRUE_FALSE */}
            {Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
              <div className="space-y-3">
                {currentQ.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = selectedAnswers[currentQ.id] === opt;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span
                        className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {currentQ.questionType === 'TRUE_FALSE' ? (opt === 'True' ? 'T' : 'F') : letter}
                      </span>
                      <span className="leading-snug pt-0.5">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Short Answer input */
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Your Answer:</label>
                <textarea
                  rows={3}
                  value={selectedAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Type your concise model answer here..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            )}

            {/* Navigation Footer */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium text-slate-300 transition flex items-center gap-1.5"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition flex items-center gap-1.5"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitModal(true)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                  >
                    <Send className="h-4 w-4" />
                    Submit Quiz
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Palette Indicator */}
          <div className="bg-slate-900/40 rounded-xl border border-slate-800/80 p-4">
            <span className="text-xs font-medium text-slate-400 block mb-3">Jump to Question:</span>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!selectedAnswers[q.id];

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 text-white bg-indigo-600'
                        : isAnswered
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* SUBMISSION CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Send className="h-4 w-4 text-emerald-400" />
                Submit Quiz for Grading
              </h3>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You have answered <strong className="text-white">{answeredCount}</strong> out of{' '}
              <strong className="text-white">{questions.length}</strong> questions.
              {answeredCount < questions.length && (
                <span className="block mt-2 text-amber-400">
                  ⚠️ You still have {questions.length - answeredCount} unanswered question(s). Unanswered questions will receive 0 points.
                </span>
              )}
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Continue Reviewing
              </button>

              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    Scoring...
                  </>
                ) : (
                  'Confirm & Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
