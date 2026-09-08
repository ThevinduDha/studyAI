import { useState, useEffect, useMemo } from 'react';
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
  X,
  Filter,
  Eye,
  EyeOff
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
import { Modal } from '../components/ui/Modal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonCard } from '../components/ui/Skeleton.jsx';
import { GroundedBadge, SourceCard } from '../components/ai/index.js';

export default function ExamQuestionsPage() {
  const { user, isAdmin } = useAuth();

  // Selection states
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');

  // Generation options
  const [genType, setGenType] = useState('MCQ');
  const [genDifficulty, setGenDifficulty] = useState(3);
  const [genCount, setGenCount] = useState(5);

  // Client-side Question Filters
  const [filterType, setFilterType] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [filterTopic, setFilterTopic] = useState('ALL');

  // Data states
  const [questions, setQuestions] = useState([]);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // Deletion Modal state (Admin)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
        questionType: genType,
        difficulty: Number(genDifficulty),
        count: Number(genCount)
      });

      const updated = await questionService.getQuestionsByDocument(selectedDocument);
      setQuestions(updated || []);
      setSuccessMsg(`Successfully synthesized ${result.generated} exam question${result.generated === 1 ? '' : 's'}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
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
    const allRevealed = filteredQuestions.length > 0 && filteredQuestions.every((q) => revealedAnswers[q._id]);
    const newState = { ...revealedAnswers };
    filteredQuestions.forEach((q) => {
      newState[q._id] = !allRevealed;
    });
    setRevealedAnswers(newState);
  };

  // Confirm delete question (Admin)
  const openDeleteModal = (q) => {
    setQuestionToDelete(q);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;
    setDeleting(true);
    try {
      await questionService.deleteQuestion(questionToDelete._id);
      setQuestions((prev) => prev.filter((q) => q._id !== questionToDelete._id));
      setSuccessMsg('Question permanently deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setDeleteModalOpen(false);
      setQuestionToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete question.');
    } finally {
      setDeleting(false);
    }
  };

  // Extract distinct topics from current question set
  const availableTopics = useMemo(() => {
    const set = new Set();
    questions.forEach((q) => {
      if (q.topic && q.topic.trim()) set.add(q.topic.trim());
    });
    return Array.from(set);
  }, [questions]);

  // Client-side filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (filterType !== 'ALL' && q.questionType !== filterType) return false;
      if (filterDifficulty !== 'ALL' && Number(q.difficulty) !== Number(filterDifficulty)) return false;
      if (filterTopic !== 'ALL' && q.topic !== filterTopic) return false;
      return true;
    });
  }, [questions, filterType, filterDifficulty, filterTopic]);

  const hasActiveFilters = filterType !== 'ALL' || filterDifficulty !== 'ALL' || filterTopic !== 'ALL';

  const clearFilters = () => {
    setFilterType('ALL');
    setFilterDifficulty('ALL');
    setFilterTopic('ALL');
  };

  const getDifficultyBadge = (level) => {
    switch (Number(level)) {
      case 2:
        return { label: 'Level 2: Basic', variant: 'emerald' };
      case 3:
        return { label: 'Level 3: Application', variant: 'indigo' };
      case 4:
        return { label: 'Level 4: Scenario', variant: 'purple' };
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
        return { label: 'Scenario Case', variant: 'rose' };
      default:
        return { label: type, variant: 'default' };
    }
  };

  const currentDocObj = documents.find((d) => d._id === selectedDocument);
  const currentModuleObj = modules.find((m) => m._id === selectedModule);

  const areAllFilteredRevealed =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => revealedAnswers[q._id]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <PageHeader
        badge="Phase 9"
        badgeVariant="indigo"
        title="Exam Question Generator"
        icon={HelpCircle}
        subtitle="Synthesize high-yield exam practice questions, analyze exam clues, and identify common student traps directly from lecture materials."
        actions={
          <div className="flex items-center gap-2">
            <GroundedBadge label="Verified Grounded" size="sm" variant="emerald" />
            {filteredQuestions.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={areAllFilteredRevealed ? EyeOff : Eye}
                onClick={toggleRevealAll}
              >
                {areAllFilteredRevealed ? 'Hide All Answers' : 'Reveal All Answers'}
              </Button>
            )}
          </div>
        }
      />

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-sm flex items-start justify-between gap-3 animate-fade-in shadow-xs">
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

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-sm flex items-start justify-between gap-3 animate-fade-in shadow-xs">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg('')}
            className="text-emerald-400 hover:text-emerald-300 font-bold text-base cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Selector & Generator Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope Selection */}
        <Card className="lg:col-span-1 p-6 flex flex-col justify-between shadow-sm border border-subtle">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-heading flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-indigo-400" />
                1. Select Lecture Scope
              </h2>
              {currentModuleObj && (
                <Badge variant="indigo" size="xs">
                  {currentModuleObj.moduleCode || currentModuleObj.code}
                </Badge>
              )}
            </div>

            {/* Module Selection */}
            <div>
              {loadingModules ? (
                <div className="h-10 bg-subtle animate-pulse rounded-xl" />
              ) : modules.length === 0 ? (
                <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                  No enrolled modules available. Please enroll in a module to generate questions.
                </p>
              ) : (
                <Select
                  id="exam-module"
                  label="Course Module"
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                >
                  <option value="">-- Choose Module --</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.moduleCode || m.code} — {m.moduleName || m.name}
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
                <p className="text-xs text-muted italic">Select a course module first</p>
              ) : documents.length === 0 ? (
                <p className="text-xs text-amber-400 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
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

          {/* Document metadata summary */}
          {currentDocObj && (
            <div className="mt-6 pt-4 border-t border-subtle text-xs text-muted flex items-center justify-between">
              <span className="truncate max-w-[190px] font-medium" title={currentDocObj.originalName}>
                {currentDocObj.originalName}
              </span>
              <Badge variant="default" size="xs">
                {currentDocObj.chunkCount || 0} chunks indexed
              </Badge>
            </div>
          )}
        </Card>

        {/* Right Column: Generation Specifications */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between shadow-sm border border-subtle">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-heading flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                2. Generator Specifications
              </h2>
              <span className="text-xs text-muted">
                Questions are persisted into the Question Bank
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div>
                <Select
                  id="question-type"
                  label="Question Type"
                  value={genType}
                  onChange={(e) => setGenType(e.target.value)}
                >
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="SCENARIO">Scenario-Based Case</option>
                </Select>
              </div>

              <div>
                <Select
                  id="difficulty"
                  label="Difficulty Target"
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(Number(e.target.value))}
                >
                  <option value={2}>Level 2 — Basic Understanding</option>
                  <option value={3}>Level 3 — Application / Analysis</option>
                  <option value={4}>Level 4 — Advanced Scenario</option>
                </Select>
              </div>

              <div>
                <Input
                  id="count"
                  label="Items to Generate"
                  type="number"
                  min="1"
                  max="20"
                  value={genCount}
                  onChange={(e) => setGenCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                />
              </div>
            </div>

            {/* Academic Grounding Policy */}
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Academic Grounding:</strong> Questions are synthesized exclusively from your verified lecture chunks. External hallucinations and prompt injections are strictly filtered.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="mt-6 pt-4 border-t border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-muted">
              {questions.length > 0
                ? `${questions.length} active question${questions.length === 1 ? '' : 's'} in bank for this lecture`
                : 'No questions generated yet for this document'}
            </span>

            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              onClick={handleGenerate}
              disabled={!selectedDocument || generating}
              loading={generating}
            >
              {generating ? 'Synthesizing Questions...' : 'Generate Questions'}
            </Button>
          </div>
        </Card>
      </div>

      {/* Main Question Bank Section */}
      <div className="space-y-4">
        {/* Section Header with Quick Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-bold text-heading flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Exam Question Bank
            </h2>
            <Badge variant="default" size="sm">
              {filteredQuestions.length} {filteredQuestions.length === 1 ? 'Question' : 'Questions'}
              {hasActiveFilters && ` (filtered from ${questions.length})`}
            </Badge>
          </div>

          {questions.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                icon={RotateCw}
                onClick={handleGenerate}
                disabled={generating || !selectedDocument}
                loading={generating}
              >
                Generate More
              </Button>
            </div>
          )}
        </div>

        {/* Filter Toolbar (if questions exist) */}
        {questions.length > 0 && (
          <Card className="p-3.5 shadow-xs border border-subtle">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted">
                <Filter className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-semibold uppercase tracking-wider text-[10px]">Filters:</span>
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-base text-xs rounded-lg px-2.5 py-1.5"
                aria-label="Filter by question type"
              >
                <option value="ALL">All Types</option>
                <option value="MCQ">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_ANSWER">Short Answer</option>
                <option value="SCENARIO">Scenario-Based</option>
              </select>

              {/* Difficulty Filter */}
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="input-base text-xs rounded-lg px-2.5 py-1.5"
                aria-label="Filter by difficulty"
              >
                <option value="ALL">All Difficulties</option>
                <option value="2">Level 2 (Basic)</option>
                <option value="3">Level 3 (Application)</option>
                <option value="4">Level 4 (Scenario)</option>
              </select>

              {/* Topic Filter */}
              {availableTopics.length > 0 && (
                <select
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                  className="input-base text-xs rounded-lg px-2.5 py-1.5 max-w-[180px] truncate"
                  aria-label="Filter by topic"
                >
                  <option value="ALL">All Topics ({availableTopics.length})</option>
                  {availableTopics.map((top) => (
                    <option key={top} value={top}>
                      {top}
                    </option>
                  ))}
                </select>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer ml-auto"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </Card>
        )}

        {/* Loading questions skeleton */}
        {loadingQuestions && (
          <div className="space-y-4">
            <SkeletonCard className="h-48" />
            <SkeletonCard className="h-48" />
          </div>
        )}

        {/* Empty state: No lecture selected */}
        {!loadingQuestions && !selectedDocument && (
          <EmptyState
            icon={FileText}
            title="No Lecture Document Selected"
            description="Choose an enrolled course module and lecture document above to view or synthesize exam-focused practice questions."
          />
        )}

        {/* Empty state: No questions in bank */}
        {!loadingQuestions && selectedDocument && questions.length === 0 && (
          <EmptyState
            icon={HelpCircle}
            title="No Exam Questions Yet"
            description="Generate high-yield exam practice questions for this lecture with detailed explanations, exam tips, and common traps."
            actionLabel="Generate Questions Now"
            onAction={handleGenerate}
          />
        )}

        {/* Empty state: Filters yielded 0 items */}
        {!loadingQuestions && questions.length > 0 && filteredQuestions.length === 0 && (
          <EmptyState
            icon={Filter}
            title="No Questions Match Current Filters"
            description="Try changing or clearing your question type, difficulty, or topic filter criteria."
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        )}

        {/* Question Cards Grid */}
        {!loadingQuestions && filteredQuestions.length > 0 && (
          <div className="space-y-5">
            {filteredQuestions.map((q, idx) => {
              const typeBadge = getTypeBadge(q.questionType);
              const diffBadge = getDifficultyBadge(q.difficulty);
              const isRevealed = Boolean(revealedAnswers[q._id]);

              return (
                <Card
                  key={q._id || idx}
                  className="p-6 transition-all duration-200 hover:border-indigo-500/40 shadow-xs border border-subtle"
                >
                  {/* Card Header: Metadata badges & Admin Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-heading px-2.5 py-1 card-base border border-subtle rounded-lg shadow-xs">
                        Q{idx + 1}
                      </span>
                      <Badge variant={typeBadge.variant} size="xs">
                        {typeBadge.label}
                      </Badge>
                      <Badge variant={diffBadge.variant} size="xs">
                        {diffBadge.label}
                      </Badge>
                      {q.topic && (
                        <Badge variant="purple" size="xs">
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
                          onClick={() => openDeleteModal(q)}
                          title="Permanently delete question (Admin)"
                          className="!text-rose-400 hover:!bg-rose-500/10"
                        />
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <h3 className="text-heading font-semibold text-base sm:text-lg mb-5 leading-relaxed">
                    {q.questionText}
                  </h3>

                  {/* Options (for MCQ & Scenario MCQ) */}
                  {Array.isArray(q.options) && q.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                      {q.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = isRevealed && opt.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase();

                        return (
                          <div
                            key={optIdx}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs sm:text-sm transition-all duration-150 ${
                              isCorrect
                                ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400 font-medium shadow-xs ring-1 ring-emerald-500/40'
                                : 'card-base border-subtle text-body hover:border-indigo-500/30'
                            }`}
                          >
                            <span
                              className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-subtle text-muted'
                              }`}
                            >
                              {q.questionType === 'TRUE_FALSE' ? (opt === 'True' ? 'T' : 'F') : letter}
                            </span>
                            <span className="leading-relaxed pt-0.5">{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer hint area if not MCQ */}
                  {q.questionType === 'SHORT_ANSWER' && !isRevealed && (
                    <div className="mb-5 p-3.5 rounded-xl card-base border border-dashed border-subtle text-xs text-muted flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-indigo-400 shrink-0" />
                      <span>Formulate your response in your own words, then reveal the model solution below to compare.</span>
                    </div>
                  )}

                  {/* Answer & Explanation Toggle Button */}
                  <div className="pt-2">
                    <Button
                      variant={isRevealed ? 'primary' : 'outline'}
                      size="xs"
                      icon={isRevealed ? EyeOff : Eye}
                      onClick={() => toggleAnswer(q._id)}
                    >
                      {isRevealed ? 'Hide Answer & Exam Clues' : 'Reveal Solution & Exam Clues'}
                    </Button>

                    {/* Revealed Solution & Grounded Analysis Box */}
                    {isRevealed && (
                      <div className="mt-4 p-5 rounded-xl card-base border border-indigo-500/30 space-y-4 animate-slide-up shadow-sm">
                        {/* Correct Answer */}
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            Model Solution / Correct Answer:
                          </span>
                          <div className="text-sm font-semibold text-heading p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            {q.correctAnswer}
                          </div>
                        </div>

                        {/* Detailed Explanation */}
                        {q.explanation && (
                          <div className="space-y-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                              Academic Explanation:
                            </span>
                            <p className="text-xs sm:text-sm text-body leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        )}

                        {/* Exam Clue & Common Trap */}
                        {(q.examClue || q.commonTrap) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-subtle">
                            {q.examClue && (
                              <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/25 text-xs text-amber-300 space-y-1">
                                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                                  ⭐ High-Yield Exam Clue
                                </span>
                                <p className="leading-relaxed">{q.examClue}</p>
                              </div>
                            )}

                            {q.commonTrap && (
                              <div className="p-3.5 bg-rose-500/10 rounded-xl border border-rose-500/25 text-xs text-rose-300 space-y-1">
                                <span className="font-bold flex items-center gap-1.5 text-rose-400">
                                  ⚠️ Common Exam Trap
                                </span>
                                <p className="leading-relaxed">{q.commonTrap}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Verified Grounded Source Attribution */}
                        {Array.isArray(q.sourceChunks) && q.sourceChunks.length > 0 && (
                          <div className="pt-3 border-t border-subtle space-y-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-indigo-400" />
                              Grounded Lecture Citations:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.sourceChunks.map((src, sIdx) => (
                                <SourceCard
                                  key={sIdx}
                                  source={src}
                                  index={sIdx}
                                />
                              ))}
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

      {/* Admin Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm Question Deletion"
      >
        <div className="space-y-4">
          <p className="text-xs text-body leading-relaxed">
            Are you sure you want to permanently delete this exam question from the Question Bank?
          </p>
          {questionToDelete && (
            <div className="p-3 rounded-lg card-base border border-subtle text-xs text-heading font-medium italic">
              "{questionToDelete.questionText}"
            </div>
          )}
          <p className="text-[11px] text-muted">
            This action cannot be undone. Historical completed quiz attempts will retain their records safely.
          </p>

          <div className="pt-4 border-t border-subtle flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleConfirmDelete}
              loading={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Question'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
