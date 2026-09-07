import { forwardRef } from 'react';

export const Card = forwardRef(function Card(
  { children, className = '', hoverable = false, interactive = false, ...props },
  ref
) {
  const hoverStyle = hoverable
    ? 'hover:-translate-y-0.5 hover:shadow-lg hover:border-slate-700/90 light:hover:border-slate-300 transition-all duration-200'
    : '';
  const interactiveStyle = interactive ? 'cursor-pointer active:scale-[0.99]' : '';

  return (
    <div
      ref={ref}
      className={`rounded-2xl border border-slate-800/80 bg-[#0e1526]/80 text-slate-100 shadow-sm backdrop-blur light:bg-white light:border-slate-200 light:text-slate-900 light:shadow-sm ${hoverStyle} ${interactiveStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pb-3 sm:pb-4 flex flex-col gap-1.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', as: Component = 'h3', ...props }) {
  return (
    <Component
      className={`text-base sm:text-lg font-semibold tracking-tight text-white light:text-slate-900 ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardDescription({ children, className = '', ...props }) {
  return (
    <p className={`text-xs sm:text-sm text-slate-400 light:text-slate-500 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`p-5 sm:p-6 pt-2 sm:pt-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }) {
  return (
    <div
      className={`p-5 sm:p-6 pt-3 sm:pt-3 border-t border-slate-800/60 light:border-slate-100 flex items-center justify-between ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
