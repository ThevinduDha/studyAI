import { useState, useEffect } from 'react';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  RefreshCw,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

export default function Phase1OverviewPage() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiUrl}/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setHealthData(data);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
      setHealthData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero Section */}
      <div className="max-w-3xl mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Foundation Infrastructure Baseline
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          Phase 1 System Health & Baseline Overview
        </h1>
        <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
          The foundational architecture powering StudyAI. This view monitors real-time Express backend connectivity and architectural blueprints.
        </p>
      </div>

      {/* System Health Check Card */}
      <section id="health-status" className="mb-12">
        <div className="rounded-xl border border-slate-800 bg-[#0e1526]/60 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">Backend Health Status</h2>
                <p className="text-xs text-slate-400">Live check against Express API (/api/health)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastChecked && (
                <span className="text-xs text-slate-500">
                  Checked at {lastChecked}
                </span>
              )}
              <button
                onClick={fetchHealth}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Check Health
              </button>
            </div>
          </div>

          <div className="mt-4 pt-1">
            {loading && !healthData && !error && (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse"></div>
                Querying backend server...
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>Failed to connect to backend: {error}</span>
                </div>
                <span className="text-xs text-red-400/80">Ensure Express server is running on port 5000</span>
              </div>
            )}

            {healthData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1">Status</div>
                  <div className="flex items-center gap-2 font-medium text-emerald-400 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{healthData.status?.toUpperCase() || 'ONLINE'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1">Response Message</div>
                  <div className="text-slate-200 text-sm font-mono truncate">
                    {healthData.message}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800/80">
                  <div className="text-xs text-slate-400 mb-1">Server Timestamp</div>
                  <div className="text-slate-300 text-xs font-mono truncate">
                    {healthData.timestamp}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Architecture Grid */}
      <section className="mb-12">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white tracking-tight">System Architecture Overview</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            The foundational tiers configured for production-grade university AI learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1526]/40 p-5 hover:border-slate-700 transition">
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Frontend Client</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              React with Vite, Tailwind CSS, Lucide icons, and modern responsive UI components structured for scale.
            </p>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <span>client/src</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1526]/40 p-5 hover:border-slate-700 transition">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Backend REST Server</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Node.js and Express.js clean architecture with separated routes, controllers, middleware, and domain services.
            </p>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <span>server/src</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-800 bg-[#0e1526]/40 p-5 hover:border-slate-700 transition">
            <div className="h-9 w-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">AI & Grounded RAG</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Structured RAG pipeline utilizing Google Gemini embeddings, semantic chunk retrieval, and verifiable source citations.
            </p>
            <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <span>docs/ai-rag.md</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </section>

      {/* Phase Roadmap Status */}
      <section className="rounded-xl border border-slate-800 bg-[#0e1526]/30 p-6">
        <h2 className="text-sm font-semibold text-white mb-2">Phase 1 & Phase 2 Delivery Status</h2>
        <p className="text-xs text-slate-400 mb-4">
          Phase 1 established architectural foundations and operational baselines. Phase 2 activates MongoDB, User and Module entities, JWT authentication, and student enrollment.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300">Clean Architecture</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300">JWT Authentication</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300">Module Management</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-300">Student Enrollment</span>
          </div>
        </div>
      </section>
    </div>
  );
}
