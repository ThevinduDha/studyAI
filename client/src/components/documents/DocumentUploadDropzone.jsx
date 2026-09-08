import { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, X, CheckCircle2 } from 'lucide-react';

/**
 * Format bytes to readable string (e.g. 1.4 MB, 512 KB)
 */
const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return 'Unknown size';
  const k = 1024;
  if (bytes < k) return `${bytes} B`;
  if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
  return `${(bytes / (k * k)).toFixed(1)} MB`;
};

/**
 * DocumentUploadDropzone
 * Modernized drag-and-drop zone for academic PDF ingestion.
 */
export function DocumentUploadDropzone({
  file,
  onFileSelect,
  disabled = false,
  error = null,
  maxSizeMB = 25
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSet = (selectedFile) => {
    if (!selectedFile) return;

    if (
      selectedFile.type !== 'application/pdf' &&
      !selectedFile.name.toLowerCase().endsWith('.pdf')
    ) {
      if (onFileSelect) onFileSelect(null, 'Only PDF files are supported for lecture ingestion.');
      return;
    }

    if (selectedFile.size > maxSizeMB * 1024 * 1024) {
      if (onFileSelect) onFileSelect(null, `File size exceeds the ${maxSizeMB}MB maximum limit.`);
      return;
    }

    if (onFileSelect) onFileSelect(selectedFile, null);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
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
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            validateAndSet(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-7 text-center transition flex flex-col items-center justify-center gap-3 cursor-pointer select-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-subtle bg-subtle/20'
            : dragActive
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
            : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-subtle hover:border-indigo-500/50 bg-subtle/30 hover:bg-subtle/50'
        }`}
      >
        {file ? (
          <div className="flex items-center gap-3.5 max-w-full text-left">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
              <FileText className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-heading truncate max-w-xs" title={file.name}>
                  {file.name}
                </span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-muted mt-0.5">
                {formatFileSize(file.size)} &bull; Click or drag another file to replace
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center transition group-hover:scale-105">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-heading">
                Drag &amp; drop your lecture PDF here
              </p>
              <p className="text-[11px] text-muted mt-1">
                Or click to browse from your computer (PDF format only, up to {maxSizeMB}MB)
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

export default DocumentUploadDropzone;
