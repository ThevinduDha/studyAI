import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  BookOpen,
  FileText,
  Trash2,
  AlertCircle,
  ShieldCheck,
  User,
  Bot,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Layers,
  RotateCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { documentService } from '../services/document.service.js';
import { ragService } from '../services/rag.service.js';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Card } from '../components/ui/Card.jsx';
import {
  GroundedBadge,
  AIStatusBadge,
  SourceCard,
  AIThinkingIndicator,
  SuggestedPrompt,
  FormattedAIResponse
} from '../components/ai/index.js';

export default function StudyAssistantPage() {
  const { user, isAdmin } = useAuth();

  const [question, setQuestion] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');

  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, loading]);

  // Load course modules on mount
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
        setError('Could not load course modules. Please refresh.');
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [isAdmin]);

  // Load documents for selected module
  useEffect(() => {
    if (!selectedModule) {
      setDocuments([]);
      setSelectedDocument('');
      return;
    }

    const fetchDocuments = async () => {
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

    fetchDocuments();
  }, [selectedModule]);

  // Submit question to grounded RAG backend
  const handleSubmit = async (queryText = null) => {
    const textToSubmit = typeof queryText === 'string' ? queryText.trim() : question.trim();
    if (!textToSubmit || loading) return;

    setQuestion('');
    setError('');

    // Append user message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSubmit,
      timestamp: new Date()
    };

    setConversation((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await ragService.askQuestion({
        question: textToSubmit,
        moduleId: selectedModule || undefined,
        documentId: selectedDocument || undefined,
        topK: 5
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: response.answer,
        sources: response.sources || [],
        retrievalCount: response.retrieval?.count || 0,
        originalQuestion: textToSubmit,
        timestamp: new Date()
      };

      setConversation((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errMsg = err.message || 'Failed to retrieve answer. Please try again.';
      setError(errMsg);
      setConversation((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'error',
          text: errMsg,
          originalQuestion: textToSubmit,
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
      // Refocus textarea after response
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearChat = () => {
    setConversation([]);
    setError('');
    textareaRef.current?.focus();
  };

  const handleRetry = (originalQuestion) => {
    if (originalQuestion) {
      handleSubmit(originalQuestion);
    }
  };

  const handleSelectSuggestedPrompt = (promptText) => {
    handleSubmit(promptText);
  };

  const selectedModuleObj = modules.find((m) => m._id === selectedModule);
  const selectedDocObj = documents.find((d) => d._id === selectedDocument);

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header Bar */}
      <div className="shrink-0 pb-3 border-b border-subtle">
        <PageHeader
          badge="Grounded AI"
          badgeVariant="indigo"
          title="AI Study Assistant"
          icon={Sparkles}
          subtitle="Ask questions grounded in your course slides, notes, and academic textbooks with verified citations."
          actions={
            <div className="flex items-center gap-2">
              <GroundedBadge label="Grounded in your study materials" size="xs" variant="emerald" />
              {conversation.length > 0 && (
                <Button
                  variant="outline"
                  size="xs"
                  icon={Trash2}
                  onClick={handleClearChat}
                  title="Clear current chat conversation"
                >
                  Clear
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Context Scope Bar */}
      <div className="py-2.5 px-3 card-base border border-subtle rounded-xl mt-3 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
          {/* Module Selector */}
          <div>
            <Select
              id="rag-module"
              label=""
              icon={BookOpen}
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={loadingModules || modules.length === 0}
              className="text-xs"
            >
              <option value="">
                {isAdmin ? 'All Modules (Global Scope)' : 'All Enrolled Modules'}
              </option>
              {modules.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.moduleCode || m.code} — {m.moduleName || m.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Document Selector */}
          <div>
            <Select
              id="rag-document"
              label=""
              icon={FileText}
              value={selectedDocument}
              onChange={(e) => setSelectedDocument(e.target.value)}
              disabled={!selectedModule || loadingDocs || documents.length === 0}
              className="text-xs"
            >
              <option value="">
                {!selectedModule
                  ? 'Scope: Entire Module'
                  : documents.length === 0
                  ? 'No documents in module'
                  : 'Scope: All Documents in Module'}
              </option>
              {documents.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.originalName} ({doc.chunkCount || 0} chunks)
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Current Active Scope Tag */}
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-muted shrink-0 px-2 py-1 bg-surface/50 rounded-lg border border-subtle">
          <Layers className="h-3 w-3 text-indigo-400" />
          <span className="truncate max-w-[200px]">
            {selectedDocObj
              ? selectedDocObj.originalName
              : selectedModuleObj
              ? `${selectedModuleObj.moduleCode || selectedModuleObj.code}`
              : 'All Enrolled Modules'}
          </span>
        </div>
      </div>

      {/* Enrolled Modules Warning for Students */}
      {!isAdmin && modules.length === 0 && !loadingModules && (
        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            You are not currently enrolled in any course modules. Please enroll in a module to ask questions grounded in its materials.
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-3 min-h-0">
        {conversation.length === 0 ? (
          /* Restrained, Academic Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted max-w-xl mx-auto animate-fade-in">
            <div className="relative mb-3">
              <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 shadow-inner">
                <Sparkles className="h-7 w-7" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-heading">
              How can I help you study?
            </h3>
            <p className="text-xs text-muted mt-1.5 leading-relaxed">
              Ask questions about your lecture materials, concepts, definitions, or exam preparation.
              Every response is strictly synthesized from your uploaded course documents.
            </p>

            {/* Grounding guarantee */}
            <div className="mt-3.5 px-3 py-1.5 rounded-full card-base border border-subtle text-[11px] text-muted flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Zero-Hallucination Policy: Will state when information is missing.</span>
            </div>

            {/* Suggested Prompts */}
            <div className="mt-6 w-full text-left space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted px-1 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-amber-400" />
                Suggested Study Prompts:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <SuggestedPrompt
                  prompt="Explain this topic simply"
                  category="Concept Breakdown"
                  onClick={handleSelectSuggestedPrompt}
                  disabled={loading || (!isAdmin && modules.length === 0)}
                />
                <SuggestedPrompt
                  prompt="Give me an exam-style example"
                  category="Practice Application"
                  onClick={handleSelectSuggestedPrompt}
                  disabled={loading || (!isAdmin && modules.length === 0)}
                />
                <SuggestedPrompt
                  prompt="What are the key concepts?"
                  category="High-Yield Review"
                  onClick={handleSelectSuggestedPrompt}
                  disabled={loading || (!isAdmin && modules.length === 0)}
                />
                <SuggestedPrompt
                  prompt="Create an exam-style explanation"
                  category="Assessment Prep"
                  onClick={handleSelectSuggestedPrompt}
                  disabled={loading || (!isAdmin && modules.length === 0)}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Message Thread */
          conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}
            >
              {msg.role === 'user' ? (
                /* User Bubble */
                <div className="flex items-start gap-2.5 max-w-2xl">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-4 py-3 text-xs sm:text-sm shadow-md shadow-indigo-600/10 leading-relaxed font-sans">
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div className="text-[10px] text-indigo-200/80 text-right mt-1 select-none">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="h-7 w-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 select-none mt-1">
                    <User className="h-3.5 w-3.5" />
                  </div>
                </div>
              ) : msg.role === 'error' ? (
                /* Error Bubble with Retry */
                <div className="max-w-2xl card-base border border-rose-500/30 bg-rose-500/10 rounded-2xl p-4 text-xs text-rose-400 flex items-start justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block mb-0.5">Generation Error</span>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                  {msg.originalQuestion && (
                    <Button
                      variant="outline"
                      size="xs"
                      icon={RotateCw}
                      onClick={() => handleRetry(msg.originalQuestion)}
                      className="shrink-0 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ) : (
                /* Assistant Answer Card */
                <div className="max-w-3xl w-full card-base border border-subtle rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm">
                  {/* Assistant Identity Header */}
                  <div className="flex items-center justify-between text-xs border-b border-subtle pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-heading text-xs">StudyAI Assistant</span>
                        <span className="text-[10px] text-muted block">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {msg.retrievalCount > 0 ? (
                        <GroundedBadge count={msg.retrievalCount} size="xs" variant="emerald" />
                      ) : (
                        <span className="text-[10px] text-muted">
                          No grounding sources found
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Formatted Answer Body */}
                  <FormattedAIResponse
                    content={msg.text}
                    onRetry={() => handleRetry(msg.originalQuestion)}
                  />

                  {/* Grounded Source Citations Section */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-subtle/60 space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-indigo-400" />
                          Source Citations ({msg.sources.length}):
                        </span>
                        <span className="text-[10px] text-muted">
                          Click to expand passage
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => (
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
          ))
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-start animate-fade-in">
            <AIThinkingIndicator
              title="AI is analyzing your lecture material..."
              subtitle="Searching relevant sections via MongoDB Atlas Vector Search and verifying grounded context."
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Area */}
      <div className="pt-3 border-t border-subtle shrink-0">
        {error && (
          <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError('')}
              className="text-xs font-semibold hover:underline text-rose-400 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="relative">
          <textarea
            ref={textareaRef}
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your lectures... (Enter to send, Shift+Enter for newline)"
            maxLength={2000}
            disabled={loading || (!isAdmin && modules.length === 0)}
            className="w-full pl-4 pr-24 py-3 rounded-xl input-base text-xs sm:text-sm resize-none disabled:opacity-50 transition shadow-xs focus:ring-2 focus:ring-indigo-500/50"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2 select-none">
            <span
              className={`text-[10px] ${
                question.length > 1900 ? 'text-amber-400 font-semibold' : 'text-muted'
              }`}
            >
              {question.length}/2000
            </span>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !question.trim() || (!isAdmin && modules.length === 0)}
              title="Send question to AI Assistant"
              className="!p-2 !h-8 !w-8 flex items-center justify-center rounded-lg shadow-sm"
            >
              {loading ? (
                <div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
