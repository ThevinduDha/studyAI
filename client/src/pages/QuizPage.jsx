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
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';

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
  const [selectedAnswers, setSelectedAnswers] = useState({});
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
      const createRes = await quizService.createQuiz({
        moduleId: selectedModule,
        documentId: selectedDocument || undefined,
        questionType,
        difficulty,
        count: Number(count),
        randomized: true
      });

      const newQuiz = createRes.quiz;
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

      await quizService.submitQuiz(currentAttempt._id, answersPayload);
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Phase 10"
        badgeVariant="indigo"
        title="AI Quiz System"
        icon={Award}
        subtitle="Interactive, timed practice tests with server-evaluated grading and exam preparation analytics."
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={History}
            onClick={() => navigate('/quiz-history')}
          >
            My Quiz History
          </Button>
        }
      />

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="text-rose-500 hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODE 1: QUIZ CONFIGURATION */}
      {/* ------------------------------------------------------------ */}
      {mode === 'configure' && (
        <Card className="p-6 md:p-8 shadow-sm space-y-6">
          <h2 className="text-base font-semibold text-heading flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            Configure Your Practice Quiz
          </h2>

          <form onSubmit={handleStartQuiz} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Module Selector */}
              <div>
                {loadingModules ? (
                  <div className="h-10 bg-subtle animate-pulse rounded-xl" />
                ) : (
                  <Select
                    id="quiz-module"
                    label="Course Module *"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    required
                  >
                    <option value="">-- Select Module --</option>
                    {modules.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.moduleCode} — {m.moduleName}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Lecture Document Selector */}
              <div>
                {loadingDocs ? (
                  <div className="h-10 bg-subtle animate-pulse rounded-xl" />
                ) : (
                  <Select
                    id="quiz-doc"
                    label="Lecture Document (Optional)"
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    disabled={!selectedModule || documents.length === 0}
                  >
                    <option value="">All Lecture Documents in Module</option>
                    {documents.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.originalName}
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Question Type */}
              <div>
                <Select
                  id="quiz-type"
                  label="Question Type"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                >
                  <option value="ALL">All Types (Mixed Quiz)</option>
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="SCENARIO">Scenario-Based</option>
                </Select>
              </div>

              {/* Difficulty */}
              <div>
                <Select
                  id="quiz-difficulty"
                  label="Difficulty Level"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="ALL">All Levels (Adaptive)</option>
                  <option value="2">Level 2 — Basic Understanding</option>
                  <option value="3">Level 3 — Moderate / Application</option>
                  <option value="4">Level 4 — Advanced / Scenario</option>
                </Select>
              </div>

              {/* Number of Questions */}
              <div>
                <Input
                  id="quiz-count"
                  label="Number of Questions"
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                />
              </div>

              {/* Available Questions Indicator */}
              <div className="flex flex-col justify-end">
                <span className="text-xs font-medium text-muted mb-1.5">Question Bank Availability</span>
                <div className="p-3 card-base rounded-xl border border-subtle text-xs flex items-center justify-between shadow-sm">
                  <span className="text-muted">Available items:</span>
                  {checkingBank ? (
                    <RotateCw className="h-4 w-4 animate-spin text-indigo-500" />
                  ) : availableQuestionsCount !== null ? (
                    <Badge
                      variant={availableQuestionsCount >= count ? 'emerald' : 'amber'}
                      size="sm"
                    >
                      {availableQuestionsCount} {availableQuestionsCount === 1 ? 'question' : 'questions'}
                    </Badge>
                  ) : (
                    <span className="text-muted">Select module to check</span>
                  )}
                </div>
              </div>
            </div>

            {/* Warning if insufficient */}
            {availableQuestionsCount !== null && availableQuestionsCount < count && (
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-500 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  Only <strong>{availableQuestionsCount}</strong> questions are currently generated in the Question Bank for these filters. Please select up to {availableQuestionsCount} questions or visit the <strong>Exam Questions</strong> generator to create more items.
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-subtle flex items-center justify-end">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                icon={Award}
                disabled={
                  starting ||
                  !selectedModule ||
                  (availableQuestionsCount !== null && availableQuestionsCount < count)
                }
                loading={starting}
              >
                {starting ? 'Preparing Quiz...' : 'Start Practice Quiz'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODE 2: ACTIVE QUIZ */}
      {/* ------------------------------------------------------------ */}
      {mode === 'active' && questions.length > 0 && currentQ && (
        <div className="space-y-6">
          {/* Top Bar: Progress & Timer */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Badge variant="indigo" size="md">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <span className="text-xs text-muted">
                Answered: <strong className="text-heading">{answeredCount}</strong> / {questions.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Elapsed Timer */}
              <div className="flex items-center gap-1.5 text-body font-mono text-xs card-base px-3 py-1.5 rounded-xl border border-subtle shadow-sm">
                <Clock className="h-3.5 w-3.5 text-indigo-500" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>

              {/* Abandon button */}
              <Button
                variant="ghost"
                size="xs"
                onClick={handleAbandonQuiz}
                className="!text-rose-500 hover:!bg-rose-500/10"
              >
                Abandon Quiz
              </Button>
            </div>
          </Card>

          {/* Progress Bar */}
          <div className="w-full bg-subtle h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Card */}
          <Card className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="default" size="sm">
                {currentQ.questionType}
              </Badge>
              <Badge variant="indigo" size="sm">
                Difficulty Level {currentQ.difficulty}
              </Badge>
              {currentQ.topic && (
                <Badge variant="purple" size="sm">
                  Topic: {currentQ.topic}
                </Badge>
              )}
            </div>

            {/* Question Text */}
            <h3 className="text-lg font-medium text-heading mb-6 leading-relaxed">
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
                      className={`w-full text-left p-4 rounded-xl border text-sm transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500 text-heading shadow-sm ring-1 ring-indigo-500'
                          : 'card-base hover:border-subtle border-subtle text-body'
                      }`}
                    >
                      <span
                        className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-subtle text-muted'
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
                <label className="block text-xs font-medium text-muted mb-2">Your Answer:</label>
                <textarea
                  rows={3}
                  value={selectedAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Type your concise model answer here..."
                  className="w-full input-base rounded-xl p-3 text-sm resize-none"
                />
              </div>
            )}

            {/* Navigation Footer */}
            <div className="mt-8 pt-6 border-t border-subtle flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1 inline" />
                  </Button>
                ) : (
                  <Button
                    variant="success"
                    size="sm"
                    icon={Send}
                    onClick={() => setShowSubmitModal(true)}
                  >
                    Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Question Palette Indicator */}
          <Card className="p-4">
            <span className="text-xs font-medium text-muted block mb-3">Jump to Question:</span>
            <div className="flex flex-wrap gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = !!selectedAnswers[q.id];

                return (
                  <button
                    key={q.id || idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 text-white bg-indigo-600'
                        : isAnswered
                        ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                        : 'card-base border border-subtle text-muted hover:text-heading'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* SUBMISSION CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------ */}
      <Modal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        title="Submit Quiz for Grading"
      >
        <div className="space-y-4">
          <p className="text-xs text-body leading-relaxed">
            You have answered <strong className="text-heading">{answeredCount}</strong> out of{' '}
            <strong className="text-heading">{questions.length}</strong> questions.
            {answeredCount < questions.length && (
              <span className="block mt-2 text-amber-500 font-medium">
                ⚠️ You still have {questions.length - answeredCount} unanswered question(s). Unanswered questions will receive 0 points.
              </span>
            )}
          </p>

          <div className="pt-4 border-t border-subtle flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubmitModal(false)}
            >
              Continue Reviewing
            </Button>

            <Button
              variant="success"
              size="sm"
              icon={RotateCw}
              onClick={handleSubmitQuiz}
              loading={submitting}
            >
              {submitting ? 'Scoring...' : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
