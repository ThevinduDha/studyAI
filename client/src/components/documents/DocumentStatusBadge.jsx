import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge.jsx';

/**
 * DocumentStatusBadge
 * Displays semantic status of document ingestion & processing.
 */
export function DocumentStatusBadge({ status, errorMsg, size = 'xs', className = '' }) {
  switch (status) {
    case 'processed':
      return (
        <Badge variant="emerald" size={size} className={className}>
          <CheckCircle2 className="h-3 w-3 mr-1 inline shrink-0" />
          <span>Ready to Study</span>
        </Badge>
      );
    case 'processing':
      return (
        <Badge variant="amber" size={size} className={className}>
          <Loader2 className="h-3 w-3 animate-spin mr-1 inline shrink-0" />
          <span>Extracting text...</span>
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          variant="rose"
          size={size}
          className={className}
          title={errorMsg || 'Text extraction and processing failed'}
        >
          <AlertCircle className="h-3 w-3 mr-1 inline shrink-0" />
          <span>Processing Failed</span>
        </Badge>
      );
    case 'uploaded':
    default:
      return (
        <Badge variant="cyan" size={size} className={className}>
          <Clock className="h-3 w-3 mr-1 inline shrink-0" />
          <span>Uploaded</span>
        </Badge>
      );
  }
}

export default DocumentStatusBadge;
