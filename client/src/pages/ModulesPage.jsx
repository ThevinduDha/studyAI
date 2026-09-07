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
  Clock,
  User,
  Calendar,
  FileText,
  Loader2,
  Info,
  X
} from 'lucide-react';

export default function ModulesPage() {
  const { user, refreshUser } = useAuth();
  const [modules, setModules] = useState([]);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'enrolled'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // module ID being enrolled/unenrolled
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpen className="h-6 w-6 text-indigo-400" />
            <span>Academic Course Modules</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Browse university syllabus modules, enroll to track coursework, and access lecture-grounded study intelligence.
          </p>
        </div>

        {/* Search bar */}
        <div className="w-full md:w-80">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code or title..."
              className="block w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          All Modules ({modules.length})
        </button>

        {user?.role === 'student' && (
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'enrolled'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <span>My Enrolled</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950/60 border border-indigo-400/40 text-indigo-300">
              {enrolledModules.length}
            </span>
          </button>
        )}
      </div>

      {/* Feedback alerts */}
      {feedback && (
        <div
          className={`mb-6 p-3 rounded-lg border text-xs flex items-center justify-between transition ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-900/60 text-emerald-300'
              : 'bg-red-950/40 border-red-900/60 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-3"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-900/60 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <span className="text-xs">Loading academic modules...</span>
        </div>
      ) : displayedModules.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0e1526]/50 p-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No modules found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'enrolled'
              ? 'You have not enrolled in any modules yet. Switch to "All Modules" tab to select and enroll in courses.'
              : search
              ? `No modules matched your search query "${search}". Try adjusting your keyword.`
              : 'No modules have been configured yet. If you are an administrator, access the Admin Panel to add course modules.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedModules.map((mod) => {
            const enrolled = isEnrolled(mod._id);
            const isActing = actionLoading === mod._id;

            return (
              <div
                key={mod._id}
                className="rounded-xl border border-slate-800/90 bg-[#0e1526]/70 hover:border-slate-700/90 transition flex flex-col justify-between p-5 shadow-sm"
              >
                <div>
                  {/* Top Bar: Code & Enrolled status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {mod.moduleCode}
                    </span>

                    {enrolled && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        Enrolled
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-sm font-semibold text-white leading-snug mb-2 line-clamp-2">
                    {mod.moduleName}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {mod.description || 'No detailed syllabus overview provided.'}
                  </p>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-5 pt-3 border-t border-slate-800/60">
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
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80">
                  <button
                    onClick={() => handleOpenDetails(mod)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 text-xs font-medium transition cursor-pointer"
                  >
                    View Details &amp; Documents
                  </button>

                  {user?.role === 'student' && (
                    <>
                      {enrolled ? (
                        <button
                          onClick={() => handleUnenroll(mod._id)}
                          disabled={isActing}
                          className="py-1.5 px-3 rounded-lg bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-900/60 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          title="Unenroll from module"
                        >
                          {isActing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <MinusCircle className="h-3.5 w-3.5" />
                          )}
                          <span>Unenroll</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(mod._id)}
                          disabled={isActing}
                          className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-600/20"
                        >
                          {isActing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <PlusCircle className="h-3.5 w-3.5" />
                          )}
                          <span>Enroll</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Module Details & Documents Modal */}
      {selectedModule && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[90vh] rounded-xl border border-slate-800 bg-[#0e1526] p-6 shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedModule(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {selectedModule.moduleCode}
              </span>
              <span className="text-xs text-slate-400">
                {selectedModule.semester} &bull; {selectedModule.year}
              </span>
            </div>

            <h2 className="text-lg font-bold text-white mb-3">{selectedModule.moduleName}</h2>

            <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs text-slate-300">
              <div>
                <h4 className="text-slate-400 font-semibold mb-1">Description / Syllabus</h4>
                <p className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {selectedModule.description || 'No detailed syllabus description provided yet.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Lecturer / Faculty</div>
                  <div className="font-medium text-white mt-0.5">{selectedModule.lecturer || 'Not assigned'}</div>
                </div>

                <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[11px]">Enrollment Status</div>
                  <div className="font-medium text-white mt-0.5">
                    {isEnrolled(selectedModule._id) ? (
                      <span className="text-emerald-400">Enrolled (Active)</span>
                    ) : (
                      <span className="text-slate-400">Not Enrolled</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Documents Section */}
              <div className="pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold text-white mb-2 flex items-center gap-1.5">
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
                  <div className="p-4 rounded-lg border border-slate-800 bg-slate-900/40 text-center">
                    <p className="text-xs text-slate-400">
                      Enroll in this module to access and study its ingested lecture slides and literature.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800 mt-4">
              <button
                onClick={() => setSelectedModule(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

