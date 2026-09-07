import { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import documentService from '../services/document.service.js';
import { Modal } from './ui/Modal.jsx';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';

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
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validateAndSetFile = (selectedFile) => {
    setError(null);
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are supported for course document ingestion.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB maximum limit.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file to upload.');
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
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Academic Course PDF"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {moduleCode && (
              <Badge variant="indigo" size="xs">
                {moduleCode}
              </Badge>
            )}
            <span className="text-xs text-muted truncate">{moduleName}</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Upload syllabus readings or lecture slides. The server will extract clean text and prepare metadata for the study engine.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => validateAndSetFile(e.target.files[0])}
            className="hidden"
          />

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : file
                ? 'border-emerald-500/60 bg-emerald-500/10'
                : 'border-subtle hover:border-indigo-500/50 bg-subtle/40'
            }`}
          >
            {file ? (
              <>
                <div className="p-3 rounded-2xl bg-emerald-500/15 text-emerald-500">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-heading truncate max-w-xs">{file.name}</div>
                <div className="text-[11px] text-muted">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Click or drop another to change
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-subtle text-muted">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-xs font-medium text-heading">
                  Click to select or drag &amp; drop PDF
                </div>
                <div className="text-[11px] text-muted">
                  PDF format only &bull; Up to 25MB
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
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
              variant="primary"
              size="sm"
              icon={UploadCloud}
              disabled={!file || uploading}
              loading={uploading}
            >
              {uploading ? 'Uploading PDF...' : 'Upload & Ingest'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
