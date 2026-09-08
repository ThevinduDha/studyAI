import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
  AlertTriangle,
  FileText,
  X,
  Check
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
import { GroundedBadge } from '../components/ai/index.js';
import { QuizQuestionNavigator } from '../components/quiz/index.js';

export default function QuizPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();

  // Mode: 'configure' | 'active'
  const [mode, setMode] = useState('configure');

  // Configuration state
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(
    searchParams.get('module') || searchParams.get('moduleId') || ''
  );
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(
    searchParams.get('document') || searchParams.get('documentId') || ''
  );
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

  // Modals
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAbandonModal, setShowAbandonModal] = useState(false);

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
        const paramDoc = searchParams.get('document') || searchParams.get('documentId');
        if (paramDoc && docs && docs.some((d) => d._id === paramDoc)) {
          setSelectedDocument(paramDoc);
        }
      } catch (err) {
        console.error('Failed to load module documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocs();
  }, [selectedModule, searchParams]);

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
  const handleConfirmAbandon = async () => {
    if (!currentAttempt) return;
    try {
      await quizService.abandonAttempt(currentAttempt._id);
      setMode('configure');
      setActiveQuiz(null);
      setCurrentAttempt(null);
      setQuestions([]);
      setShowAbandonModal(false);
    } catch (err) {
      console.error('Abandon failed:', err);
      setError('Failed to abandon quiz.');
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(selectedAnswers).filter((k) => selectedAnswers[k]?.trim().length > 0).length;
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;
  const selectedModuleObj = modules.find((m) => m._id === selectedModule);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header (Configuration Mode) */}
      {mode === 'configure' && (
        <PageHeader
          badge="Phase 10"
          badgeVariant="indigo"
          title="Interactive AI Quiz"
          icon={Award}
          subtitle="Timed exam simulations with server-evaluated grading, comprehensive answer breakdowns, and topic analytics."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={History}
                onClick={() => navigate('/quiz-history')}
              >
                My Quiz History
              </Button>
            </div>
          }
        />
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs sm:text-sm flex items-start justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-rose-400 hover:text-rose-300 font-bold text-base cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODE 1: QUIZ SETUP & CONFIGURATION */}
      {/* ------------------------------------------------------------ */}
      {mode === 'configure' && (
        <Card className="p-6 md:p-8 shadow-sm space-y-6 border border-subtle">
          <div className="flex items-center justify-between border-b border-subtle pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-heading">
                  Configure Practice Test
                </h2>
                <p className="text-xs text-muted">
                  Customize the scope, difficulty level, and length of your quiz
                </p>
              </div>
            </div>

            <GroundedBadge label="Verified Bank" size="xs" variant="emerald" />
          </div>

          <form onSubmit={handleStartQuiz} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Module Selector */}
              <div>
                {loadingModules ? (
                  <div className="h-10 bg-subtle animate-pulse rounded-xl" />
                ) : (
                  <Select
                    id="quiz-module"
                    label="1. Target Course Module *"
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an Enrolled Module --</option>
                    {modules.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.moduleCode || m.code} — {m.moduleName || m.name}
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
                    label="2. Lecture Document (Optional Scope)"
                    value={selectedDocument}
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    disabled={!selectedModule || documents.length === 0}
                  >
                    <option value="">All Lecture Materials in Module</option>
                    {documents.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.originalName} ({d.chunkCount || 0} chunks)
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {/* Question Type */}
              <div>
                <Select
                  id="quiz-type"
                  label="3. Question Format"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                >
                  <option value="ALL">All Types (Mixed Comprehensive Test)</option>
                  <option value="MCQ">Multiple Choice Only (MCQ)</option>
                  <option value="TRUE_FALSE">True / False Only</option>
                  <option value="SHORT_ANSWER">Short Answer Only</option>
                  <option value="SCENARIO">Scenario-Based Case Studies</option>
                </Select>
              </div>

              {/* Difficulty */}
              <div>
                <Select
                  id="quiz-difficulty"
                  label="4. Target Difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value="ALL">All Difficulties (Adaptive Mix)</option>
                  <option value="2">Level 2 — Basic Understanding</option>
                  <option value="3">Level 3 — Moderate / Application</option>
                  <option value="4">Level 4 — Advanced Scenario</option>
                </Select>
              </div>

              {/* Number of Questions */}
              <div>
                <Input
                  id="quiz-count"
                  label="5. Number of Questions"
                  type="number"
                  min="1"
                  max="50"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                />
              </div>

              {/* Available Questions Indicator Card */}
              <div className="flex flex-col justify-end">
                <span className="text-xs font-semibold text-heading mb-1.5">
                  Question Bank Availability
                </span>
                <div className="p-3 card-base rounded-xl border border-subtle text-xs flex items-center justify-between shadow-xs">
                  <span className="text-muted">Available items in bank:</span>
                  {checkingBank ? (
                    <RotateCw className="h-4 w-4 animate-spin text-indigo-400" />
                  ) : availableQuestionsCount !== null ? (
                    <Badge
                      variant={availableQuestionsCount >= count ? 'emerald' : 'amber'}
                      size="sm"
                    >
                      {availableQuestionsCount} {availableQuestionsCount === 1 ? 'question' : 'questions'}
                    </Badge>
                  ) : (
                    <span className="text-muted">Select a module to check</span>
                  )}
                </div>
              </div>
            </div>

            {/* Warning if insufficient */}
            {availableQuestionsCount !== null && availableQuestionsCount < count && (
              <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/25 text-xs text-amber-400 flex items-start gap-3 shadow-xs">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  Only <strong>{availableQuestionsCount}</strong> questions are currently available in the Question Bank matching these specifications. Please reduce your question count to {availableQuestionsCount} or visit the <strong>Exam Questions Generator</strong> to synthesize additional items.
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-5 border-t border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-muted">
                Responses will be evaluated strictly by the backend scoring engine
              </span>

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
                {starting ? 'Preparing Practice Test...' : 'Start Practice Quiz'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ------------------------------------------------------------ */}
      {/* MODE 2: ACTIVE QUIZ WORKSPACE */}
      {/* ------------------------------------------------------------ */}
      {mode === 'active' && questions.length > 0 && currentQ && (
        <div className="space-y-6">
          {/* Top Bar: Progress & Timer */}
          <Card className="p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm border border-subtle">
            <div className="flex items-center gap-3">
              <Badge variant="indigo" size="md">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <span className="text-xs text-muted">
                Progress: <strong className="text-heading font-semibold">{answeredCount}</strong> / {questions.length} answered
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Elapsed Timer */}
              <div className="flex items-center gap-1.5 text-body font-mono text-xs card-base px-3.5 py-1.5 rounded-xl border border-subtle shadow-xs">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold text-heading">{formatTimer(elapsedSeconds)}</span>
              </div>

              {/* Abandon button */}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setShowAbandonModal(true)}
                className="!text-rose-400 hover:!bg-rose-500/10"
              >
                Abandon Quiz
              </Button>
            </div>
          </Card>

          {/* Smooth Progress Bar */}
          <div className="w-full bg-subtle h-2.5 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          {/* Question Card */}
          <Card className="p-6 md:p-8 shadow-sm border border-subtle space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" size="sm">
                  {currentQ.questionType}
                </Badge>
                <Badge variant="indigo" size="sm">
                  Level {currentQ.difficulty}
                </Badge>
                {currentQ.topic && (
                  <Badge variant="purple" size="sm">
                    {currentQ.topic}
                  </Badge>
                )}
              </div>

              <span className="text-xs text-muted select-none">
                Item #{currentIndex + 1}
              </span>
            </div>

            {/* Question Text */}
            <h3 className="text-base sm:text-xl font-semibold text-heading leading-relaxed">
              {currentQ.questionText}
            </h3>

            {/* Options for MCQ / Scenario MCQ / TRUE_FALSE */}
            {Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = selectedAnswers[currentQ.id] === opt;

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm transition-all duration-150 flex items-start gap-3.5 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-indigo-500/15 border-indigo-500 text-heading shadow-xs ring-2 ring-indigo-500/50'
                          : 'card-base hover:border-indigo-500/40 border-subtle text-body'
                      }`}
                    >
                      <span
                        className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-subtle text-muted'
                        }`}
                      >
                        {currentQ.questionType === 'TRUE_FALSE' ? (opt === 'True' ? 'T' : 'F') : letter}
                      </span>
                      <span className="leading-relaxed pt-1 flex-1 font-medium">{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Short Answer input */
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-heading">
                  Your Answer:
                </label>
                <textarea
                  rows={3}
                  value={selectedAnswers[currentQ.id] || ''}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Type your answer concisely here..."
                  className="w-full input-base rounded-xl p-3.5 text-xs sm:text-sm resize-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            )}

            {/* Navigation Footer */}
            <div className="pt-6 border-t border-subtle flex items-center justify-between">
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
                    Review &amp; Submit Quiz
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Interactive Question Palette / Navigator */}
          <QuizQuestionNavigator
            questions={questions}
            currentIndex={currentIndex}
            selectedAnswers={selectedAnswers}
            onSelectIndex={setCurrentIndex}
          />
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
          <p className="text-xs sm:text-sm text-body leading-relaxed">
            You have answered <strong className="text-heading font-semibold">{answeredCount}</strong> out of{' '}
            <strong className="text-heading font-semibold">{questions.length}</strong> questions.
          </p>

          {answeredCount < questions.length && (
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/25 text-xs text-amber-400 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                You still have <strong>{questions.length - answeredCount}</strong> unanswered question(s). Unanswered questions will receive 0 points.
              </span>
            </div>
          )}

          <div className="pt-4 border-t border-subtle flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSubmitModal(false)}
              disabled={submitting}
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
              {submitting ? 'Scoring Answers...' : 'Confirm & Submit'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------------------ */}
      {/* ABANDON CONFIRMATION MODAL */}
      {/* ------------------------------------------------------------ */}
      <Modal
        isOpen={showAbandonModal}
        onClose={() => setShowAbandonModal(false)}
        title="Abandon Quiz Attempt?"
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/25 text-xs text-rose-400 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Are you sure you want to abandon this quiz? Your current in-progress responses will not be evaluated, and the attempt will be marked abandoned.
            </p>
          </div>

          <div className="pt-4 border-t border-subtle flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAbandonModal(false)}
            >
              Keep Answering
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmAbandon}
            >
              Abandon Attempt
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
