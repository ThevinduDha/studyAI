export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`rounded-xl bg-slate-850 border border-slate-800/60 shimmer-bg light:bg-slate-200 light:border-slate-300 ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 rounded ${
            i === lines - 1 ? 'w-2/3' : i === 0 ? 'w-full' : 'w-5/6'
          }`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-800/80 bg-[#0e1526]/80 p-5 sm:p-6 light:bg-white light:border-slate-200 space-y-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="pt-2 flex justify-between">
        <Skeleton className="h-7 w-20 rounded-lg" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6, columns = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', className = '' }) {
  return (
    <div className={`grid gap-4 sm:gap-6 ${columns} ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
}

export default Skeleton;
