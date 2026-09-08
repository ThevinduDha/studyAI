import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  AlertCircle,
  FileText
} from 'lucide-react';
import ragService from '../../services/rag.service.js';
import { FormattedAIResponse } from './FormattedAIResponse.jsx';
import { AIThinkingIndicator } from './AIThinkingIndicator.jsx';
import { SourceCard } from './SourceCard.jsx';
import { GroundedBadge } from './GroundedBadge.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * FloatingAIChatbot
 * Persistent bottom-right AI Tutor available to authenticated students on all pages.
 * Reuses the existing Grounded RAG backend without creating duplicate AI logic.
 */
export function FloatingAIChatbot() {
  const [searchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(() => {
    try {
      const saved = sessionStorage.getItem('studyai_floating_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, conversation, loading]);

  // Persist session conversation in sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('studyai_floating_chat', JSON.stringify(conversation));
    } catch {}
  }, [conversation]);

  // Read module context from URL if student is viewing a specific course or document
  const activeModuleId = searchParams.get('module') || searchParams.get('moduleId');
  const activeDocumentId = searchParams.get('document') || searchParams.get('documentId');

  const handleSend = async (customPrompt) => {
    const promptToSend = typeof customPrompt === 'string' ? customPrompt : inputPrompt;
    if (!promptToSend.trim() || loading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: promptToSend.trim(),
      timestamp: new Date().toISOString()
    };

    setConversation((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setLoading(true);

    try {
      const res = await ragService.askQuestion({
        question: userMessage.text,
        moduleId: activeModuleId || undefined,
        documentId: activeDocumentId || undefined,
        topK: 4
      });

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: res.answer,
        timestamp: new Date().toISOString(),
        sources: res.sources || [],
        retrievalCount: res.retrieval?.count || res.sources?.length || 0,
        originalQuestion: userMessage.text
      };

      setConversation((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.warn('Floating chat RAG error:', err);
      const errorMessage = {
        id: `err-${Date.now()}`,
        role: 'error',
        text: err.message || 'Unable to retrieve answer. Please verify network connectivity.',
        timestamp: new Date().toISOString(),
        originalQuestion: userMessage.text
      };
      setConversation((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setConversation([]);
    try {
      sessionStorage.removeItem('studyai_floating_chat');
    } catch {}
  };

  const quickPrompts = [
    'Explain the core concepts of this course',
    'Summarize key takeaways for my exams',
    'What are common traps students make here?'
  ];

  return (
    <>
      {/* 1. Persistent Floating Action Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative h-14 w-14 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/40"
            aria-label="Open StudyAI AI Tutor"
            title="Ask AI Tutor"
          >
            <Sparkles className="h-6 w-6 text-white group-hover:rotate-12 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#090d16]" />
            </span>
          </button>
        </div>
      )}

      {/* 2. Floating Chatbot Drawer Panel */}
      {isOpen && (
        <div className="fixed bottom-4 sm:bottom-6 right-2 sm:right-6 w-[calc(100vw-1rem)] sm:w-[420px] h-[560px] max-h-[85vh] z-50 rounded-2xl shadow-2xl card-base border border-subtle flex flex-col overflow-hidden animate-slide-up bg-surface light:bg-card">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-subtle flex items-center justify-between bg-subtle/30 light:bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-xs sm:text-sm text-heading">StudyAI AI Tutor</h3>
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live RAG
                  </span>
                </div>
                <p className="text-[11px] text-muted truncate max-w-[200px]">
                  {activeDocumentId ? 'Scoped to current lecture' : activeModuleId ? 'Scoped to current course' : 'Ask anything from your lectures'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {conversation.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  className="p-1.5 rounded-lg text-muted hover:text-heading hover:bg-subtle/50 transition cursor-pointer"
                  title="Clear conversation"
                  aria-label="Clear conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-heading hover:bg-subtle/50 transition cursor-pointer"
                title="Minimize chat"
                aria-label="Close AI Tutor"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Message List */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs">
            {conversation.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3 text-muted">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-heading text-sm mb-1">How can I help you study?</h4>
                  <p className="text-xs text-muted max-w-xs leading-relaxed">
                    Ask questions grounded in your course slides, textbooks, and lecture materials.
                  </p>
                </div>

                <div className="w-full space-y-1.5 pt-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted block text-left">
                    Suggested Questions:
                  </span>
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(q)}
                      className="w-full text-left p-2 rounded-xl card-base border border-subtle hover:border-indigo-500/40 text-muted hover:text-heading transition text-[11px] cursor-pointer block truncate"
                    >
                      &bull; {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[85%] rounded-2xl rounded-tr-xs bg-indigo-600 text-white px-3.5 py-2.5 shadow-sm text-xs leading-relaxed">
                      {msg.text}
                    </div>
                  ) : msg.role === 'error' ? (
                    <div className="max-w-[90%] rounded-2xl p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block mb-0.5">Response Error</span>
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-[95%] w-full rounded-2xl p-3.5 card-base border border-subtle space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-subtle">
                        <span className="font-semibold text-heading flex items-center gap-1.5">
                          <Bot className="h-3.5 w-3.5 text-indigo-500" />
                          AI Tutor
                        </span>
                        {msg.retrievalCount > 0 && (
                          <GroundedBadge count={msg.retrievalCount} size="xs" variant="emerald" />
                        )}
                      </div>

                      <FormattedAIResponse content={msg.text} />

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-subtle space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
                            <FileText className="h-3 w-3 text-indigo-500" />
                            Grounded Citations ({msg.sources.length}):
                          </span>
                          <div className="space-y-1">
                            {msg.sources.slice(0, 3).map((src, sIdx) => (
                              <SourceCard key={sIdx} source={src} index={sIdx} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && <AIThinkingIndicator message="Retrieving lecture passages & formulating answer..." />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 border-t border-subtle bg-subtle/20 light:bg-slate-50/80">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your study material..."
                disabled={loading}
                className="flex-1 px-3 py-2 rounded-xl input-base text-xs disabled:opacity-50"
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => handleSend()}
                disabled={!inputPrompt.trim() || loading}
                loading={loading}
                aria-label="Send query"
              />
            </div>
            <span className="text-[10px] text-muted block mt-1 text-center">
              Enter to send &bull; Grounded in course documents
            </span>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingAIChatbot;
