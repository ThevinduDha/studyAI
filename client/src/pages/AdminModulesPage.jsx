import { useState, useEffect, useCallback } from 'react';
import moduleService from '../services/module.service.js';
import documentService from '../services/document.service.js';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';
import DocumentList from '../components/DocumentList.jsx';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  X,
  BookOpen,
  UploadCloud
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { SkeletonGrid } from '../components/ui/Skeleton.jsx';

export default function AdminModulesPage() {
  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [deletingModule, setDeletingModule] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Document Management Modal states
  const [activeDocModule, setActiveDocModule] = useState(null);
  const [moduleDocs, setModuleDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Form fields
  const [formData, setFormData] = useState({
    moduleCode: '',
    moduleName: '',
    description: '',
    lecturer: '',
    semester: 'Semester 1',
    year: new Date().getFullYear()
  });

  const fetchModules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await moduleService.getAllModules(search);
      setModules(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load module catalog');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  const openCreateModal = () => {
    setFormData({
      moduleCode: '',
      moduleName: '',
      description: '',
      lecturer: '',
      semester: 'Semester 1',
      year: new Date().getFullYear()
    });
    setIsCreateOpen(true);
  };

  const openEditModal = (mod) => {
    setEditingModule(mod);
    setFormData({
      moduleCode: mod.moduleCode,
      moduleName: mod.moduleName,
      description: mod.description || '',
      lecturer: mod.lecturer || '',
      semester: mod.semester || 'Semester 1',
      year: mod.year || new Date().getFullYear()
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      await moduleService.createModule(formData);
      setFeedback({ type: 'success', message: `Module '${formData.moduleCode}' created successfully!` });
      setIsCreateOpen(false);
      fetchModules();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create module' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingModule) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await moduleService.updateModule(editingModule._id, formData);
      setFeedback({ type: 'success', message: `Module '${formData.moduleCode}' updated successfully!` });
      setEditingModule(null);
      fetchModules();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update module' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingModule) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      await moduleService.deleteModule(deletingModule._id);
      setFeedback({ type: 'success', message: `Module '${deletingModule.moduleCode}' removed from catalog.` });
      setDeletingModule(null);
      fetchModules();
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to delete module' });
    } finally {
      setSubmitting(false);
    }
  };

  const openDocManager = async (mod) => {
    setActiveDocModule(mod);
    setLoadingDocs(true);
    try {
      const docs = await documentService.getDocuments(mod._id);
      setModuleDocs(docs || []);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load module documents' });
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleRefreshActiveDocs = async () => {
    if (!activeDocModule) return;
    setLoadingDocs(true);
    try {
      const docs = await documentService.getDocuments(activeDocModule._id);
      setModuleDocs(docs || []);
    } catch (err) {
      console.warn('Failed to refresh documents:', err.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDocUploaded = (newDoc) => {
    setModuleDocs((prev) => [newDoc, ...prev]);
    setFeedback({ type: 'success', message: `Document "${newDoc.originalName}" uploaded successfully!` });
    fetchModules();
  };

  const handleDocDeleted = (deletedId) => {
    setModuleDocs((prev) => prev.filter((d) => d._id !== deletedId));
    setFeedback({ type: 'success', message: 'Document deleted successfully.' });
    fetchModules();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        badge="Administrative Authority"
        badgeVariant="purple"
        title="Module Management"
        icon={Shield}
        subtitle="Publish, update, and manage official academic modules across university faculties."
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={openCreateModal}
          >
            Create New Module
          </Button>
        }
      />

      {/* Search and count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-muted">
          Showing <span className="text-heading font-medium">{modules.length}</span> course modules
        </div>

        <div className="w-full sm:w-72">
          <Input
            id="module-search"
            icon={Search}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or module..."
          />
        </div>
      </div>

      {/* Feedback alerts */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-500'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="hover:opacity-80 cursor-pointer ml-3"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Module Table */}
      {loading ? (
        <SkeletonGrid count={6} />
      ) : modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No modules found"
          description="Get started by creating your first course module for students to enroll."
          actionLabel="Create Module"
          onAction={openCreateModal}
        />
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-body">
              <thead className="bg-subtle border-b border-subtle text-muted uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Module Name</th>
                  <th className="px-5 py-3.5">Lecturer</th>
                  <th className="px-5 py-3.5">Term</th>
                  <th className="px-5 py-3.5">RAG Documents</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {modules.map((mod) => (
                  <tr key={mod._id} className="hover:bg-subtle transition">
                    <td className="px-5 py-4 font-mono font-medium text-indigo-500">
                      {mod.moduleCode}
                    </td>
                    <td className="px-5 py-4 text-heading font-medium max-w-xs truncate">
                      {mod.moduleName}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      {mod.lecturer || <span className="text-muted italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 text-muted whitespace-nowrap">
                      {mod.semester} {mod.year}
                    </td>
                    <td className="px-5 py-4 text-muted">
                      <Badge variant="default" size="xs">
                        <FileText className="h-3 w-3 mr-1 inline" />
                        {mod.documents?.length || 0}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={FileText}
                          onClick={() => openDocManager(mod)}
                          title="Manage course documents"
                        >
                          Docs
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Edit2}
                          onClick={() => openEditModal(mod)}
                          title="Edit module"
                        />
                        <Button
                          variant="dangerOutline"
                          size="xs"
                          icon={Trash2}
                          onClick={() => setDeletingModule(mod)}
                          title="Delete module"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={Boolean(isCreateOpen || editingModule)}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingModule(null);
        }}
        title={isCreateOpen ? 'Create New Course Module' : `Edit Module (${editingModule?.moduleCode})`}
        maxWidth="max-w-lg"
      >
        <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                id="form-code"
                label="Module Code *"
                required
                value={formData.moduleCode}
                onChange={(e) => setFormData({ ...formData, moduleCode: e.target.value })}
                placeholder="e.g. CS2040"
                className="uppercase font-mono"
              />
            </div>

            <div>
              <Input
                id="form-lecturer"
                label="Lecturer Name"
                value={formData.lecturer}
                onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                placeholder="e.g. Dr. Alan Turing"
              />
            </div>
          </div>

          <div>
            <Input
              id="form-name"
              label="Module Name / Title *"
              required
              value={formData.moduleName}
              onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
              placeholder="e.g. Data Structures and Algorithms"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                id="form-semester"
                label="Semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Summer Term">Summer Term</option>
                <option value="Special Term">Special Term</option>
              </Select>
            </div>

            <div>
              <Input
                id="form-year"
                label="Academic Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Description / Syllabus Overview</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief synopsis of key topics, textbook references, and learning objectives..."
              className="w-full p-3 rounded-xl input-base text-xs resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-subtle">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingModule(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
            >
              {isCreateOpen ? 'Create Module' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Document Management Modal for Module */}
      {activeDocModule && (
        <Modal
          isOpen={Boolean(activeDocModule)}
          onClose={() => setActiveDocModule(null)}
          title={`Course Documents: ${activeDocModule.moduleCode}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-subtle">
              <span className="text-xs text-muted truncate">{activeDocModule.moduleName}</span>
              <Button
                variant="primary"
                size="xs"
                icon={UploadCloud}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload PDF
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              <DocumentList
                documents={moduleDocs}
                loading={loadingDocs}
                onRefresh={handleRefreshActiveDocs}
                onDelete={handleDocDeleted}
                canDelete={true}
                moduleCode={activeDocModule?.moduleCode}
                moduleName={activeDocModule?.moduleName}
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Upload PDF Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        moduleId={activeDocModule?._id}
        moduleCode={activeDocModule?.moduleCode}
        moduleName={activeDocModule?.moduleName}
        onSuccess={handleDocUploaded}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingModule)}
        onClose={() => setDeletingModule(null)}
        title="Delete Module?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
            <Trash2 className="h-5 w-5" />
          </div>

          <p className="text-xs text-body leading-relaxed">
            Are you sure you want to delete <span className="font-mono text-rose-500 font-semibold">{deletingModule?.moduleCode} — {deletingModule?.moduleName}</span>?
            This will remove the module from all enrolled student profiles.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-subtle">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingModule(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={submitting}
              onClick={handleDeleteConfirm}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
