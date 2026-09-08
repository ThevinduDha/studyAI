import { useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Eye,
  RefreshCw,
  X,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';
import documentService from '../services/document.service.js';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import { Card } from './ui/Card.jsx';
import { Input } from './ui/Input.jsx';
import {
  DocumentCard,
  DocumentStudyModal,
  DocumentChunksModal
} from './documents/index.js';

export default function DocumentList({
  documents = [],
  loading = false,
  onRefresh,
  onDelete,
  onDeleteSuccess,
  canDelete = false,
  moduleCode = '',
  moduleName = '',
  emptyMessage = 'No documents uploaded for this course module yet.'
}) {
  const [searchFilter, setSearchFilter] = useState('');
  const [studyDoc, setStudyDoc] = useState(null);
  const [chunksDoc, setChunksDoc] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleOpenStudy = async (doc) => {
    setActionError(null);
    try {
      // If extractedText is not loaded on list summary, fetch full document
      if (!doc.extractedText && doc.status === 'processed') {
        const fullDoc = await documentService.getDocument(doc._id);
        setStudyDoc(fullDoc || doc);
      } else {
        setStudyDoc(doc);
      }
    } catch (err) {
      console.warn('Failed to load full document:', err);
      setStudyDoc(doc);
    }
  };

  const handleOpenChunks = (doc) => {
    setActionError(null);
    setChunksDoc(doc);
  };

  const handleDelete = async (docId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    setActionError(null);
    setDeletingId(docId);
    try {
      await documentService.deleteDocument(docId);
      if (onDeleteSuccess) {
        onDeleteSuccess(docId);
      } else if (onDelete) {
        onDelete(docId);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter documents by title
  const filteredDocs = documents.filter((doc) => {
    if (!searchFilter.trim()) return true;
    return doc.originalName?.toLowerCase().includes(searchFilter.toLowerCase().trim());
  });

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-500 hover:opacity-80 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar: Document count, search filter, and refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted pb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-heading">
            {documents.length} {documents.length === 1 ? 'Lecture Document' : 'Lecture Documents'}
          </span>
          {documents.length > 0 && (
            <Badge variant="default" size="xs">
              {documents.filter((d) => d.status === 'processed').length} Ready
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {documents.length > 4 && (
            <div className="w-48">
              <Input
                type="text"
                placeholder="Filter files..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                icon={Search}
                size="sm"
              />
            </div>
          )}

          {onRefresh && (
            <Button
              variant="ghost"
              size="xs"
              icon={RefreshCw}
              onClick={onRefresh}
              disabled={loading}
              title="Refresh processing status"
            >
              <span>Refresh Status</span>
            </Button>
          )}
        </div>
      </div>

      {/* List States */}
      {loading && documents.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center text-muted gap-2">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
          <span className="text-xs">Loading course materials...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-subtle p-10 text-center bg-card">
          <div className="h-12 w-12 rounded-2xl bg-subtle text-muted flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 opacity-60" />
          </div>
          <p className="text-xs font-semibold text-heading mb-1">No Lecture Documents</p>
          <p className="text-xs text-muted max-w-sm mx-auto">{emptyMessage}</p>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-2xl border border-subtle p-8 text-center bg-card text-xs text-muted">
          No documents matched your filter "{searchFilter}".
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <DocumentCard
              key={doc._id}
              document={doc}
              canManage={canDelete}
              isDeleting={deletingId === doc._id}
              onStudy={handleOpenStudy}
              onInspectChunks={handleOpenChunks}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Document Study Modal */}
      <DocumentStudyModal
        isOpen={Boolean(studyDoc)}
        onClose={() => setStudyDoc(null)}
        document={studyDoc}
        moduleCode={moduleCode || studyDoc?.module?.moduleCode}
        moduleName={moduleName || studyDoc?.module?.moduleName}
      />

      {/* Document Chunks Modal */}
      <DocumentChunksModal
        isOpen={Boolean(chunksDoc)}
        onClose={() => setChunksDoc(null)}
        document={chunksDoc}
        canManage={canDelete}
        onChunksUpdated={onRefresh}
      />
    </div>
  );
}
