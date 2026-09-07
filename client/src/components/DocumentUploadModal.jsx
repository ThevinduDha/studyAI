import { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, Loader2, X } from 'lucide-react';
import documentService from '../services/document.service.js';

export default function DocumentUploadModal({
  isOpen,
  onClose,
  moduleId,
  moduleCode,
  moduleName,
  onUploadSuccess
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

    // 25MB max
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
      if (onUploadSuccess) {
        onUploadSuccess(newDoc);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-xl border border-slate-800 bg-[#0e1526] p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={uploading}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 cursor-pointer disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {moduleCode}
            </span>
            <span className="text-xs text-slate-400 truncate">{moduleName}</span>
          </div>
          <h2 className="text-base font-bold text-white">Upload Academic Course PDF</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Upload syllabus readings or lecture slides. The server will extract clean text and prepare metadata for the study engine.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
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
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : file
                ? 'border-emerald-500/60 bg-emerald-950/20'
                : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
            }`}
          >
            {file ? (
              <>
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div className="text-xs font-semibold text-white truncate max-w-xs">{file.name}</div>
                <div className="text-[11px] text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Click or drop another to change
                </div>
              </>
            ) : (
              <>
                <div className="p-3 rounded-full bg-slate-800 text-slate-400">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <div className="text-xs font-medium text-slate-200">
                  Click to select or drag &amp; drop PDF
                </div>
                <div className="text-[11px] text-slate-500">
                  PDF format only &bull; Up to 25MB
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-600/30"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading PDF...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>Upload &amp; Ingest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
