import { isValidElement } from 'react';
import { Badge } from './Badge.jsx';

export function PageHeader({
  title,
  subtitle,
  badge,
  badgeVariant = 'indigo',
  icon: Icon,
  actions,
  breadcrumbs,
  className = ''
}) {
  const renderedBadge = badge ? (
    typeof badge === 'string' ? (
      <Badge variant={badgeVariant} size="sm">
        {badge}
      </Badge>
    ) : isValidElement(badge) ? (
      badge
    ) : (
      <Badge variant={badgeVariant} size="sm">
        {String(badge)}
      </Badge>
    )
  ) : null;

  return (
    <div className={`mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="space-y-1.5 max-w-2xl">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <div className="flex flex-wrap items-center gap-2.5">
          {Icon && (
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-heading">
            {title}
          </h1>
          {renderedBadge && <div className="ml-1">{renderedBadge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-muted leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;
