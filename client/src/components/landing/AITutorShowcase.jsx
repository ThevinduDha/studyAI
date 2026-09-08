import { useState } from 'react';
import {
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  FileText,
  Copy,
  Check,
  Send,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function AITutorShowcase() {
  const [copied, setCopied] = useState(false);
  const [activePromptIndex, setActivePromptIndex] = useState(0);

  const prompts = [
    {
      chip: "Dijkstra's Algorithm",
      question: "Can you explain Dijkstra's algorithm in simple terms?",
      answer: "Dijkstra's algorithm finds the shortest route from a starting node to all other nodes in a weighted network:\n\n1. Start by setting the distance to your starting point as 0 and all other locations as infinity.\n2. Always visit the unvisited node with the smallest tentative distance.\n3. Examine all of its neighbors and calculate whether taking this path is shorter than previous routes.\n4. Mark the current node as finished and repeat until you reach the target destination.",
      source: "Data Structures & Algorithms &bull; Lecture 08, Page 19",
      topic: "Graph Traversal"
    },
    {
      chip: "Threads vs Processes",
      question: "What is the main difference between a process and a thread?",
      answer: "A process is an independent executing program with its own private address space and memory allocation.\n\nA thread is a lightweight unit of execution within a process that shares the same address space, file handles, and variables with peer threads, making inter-thread communication significantly faster with lower context-switch overhead.",
      source: "Operating Systems &bull; Lecture 03, Page 7",
      topic: "Concurrency"
    },
    {
      chip: "CAP Theorem",
      question: "What does the CAP theorem state in distributed systems?",
      answer: "The CAP theorem proves that in any distributed data store, you can only guarantee two out of the following three guarantees simultaneously:\n\n• Consistency: Every read receives the most recent write.\n• Availability: Every request receives a non-error response.\n• Partition Tolerance: The system continues operating despite network message drops.",
      source: "Distributed Systems &bull; Lecture 06, Page 22",
      topic: "System Architecture"
    }
  ];

  const activeDemo = prompts[activePromptIndex];

  const handleCopy = () => {
    navigator.clipboard?.writeText(activeDemo.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="ai-tutor" className="py-20 md:py-28 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Interactive Prompt Selectors */}
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 light:bg-indigo-50 light:text-indigo-700 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Grounded Intelligence</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white light:text-slate-900 tracking-tight leading-tight">
              Your personal AI study companion.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 light:text-slate-600 leading-relaxed">
              Ask questions in your own words. StudyAI explains concepts clearly using your learning materials — never inventing answers from outside your curriculum.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 light:text-slate-700">
                <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>
                  <strong className="text-white light:text-slate-900">Zero Hallucinations:</strong> Verified against your uploaded professor’s slides.
                </span>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 light:text-slate-700">
                <div className="h-5 w-5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>
                  <strong className="text-white light:text-slate-900">Verifiable Page Citations:</strong> Click citations to jump directly to the lecture source.
                </span>
              </div>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-slate-300 light:text-slate-700">
                <div className="h-5 w-5 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <span>
                  <strong className="text-white light:text-slate-900">Adaptive Clarity:</strong> Request simplified analogies or rigorous mathematical steps.
                </span>
              </div>
            </div>

            {/* Interactive Demo Chips */}
            <div className="pt-4 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Try a sample lecture question:
              </span>
              <div className="flex flex-wrap gap-2">
                {prompts.map((p, idx) => (
                  <button
                    key={p.chip}
                    onClick={() => setActivePromptIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      activePromptIndex === idx
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-800/60 light:bg-slate-100 text-slate-300 light:text-slate-700 hover:bg-slate-800 border border-slate-700/60 light:border-slate-300'
                    }`}
                  >
                    {p.chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Realistic Chat Mockup */}
          <div className="lg:col-span-7">
            <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200 shadow-2xl shadow-black/30 backdrop-blur-xl space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 light:border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-xs">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white light:text-slate-900 flex items-center gap-2">
                      StudyAI Tutor
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    </h4>
                    <p className="text-[11px] text-slate-400">Online &bull; Grounded in Course Slides</p>
                  </div>
                </div>

                <Badge variant="emerald" size="xs">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  Grounded Mode
                </Badge>
              </div>

              {/* Chat Message History */}
              <div className="space-y-4 py-2 min-h-[320px] flex flex-col justify-between">
                {/* User Message */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="p-3.5 rounded-2xl rounded-tr-sm bg-indigo-600 text-white text-xs sm:text-sm max-w-[85%] leading-relaxed shadow-sm">
                    {activeDemo.question}
                  </div>
                  <div className="h-8 w-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                </div>

                {/* AI Tutor Message */}
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>

                  <div className="space-y-3 flex-1 max-w-[90%]">
                    <div className="p-4 rounded-2xl rounded-tl-sm bg-slate-800/60 light:bg-slate-50 border border-slate-700/60 light:border-slate-200 text-xs sm:text-sm text-slate-200 light:text-slate-800 leading-relaxed whitespace-pre-line shadow-xs">
                      {activeDemo.answer}
                    </div>

                    {/* Source citation pill */}
                    <div className="p-2.5 rounded-xl bg-indigo-950/20 light:bg-indigo-50/60 border border-indigo-500/20 light:border-indigo-100 flex items-center justify-between text-[11px] text-slate-400 light:text-slate-600 flex-wrap gap-2">
                      <span className="flex items-center gap-1.5 font-medium text-slate-300 light:text-slate-700">
                        <FileText className="h-3.5 w-3.5 text-indigo-400 light:text-indigo-600" />
                        <span dangerouslySetInnerHTML={{ __html: activeDemo.source }} />
                      </span>

                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 light:text-indigo-600 hover:underline cursor-pointer"
                      >
                        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input Bar Mockup */}
              <div className="pt-2 border-t border-slate-800 light:border-slate-200">
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/40 light:bg-slate-100 border border-slate-700/60 light:border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value="Ask anything from this lecture material..."
                    className="flex-1 bg-transparent border-none text-xs text-slate-400 focus:outline-none cursor-default px-2"
                  />
                  <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                    <Send className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
