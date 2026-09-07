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
  const [activeTab, setActiveTab] = useState('bank'); // 'bank' or 'generate'

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

  // 3. Fetch existing questions when document changes (WITHOUT triggering generation)
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

      // Refresh document questions
      const updated = await questionService.getQuestionsByDocument(selectedDocument);
      setQuestions(updated || []);
      setSuccessMsg(`Successfully generated ${result.generated} exam question${result.generated === 1 ? '' : 's'}!`);
      setActiveTab('bank');
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
        return { label: 'Level 2: Basic Understanding', color: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60' };
      case 3:
        return { label: 'Level 3: Moderate Application', color: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60' };
      case 4:
        return { label: 'Level 4: Advanced Scenario', color: 'bg-purple-950/60 text-purple-300 border-purple-800/60' };
      default:
        return { label: `Level ${level}`, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'MCQ':
        return { label: 'Multiple Choice', color: 'bg-blue-950/60 text-blue-300 border-blue-800/60' };
      case 'TRUE_FALSE':
        return { label: 'True / False', color: 'bg-amber-950/60 text-amber-300 border-amber-800/60' };
      case 'SHORT_ANSWER':
        return { label: 'Short Answer', color: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60' };
      case 'SCENARIO':
        return { label: 'Scenario-Based', color: 'bg-pink-950/60 text-pink-300 border-pink-800/60' };
      default:
        return { label: type, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const currentDocObj = documents.find((d) => d._id === selectedDocument);
  const currentModObj = modules.find((m) => m._id === selectedModule);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-md bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Exam Question Generator</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
              Phase 9
            </span>
          </div>
          <p className="text-sm text-slate-400">
            Generate exam-oriented questions, practice tests, and analyze traps directly from uploaded course lectures.
          </p>
        </div>

        {/* Global Action Stats */}
        {questions.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleRevealAll}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
            >
              {questions.every((q) => revealedAnswers[q._id]) ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 text-indigo-400" />
                  Hide All Answers
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 text-indigo-400" />
                  Reveal All Answers
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">
            &times;
          </button>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-200 text-sm flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">{successMsg}</div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">
            &times;
          </button>
        </div>
      )}

      {/* Selector & Generator Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Scope Selection (Module + Document) */}
        <div className="lg:col-span-1 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-indigo-400" />
              1. Select Lecture Material
            </h2>

            {/* Module Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Enrolled Course Module</label>
              {loadingModules ? (
                <div className="h-10 bg-slate-800/50 animate-pulse rounded-lg border border-slate-700/50" />
              ) : modules.length === 0 ? (
                <p className="text-xs text-amber-400 bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/40">
                  No enrolled modules available. Please enroll in a module to generate questions.
                </p>
              ) : (
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                >
                  <option value="">-- Choose Module --</option>
                  {modules.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.moduleCode} — {m.moduleName}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Document Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Lecture Document</label>
              {loadingDocs ? (
                <div className="h-10 bg-slate-800/50 animate-pulse rounded-lg border border-slate-700/50" />
              ) : !selectedModule ? (
                <p className="text-xs text-slate-500 italic">Select a module first</p>
              ) : documents.length === 0 ? (
                <p className="text-xs text-amber-400/80 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30">
                  No documents found for this module.
                </p>
              ) : (
                <select
                  value={selectedDocument}
                  onChange={(e) => setSelectedDocument(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                >
                  {documents.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.originalName} ({d.chunkCount || 0} chunks)
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Document Info preview */}
          {currentDocObj && (
            <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
              <span className="truncate max-w-[180px]">{currentDocObj.originalName}</span>
              <span className="font-mono text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                {currentDocObj.chunkCount || 0} chunks
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Generation Configuration */}
        <div className="lg:col-span-2 bg-slate-900/60 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              2. Question Specifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Question Type */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Question Type</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                >
                  <option value="MCQ">Multiple Choice (MCQ)</option>
                  <option value="TRUE_FALSE">True / False</option>
                  <option value="SHORT_ANSWER">Short Answer</option>
                  <option value="SCENARIO">Scenario-Based</option>
                </select>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                >
                  <option value={2}>Level 2 — Basic Understanding</option>
                  <option value={3}>Level 3 — Moderate / Application</option>
                  <option value={4}>Level 4 — Advanced / Scenario</option>
                </select>
              </div>

              {/* Count */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Number of Questions</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition"
                />
              </div>
            </div>

            {/* Grounding and Design notice */}
            <div className="p-3 bg-indigo-950/30 rounded-xl border border-indigo-900/40 text-xs text-indigo-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong>Academic Grounding:</strong> Questions are generated exclusively from lecture chunks and verified against potential prompt injections. External facts and hallucinated content are strictly filtered.
              </span>
            </div>
          </div>

          {/* Generation Action Button */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {questions.length > 0
                ? `${questions.length} active question${questions.length === 1 ? '' : 's'} available in bank`
                : 'No questions generated yet for this document'}
            </span>

            <button
              onClick={handleGenerate}
              disabled={generating || !selectedDocument}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              {generating ? (
                <>
                  <RotateCw className="h-4 w-4 animate-spin" />
                  Generating Exam Questions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Questions
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Question Bank Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Exam Question Bank
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>

          {questions.length > 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedDocument}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
            >
              <RotateCw className={`h-3.5 w-3.5 ${generating ? 'animate-spin' : ''}`} />
              Generate More
            </button>
          )}
        </div>

        {/* Loading questions */}
        {loadingQuestions && (
          <div className="py-16 text-center text-slate-500">
            <RotateCw className="h-8 w-8 animate-spin mx-auto text-indigo-500 mb-3" />
            <p className="text-sm">Loading exam questions...</p>
          </div>
        )}

        {/* Empty state */}
        {!loadingQuestions && questions.length === 0 && (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <HelpCircle className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300 mb-1">No Exam Questions Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
              Select a lecture document above and click <strong>Generate Questions</strong> to build high-yield practice items with explanations and exam traps.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedDocument}
              className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition inline-flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start Question Generation
            </button>
          </div>
        )}

        {/* Question Cards Grid */}
        {!loadingQuestions && questions.length > 0 && (
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const typeBadge = getTypeBadge(q.questionType);
              const diffBadge = getDifficultyBadge(q.difficulty);
              const isRevealed = !!revealedAnswers[q._id];

              return (
                <div
                  key={q._id || idx}
                  className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700/80 rounded-2xl p-6 transition shadow-sm"
                >
                  {/* Card Header: Badges and Admin Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-300 px-2.5 py-1 bg-slate-800 rounded-lg">
                        Q{idx + 1}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${typeBadge.color}`}>
                        {typeBadge.label}
                      </span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${diffBadge.color}`}>
                        {diffBadge.label}
                      </span>
                      {q.topic && (
                        <span className="text-xs text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                          {q.topic}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition"
                          title="Delete Question (Admin)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-slate-100 font-medium text-base mb-5 leading-relaxed">
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
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300'
                            }`}
                          >
                            <span
                              className={`h-6 w-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 text-slate-400'
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
                    <button
                      onClick={() => toggleAnswer(q._id)}
                      className={`text-xs font-medium px-3.5 py-1.5 rounded-lg border transition flex items-center gap-2 ${
                        isRevealed
                          ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300'
                          : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                      {isRevealed ? 'Hide Answer & Exam Analysis' : 'Show Answer & Explanation'}
                      {isRevealed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>

                    {/* Revealed Answer Box */}
                    {isRevealed && (
                      <div className="mt-4 p-5 rounded-xl bg-slate-950/80 border border-indigo-950 space-y-4 animate-in fade-in duration-200">
                        {/* Correct Answer */}
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
                            Correct Answer
                          </span>
                          <p className="text-sm font-semibold text-emerald-200">
                            {q.correctAnswer}
                          </p>
                        </div>

                        {/* Explanation */}
                        {q.explanation && (
                          <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Explanation
                            </span>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        )}

                        {/* Exam Clue & Common Trap */}
                        {(q.examClue || q.commonTrap) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                            {q.examClue && (
                              <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-900/40 text-xs text-amber-200">
                                <span className="font-semibold flex items-center gap-1.5 text-amber-400 mb-1">
                                  ⭐ Exam Clue
                                </span>
                                <p>{q.examClue}</p>
                              </div>
                            )}

                            {q.commonTrap && (
                              <div className="p-3 bg-rose-950/20 rounded-lg border border-rose-900/40 text-xs text-rose-200">
                                <span className="font-semibold flex items-center gap-1.5 text-rose-400 mb-1">
                                  ⚠️ Common Exam Trap
                                </span>
                                <p>{q.commonTrap}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Source Attribution */}
                        {Array.isArray(q.sourceChunks) && q.sourceChunks.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                              📄 Verified Source Attribution
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
                                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-400 flex items-center gap-2"
                                  >
                                    <FileText className="h-3.5 w-3.5 text-indigo-400" />
                                    <span>{src.documentName || 'Document'}</span>
                                    <span className="text-slate-600">&bull;</span>
                                    <span className="text-slate-300 font-mono">Chunk {src.chunkIndex}</span>
                                    <span className="text-slate-600">&bull;</span>
                                    <span>{pageText}</span>
                                    {src.sectionHeading && src.sectionHeading !== 'General' && (
                                      <>
                                        <span className="text-slate-600">&bull;</span>
                                        <span className="text-indigo-400">{src.sectionHeading}</span>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
