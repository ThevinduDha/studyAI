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
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';

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
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        badge="Foundation Infrastructure"
        badgeVariant="indigo"
        title="System Health & Architecture"
        icon={Server}
        subtitle="The foundational architecture powering StudyAI. This view monitors real-time Express backend connectivity and architectural blueprints."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={RefreshCw}
            onClick={fetchHealth}
            loading={loading}
          >
            Check Health
          </Button>
        }
      />

      {/* System Health Check Card */}
      <section id="health-status">
        <Card className="p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-subtle">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
                <Server className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-heading">Backend Health Status</h2>
                <p className="text-xs text-muted">Live check against Express API (/api/health)</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lastChecked && (
                <span className="text-xs text-muted">
                  Checked at {lastChecked}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-1">
            {loading && !healthData && !error && (
              <div className="text-xs text-muted flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                Querying backend server...
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Failed to connect to backend: {error}</span>
                </div>
                <span className="text-xs opacity-80">Ensure Express server is running on port 5000</span>
              </div>
            )}

            {healthData && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl card-base border border-subtle shadow-sm">
                  <div className="text-xs text-muted mb-1">Status</div>
                  <div className="flex items-center gap-2 font-medium text-emerald-500 text-sm">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{healthData.status?.toUpperCase() || 'ONLINE'}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl card-base border border-subtle shadow-sm">
                  <div className="text-xs text-muted mb-1">Response Message</div>
                  <div className="text-heading text-sm font-mono truncate">
                    {healthData.message}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl card-base border border-subtle shadow-sm">
                  <div className="text-xs text-muted mb-1">Server Timestamp</div>
                  <div className="text-heading text-xs font-mono truncate">
                    {healthData.timestamp}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Architecture Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-heading tracking-tight">System Architecture Overview</h2>
          <p className="text-xs sm:text-sm text-muted">
            The foundational tiers configured for production-grade university AI learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <Card hoverable className="p-5 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-heading mb-1.5">Frontend Client</h3>
            <p className="text-xs text-muted leading-relaxed mb-4">
              React with Vite, Tailwind CSS, Lucide icons, and modern responsive UI components structured for scale.
            </p>
            <div className="text-xs font-medium text-muted flex items-center gap-1">
              <span>client/src</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </Card>

          {/* Card 2 */}
          <Card hoverable className="p-5 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4">
              <Server className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-heading mb-1.5">Backend REST Server</h3>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Node.js and Express.js clean architecture with separated routes, controllers, middleware, and domain services.
            </p>
            <div className="text-xs font-medium text-muted flex items-center gap-1">
              <span>server/src</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </Card>

          {/* Card 3 */}
          <Card hoverable className="p-5 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-semibold text-heading mb-1.5">AI & Grounded RAG</h3>
            <p className="text-xs text-muted leading-relaxed mb-4">
              Structured RAG pipeline utilizing Google Gemini embeddings, semantic chunk retrieval, and verifiable source citations.
            </p>
            <div className="text-xs font-medium text-muted flex items-center gap-1">
              <span>MongoDB Atlas + Gemini</span>
              <ArrowUpRight className="h-3 w-3" />
            </div>
          </Card>
        </div>
      </section>

      {/* Phase Roadmap Status */}
      <Card className="p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-heading mb-2">Platform Delivery Status</h2>
        <p className="text-xs text-muted mb-4">
          All 11 functional phases are fully active: Authentication, PDF processing, Vector Embeddings, Semantic Search, Grounded RAG, Lecture Summaries, Exam Questions, AI Quizzes, and Student Learning Analytics.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl card-base border border-subtle flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-heading">Clean Architecture</span>
          </div>
          <div className="p-2.5 rounded-xl card-base border border-subtle flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-heading">JWT Authentication</span>
          </div>
          <div className="p-2.5 rounded-xl card-base border border-subtle flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-heading">Module Management</span>
          </div>
          <div className="p-2.5 rounded-xl card-base border border-subtle flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span className="text-heading">Grounded RAG Engine</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
