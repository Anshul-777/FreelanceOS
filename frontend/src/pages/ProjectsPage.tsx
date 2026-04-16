import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, FolderOpen, LayoutGrid, List, Search,
  MoreHorizontal, Calendar, Clock, DollarSign, Pencil, Trash2, Loader2,
} from 'lucide-react'
import { projectsApi, clientsApi } from '../api'
import {
  Modal, ConfirmDialog, EmptyState, PageLoader, SectionHeader, ProgressBar,
} from '../components/UI'
import {
  formatCurrency, formatDate, getProjectStatusClass, classNames, capitalize,
} from '../utils'
import toast from 'react-hot-toast'

const PROJECT_COLORS = [
  '#4F46E5','#0EA5E9','#10B981','#F59E0B','#EC4899',
  '#8B5CF6','#06B6D4','#F97316','#EF4444','#84CC16',
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'lead', label: 'Lead' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const EMPTY_FORM = {
  name: '', description: '', status: 'active', client_id: '',
  color: '#4F46E5', budget: '', budget_type: 'fixed',
  hourly_rate: '', start_date: '', due_date: '',
  estimated_hours: '', is_billable: true,
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatus] = useState('')
  const [view, setView]           = useState<'grid' | 'list'>('grid')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [form, setForm]           = useState<any>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const navigate                  = useNavigate()

  const load = () => {
    const params: any = {}
    if (statusFilter) params.status_filter = statusFilter
    return projectsApi.list(params).then((r) => setProjects(r.data))
  }

  useEffect(() => {
    Promise.all([load(), clientsApi.list().then((r) => setClients(r.data))])
      .finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditProject(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (p: any) => {
    setEditProject(p)
    setForm({
      name: p.name, description: p.description || '', status: p.status,
      client_id: p.client_id || '', color: p.color || '#4F46E5',
      budget: p.budget || '', budget_type: p.budget_type || 'fixed',
      hourly_rate: p.hourly_rate || '', start_date: p.start_date || '',
      due_date: p.due_date || '', estimated_hours: p.estimated_hours || '',
      is_billable: p.is_billable ?? true,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Project name is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        client_id:       form.client_id   ? Number(form.client_id)   : null,
        budget:          form.budget      ? Number(form.budget)       : null,
        hourly_rate:     form.hourly_rate ? Number(form.hourly_rate)  : null,
        estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
        start_date:      form.start_date  || null,
        due_date:        form.due_date    || null,
      }
      if (editProject) {
        await projectsApi.update(editProject.id, payload)
        toast.success('Project updated')
      } else {
        await projectsApi.create(payload)
        toast.success('Project created!')
      }
      setModalOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await projectsApi.delete(deleteTarget.id)
      toast.success('Project deleted')
      setDeleteTarget(null)
      await load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container space-y-5 max-w-[1600px]">
      <SectionHeader
        title="Projects"
        description={`${projects.length} project${projects.length !== 1 ? 's' : ''} total`}
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> New Project
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            title="Search projects"
            className="input-field pl-9 py-2"
          />
        </div>
        <select
          value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          title="Filter by status"
          className="select-field w-auto py-2">
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 gap-1 ml-auto">
          <button onClick={() => setView('grid')}
            title="Grid view"
            className={classNames('p-1.5 rounded-md transition-colors',
              view === 'grid' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-700')}>
            <LayoutGrid size={16} />
          </button>
          <button onClick={() => setView('list')}
            title="List view"
            className={classNames('p-1.5 rounded-md transition-colors',
              view === 'list' ? 'bg-brand-50 text-brand-600' : 'text-slate-400 hover:text-slate-700')}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Projects */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FolderOpen size={28} />}
            title="No projects found"
            description="Create your first project to start tracking work and time."
            action={<button onClick={openCreate} className="btn-primary">+ New Project</button>}
          />
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id} project={p}
              onEdit={() => openEdit(p)}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr>
                {['Project','Client','Status','Budget','Hours','Progress','Due Date',''].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="table-row">
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                      <div>
                        <p className="font-semibold text-slate-900">{p.name}</p>
                        {p.description && <p className="text-xs text-slate-400 truncate max-w-48">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="table-td text-slate-500">{p.client_name || '—'}</td>
                  <td className="table-td">
                    <span className={getProjectStatusClass(p.status)}>{capitalize(p.status)}</span>
                  </td>
                  <td className="table-td font-mono text-sm">
                    {p.budget ? formatCurrency(p.budget) : '—'}
                  </td>
                  <td className="table-td text-slate-600">
                    {p.total_hours?.toFixed(1)}h
                  </td>
                  <td className="table-td w-32">
                    <ProgressBar value={p.completion_percentage || 0} max={100} />
                    <span className="text-xs text-slate-400 mt-0.5 block">
                      {(p.completion_percentage || 0).toFixed(0)}%
                    </span>
                  </td>
                  <td className="table-td text-slate-500">
                    {p.due_date ? formatDate(p.due_date) : '—'}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} title="Edit project" className="btn-ghost p-1.5"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(p)} title="Delete project" className="btn-ghost p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editProject ? 'Edit Project' : 'New Project'}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editProject ? 'Save Changes' : 'Create Project'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Name + Color row */}
          <div className="flex gap-3">
            <div className="form-group flex-1">
              <label className="input-label">Project Name *</label>
              <input className="input-field" value={form.name}
                title="Project Name"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Website Redesign" />
            </div>
            <div className="form-group">
              <label className="input-label">Color</label>
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {PROJECT_COLORS.map((c) => (
                  <button key={c} type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    title={`Select color ${c}`}
                    className={classNames('w-7 h-7 rounded-full transition-transform',
                      form.color === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110')}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Client</label>
              <select className="select-field" value={form.client_id}
                title="Select client"
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">No client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Status</label>
              <select className="select-field" value={form.status}
                title="Select status"
                onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="lead">Lead</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea className="input-field resize-none" rows={3} value={form.description}
              title="Project Description"
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief project description…" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Budget Type</label>
              <select className="select-field" value={form.budget_type}
                title="Budget type"
                onChange={(e) => setForm({ ...form, budget_type: e.target.value })}>
                <option value="fixed">Fixed Price</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">{form.budget_type === 'fixed' ? 'Fixed Budget ($)' : 'Hourly Rate ($/hr)'}</label>
              <input type="number" className="input-field" step="0.01"
                value={form.budget_type === 'fixed' ? form.budget : form.hourly_rate}
                title={form.budget_type === 'fixed' ? 'Fixed Budget' : 'Hourly Rate'}
                onChange={(e) => form.budget_type === 'fixed'
                  ? setForm({ ...form, budget: e.target.value })
                  : setForm({ ...form, hourly_rate: e.target.value })}
                placeholder="0.00" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="form-group">
              <label className="input-label">Start Date</label>
              <input type="date" className="input-field" value={form.start_date}
                title="Start date"
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Due Date</label>
              <input type="date" className="input-field" value={form.due_date}
                title="Due date"
                onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Est. Hours</label>
              <input type="number" className="input-field" step="0.5" value={form.estimated_hours}
                title="Estimated hours"
                onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
                placeholder="0" />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={form.is_billable}
              title="Is Billable"
              onChange={(e) => setForm({ ...form, is_billable: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-brand-600" />
            <span className="text-sm font-medium text-slate-700">Billable project</span>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All tasks and time entries will be removed permanently.`}
        confirmLabel="Delete Project"
        danger
        loading={deleting}
      />
    </div>
  )
}

// ─── Project Card ──────────────────────────────────────────────────────────
function ProjectCard({ project: p, onEdit, onDelete }: { project: any; onEdit: () => void; onDelete: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      className="card-hover p-5 relative group cursor-pointer"
      onClick={() => navigate(`/app/projects/${p.id}`)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: (p.color || '#4F46E5') + '20' }}>
            <FolderOpen size={18} style={{ color: p.color || '#4F46E5' }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">{p.name}</p>
            <p className="text-xs text-slate-400 truncate">{p.client_name || 'No client'}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
            title="Project actions"
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all">
            <MoreHorizontal size={16} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-xl shadow-card-md z-20 w-36 py-1 animate-scale-in">
              <button onClick={(e) => { e.stopPropagation(); onEdit(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(); setMenuOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-3">
        <span className={getProjectStatusClass(p.status)}>{capitalize(p.status)}</span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>Progress</span>
          <span className="font-semibold">{(p.completion_percentage || 0).toFixed(0)}%</span>
        </div>
        <ProgressBar
          value={p.completion_percentage || 0}
          max={100}
          color={p.completion_percentage >= 100 ? 'bg-emerald-500' : 'bg-brand-600'}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
        <div>
          <p className="text-xs text-slate-400">Hours</p>
          <p className="text-sm font-semibold text-slate-900">{(p.total_hours || 0).toFixed(1)}h</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Earned</p>
          <p className="text-sm font-semibold text-slate-900">
            {p.total_earnings > 0 ? `$${(p.total_earnings / 1000).toFixed(1)}k` : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Due</p>
          <p className="text-sm font-semibold text-slate-900">
            {p.due_date ? formatDate(p.due_date, 'MMM d') : '—'}
          </p>
        </div>
      </div>
    </div>
  )
}
