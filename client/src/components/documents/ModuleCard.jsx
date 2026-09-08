import {
  BookOpen,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  User,
  Calendar,
  FileText,
  ArrowRight
} from 'lucide-react';
import { Card } from '../ui/Card.jsx';
import { Badge } from '../ui/Badge.jsx';
import { Button } from '../ui/Button.jsx';

/**
 * ModuleCard
 * Course Library card displaying syllabus information, lecturer, document count, and study CTA.
 */
export function ModuleCard({
  module,
  isEnrolled,
  isStudent = true,
  onOpenDetails,
  onEnroll,
  onUnenroll,
  isActing = false,
  className = ''
}) {
  const docCount = module.documents?.length || module.documentCount || 0;

  return (
    <Card
      hoverable={true}
      className={`p-5 flex flex-col justify-between shadow-xs border border-subtle hover:border-indigo-500/40 transition group ${className}`}
    >
      <div className="space-y-3.5">
        {/* Top bar: Code & Enrollment Badge */}
        <div className="flex items-center justify-between gap-2">
          <Badge variant="indigo" size="sm" className="font-mono font-bold tracking-wide">
            {module.moduleCode}
          </Badge>

          {isEnrolled ? (
            <Badge variant="emerald" size="xs">
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
              Enrolled
            </Badge>
          ) : (
            <Badge variant="default" size="xs">
              Available
            </Badge>
          )}
        </div>

        {/* Title and syllabus */}
        <div>
          <h3 className="text-sm sm:text-base font-bold text-heading line-clamp-2 group-hover:text-indigo-400 transition">
            {module.moduleName}
          </h3>
          <p className="text-xs text-muted line-clamp-2 mt-1.5 leading-relaxed">
            {module.description || 'No detailed syllabus overview provided.'}
          </p>
        </div>

        {/* Academic metadata */}
        <div className="space-y-2 text-xs text-muted pt-3 border-t border-subtle">
          {module.lecturer && (
            <div className="flex items-center gap-2 truncate">
              <User className="h-3.5 w-3.5 text-muted shrink-0" />
              <span className="truncate">{module.lecturer}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted shrink-0" />
              <span>
                {module.semester} &bull; {module.year}
              </span>
            </div>

            <div className="flex items-center gap-1.5 font-medium text-heading">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>{docCount} {docCount === 1 ? 'lecture' : 'lectures'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-4 border-t border-subtle mt-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onOpenDetails && onOpenDetails(module)}
          className="flex-1 justify-center"
        >
          <span>Open Lectures</span>
          <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
        </Button>

        {isStudent && (
          <>
            {isEnrolled ? (
              <Button
                variant="dangerOutline"
                size="sm"
                onClick={() => onUnenroll && onUnenroll(module._id)}
                loading={isActing}
                icon={MinusCircle}
                title="Unenroll from this course"
              />
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onEnroll && onEnroll(module._id)}
                loading={isActing}
                icon={PlusCircle}
                title="Enroll in this course"
              >
                Enroll
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

export default ModuleCard;
