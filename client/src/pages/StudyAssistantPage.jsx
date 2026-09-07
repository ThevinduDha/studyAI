import { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  BookOpen,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Info,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  User,
  Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { moduleService } from '../services/module.service.js';
import { documentService } from '../services/document.service.js';
import { ragService } from '../services/rag.service.js';

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, loading]);

  // Load modules on mount
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!question.trim() || loading) return;

    const currentQ = question.trim();
    setQuestion('');
    setError('');

    // Append user message immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: currentQ,
      timestamp: new Date()
    };

    setConversation((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await ragService.askQuestion({
        question: currentQ,
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
        timestamp: new Date()
      };

      setConversation((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Failed to get answer. Please try again.');
      // Append error message to chat
      setConversation((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'error',
          text: err.message || 'An error occurred while generating the answer.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
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
  };

  const handleSampleQuestion = (q) => {
    setQuestion(q);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-5rem)]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Phase 7
            </span>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Strictly Grounded RAG
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            Study Assistant
          </h1>
        </div>

        {/* Clear Button */}
        {conversation.length > 0 && (
          <button
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs transition cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear Chat
          </button>
        )}
      </div>

      {/* Scope Selectors Bar */}
      <div className="py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
        <div>
          <label htmlFor="rag-module" className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <BookOpen className="h-3 w-3 text-indigo-400" />
            Study Scope: Module
          </label>
          <select
            id="rag-module"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            disabled={loadingModules || modules.length === 0}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">
              {isAdmin ? 'All Modules (Global Scope)' : 'All Enrolled Modules'}
            </option>
            {modules.map((m) => (
              <option key={m._id} value={m._id}>
                {m.moduleCode} — {m.moduleName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rag-document" className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <FileText className="h-3 w-3 text-indigo-400" />
            Study Scope: Document (Optional)
          </label>
          <select
            id="rag-document"
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            disabled={!selectedModule || loadingDocs || documents.length === 0}
            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          >
            <option value="">
              {!selectedModule
                ? 'Select a module first'
                : documents.length === 0
                ? 'No documents in module'
                : 'All Documents in Module'}
            </option>
            {documents.map((doc) => (
              <option key={doc._id} value={doc._id}>
                {doc.originalName} ({doc.chunkCount} chunks)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Enrolled Modules Warning for Students */}
      {!isAdmin && modules.length === 0 && !loadingModules && (
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>You are not enrolled in any modules yet. Please enroll in a course module to ask questions grounded in its materials.</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-3 min-h-0">
        {conversation.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">StudyAI Grounded Assistant</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Ask questions directly based on your course slides, notes, and textbook excerpts. The assistant strictly answers from your uploaded materials and provides direct source citations.
            </p>

            {/* Grounding guarantee pill */}
            <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Zero Hallucination Policy: Will state when information is missing.</span>
            </div>

            {/* Sample Questions */}
            <div className="mt-6 w-full max-w-md text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Example Academic Questions:
              </p>
              <div className="space-y-1.5">
                {[
                  'What is the difference between supervised and unsupervised learning?',
                  'How does state machine replication work in distributed systems?',
                  'Explain virtual memory paging and address translation.'
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSampleQuestion(sample)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/70 hover:border-slate-700 text-xs text-slate-300 transition flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate mr-2">{sample}</span>
                    <ArrowRight className="h-3 w-3 text-slate-500 group-hover:text-indigo-400 transition shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Message Thread */
          conversation.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              {msg.role === 'user' ? (
                /* User Bubble */
                <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm shadow-md shadow-indigo-600/10">
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              ) : msg.role === 'error' ? (
                /* Error Bubble */
                <div className="max-w-2xl bg-red-950/40 border border-red-900/60 rounded-2xl px-4 py-3 text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <p>{msg.text}</p>
                </div>
              ) : (
                /* Assistant Answer Card */
                <div className="max-w-3xl w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg backdrop-blur-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800/60 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-md bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-slate-200">StudyAI Assistant</span>
                    </div>

                    {msg.retrievalCount > 0 ? (
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                        <CheckCircle2 className="h-3 w-3" />
                        Grounded in {msg.retrievalCount} source {msg.retrievalCount === 1 ? 'chunk' : 'chunks'}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">
                        No grounding sources available
                      </span>
                    )}
                  </div>

                  {/* Answer Text */}
                  <div className="text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>

                  {/* Sources Section */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/70">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5 text-indigo-400" />
                        Verified Source Citations:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70 text-xs space-y-1 hover:border-slate-700 transition"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-semibold text-slate-200 truncate" title={src.documentName}>
                                {src.documentName}
                              </span>
                              {src.moduleCode && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                                  {src.moduleCode}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                              {src.pageStart && (
                                <span>
                                  Pages: {src.pageStart}
                                  {src.pageEnd && src.pageEnd !== src.pageStart ? `–${src.pageEnd}` : ''}
                                </span>
                              )}
                              <span>Chunk #{src.chunkIndex}</span>
                              {src.sectionHeading && (
                                <span className="italic truncate max-w-[120px]">
                                  § {src.sectionHeading}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start">
            <div className="max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-md">
              <div className="flex items-center gap-2 text-xs text-indigo-300 font-medium">
                <div className="h-3.5 w-3.5 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <span>Searching course materials & synthesizing answer...</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Retrieving relevant chunks from MongoDB Atlas Vector Search and verifying grounded context.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-3 border-t border-slate-800/80 shrink-0">
        {error && (
          <div className="mb-2 p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your study materials (Press Enter to send)..."
            maxLength={2000}
            disabled={loading || (!isAdmin && modules.length === 0)}
            className="w-full pl-4 pr-24 py-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/60 transition resize-none disabled:opacity-50"
          />

          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <span className={`text-[10px] ${question.length > 1900 ? 'text-amber-400' : 'text-slate-500'}`}>
              {question.length}/2000
            </span>
            <button
              type="submit"
              disabled={loading || !question.trim() || (!isAdmin && modules.length === 0)}
              className="h-8 w-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Send question"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
