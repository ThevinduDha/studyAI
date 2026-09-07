import { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  BookOpen,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RotateCw,
  AlertCircle,
  Clock,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Trash2,
  FileText,
  Bookmark,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { documentService } from '../services/document.service.js';
import { questionService } from '../services/question.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Input } from '../components/ui/Input.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';

export default function ExamQuestionsPage() {
  const { user, isAdmin } = useAuth();

  // Selection states
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');

  // Generation options
  const [questionType, setQuestionType] = useState('MCQ');
  const [difficulty, setDifficulty] = useState(3);
  const [count, setCount] = useState(5);

  // Data states
  const [questions, setQuestions] = useState([]);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // Loading and feedback states
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch modules on initial load
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
        console.error('Failed to load course modules:', err);
        setError('Could not load course modules. Please refresh.');
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
      setQuestions([]);
      return;
    }

    const fetchDocuments = async () => {
      setLoadingDocs(true);
      setQuestions([]);
      try {
        const docs = await documentService.getDocuments(selectedModule);
        setDocuments(docs || []);
        if (docs && docs.length > 0) {
          setSelectedDocument(docs[0]._id);
        } else {
          setSelectedDocument('');
        }
      } catch (err) {
        console.error('Failed to load module documents:', err);
      } finally {
        setLoadingDocs(false);
      }
    };

    fetchDocuments();
  }, [selectedModule]);

  // 3. Fetch existing questions when document changes
  useEffect(() => {
    if (!selectedDocument) {
      setQuestions([]);
      return;
    }

    const fetchExistingQuestions = async () => {
      setLoadingQuestions(true);
      setError('');
      try {
        const list = await questionService.getQuestionsByDocument(selectedDocument);
        setQuestions(list || []);
      } catch (err) {
        console.error('Failed to load questions:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };

    fetchExistingQuestions();
  }, [selectedDocument]);

  // Handle Question Generation
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDocument) {
      setError('Please select a lecture document first.');
      return;
    }

    setGenerating(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await questionService.generateQuestions({
        documentId: selectedDocument,
        questionType,
        difficulty: Number(difficulty),
        count: Number(count)
      });

      const updated = await questionService.getQuestionsByDocument(selectedDocument);
      setQuestions(updated || []);
      setSuccessMsg(`Successfully generated ${result.generated} exam question${result.generated === 1 ? '' : 's'}!`);
    } catch (err) {
      console.error('Question generation failed:', err);
      setError(err.response?.data?.error?.message || err.message || 'Failed to generate questions. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Toggle answer visibility for a single question card
  const toggleAnswer = (qId) => {
    setRevealedAnswers((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  // Toggle reveal all answers
  const toggleRevealAll = () => {
    const allRevealed = questions.every((q) => revealedAnswers[q._id]);
    const newState = {};
    if (!allRevealed) {
      questions.forEach((q) => {
        newState[q._id] = true;
      });
    }
    setRevealedAnswers(newState);
  };

  // Admin delete question
  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to permanently delete this exam question?')) return;
    try {
      await questionService.deleteQuestion(qId);
      setQuestions((prev) => prev.filter((q) => q._id !== qId));
      setSuccessMsg('Question deleted successfully.');
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete question.');
    }
  };

  const getDifficultyBadge = (level) => {
    switch (Number(level)) {
      case 2:
        return { label: 'Level 2: Basic Understanding', variant: 'emerald' };
      case 3:
        return { label: 'Level 3: Moderate Application', variant: 'indigo' };
      case 4:
        return { label: 'Level 4: Advanced Scenario', variant: 'purple' };
      default:
        return { label: `Level ${level}`, variant: 'default' };
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'MCQ':
        return { label: 'Multiple Choice', variant: 'cyan' };
      case 'TRUE_FALSE':
        return { label: 'True / False', variant: 'amber' };
      case 'SHORT_ANSWER':
        return { label: 'Short Answer', variant: 'indigo' };
      case 'SCENARIO':
        return { label: 'Scenario-Based', variant: 'rose' };
      default:
        return { label: type, variant: 'default' };
    }
  };

  const currentDocObj = documents.find((d) => d._id === selectedDocument);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        badge="Phase 9"
        badgeVariant="indigo"
        title="Exam Question Generator"
        icon={HelpCircle}
        subtitle="Generate exam-oriented questions, practice tests, and analyze traps directly from uploaded course lectures."
        actions={
          questions.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={questions.every((q) => revealedAnswers[q._id]) ? ChevronUp : ChevronDown}
              onClick={toggleRevealAll}
            >
              {questions.every((q) => revealedAnswers[q._id]) ? 'Hide All Answers' : 'Reveal All Answers'}
            </Button>
          )
        }
      />

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="text-rose-500 hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-sm flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      {/* Selector & Generator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope Selection (Module + Document) */}
        <Card className="lg:col-span-1 p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-heading flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              1. Select Lecture Material
            </h2>

            {/* Module Selection */}
            <div>
              {loadingModules ? (
                <div className="h-10 bg-subtle animate-pulse rounded-xl" />
              ) : modules.length === 0 ? (
                <p className="text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  No enrolled modules available. Please enroll in a module to generate questions.
                </p>
              ) : (
                <Select
                  id="exam-module"
                  label="Enrolled Course Module"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="">-- Choose Module --</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.moduleCode} — {m.moduleName}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            {/* Document Selection */}
            <div>
              {loadingDocs ? (
                <div className="h-10 bg-subtle animate-pulse rounded-xl" />
              ) : !selectedModule ? (
                <p className="text-xs text-muted italic">Select a module first</p>
              ) : documents.length === 0 ? (
                <p className="text-xs text-amber-500 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                  No documents found for this module.
                </p>
              ) : (
                <Select
                  id="exam-doc"
                  label="Lecture Document"
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                >
                  {documents.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.originalName} ({d.chunkCount || 0} chunks)
                    </option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          {/* Document Info preview */}
          {currentDocObj && (
            <div className="mt-6 pt-4 border-t border-subtle text-xs text-muted flex items-center justify-between">
              <span className="truncate max-w-[180px]">{currentDocObj.originalName}</span>
              <Badge variant="indigo" size="xs">
                {currentDocObj.chunkCount || 0} chunks
              </Badge>
            </div>
          )}
        </Card>

        {/* Right Column: Generation Configuration */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-heading flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              2. Question Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <div>
                <Select
                  id="question-type"
                  label="Question Type"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                >
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="SCENARIO">Scenario-Based</option>
                </Select>
              </div>

              <div>
                <Select
                  id="difficulty"
                  label="Target Difficulty"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                >
                  <option value={2}>Level 2 — Basic Understanding</option>
                  <option value={3}>Level 3 — Moderate / Application</option>
                  <option value={4}>Level 4 — Advanced / Scenario</option>
                </Select>
              </div>

              <div>
                <Input
                  id="count"
                  label="Number of Questions"
                  type="number"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                />
              </div>
            </div>

            {/* Academic Grounding notice */}
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs text-indigo-400 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Grounding:</strong> Questions are generated exclusively from lecture chunks and verified against potential prompt injections. External facts and hallucinated content are strictly filtered.
              </span>
            </div>
          </div>

          {/* Generation Action Button */}
          <div className="mt-6 pt-4 border-t border-subtle flex items-center justify-between">
            <span className="text-xs text-muted">
              {questions.length > 0
                ? `${questions.length} active question${questions.length === 1 ? '' : 's'} in bank`
                : 'No questions generated yet for this document'}
            </span>

            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={handleGenerate}
              disabled={!selectedDocument}
              loading={generating}
            >
              {generating ? 'Generating Exam Questions...' : 'Generate Questions'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Question Bank Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-subtle pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-heading flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-500" />
              Exam Question Bank
            </h2>
            <Badge variant="default" size="sm">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </Badge>
          </div>

          {questions.length > 0 && (
            <Button
              variant="ghost"
              size="xs"
              icon={RotateCw}
              onClick={handleGenerate}
              disabled={generating || !selectedDocument}
              loading={generating}
            >
              Generate More
            </Button>
          )}
        </div>

        {/* Loading questions */}
        {loadingQuestions && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty state */}
        {!loadingQuestions && questions.length === 0 && (
          <EmptyState
            icon={HelpCircle}
            title="No Exam Questions Yet"
            description="Select a lecture document above and click Generate Questions to build high-yield practice items with explanations and exam traps."
            actionLabel="Start Question Generation"
            onAction={handleGenerate}
          />
        )}

        {/* Question Cards Grid */}
        {!loadingQuestions && questions.length > 0 && (
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const typeBadge = getTypeBadge(q.questionType);
              const diffBadge = getDifficultyBadge(q.difficulty);
              const isRevealed = !!revealedAnswers[q._id];

              return (
                <Card
                  key={q._id || idx}
                  className="p-6 transition hover:border-indigo-500/40 shadow-sm"
                >
                  {/* Card Header: Badges and Admin Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-heading px-2.5 py-1 card-base border border-subtle rounded-lg">
                        Q{idx + 1}
                      </span>
                      <Badge variant={typeBadge.variant} size="sm">
                        {typeBadge.label}
                      </Badge>
                      <Badge variant={diffBadge.variant} size="sm">
                        {diffBadge.label}
                      </Badge>
                      {q.topic && (
                        <Badge variant="default" size="sm">
                          {q.topic}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={Trash2}
                          onClick={() => handleDeleteQuestion(q._id)}
                          title="Delete Question (Admin)"
                          className="!text-rose-500 hover:!bg-rose-500/10"
                        />
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-heading font-medium text-base mb-5 leading-relaxed">
                    {q.questionText}
                  </div>

                  {/* Options (for MCQ & Scenario MCQ) */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      {q.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = isRevealed && opt.toLowerCase() === q.correctAnswer.toLowerCase();

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-start gap-3 p-3 rounded-xl border text-sm transition ${
                              isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-500'
                                : 'card-base border-subtle text-body'
                            }`}
                          >
                            <span
                              className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-subtle text-muted'
                              }`}
                            >
                              {letter}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Answer & Explanation Toggle */}
                  <div className="pt-2">
                    <Button
                      variant={isRevealed ? 'primary' : 'outline'}
                      size="xs"
                      icon={Lightbulb}
                      onClick={() => toggleAnswer(q._id)}
                    >
                      {isRevealed ? 'Hide Answer & Exam Analysis' : 'Show Answer & Explanation'}
                      {isRevealed ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
                    </Button>

                    {/* Revealed Answer Box */}
                    {isRevealed && (
                      <div className="mt-4 p-5 rounded-xl card-base border border-indigo-500/30 space-y-4 animate-slide-up shadow-sm">
                        {/* Correct Answer */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-500 block mb-1">
                            Correct Answer
                          </span>
                          <p className="text-sm font-semibold text-emerald-500">
                            {q.correctAnswer}
                          </p>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-1">
                              Explanation
                            </span>
                            <p className="text-sm text-body leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        )}

                        {/* Exam Clue & Common Trap */}
                        {(q.examClue || q.commonTrap) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-subtle">
                            {q.examClue && (
                              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-xs text-amber-500">
                                <span className="font-semibold flex items-center gap-1.5 mb-1">
                                  ⭐ Exam Clue
                                </span>
                                <p>{q.examClue}</p>
                              </div>
                            )}

                            {q.commonTrap && (
                              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-xs text-rose-500">
                                <span className="font-semibold flex items-center gap-1.5 mb-1">
                                  ⚠️ Common Exam Trap
                                </span>
                                <p>{q.commonTrap}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Source Attribution */}
                        {Array.isArray(q.sourceChunks) && q.sourceChunks.length > 0 && (
                          <div className="pt-2 border-t border-subtle">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted block mb-2">
                              Verified Source Attribution
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {q.sourceChunks.map((src, sIdx) => {
                                const pageText = src.pageStart
                                  ? src.pageEnd && src.pageEnd !== src.pageStart
                                    ? `Pages ${src.pageStart}–${src.pageEnd}`
                                    : `Page ${src.pageStart}`
                                  : 'General Context';

                                return (
                                  <div
                                    key={sIdx}
                                    className="p-2.5 card-base rounded-lg border border-subtle text-xs text-muted flex items-center gap-2 shadow-sm"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-indigo-500" />
                                    <span>{src.documentName || 'Document'}</span>
                                    <span className="text-muted">&bull;</span>
                                    <span className="text-heading font-mono">Chunk {src.chunkIndex}</span>
                                    <span className="text-muted">&bull;</span>
                                    <span>{pageText}</span>
                                    {src.sectionHeading && src.sectionHeading !== 'General' && (
                                      <>
                                        <span className="text-muted">&bull;</span>
                                        <span className="text-indigo-500">{src.sectionHeading}</span>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
