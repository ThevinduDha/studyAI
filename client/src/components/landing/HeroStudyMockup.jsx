import {
  Sparkles,
  FileText,
  Target,
  Award,
  BookOpen,
  CheckCircle2,
  Bot,
  User,
  Search,
  Layers
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';

export default function HeroStudyMockup() {
  return (
    <div className="relative w-full max-w-xl mx-auto lg:max-w-none">
      {/* Ambient background glow */}
      <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-cyan-500/20 rounded-3xl blur-2xl -z-10 animate-pulse-glow" />

      {/* Main Workspace Mockup Window */}
      <div className="rounded-2xl bg-slate-900/90 light:bg-white border border-slate-800 light:border-slate-200/90 shadow-2xl shadow-black/40 overflow-hidden backdrop-blur-xl">
        {/* Window Chrome / Titlebar */}
        <div className="px-4 py-3 bg-slate-950/70 light:bg-slate-50 border-b border-slate-800/80 light:border-slate-200 flex items-center justify-between gap-2">
          {/* Mac-style traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-rose-500/80" />
            <div className="h-3 w-3 rounded-full bg-amber-500/80" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>

          {/* Active document / lecture pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 light:bg-slate-200/70 text-[11px] font-medium text-slate-300 light:text-slate-700 min-w-0">
            <BookOpen className="h-3 w-3 text-indigo-400 light:text-indigo-600 shrink-0" />
            <span className="truncate max-w-[110px] sm:max-w-[200px]">CS301 &bull; Lecture 04</span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
            <span className="hidden sm:inline font-mono">Demo Workspace</span>
          </div>
        </div>

        {/* Workspace Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Student Question Bubble */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <User className="h-4 w-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-sm bg-slate-800/60 light:bg-slate-100 border border-slate-700/60 light:border-slate-200/80 text-xs sm:text-sm text-slate-100 light:text-slate-900 leading-relaxed max-w-[85%]">
              "Can you explain how Virtual Memory and Paging work in simple terms?"
            </div>
          </div>

          {/* AI Tutor Response Card */}
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-indigo-600/20">
              <Sparkles className="h-4 w-4" />
            </div>

            <div className="flex-1 p-4 sm:p-5 rounded-2xl rounded-tl-sm bg-indigo-950/20 light:bg-indigo-50/40 border border-indigo-500/30 light:border-indigo-200 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-400 light:text-indigo-600 flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5" />
                  StudyAI Tutor
                </span>
                <Badge variant="emerald" size="xs">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1 inline" />
                  Grounded in Lecture
                </Badge>
              </div>

              <div className="text-xs sm:text-[13px] text-slate-200 light:text-slate-800 leading-relaxed space-y-2">
                <p>
                  Think of virtual memory as a massive library desk where only the active book pages are kept open:
                </p>
                <div className="space-y-1.5 pl-2.5 border-l-2 border-indigo-500/40 light:border-indigo-400 text-slate-300 light:text-slate-700">
                  <p>
                    <strong className="text-white light:text-slate-900">1. Virtual Address Space:</strong> Programs see a continuous private block of memory without worrying about hardware RAM limits.
                  </p>
                  <p>
                    <strong className="text-white light:text-slate-900">2. Paging:</strong> Divides memory into fixed 4KB chunks so physical RAM never fragments.
                  </p>
                  <p>
                    <strong className="text-white light:text-slate-900">3. Page Fault:</strong> When a page isn't in physical RAM, the operating system loads it seamlessly from disk.
                  </p>
                </div>
              </div>

              {/* Source citation pill */}
              <div className="pt-2 border-t border-indigo-500/20 light:border-indigo-200 flex items-center justify-between text-[11px] text-slate-400 light:text-slate-600 flex-wrap gap-2">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3 text-indigo-400 light:text-indigo-600" />
                  Source: Operating Systems &bull; Lecture 04, Page 14
                </span>
                <span className="text-indigo-400 light:text-indigo-600 font-semibold cursor-pointer hover:underline">
                  View Reference &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status bar */}
        <div className="px-4 py-2 bg-slate-950/50 light:bg-slate-50 border-t border-slate-800/80 light:border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
          <span>✓ Ready to synthesize flashcards & quiz questions</span>
          <span className="text-indigo-400 font-medium">Interactive Demo Mockup</span>
        </div>
      </div>

      {/* Floating Card 1 (Top Left): AI Tutor */}
      <div className="absolute -top-4 -left-4 sm:-left-8 p-3 rounded-2xl bg-slate-900/90 light:bg-white border border-indigo-500/30 light:border-indigo-200 shadow-xl shadow-black/30 backdrop-blur-md flex items-center gap-2.5 animate-float-slow hidden sm:flex">
        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 light:text-indigo-600">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-100 light:text-slate-900">AI Tutor</div>
          <div className="text-[10px] text-slate-400">Grounded in lecture notes</div>
        </div>
      </div>

      {/* Floating Card 2 (Top Right): Lecture Summary */}
      <div className="absolute -top-6 -right-4 sm:-right-8 p-3 rounded-2xl bg-slate-900/90 light:bg-white border border-purple-500/30 light:border-purple-200 shadow-xl shadow-black/30 backdrop-blur-md flex items-center gap-2.5 animate-float-delayed hidden sm:flex">
        <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 light:text-purple-600">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-100 light:text-slate-900">Lecture Summary</div>
          <div className="text-[10px] text-slate-400">High-yield study points</div>
        </div>
      </div>

      {/* Floating Card 3 (Bottom Left): 82% Accuracy */}
      <div className="absolute -bottom-6 -left-2 sm:-left-6 p-3 rounded-2xl bg-slate-900/90 light:bg-white border border-emerald-500/30 light:border-emerald-200 shadow-xl shadow-black/30 backdrop-blur-md flex items-center gap-2.5 animate-float-delayed hidden sm:flex">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 light:text-emerald-600">
          <Target className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-100 light:text-slate-900 flex items-center gap-1">
            <span>82% Accuracy</span>
            <span className="text-[10px] text-emerald-400 font-semibold">+6%</span>
          </div>
          <div className="text-[10px] text-slate-400">Progress trajectory</div>
        </div>
      </div>

      {/* Floating Card 4 (Bottom Right): Practice Quiz */}
      <div className="absolute -bottom-4 -right-2 sm:-right-6 p-3 rounded-2xl bg-slate-900/90 light:bg-white border border-amber-500/30 light:border-amber-200 shadow-xl shadow-black/30 backdrop-blur-md flex items-center gap-2.5 animate-float-slow hidden sm:flex">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 light:text-amber-600">
          <Award className="h-4 w-4" />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-100 light:text-slate-900">Practice Quiz</div>
          <div className="text-[10px] text-slate-400">Timed exam conditions</div>
        </div>
      </div>
    </div>
  );
}
