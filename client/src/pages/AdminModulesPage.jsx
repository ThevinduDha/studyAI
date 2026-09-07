import { useState, useEffect, useCallback } from 'react';
import moduleService from '../services/module.service.js';
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
  BookOpen
} from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium mb-2">
            <Shield className="h-3 w-3" />
            Administrative Authority
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Module Management</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Publish, update, and manage official academic modules across university faculties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm shadow-indigo-600/30 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Module</span>
          </button>
        </div>
      </div>

      {/* Search and count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-medium">{modules.length}</span> course modules
        </div>

        <div className="w-full sm:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or module..."
            className="block w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
          />
        </div>
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

      {/* Module Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500 mb-3" />
          <span className="text-xs">Querying module registry...</span>
        </div>
      ) : modules.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-[#0e1526]/50 p-12 text-center">
          <BookOpen className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No modules found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Get started by creating your first course module for students to enroll.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Module
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0e1526]/60 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Module Name</th>
                  <th className="px-5 py-3.5">Lecturer</th>
                  <th className="px-5 py-3.5">Term</th>
                  <th className="px-5 py-3.5">RAG Documents</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {modules.map((mod) => (
                  <tr key={mod._id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-mono font-medium text-indigo-400">
                      {mod.moduleCode}
                    </td>
                    <td className="px-5 py-4 text-white font-medium max-w-xs truncate">
                      {mod.moduleName}
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      {mod.lecturer || <span className="text-slate-500 italic">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      {mod.semester} {mod.year}
                    </td>
                    <td className="px-5 py-4 text-slate-400">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
                        <FileText className="h-3 w-3 text-slate-400" />
                        {mod.documents?.length || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(mod)}
                          className="p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                          title="Edit module"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingModule(mod)}
                          className="p-1.5 rounded-md bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/50 transition cursor-pointer"
                          title="Delete module"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateOpen || editingModule) && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full rounded-xl border border-slate-800 bg-[#0e1526] p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsCreateOpen(false);
                setEditingModule(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-md bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">
              {isCreateOpen ? 'Create New Course Module' : `Edit Module (${editingModule?.moduleCode})`}
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Enter academic course information and syllabus details.
            </p>

            <form onSubmit={isCreateOpen ? handleCreateSubmit : handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Module Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.moduleCode}
                    onChange={(e) => setFormData({ ...formData, moduleCode: e.target.value })}
                    placeholder="e.g. CS2040"
                    className="block w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white font-mono uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Lecturer Name</label>
                  <input
                    type="text"
                    value={formData.lecturer}
                    onChange={(e) => setFormData({ ...formData, lecturer: e.target.value })}
                    placeholder="e.g. Dr. Alan Turing"
                    className="block w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Module Name / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.moduleName}
                  onChange={(e) => setFormData({ ...formData, moduleName: e.target.value })}
                  placeholder="e.g. Data Structures and Algorithms"
                  className="block w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Semester</label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className="block w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Summer Term">Summer Term</option>
                    <option value="Special Term">Special Term</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Academic Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="block w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description / Syllabus Overview</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief synopsis of key topics, textbook references, and learning objectives..."
                  className="block w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingModule(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-sm shadow-indigo-600/30"
                >
                  {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{isCreateOpen ? 'Create Module' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingModule && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full rounded-xl border border-red-900/50 bg-[#0e1526] p-6 shadow-2xl">
            <div className="h-10 w-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mb-3">
              <Trash2 className="h-5 w-5" />
            </div>

            <h3 className="text-base font-bold text-white mb-1">Delete Module?</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Are you sure you want to delete <span className="font-mono text-red-300 font-semibold">{deletingModule.moduleCode} — {deletingModule.moduleName}</span>?
              This will remove the module from all enrolled student profiles.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingModule(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
