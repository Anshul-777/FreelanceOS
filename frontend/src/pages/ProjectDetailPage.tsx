import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, DollarSign, CheckSquare, Calendar,
  Pencil, Trash2, Plus, Loader2, Users,
} from 'lucide-react'
import { projectsApi, timeApi } from '../api'
import {
  Modal, ConfirmDialog, PageLoader, ProgressBar,
} from '../components/UI'
import { KanbanBoard, type Task, type TaskStatus } from '../components/Kanban/KanbanBoard'
import {
  formatCurrency, formatDate, formatDuration,
  getProjectStatusClass, getPriorityClass, capitalize, classNames,
} from '../utils'
import toast from 'react-hot-toast'

const EMPTY_TASK_FORM = {
  title: '', description: '', status: 'todo',
  priority: 'medium', estimated_hours: '', due_date: '',
}

export default function ProjectDetailPage() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()
  const projectId  = Number(id)

  const [project, setProject]       = useState<any>(null)
  const [tasks, setTasks]           = useState<Task[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState<'kanban' | 'time' | 'overview'>('kanban')

  // Task modal
  const [taskModal, setTaskModal]   = useState(false)
  const [editTask, setEditTask]     = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const [taskForm, setTaskForm]     = useState<any>(EMPTY_TASK_FORM)
  const [savingTask, setSavingTask] = useState(false)
  const [deletingTask, setDeletingTask] = useState(false)

  const loadProject = useCallback(async () => {
    try {
      const [projRes, tasksRes, timeRes] = await Promise.all([
        projectsApi.get(projectId),
        projectsApi.listTasks(projectId),
        timeApi.list({ project_id: projectId, limit: 50 }),
      ])
      setProject(projRes.data)
      setTasks(tasksRes.data)
      setTimeEntries(timeRes.data)
    } catch {
      toast.error('Failed to load project')
      navigate('/app/projects')
    }
  }, [projectId])

  useEffect(() => {
    loadProject().finally(() => setLoading(false))
  }, [loadProject])

  // ── Task CRUD ──────────────────────────────────────────────────────────
  const openCreateTask = (status: TaskStatus = 'todo') => {
    setEditTask(null)
    setTaskForm({ ...EMPTY_TASK_FORM, status })
    setTaskModal(true)
  }
  const openEditTask = (task: Task) => {
    setEditTask(task)
    setTaskForm({
      title:           task.title,
      description:     task.description || '',
      status:          task.status,
      priority:        task.priority,
      estimated_hours: task.estimated_hours || '',
      due_date:        task.due_date || '',
    })
    setTaskModal(true)
  }
  const handleSaveTask = async () => {
    if (!taskForm.title.trim()) return toast.error('Title required')
    setSavingTask(true)
    try {
      const payload = {
        ...taskForm,
        estimated_hours: taskForm.estimated_hours ? Number(taskForm.estimated_hours) : null,
        due_date: taskForm.due_date || null,
        project_id: projectId,
      }
      if (editTask) {
        await projectsApi.updateTask(editTask.id, payload)
        toast.success('Task updated')
      } else {
        await projectsApi.createTask(projectId, payload)
        toast.success('Task created!')
      }
      setTaskModal(false)
      const res = await projectsApi.listTasks(projectId)
      setTasks(res.data)
      // Reload project to update completion %
      const projRes = await projectsApi.get(projectId)
      setProject(projRes.data)
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save task')
    } finally { setSavingTask(false) }
  }
  const handleDeleteTask = async () => {
    if (!deleteTask) return
    setDeletingTask(true)
    try {
      await projectsApi.deleteTask(deleteTask.id)
      toast.success('Task deleted')
      setDeleteTask(null)
      const res = await projectsApi.listTasks(projectId)
      setTasks(res.data)
      const projRes = await projectsApi.get(projectId)
      setProject(projRes.data)
    } catch { toast.error('Failed to delete task') }
    finally { setDeletingTask(false) }
  }

  const handleTasksChange = (newTasks: Task[]) => setTasks(newTasks)

  if (loading || !project) return <PageLoader />

  // ── Computed stats ─────────────────────────────────────────────────────
  const totalHours   = timeEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0) / 60
  const totalEarnings = timeEntries.reduce((s, e) => s + (e.earnings || 0), 0)
  const doneTasks    = tasks.filter((t) => t.status === 'done').length
  const completion   = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0

  const budgetUsedPct = project.budget && totalEarnings > 0
    ? Math.min(100, (totalEarnings / project.budget) * 100)
    : 0

  const TABS = [
    { id: 'kanban',   label: 'Kanban Board',  count: tasks.length },
    { id: 'time',     label: 'Time Entries',  count: timeEntries.length },
    { id: 'overview', label: 'Overview',      count: null },
  ]

  return (
    <div className="page-container space-y-5 max-w-[1600px]">
      {/* ── Breadcrumb + Header ────────────────────────────────────────── */}
      <div>
        <Link
          to="/app/projects"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-3 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: (project.color || '#4F46E5') + '22' }}
            >
              <div className="w-5 h-5 rounded-full" style={{ backgroundColor: project.color || '#4F46E5' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 font-display">{project.name}</h1>
                <span className={getProjectStatusClass(project.status)}>
                  {capitalize(project.status)}
                </span>
              </div>
              {project.client_name && (
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <Users size={13} />
                  {project.client_name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/app/projects?edit=${project.id}`)}
              className="btn-secondary"
            >
              <Pencil size={14} /> Edit Project
            </button>
            <button
              onClick={() => openCreateTask()}
              className="btn-primary"
            >
              <Plus size={15} /> Add Task
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Logged</p>
            <p className="text-xl font-bold text-slate-900">{totalHours.toFixed(1)}h</p>
            {project.estimated_hours && (
              <p className="text-xs text-slate-400">of {project.estimated_hours}h est.</p>
            )}
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Earned</p>
            <p className="text-xl font-bold text-slate-900">{formatCurrency(totalEarnings)}</p>
            {project.budget && (
              <p className="text-xs text-slate-400">of {formatCurrency(project.budget)} budget</p>
            )}
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
            <CheckSquare size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks</p>
            <p className="text-xl font-bold text-slate-900">{doneTasks}/{tasks.length}</p>
            <p className="text-xs text-slate-400">{completion}% complete</p>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Calendar size={16} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</p>
            <p className="text-xl font-bold text-slate-900">
              {project.due_date ? formatDate(project.due_date, 'MMM d') : '—'}
            </p>
            {project.due_date && (
              <p className="text-xs text-slate-400">{formatDate(project.due_date, 'yyyy')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {project.budget && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold text-slate-700">Budget Usage</span>
            <span className={classNames(
              'font-semibold',
              budgetUsedPct > 90 ? 'text-red-600' : budgetUsedPct > 70 ? 'text-amber-600' : 'text-emerald-600'
            )}>
              {formatCurrency(totalEarnings)} / {formatCurrency(project.budget)}
            </span>
          </div>
          <ProgressBar
            value={budgetUsedPct}
            max={100}
            color={budgetUsedPct > 90 ? 'bg-red-500' : budgetUsedPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}
            height="h-3"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            {(100 - budgetUsedPct).toFixed(0)}% remaining ({formatCurrency(project.budget - totalEarnings)} left)
          </p>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(({ id: tabId, label, count }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId as any)}
            className={classNames(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px',
              activeTab === tabId
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            )}
          >
            {label}
            {count !== null && (
              <span className={classNames(
                'badge text-xs',
                activeTab === tabId ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500'
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Kanban Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'kanban' && (
        <KanbanBoard
          tasks={tasks}
          projectId={projectId}
          onTasksChange={handleTasksChange}
          onEditTask={openEditTask}
          onDeleteTask={(t) => setDeleteTask(t)}
        />
      )}

      {/* ── Time Entries Tab ─────────────────────────────────────────────── */}
      {activeTab === 'time' && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 font-display">Time Entries</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-500 font-medium">
                Total: <strong className="text-slate-900">{totalHours.toFixed(1)}h</strong>
              </span>
              <span className="text-sm text-slate-500 font-medium">
                Earned: <strong className="text-emerald-700">{formatCurrency(totalEarnings)}</strong>
              </span>
            </div>
          </div>
          {timeEntries.length === 0 ? (
            <div className="py-16 text-center">
              <Clock size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">No time entries for this project yet.</p>
              <Link to="/app/time" className="btn-primary text-sm mt-4 inline-flex">
                <Clock size={14} /> Log Time
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  {['Date','Description','Duration','Rate','Earnings','Billable'].map((h) => (
                    <th key={h} className="table-th">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((entry) => (
                  <tr key={entry.id} className="table-row">
                    <td className="table-td text-slate-500 whitespace-nowrap">
                      {formatDate(entry.date)}
                    </td>
                    <td className="table-td">
                      <p className="text-slate-800">
                        {entry.description || <span className="italic text-slate-400">No description</span>}
                      </p>
                      {entry.task_title && (
                        <p className="text-xs text-slate-400 mt-0.5">Task: {entry.task_title}</p>
                      )}
                    </td>
                    <td className="table-td font-mono text-slate-700">
                      {formatDuration(entry.duration_minutes || 0)}
                    </td>
                    <td className="table-td text-slate-500">
                      ${entry.hourly_rate}/hr
                    </td>
                    <td className="table-td font-semibold text-emerald-700">
                      {entry.is_billable ? formatCurrency(entry.earnings || 0) : '—'}
                    </td>
                    <td className="table-td">
                      {entry.is_billable ? (
                        <span className="badge bg-brand-50 text-brand-700">Billable</span>
                      ) : (
                        <span className="badge bg-slate-100 text-slate-500">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Overview Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Project Details */}
          <div className="card p-5 space-y-4">
            <h3 className="font-bold text-slate-900 font-display">Project Details</h3>
            <div className="space-y-3">
              {project.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-slate-700">{project.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  { label: 'Status',     value: capitalize(project.status) },
                  { label: 'Type',       value: project.budget_type === 'fixed' ? 'Fixed Price' : 'Hourly' },
                  { label: 'Budget',     value: project.budget ? formatCurrency(project.budget) : '—' },
                  { label: 'Rate',       value: project.hourly_rate ? `$${project.hourly_rate}/hr` : '—' },
                  { label: 'Start Date', value: project.start_date ? formatDate(project.start_date) : '—' },
                  { label: 'Due Date',   value: project.due_date  ? formatDate(project.due_date)  : '—' },
                  { label: 'Est. Hours', value: project.estimated_hours ? `${project.estimated_hours}h` : '—' },
                  { label: 'Billable',   value: project.is_billable ? 'Yes' : 'No' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-medium text-slate-800 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Progress by Status */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 mb-4 font-display">Task Breakdown</h3>
            {tasks.length === 0 ? (
              <div className="py-8 text-center">
                <CheckSquare size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-400">No tasks yet</p>
                <button onClick={() => openCreateTask()} className="btn-primary text-sm mt-3 inline-flex">
                  <Plus size={14} /> Add First Task
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { status: 'todo',        label: 'To Do',       color: 'bg-slate-400' },
                  { status: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
                  { status: 'review',      label: 'In Review',   color: 'bg-purple-500' },
                  { status: 'done',        label: 'Done',        color: 'bg-emerald-500' },
                ].map(({ status, label, color }) => {
                  const count = tasks.filter((t) => t.status === status).length
                  const pct   = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0
                  return (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-slate-700">{label}</span>
                        <span className="text-slate-500">{count} tasks ({pct}%)</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={classNames('h-full rounded-full transition-all duration-500', color)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Overall Completion</span>
                  <span className="text-lg font-bold text-brand-700">{completion}%</span>
                </div>
                <ProgressBar
                  value={completion}
                  max={100}
                  color={completion >= 100 ? 'bg-emerald-500' : 'bg-brand-600'}
                  height="h-3"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Task Edit Modal ──────────────────────────────────────────────── */}
      <Modal
        open={taskModal}
        onClose={() => setTaskModal(false)}
        title={editTask ? 'Edit Task' : 'New Task'}
        footer={
          <>
            <button onClick={() => setTaskModal(false)} className="btn-secondary" disabled={savingTask}>
              Cancel
            </button>
            <button onClick={handleSaveTask} className="btn-primary" disabled={savingTask}>
              {savingTask && <Loader2 size={14} className="animate-spin" />}
              {editTask ? 'Save Changes' : 'Create Task'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="input-label">Title *</label>
            <input
              className="input-field"
              value={taskForm.title}
              title="Task Title"
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              placeholder="Task title"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="input-label">Description</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={taskForm.description}
              title="Task Description"
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              placeholder="Additional details…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Status</label>
              <select
                className="select-field"
                value={taskForm.status}
                title="Task status"
                onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Priority</label>
              <select
                className="select-field"
                value={taskForm.priority}
                title="Task priority"
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Estimated Hours</label>
              <input
                type="number"
                className="input-field"
                step="0.5"
                min="0"
                value={taskForm.estimated_hours}
                title="Estimated Hours"
                onChange={(e) => setTaskForm({ ...taskForm, estimated_hours: e.target.value })}
                placeholder="e.g. 4"
              />
            </div>
            <div className="form-group">
              <label className="input-label">Due Date</label>
              <input
                type="date"
                className="input-field"
                title="Due date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
              />
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Delete "${deleteTask?.title}"? This cannot be undone.`}
        confirmLabel="Delete Task"
        danger
        loading={deletingTask}
      />
    </div>
  )
}
