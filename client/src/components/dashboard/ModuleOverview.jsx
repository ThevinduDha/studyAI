import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';

export default function ModuleOverview({ enrolledModules = [] }) {
  const navigate = useNavigate();
  const hasModules = Array.isArray(enrolledModules) && enrolledModules.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-heading">Enrolled Course Modules</h2>
          <p className="text-xs text-muted">Your registered academic courses and lecture archives</p>
        </div>

        <Link
          to="/modules"
          className="text-xs text-indigo-500 hover:opacity-80 font-medium inline-flex items-center gap-1 transition"
        >
          All Modules ({enrolledModules.length}) <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Grid */}
      {!hasModules ? (
        <Card className="p-8 shadow-sm">
          <EmptyState
            icon={BookOpen}
            title="No Modules Enrolled"
            description="You are not enrolled in any university courses yet. Enroll in courses to access lecture materials and AI study tools."
            actionLabel="Browse Course Catalog"
            onAction={() => navigate('/modules')}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {enrolledModules.map((module) => {
            const docCount = module.documents?.length || 0;

            return (
              <Card
                key={module._id}
                hoverable
                className="p-5 flex flex-col justify-between transition hover:border-indigo-500/40 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="indigo" size="sm">
                      {module.moduleCode}
                    </Badge>
                    <span className="text-[11px] text-muted font-medium">
                      {module.semester} {module.year}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-heading line-clamp-1 mb-1" title={module.moduleName}>
                      {module.moduleName}
                    </h3>
                    <p className="text-xs text-muted">
                      {module.lecturer || 'Faculty Lecturer'}
                    </p>
                    {module.description && (
                      <p className="text-xs text-muted line-clamp-2 mt-2 leading-relaxed">
                        {module.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-subtle text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5 text-indigo-500" />
                      {docCount} lecture {docCount === 1 ? 'document' : 'documents'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between gap-2">
                  <Link to={`/assistant?module=${module._id}`} className="flex-1">
                    <Button variant="outline" size="xs" icon={Sparkles} className="w-full justify-center">
                      Ask AI
                    </Button>
                  </Link>
                  <Link to={`/questions?module=${module._id}`} className="flex-1">
                    <Button variant="secondary" size="xs" icon={HelpCircle} className="w-full justify-center">
                      Practice
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
