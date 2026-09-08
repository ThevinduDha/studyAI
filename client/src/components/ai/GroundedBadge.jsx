import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

/**
 * GroundedBadge
 *
 * Truthful visual indicator confirming AI answers or summaries
 * are strictly grounded in uploaded lecture materials.
 */
export function GroundedBadge({
  count = null,
  size = 'xs',
  variant = 'emerald',
  className = '',
  label = null
}) {
  const defaultLabel = count !== null && count !== undefined
    ? `Grounded in ${count} ${count === 1 ? 'lecture chunk' : 'lecture chunks'}`
    : 'Grounded in Lecture Material';

  return (
    <Badge
      variant={variant}
      size={size}
      className={`inline-flex items-center gap-1 font-medium tracking-wide ${className}`}
      title="Verified grounded against course documents via vector retrieval"
    >
      <ShieldCheck className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      <span>{label || defaultLabel}</span>
    </Badge>
  );
}

export default GroundedBadge;
