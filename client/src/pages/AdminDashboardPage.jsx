import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  UploadCloud,
  FileText,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import moduleService from '../services/module.service.js';
import documentService from '../services/document.service.js';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Skeleton, SkeletonGrid, SkeletonCard } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const [modules, setModules] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchAdminData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [modulesData, docsData] = await Promise.all([
        moduleService.getAllModules(),
        documentService.getDocuments()
      ]);

      setModules(Array.isArray(modulesData) ? modulesData : []);
      setDocuments(Array.isArray(docsData) ? docsData : []);
    } catch (err) {
      console.error('Failed to load admin content data:', err);
      setError(err.message || 'Failed to load course and document catalog.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Derived metrics
  const totalCourses = modules.length;
  const totalDocs = documents.length;
  const readyDocs = documents.filter((d) => d.status === 'processed' || d.status === 'ready').length;
  const pendingDocs = documents.filter((d) => d.status === 'processing' || d.status === 'uploaded').length;
  const failedDocs = documents.filter((d) => d.status === 'failed').length;

  // Format file size helper
  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return 'Unknown size';
    const k = 1024;
    if (bytes < k) return `${bytes} B`;
    if (bytes < k * k) return `${(bytes / k).toFixed(1)} KB`;
    return `${(bytes / (k * k)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        <Skeleton height="h-28" className="w-full rounded-2xl" />
        <SkeletonGrid count={4} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-40" />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <PageHeader
        badge="Academic Content Administration"
        badgeVariant="purple"
        title="Manage StudyAI's Learning Content"
        icon={Shield}
        subtitle="Publish course modules, upload and process lecture PDFs, and ensure AI study materials are ready for students."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={() => fetchAdminData(true)}
              loading={refreshing}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={UploadCloud}
              onClick={() => setIsUploadOpen(true)}
            >
              Upload Lecture PDF
            </Button>
          </div>
        }
      />

      {/* Error notification if any */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="xs" onClick={() => fetchAdminData(false)}>
            Retry
          </Button>
        </div>
      )}

      {/* Primary Action Hub (3 Clear Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action 1: Create Course */}
        <Card
          hoverable={true}
          className="p-6 border border-subtle hover:border-indigo-500/40 transition cursor-pointer group flex flex-col justify-between"
          onClick={() => navigate('/admin/modules')}
        >
          <div className="space-y-3">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-heading group-hover:text-indigo-400 transition">
                Manage Courses
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Create new academic courses, assign lecturers, and update syllabus details.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-subtle flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition">
            <span>Open Course Manager</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </div>
        </Card>

        {/* Action 2: Upload Lecture PDF */}
        <Card
          hoverable={true}
          className="p-6 border border-subtle hover:border-purple-500/40 transition cursor-pointer group flex flex-col justify-between"
          onClick={() => setIsUploadOpen(true)}
        >
          <div className="space-y-3">
            <div className="h-11 w-11 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-heading group-hover:text-purple-400 transition">
                Upload Lecture PDF
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Upload new lecture slides or notes. System automatically extracts text, chunks, and generates vector embeddings.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-subtle flex items-center text-xs font-semibold text-purple-400 group-hover:translate-x-1 transition">
            <span>Upload Document</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </div>
        </Card>

        {/* Action 3: Manage Documents */}
        <Card
          hoverable={true}
          className="p-6 border border-subtle hover:border-emerald-500/40 transition cursor-pointer group flex flex-col justify-between"
          onClick={() => navigate('/admin/documents')}
        >
          <div className="space-y-3">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-heading group-hover:text-emerald-400 transition">
                Manage Documents
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                Inspect vector chunking, monitor real processing health, re-embed materials, and remove outdated files.
              </p>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-subtle flex items-center text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition">
            <span>View All Documents</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </div>
        </Card>
      </div>

      {/* Content Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5 border border-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Academic Courses</span>
            <BookOpen className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading">{totalCourses}</span>
            <span className="text-xs text-muted">active</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Documents</span>
            <FileText className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-heading">{totalDocs}</span>
            <span className="text-xs text-muted">uploaded</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Ready for Students</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{readyDocs}</span>
            <span className="text-xs text-muted">processed</span>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 border border-subtle">
          <div className="flex items-center justify-between text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Attention Required</span>
            {failedDocs > 0 ? (
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            ) : (
              <Clock className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold ${failedDocs > 0 ? 'text-rose-400' : 'text-heading'}`}>
              {failedDocs + pendingDocs}
            </span>
            <span className="text-xs text-muted">
              {failedDocs > 0 ? `${failedDocs} failed` : 'processing'}
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Learning Materials Table / List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-heading">
              Recent Academic Documents
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Latest lecture slides and course documents ingested into the vector pipeline.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/documents')}
            className="text-indigo-400 hover:text-indigo-300"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1 inline" />
          </Button>
        </div>

        {documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Documents Uploaded Yet"
            description="Upload your first lecture PDF to make course materials searchable and available for student AI study."
            actionLabel="Upload Lecture PDF"
            onAction={() => setIsUploadOpen(true)}
          />
        ) : (
          <Card className="overflow-hidden border border-subtle">
            <div className="divide-y divide-subtle">
              {documents.slice(0, 5).map((doc) => {
                const isReady = doc.status === 'processed' || doc.status === 'ready';
                const isFailed = doc.status === 'failed';
                const isProcessing = doc.status === 'processing' || doc.status === 'uploaded';

                return (
                  <div
                    key={doc._id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-subtle/40 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-heading truncate">
                          {doc.originalName}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-muted mt-1 flex-wrap">
                          {doc.module?.moduleCode && (
                            <Badge variant="indigo" size="xs">
                              {doc.module.moduleCode}
                            </Badge>
                          )}
                          <span>{formatFileSize(doc.fileSize)}</span>
                          {doc.pageCount > 0 && <span>&bull; {doc.pageCount} pages</span>}
                          {doc.chunkCount !== undefined && (
                            <span className="text-indigo-400 font-medium">
                              &bull; {doc.chunkCount} chunks
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center self-end">
                      {isReady && (
                        <Badge variant="emerald" size="xs">
                          <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                          Ready
                        </Badge>
                      )}
                      {isProcessing && (
                        <Badge variant="amber" size="xs">
                          <Clock className="h-3 w-3 mr-1 inline animate-spin" />
                          Processing
                        </Badge>
                      )}
                      {isFailed && (
                        <Badge variant="rose" size="xs">
                          <AlertTriangle className="h-3 w-3 mr-1 inline" />
                          Failed
                        </Badge>
                      )}

                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => navigate('/admin/documents')}
                      >
                        Manage
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {/* Upload Lecture PDF Modal */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchAdminData();
        }}
      />
    </div>
  );
}
