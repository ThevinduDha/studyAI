import { useState } from 'react';
import { UploadCloud, FileText, AlertCircle, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import documentService from '../services/document.service.js';
import { Modal } from './ui/Modal.jsx';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import { DocumentUploadDropzone } from './documents/DocumentUploadDropzone.jsx';

export default function DocumentUploadModal({
  isOpen,
  onClose,
  moduleId,
  moduleCode,
  moduleName,
  onUploadSuccess,
  onSuccess
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile, validationError) => {
    setError(validationError || null);
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a lecture PDF file to upload.');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const newDoc = await documentService.uploadDocument(moduleId, file);
      const callback = onUploadSuccess || onSuccess;
      if (callback) {
        callback(newDoc);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload and ingest document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Course Lecture Material"
      description={`Ingest academic literature into ${moduleCode || 'Course Module'}`}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-muted text-[11px]">
            {uploading ? 'Extracting text and chunking...' : 'PDF only &bull; Max 25MB'}
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="document-upload-form"
              variant="primary"
              size="sm"
              icon={uploading ? Loader2 : UploadCloud}
              disabled={!file || uploading}
              loading={uploading}
            >
              {uploading ? 'Ingesting PDF...' : 'Upload & Process'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 animate-fade-in">
        <div className="p-3 rounded-xl bg-subtle/40 border border-subtle flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {moduleCode && (
              <Badge variant="indigo" size="xs">
                {moduleCode}
              </Badge>
            )}
            <span className="font-semibold text-heading truncate max-w-xs">{moduleName}</span>
          </div>
          <span className="text-[11px] text-muted shrink-0">Academic Ingestion</span>
        </div>

        <form id="document-upload-form" onSubmit={handleSubmit} className="space-y-4">
          <DocumentUploadDropzone
            file={file}
            onFileSelect={handleFileSelect}
            disabled={uploading}
            error={error}
            maxSizeMB={25}
          />

          {/* Processing Pipeline Flow */}
          <div className="p-4 rounded-2xl card-base border border-subtle bg-subtle/20 space-y-2">
            <span className="text-[11px] uppercase font-bold tracking-wider text-muted block">
              Automated RAG Ingestion Pipeline:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-muted">
              <div className="p-2 rounded-lg card-base border border-subtle text-center">
                <span className="font-bold text-heading block">1. Extraction</span>
                <span>Clean text parsing</span>
              </div>
              <div className="p-2 rounded-lg card-base border border-subtle text-center">
                <span className="font-bold text-heading block">2. Chunking</span>
                <span>Structured sections</span>
              </div>
              <div className="p-2 rounded-lg card-base border border-subtle text-center">
                <span className="font-bold text-heading block">3. Vectors</span>
                <span>768d Embeddings</span>
              </div>
              <div className="p-2 rounded-lg card-base border border-subtle text-center">
                <span className="font-bold text-heading block">4. Study Ready</span>
                <span>RAG, Quiz &amp; Summary</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
}
