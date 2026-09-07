import { useState, useEffect, useCallback } from 'react';
import moduleService from '../services/module.service.js';
import documentService from '../services/document.service.js';
import { useAuth } from '../context/AuthContext.jsx';
import DocumentList from '../components/DocumentList.jsx';
import {
  BookOpen,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  User,
  Calendar,
  FileText,
  X
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Input,
  PageHeader,
  EmptyState,
  SkeletonGrid,
  Modal,
  Tabs
} from '../components/ui';

export default function ModulesPage() {
  const { user, refreshUser } = useAuth();
  const [modules, setModules] = useState([]);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'enrolled'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [moduleDocs, setModuleDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const all = await moduleService.getAllModules(search);
      setModules(all || []);

      if (user?.role === 'student') {
        const enrolled = await moduleService.getEnrolledModules();
        setEnrolledModules(enrolled || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load modules');
    } finally {
      setLoading(false);
    }
  }, [search, user?.role]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const isEnrolled = (moduleId) => {
    return enrolledModules.some(
      (m) => (m._id || m).toString() === moduleId.toString()
    );
  };

  const handleEnroll = async (moduleId) => {
    setActionLoading(moduleId);
    setFeedback(null);
    try {
      const res = await moduleService.enroll(moduleId);
      setFeedback({ type: 'success', message: res.message || 'Enrolled successfully!' });
      await fetchModules();
      await refreshUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Enrollment failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (moduleId) => {
    if (!window.confirm('Are you sure you want to unenroll from this module?')) return;
    setActionLoading(moduleId);
    setFeedback(null);
    try {
      const res = await moduleService.unenroll(moduleId);
      setFeedback({ type: 'success', message: res.message || 'Unenrolled successfully!' });
      await fetchModules();
      await refreshUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unenrollment failed' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenDetails = async (mod) => {
    setSelectedModule(mod);
    setModuleDocs([]);
    const enrolled = isEnrolled(mod._id);
    if (user?.role === 'admin' || enrolled) {
      setLoadingDocs(true);
      try {
        const docs = await documentService.getDocuments(mod._id);
        setModuleDocs(docs || []);
      } catch (err) {
        console.warn('Failed to load module documents:', err.message);
      } finally {
        setLoadingDocs(false);
      }
    }
  };

  const handleRefreshDocs = async () => {
    if (!selectedModule) return;
    setLoadingDocs(true);
    try {
      const docs = await documentService.getDocuments(selectedModule._id);
      setModuleDocs(docs || []);
    } catch (err) {
      console.warn('Failed to refresh documents:', err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const displayedModules = activeTab === 'enrolled' ? enrolledModules : modules;

  const tabItems = [
    { id: 'all', label: 'All Modules', badge: modules.length }
  ];
  if (user?.role === 'student') {
    tabItems.push({ id: 'enrolled', label: 'My Enrolled', badge: enrolledModules.length });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header section */}
      <PageHeader
        title="Course Modules"
        subtitle="Browse university syllabus modules, enroll to track coursework, and access lecture-grounded study intelligence."
        icon={BookOpen}
        actions={
          <div className="w-full sm:w-80">
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or title..."
              icon={Search}
            />
          </div>
        }
      />

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={tabItems}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />
      </div>

      {/* Feedback alerts */}
      {feedback && (
        <div
          className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center justify-between transition animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300 light:bg-emerald-50 light:border-emerald-200 light:text-emerald-700'
              : 'bg-rose-950/40 border-rose-900/60 text-rose-300 light:bg-rose-50 light:border-rose-200 light:text-rose-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white light:hover:text-slate-900 cursor-pointer ml-3 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 light:bg-rose-50 light:border-rose-200 light:text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : displayedModules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No modules found"
          description={
            activeTab === 'enrolled'
              ? 'You have not enrolled in any modules yet. Switch to "All Modules" tab to select and enroll in courses.'
              : search
              ? `No modules matched your search query "${search}". Try adjusting your keyword.`
              : 'No modules have been configured yet. If you are an administrator, access the Admin Panel to add course modules.'
          }
          action={
            activeTab === 'enrolled' ? (
              <Button size="sm" onClick={() => setActiveTab('all')}>
                Browse All Modules
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedModules.map((mod) => {
            const enrolled = isEnrolled(mod._id);
            const isActing = actionLoading === mod._id;

            return (
              <Card
                key={mod._id}
                hoverable={true}
                className="flex flex-col justify-between"
              >
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant="indigo" size="sm" className="font-mono">
                        {mod.moduleCode}
                      </Badge>

                      {enrolled && (
                        <Badge variant="emerald" size="xs" icon={CheckCircle2}>
                          Enrolled
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="line-clamp-2">
                      {mod.moduleName}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {mod.description || 'No detailed syllabus overview provided.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <div className="space-y-2 text-xs text-slate-400 light:text-slate-500 pt-3 border-t border-slate-800/60 light:border-slate-100">
                      {mod.lecturer && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{mod.lecturer}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>
                          {mod.semester} &bull; {mod.year}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleOpenDetails(mod)}
                    className="flex-1"
                  >
                    View Details &amp; Documents
                  </Button>

                  {user?.role === 'student' && (
                    <>
                      {enrolled ? (
                        <Button
                          variant="dangerOutline"
                          size="sm"
                          onClick={() => handleUnenroll(mod._id)}
                          loading={isActing}
                          icon={MinusCircle}
                          title="Unenroll from module"
                        >
                          Unenroll
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleEnroll(mod._id)}
                          loading={isActing}
                          icon={PlusCircle}
                        >
                          Enroll
                        </Button>
                      )}
                    </>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Module Details & Documents Modal */}
      <Modal
        isOpen={Boolean(selectedModule)}
        onClose={() => setSelectedModule(null)}
        title={selectedModule?.moduleName}
        description={`${selectedModule?.moduleCode} • ${selectedModule?.semester} ${selectedModule?.year}`}
        maxWidth="2xl"
        footer={
          <Button variant="secondary" size="sm" onClick={() => setSelectedModule(null)}>
            Close
          </Button>
        }
      >
        {selectedModule && (
          <div className="space-y-4 text-xs text-slate-300 light:text-slate-700">
            <div>
              <h4 className="text-slate-400 light:text-slate-600 font-semibold mb-1.5">
                Description / Syllabus
              </h4>
              <p className="bg-slate-900/60 light:bg-slate-50 p-3.5 rounded-xl border border-slate-800 light:border-slate-200 leading-relaxed">
                {selectedModule.description || 'No detailed syllabus description provided yet.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/60 light:bg-slate-50 p-3 rounded-xl border border-slate-800 light:border-slate-200">
                <div className="text-slate-400 light:text-slate-500 text-[11px]">Lecturer / Faculty</div>
                <div className="font-semibold text-white light:text-slate-900 mt-0.5">
                  {selectedModule.lecturer || 'Not assigned'}
                </div>
              </div>

              <div className="bg-slate-900/60 light:bg-slate-50 p-3 rounded-xl border border-slate-800 light:border-slate-200">
                <div className="text-slate-400 light:text-slate-500 text-[11px]">Enrollment Status</div>
                <div className="font-semibold mt-0.5">
                  {isEnrolled(selectedModule._id) ? (
                    <span className="text-emerald-400 light:text-emerald-600">Enrolled (Active)</span>
                  ) : (
                    <span className="text-slate-400 light:text-slate-500">Not Enrolled</span>
                  )}
                </div>
              </div>
            </div>

            {/* Course Documents Section */}
            <div className="pt-2 border-t border-slate-800/80 light:border-slate-200">
              <h4 className="text-xs font-semibold text-white light:text-slate-900 mb-2.5 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-indigo-400" />
                <span>Course Documents &amp; Ingested Slides</span>
              </h4>

              {user?.role === 'admin' || isEnrolled(selectedModule._id) ? (
                <DocumentList
                  documents={moduleDocs}
                  loading={loadingDocs}
                  onRefresh={handleRefreshDocs}
                  canDelete={user?.role === 'admin'}
                  emptyMessage="No PDF documents have been uploaded for this course module yet."
                />
              ) : (
                <div className="p-5 rounded-xl border border-slate-800 light:border-slate-200 bg-slate-900/40 light:bg-slate-50 text-center">
                  <p className="text-xs text-slate-400 light:text-slate-600">
                    Enroll in this module to access and study its ingested lecture slides and literature.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
