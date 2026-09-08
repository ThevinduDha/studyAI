import { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  BookOpen,
  RotateCw
} from 'lucide-react';
import documentService from '../services/document.service.js';
import moduleService from '../services/module.service.js';
import { Modal } from './ui/Modal.jsx';
import { Button } from './ui/Button.jsx';
import { Badge } from './ui/Badge.jsx';
import { Select } from './ui/Select.jsx';
import { DocumentUploadDropzone } from './documents/DocumentUploadDropzone.jsx';

export default function DocumentUploadModal({
  isOpen,
  onClose,
  moduleId: initialModuleId,
  moduleCode: initialModuleCode,
  moduleName: initialModuleName,
  onUploadSuccess,
  onSuccess
}) {
  const [modules, setModules] = useState([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(initialModuleId || '');
  const [file, setFile] = useState(null);
  const [uploadState, setUploadState] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'ready' | 'failed'
  const [processedDoc, setProcessedDoc] = useState(null);
  const [error, setError] = useState(null);

  const pollIntervalRef = useRef(null);

  // Sync initial module if prop changes
  useEffect(() => {
    if (initialModuleId) {
      setSelectedModuleId(initialModuleId);
    }
  }, [initialModuleId]);

  // Load modules if not pre-specified
  useEffect(() => {
    if (isOpen && !initialModuleId) {
      setLoadingModules(true);
      moduleService
        .getAllModules()
        .then((mods) => {
          const list = mods || [];
          setModules(list);
          if (list.length > 0 && !selectedModuleId) {
            setSelectedModuleId(list[0]._id);
          }
        })
        .catch((err) => console.warn('Failed to load modules for upload:', err))
        .finally(() => setLoadingModules(false));
    }
  }, [isOpen, initialModuleId]);

  // Cleanup polling on unmount or close
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleReset = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setFile(null);
    setUploadState('idle');
    setProcessedDoc(null);
    setError(null);
  };

  const handleClose = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    handleReset();
    onClose();
  };

  const handleFileSelect = (selectedFile, validationError) => {
    setError(validationError || null);
    setFile(selectedFile);
  };

  const pollDocumentStatus = (docId) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    let attempts = 0;
    const maxAttempts = 30; // 30 * 2s = 60s max polling

    pollIntervalRef.current = setInterval(async () => {
      attempts += 1;
      try {
        const doc = await documentService.getDocument(docId);
        if (doc) {
          setProcessedDoc(doc);
          if (doc.status === 'ready') {
            clearInterval(pollIntervalRef.current);
            setUploadState('ready');
            const callback = onUploadSuccess || onSuccess;
            callback?.(doc);
          } else if (doc.status === 'failed') {
            clearInterval(pollIntervalRef.current);
            setUploadState('failed');
            setError(doc.processingError || 'Document extraction or embedding failed');
          }
        }
      } catch (err) {
        console.warn('Poll error:', err);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollIntervalRef.current);
        if (uploadState === 'processing') {
          // Leave it in ready or done state so user is not stuck
          setUploadState('ready');
        }
      }
    }, 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) {
      setError('Please select a course module.');
      return;
    }
    if (!file) {
      setError('Please select a lecture PDF file to upload.');
      return;
    }

    setUploadState('uploading');
    setError(null);

    try {
      const newDoc = await documentService.uploadDocument(selectedModuleId, file);
      setProcessedDoc(newDoc);
      setUploadState('processing');

      // If document is already ready (rare), finish immediately
      if (newDoc.status === 'ready') {
        setUploadState('ready');
        const callback = onUploadSuccess || onSuccess;
        callback?.(newDoc);
      } else {
        // Poll for background text extraction & embedding
        pollDocumentStatus(newDoc._id);
      }
    } catch (err) {
      setUploadState('failed');
      setError(err.message || 'Failed to upload and ingest document');
    }
  };

  const currentModule = modules.find((m) => m._id === selectedModuleId);
  const displayCode = initialModuleCode || currentModule?.moduleCode;
  const displayName = initialModuleName || currentModule?.moduleName;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Course Lecture Material"
      description={`Upload and ingest lecture notes or slides into ${displayCode || 'your course'}`}
      maxWidth="max-w-lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-muted text-[11px]">
            {uploadState === 'uploading'
              ? 'Uploading PDF to server...'
              : uploadState === 'processing'
              ? 'Extracting text & generating embeddings...'
              : uploadState === 'ready'
              ? 'Lecture successfully ingested'
              : 'PDF only &bull; Max 25MB'}
          </span>

          <div className="flex items-center gap-2">
            {uploadState === 'ready' ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleClose}
              >
                Done
              </Button>
            ) : uploadState === 'failed' ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  Try Again
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                >
                  Close
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClose}
                  disabled={uploadState === 'uploading'}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="document-upload-form"
                  variant="primary"
                  size="sm"
                  icon={uploadState !== 'idle' ? Loader2 : UploadCloud}
                  disabled={!file || !selectedModuleId || uploadState !== 'idle'}
                  loading={uploadState === 'uploading' || uploadState === 'processing'}
                >
                  {uploadState === 'uploading'
                    ? 'Uploading...'
                    : uploadState === 'processing'
                    ? 'Processing...'
                    : 'Upload & Process'}
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 animate-fade-in">
        {/* Course Selector or Pre-selected Pill */}
        {initialModuleId ? (
          <div className="p-3 rounded-xl bg-subtle/40 border border-subtle flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              {displayCode && (
                <Badge variant="indigo" size="xs">
                  {displayCode}
                </Badge>
              )}
              <span className="font-semibold text-heading truncate max-w-xs">{displayName}</span>
            </div>
            <span className="text-[11px] text-muted shrink-0">Academic Ingestion</span>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-medium text-heading mb-1.5">
              Select Target Course Module *
            </label>
            <Select
              id="upload-module-select"
              value={selectedModuleId}
              onChange={(e) => setSelectedModuleId(e.target.value)}
              disabled={uploadState !== 'idle' || loadingModules}
              icon={BookOpen}
            >
              {modules.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.moduleCode} &bull; {m.moduleName}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Live Status Views */}
        {uploadState === 'ready' ? (
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center space-y-3 animate-fade-in">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-heading text-sm">Lecture Ready to Study!</h4>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                Text extraction and dense vector embeddings were successfully completed for{' '}
                <span className="text-heading font-medium">{file?.name || 'this document'}</span>. Students can now ask AI questions and generate practice questions.
              </p>
            </div>
            {processedDoc?.chunkCount !== undefined && (
              <Badge variant="emerald" size="sm">
                {processedDoc.chunkCount} structured chunks indexed
              </Badge>
            )}
          </div>
        ) : uploadState === 'processing' ? (
          <div className="p-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-center space-y-3 animate-fade-in">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
            <div>
              <h4 className="font-bold text-heading text-sm">Processing Lecture Material...</h4>
              <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                Extracting clean text, generating structured sections, and computing 768-dimensional embeddings.
              </p>
            </div>
            <span className="text-[11px] text-indigo-400 block font-medium">
              Document uploaded &bull; Indexing in progress...
            </span>
          </div>
        ) : (
          <form id="document-upload-form" onSubmit={handleSubmit} className="space-y-4">
            <DocumentUploadDropzone
              file={file}
              onFileSelect={handleFileSelect}
              disabled={uploadState !== 'idle'}
              error={error}
              maxSizeMB={25}
            />

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Ingestion Steps Note */}
            <div className="p-3.5 rounded-2xl card-base border border-subtle bg-subtle/20 space-y-1.5 text-xs text-muted">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Automatic Document Processing:
              </span>
              <p className="text-[11px] leading-relaxed">
                Uploaded lectures are automatically processed through text extraction, chunking, and semantic vector indexing to power the AI Study Tutor and Exam Question Generator.
              </p>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
