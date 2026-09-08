import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  Sparkles,
  Bot,
  HelpCircle,
  Award,
  Layers
} from 'lucide-react';
import {
  Button,
  Badge,
  Input,
  PageHeader,
  EmptyState,
  SkeletonGrid,
  Modal,
  Tabs,
  Card
} from '../components/ui';
import { ModuleCard } from '../components/documents/ModuleCard.jsx';

export default function ModulesPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [modules, setModules] = useState([]);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'enrolled'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Selected module for reading documents & lecture materials
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
      setError(err.message || 'Failed to load course library.');
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
      setFeedback({ type: 'success', message: res.message || 'Enrolled in course successfully!' });
      await fetchModules();
      await refreshUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Enrollment failed.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (moduleId) => {
    if (!window.confirm('Are you sure you want to unenroll from this course module?')) return;
    setActionLoading(moduleId);
    setFeedback(null);
    try {
      const res = await moduleService.unenroll(moduleId);
      setFeedback({ type: 'success', message: res.message || 'Unenrolled from course.' });
      await fetchModules();
      await refreshUser();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Unenrollment failed.' });
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
        console.warn('Failed to load course documents:', err.message);
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
    { id: 'all', label: 'All Courses', badge: modules.length }
  ];
  if (user?.role === 'student') {
    tabItems.push({ id: 'enrolled', label: 'My Enrolled Courses', badge: enrolledModules.length });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header section */}
      <PageHeader
        title="Your Courses"
        subtitle="Access lectures, summaries, questions, and practice materials from your enrolled modules."
        icon={BookOpen}
        badge="Course Library"
        badgeVariant="indigo"
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
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-subtle pb-4">
        <Tabs
          tabs={tabItems}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
        />

        <div className="text-xs text-muted">
          Showing <span className="text-heading font-bold">{displayedModules.length}</span> course{displayedModules.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Feedback alerts */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
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
            className="text-muted hover:text-heading cursor-pointer ml-3 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Course Cards Grid */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : displayedModules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={
            activeTab === 'enrolled'
              ? 'You have not enrolled in any courses yet. Switch to the "All Courses" tab to select and enroll in university modules.'
              : search
              ? `No course modules matched your search query "${search}". Try checking for typos or broader keywords.`
              : 'No courses have been configured yet. If you are an administrator, access the Admin Panel to publish modules.'
          }
          actionLabel={activeTab === 'enrolled' ? 'Browse All Courses' : undefined}
          onAction={activeTab === 'enrolled' ? () => setActiveTab('all') : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedModules.map((mod) => (
            <ModuleCard
              key={mod._id}
              module={mod}
              isEnrolled={isEnrolled(mod._id)}
              isStudent={user?.role === 'student'}
              isActing={actionLoading === mod._id}
              onOpenDetails={handleOpenDetails}
              onEnroll={handleEnroll}
              onUnenroll={handleUnenroll}
            />
          ))}
        </div>
      )}

      {/* Module Details & Lecture Materials Modal */}
      <Modal
        isOpen={Boolean(selectedModule)}
        onClose={() => setSelectedModule(null)}
        title={selectedModule?.moduleName}
        description={`${selectedModule?.moduleCode} • ${selectedModule?.semester} ${selectedModule?.year}`}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full text-xs">
            <span className="text-muted text-[11px]">
              {user?.role === 'admin' || isEnrolled(selectedModule?._id)
                ? 'Full access granted to course documents and learning tools'
                : 'Enroll in this course to unlock lecture materials and study AI'}
            </span>
            <Button variant="secondary" size="sm" onClick={() => setSelectedModule(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedModule && (
          <div className="space-y-6 text-xs text-body animate-fade-in">
            {/* Syllabus & Course Overview */}
            <div className="p-4 rounded-2xl card-base border border-subtle space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge variant="indigo" size="sm" className="font-mono font-bold">
                    {selectedModule.moduleCode}
                  </Badge>
                  <span className="text-xs font-semibold text-heading truncate">
                    {selectedModule.moduleName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isEnrolled(selectedModule._id) ? (
                    <Badge variant="emerald" size="xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                      Enrolled (Active)
                    </Badge>
                  ) : (
                    <Badge variant="default" size="xs">
                      Not Enrolled
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted leading-relaxed">
                {selectedModule.description || 'No detailed syllabus overview provided for this course yet.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-subtle text-[11px]">
                <div>
                  <span className="text-muted block">Faculty / Lecturer</span>
                  <span className="font-semibold text-heading mt-0.5 block truncate">
                    {selectedModule.lecturer || 'Not assigned'}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Term / Year</span>
                  <span className="font-semibold text-heading mt-0.5 block">
                    {selectedModule.semester} &bull; {selectedModule.year}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">Lecture Materials</span>
                  <span className="font-semibold text-heading mt-0.5 block">
                    {moduleDocs.length} {moduleDocs.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Course Study Actions Bar */}
            {(user?.role === 'admin' || isEnrolled(selectedModule._id)) && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-2.5">
                <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-400 block">
                  Course Learning Tools:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Sparkles}
                    onClick={() => navigate(`/summaries?module=${selectedModule._id}`)}
                    className="justify-center"
                    title="Summarize lectures in this module"
                  >
                    Summaries
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Bot}
                    onClick={() => navigate(`/assistant?module=${selectedModule._id}`)}
                    className="justify-center"
                    title="Ask AI assistant about this course"
                  >
                    Ask AI
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={HelpCircle}
                    onClick={() => navigate(`/questions?module=${selectedModule._id}`)}
                    className="justify-center"
                    title="Practice exam questions for this course"
                  >
                    Questions
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Award}
                    onClick={() => navigate(`/quizzes?module=${selectedModule._id}`)}
                    className="justify-center"
                    title="Take a practice quiz for this course"
                  >
                    Take Quiz
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={Search}
                    onClick={() => navigate(`/search?module=${selectedModule._id}`)}
                    className="justify-center"
                    title="Search knowledge base for this course"
                  >
                    Search
                  </Button>
                </div>
              </div>
            )}

            {/* Ingested Lecture Documents List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-subtle">
                <h4 className="text-xs font-bold text-heading uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>Lecture Materials &amp; Ingested Literature</span>
                </h4>
              </div>

              {user?.role === 'admin' || isEnrolled(selectedModule._id) ? (
                <DocumentList
                  documents={moduleDocs}
                  loading={loadingDocs}
                  onRefresh={handleRefreshDocs}
                  moduleCode={selectedModule.moduleCode}
                  moduleName={selectedModule.moduleName}
                  canDelete={user?.role === 'admin'}
                  emptyMessage="No PDF documents have been uploaded for this course module yet."
                />
              ) : (
                <div className="p-8 rounded-2xl border border-subtle card-base text-center space-y-3">
                  <BookOpen className="h-8 w-8 text-muted mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-heading">Course Enrollment Required</p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    Enroll in {selectedModule.moduleCode} to unlock access to its lecture materials, structured notes, AI study assistant, and exam questions.
                  </p>
                  {user?.role === 'student' && (
                    <Button
                      variant="primary"
                      size="sm"
                      icon={PlusCircle}
                      onClick={() => handleEnroll(selectedModule._id)}
                      loading={actionLoading === selectedModule._id}
                    >
                      Enroll Now
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
