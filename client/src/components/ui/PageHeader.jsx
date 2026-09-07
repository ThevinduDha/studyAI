export function PageHeader({
  title,
  subtitle,
  badge,
  icon: Icon,
  actions,
  breadcrumbs,
  className = ''
}) {
  return (
    <div className={`mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="space-y-1.5 max-w-2xl">
        {breadcrumbs && <div className="mb-2">{breadcrumbs}</div>}
        <div className="flex flex-wrap items-center gap-2.5">
          {Icon && (
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white light:text-slate-900">
            {title}
          </h1>
          {badge && <div className="ml-1">{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-400 light:text-slate-600 leading-relaxed">
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
