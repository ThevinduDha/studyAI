import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Clock,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Button } from '../ui/Button.jsx';
import { Badge } from '../ui/Badge.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';

export default function ContinueLearning({ enrolledModules = [] }) {
  if (!enrolledModules || enrolledModules.length === 0) {
    return (
      <Card className="p-6 shadow-sm">
        <EmptyState
          icon={BookOpen}
          title="No Course Modules Enrolled"
          description="Enroll in university modules to unlock grounded AI question answering, exam preparation sets, and lecture summaries."
          actionLabel="Browse Course Modules"
          onAction={() => window.location.assign('/modules')}
        />
      </Card>
    );
  }

  // Pick the primary active module (first in enrolled array)
  const activeModule = enrolledModules[0];
  const docs = activeModule.documents || [];
  const latestDoc = docs.length > 0 ? docs[0] : null;

  return (
    <Card className="p-6 shadow-sm border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 via-card to-card">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Left Module info */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <Badge variant="indigo" size="sm">
              Current Focus
            </Badge>
            <span className="text-xs text-muted">
              {activeModule.semester} {activeModule.year}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-sm font-bold text-indigo-500">
                {activeModule.moduleCode}
              </span>
              <span className="text-muted text-xs">&bull;</span>
              <h3 className="text-lg font-bold text-heading">
                {activeModule.moduleName}
              </h3>
            </div>
            {activeModule.description && (
              <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                {activeModule.description}
              </p>
            )}
          </div>

          {/* Latest Document pill if available */}
          {latestDoc ? (
            <div className="flex items-center gap-2.5 text-xs text-muted p-2.5 rounded-xl card-base border border-subtle">
              <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className="text-heading font-medium truncate max-w-xs sm:max-w-sm" title={latestDoc.originalName}>
                {latestDoc.originalName}
              </span>
              {latestDoc.chunkCount !== undefined && (
                <span className="text-[11px] text-muted shrink-0">
                  &bull; {latestDoc.chunkCount} chunks
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted">
              {docs.length} document{docs.length === 1 ? '' : 's'} available
            </div>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="flex flex-wrap sm:flex-nowrap lg:flex-col gap-2.5 shrink-0 justify-end">
          <Link to={`/assistant?module=${activeModule._id}`}>
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              className="w-full justify-center shadow-sm"
            >
              Ask Grounded AI
            </Button>
          </Link>

          <Link to={`/questions?module=${activeModule._id}`}>
            <Button
              variant="outline"
              size="sm"
              icon={HelpCircle}
              className="w-full justify-center"
            >
              Practice Exam Items
            </Button>
          </Link>

          <Link to="/modules">
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-center text-muted"
            >
              All Modules ({enrolledModules.length}) <ArrowRight className="h-3 w-3 ml-1 inline" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
