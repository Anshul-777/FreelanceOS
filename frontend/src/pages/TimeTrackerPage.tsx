import { useEffect, useState, useRef } from 'react'
import {
  Play, Square, Plus, Clock, DollarSign, Pencil, Trash2,
  BarChart2, Loader2, Calendar,
} from 'lucide-react'
import { timeApi, projectsApi } from '../api'
import {
  Modal, ConfirmDialog, PageLoader, SectionHeader, EmptyState,
} from '../components/UI'
import {
  formatCurrency, formatDuration, formatDate, classNames,
} from '../utils'
import { useUIStore, useAuthStore } from '../store'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const EMPTY_FORM = {
  description: '', project_id: '', date: format(new Date(), 'yyyy-MM-dd'),
  duration_hours: '', duration_minutes_part: '0',
  start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  end_time: '', hourly_rate: '', is_billable: true,
}

export default function TimeTrackerPage() {
  const [entries, setEntries]       = useState<any[]>([])
  const [projects, setProjects]     = useState<any[]>([])
  const [summary, setSummary]       = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [period, setPeriod]         = useState<'week' | 'month'>('week')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editEntry, setEditEntry]   = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [form, setForm]             = useState<any>(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deleting, setDeleting]     = useState(false)

  // Timer state
  const { activeTimer, startTimer, stopTimer, updateTimerDescription } = useUIStore()
  const { user } = useAuthStore()
  const [elapsed, setElapsed]       = useState(0)
  const [timerProject, setTimerProject] = useState('')
  const [timerDesc, setTimerDesc]   = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (activeTimer.running && activeTimer.startTime) {
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - (activeTimer.startTime ?? 0)) / 1000))
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setElapsed(0)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [activeTimer.running, activeTimer.startTime])

  const loadData = async () => {
    const [entriesRes, projRes, sumRes] = await Promise.all([
      timeApi.list({ limit: 50 }),
      projectsApi.list({ status_filter: 'active' }),
      timeApi.summary(period),
    ])
    setEntries(entriesRes.data)
    setProjects(projRes.data)
    setSummary(sumRes.data)
  }

  useEffect(() => {
    loadData().finally(() => setLoading(false))
  }, [period])

  const handleStartTimer = () => {
    const proj = projects.find((p) => p.id === Number(timerProject))
    startTimer(proj?.id ?? null, proj?.name ?? 'No project', timerDesc)
    toast.success('Timer started!')
  }

  const handleStopTimer = async () => {
    const result = stopTimer()
    if (!result || result.durationMinutes < 1) {
      toast.error('Timer stopped — too short to log (< 1 min)')
      return
    }
    try {
      const now = new Date()
      const start = new Date(now.getTime() - result.durationMinutes * 60000)
      await timeApi.create({
        description: activeTimer.description || 'Timed session',
        project_id:  result.projectId || null,
        date:        format(now, 'yyyy-MM-dd'),
        start_time:  start.toISOString(),
        end_time:    now.toISOString(),
        duration_minutes: result.durationMinutes,
        is_billable: true,
      })
      toast.success(`Logged ${formatDuration(result.durationMinutes)}!`)
      await loadData()
    } catch { toast.error('Failed to save time entry') }
  }

  const openCreate = () => {
    setEditEntry(null)
    setForm({ ...EMPTY_FORM, date: format(new Date(), 'yyyy-MM-dd') })
    setModalOpen(true)
  }
  const openEdit = (e: any) => {
    setEditEntry(e)
    const h = Math.floor((e.duration_minutes || 0) / 60)
    const m = (e.duration_minutes || 0) % 60
    setForm({
      description: e.description || '',
      project_id: e.project_id || '',
      date: e.date || '',
      duration_hours: h.toString(),
      duration_minutes_part: m.toString(),
      start_time: e.start_time || '',
      end_time: e.end_time || '',
      hourly_rate: e.hourly_rate || '',
      is_billable: e.is_billable ?? true,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const dMins = (Number(form.duration_hours) * 60) + Number(form.duration_minutes_part)
    if (!form.date) return toast.error('Date is required')
    if (dMins < 1 && !form.end_time) return toast.error('Duration or end time required')
    setSaving(true)
    try {
      const payload: any = {
        description: form.description,
        project_id:  form.project_id ? Number(form.project_id) : null,
        date:        form.date,
        start_time:  form.start_time || new Date(form.date).toISOString(),
        end_time:    form.end_time || null,
        duration_minutes: dMins > 0 ? dMins : null,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        is_billable: form.is_billable,
      }
      if (editEntry) {
        await timeApi.update(editEntry.id, payload)
        toast.success('Entry updated')
      } else {
        await timeApi.create(payload)
        toast.success('Time logged!')
      }
      setModalOpen(false)
      await loadData()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await timeApi.delete(deleteTarget.id)
      toast.success('Entry deleted')
      setDeleteTarget(null)
      await loadData()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  if (loading) return <PageLoader />

  // Group entries by date
  const grouped: Record<string, any[]> = {}
  entries.forEach((e) => {
    const d = e.date || 'Unknown'
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(e)
  })

  return (
    <div className="page-container space-y-5 max-w-[1600px]">
      <SectionHeader
        title="Time Tracker"
        description="Track billable hours across all your projects"
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Log Time
          </button>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left column: Timer + Summary */}
        <div className="space-y-4">
          {/* Live Timer Card */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 mb-4 font-display">Live Timer</h3>

            {/* Timer display */}
            <div className={classNames(
              'rounded-2xl p-5 text-center mb-4 transition-colors duration-300',
              activeTimer.running
                ? 'bg-gradient-to-br from-brand-600 to-brand-700'
                : 'bg-slate-100'
            )}>
              <p className={classNames(
                'font-mono text-5xl font-bold tracking-tight',
                activeTimer.running ? 'text-white' : 'text-slate-700'
              )}>
                {formatElapsed(elapsed)}
              </p>
              {activeTimer.running && (
                <p className="text-brand-200 text-sm mt-2 truncate">
                  {activeTimer.projectName || 'No project'}
                </p>
              )}
            </div>

            {/* Timer controls */}
            {!activeTimer.running ? (
              <div className="space-y-3">
                <input
                  value={timerDesc}
                  onChange={(e) => setTimerDesc(e.target.value)}
                  placeholder="What are you working on?"
                  className="input-field"
                />
                <select
                  value={timerProject}
                  onChange={(e) => setTimerProject(e.target.value)}
                  className="select-field">
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleStartTimer}
                  className="btn-primary w-full justify-center py-3">
                  <Play size={16} fill="currentColor" />
                  Start Timer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={activeTimer.description}
                  onChange={(e) => updateTimerDescription(e.target.value)}
                  placeholder="Add description…"
                  className="input-field"
                />
                <button
                  onClick={handleStopTimer}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-600 font-semibold text-sm rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all">
                  <Square size={16} fill="currentColor" />
                  Stop & Save
                </button>
              </div>
            )}
          </div>

          {/* Summary Cards */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 font-display">Summary</h3>
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                {(['week', 'month'] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={classNames(
                      'px-3 py-1 text-xs font-semibold rounded-md transition-colors',
                      period === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            {summary && (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-brand-50 rounded-xl">
                  <div className="flex items-center gap-2 text-brand-700">
                    <Clock size={16} />
                    <span className="text-sm font-semibold">Total Hours</span>
                  </div>
                  <span className="font-bold text-brand-900 text-lg">{summary.total_hours}h</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <DollarSign size={16} />
                    <span className="text-sm font-semibold">Billable Earnings</span>
                  </div>
                  <span className="font-bold text-emerald-900 text-lg">
                    {formatCurrency(summary.total_earnings)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-2 text-slate-600">
                    <BarChart2 size={16} />
                    <span className="text-sm font-semibold">Billable Hours</span>
                  </div>
                  <span className="font-bold text-slate-800">{summary.billable_hours}h</span>
                </div>
                {/* By Project */}
                {summary.by_project?.length > 0 && (
                  <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">By Project</p>
                    {summary.by_project.slice(0, 5).map((bp: any) => {
                      const pct = summary.total_minutes > 0
                        ? Math.round((bp.minutes / summary.total_minutes) * 100)
                        : 0
                      return (
                        <div key={bp.project_id} className="mb-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-700 truncate">{bp.project_name}</span>
                            <span className="font-semibold text-slate-900 ml-2">
                              {Math.round(bp.minutes / 60 * 10) / 10}h
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Entries list */}
        <div className="xl:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 font-display">Recent Entries</h3>
              <span className="badge bg-slate-100 text-slate-700">{entries.length} entries</span>
            </div>

            {entries.length === 0 ? (
              <EmptyState
                icon={<Clock size={24} />}
                title="No time entries yet"
                description="Start a timer or log time manually to begin tracking."
                action={<button onClick={openCreate} className="btn-primary text-sm">Log Time</button>}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {Object.entries(grouped).map(([date, dayEntries]) => {
                  const dayTotal = dayEntries.reduce((s, e) => s + (e.duration_minutes || 0), 0)
                  const dayEarnings = dayEntries.reduce((s, e) => s + (e.earnings || 0), 0)
                  return (
                    <div key={date}>
                      <div className="px-5 py-2.5 bg-slate-50 flex items-center justify-between border-b border-slate-100">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <Calendar size={14} className="text-slate-400" />
                          {formatDate(date)}
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                          <span>{formatDuration(dayTotal)}</span>
                          {dayEarnings > 0 && <span className="text-emerald-600">{formatCurrency(dayEarnings)}</span>}
                        </div>
                      </div>
                      {dayEntries.map((entry) => (
                        <div key={entry.id}
                          className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                          <div className={classNames(
                            'w-2 h-2 rounded-full flex-shrink-0',
                            entry.is_billable ? 'bg-brand-500' : 'bg-slate-300'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {entry.description || <span className="text-slate-400 italic">No description</span>}
                            </p>
                            {entry.project_name && (
                              <p className="text-xs text-slate-500 mt-0.5">{entry.project_name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 flex-shrink-0">
                            {entry.is_billable && entry.earnings > 0 && (
                              <span className="text-sm font-semibold text-emerald-600 hidden sm:block">
                                {formatCurrency(entry.earnings)}
                              </span>
                            )}
                            <span className="font-mono text-sm text-slate-700">
                              {formatDuration(entry.duration_minutes || 0)}
                            </span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEdit(entry)}
                                className="btn-ghost p-1.5"><Pencil size={13} /></button>
                              <button onClick={() => setDeleteTarget(entry)}
                                className="btn-ghost p-1.5 text-red-400 hover:bg-red-50">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editEntry ? 'Edit Time Entry' : 'Log Time'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editEntry ? 'Save Changes' : 'Log Time'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="form-group">
            <label className="input-label">Description</label>
            <input className="input-field" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What did you work on?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Project</label>
              <select className="select-field" value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Hours</label>
              <input type="number" className="input-field" min="0" max="24" step="1"
                value={form.duration_hours}
                onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
                placeholder="0" />
            </div>
            <div className="form-group">
              <label className="input-label">Minutes</label>
              <input type="number" className="input-field" min="0" max="59" step="5"
                value={form.duration_minutes_part}
                onChange={(e) => setForm({ ...form, duration_minutes_part: e.target.value })}
                placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Hourly Rate ($/hr)</label>
              <input type="number" className="input-field" step="0.01"
                value={form.hourly_rate}
                onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
                placeholder={`Default: $${user?.hourly_rate || 75}/hr`} />
            </div>
            <div className="form-group flex items-end pb-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_billable}
                  onChange={(e) => setForm({ ...form, is_billable: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                <span className="text-sm font-medium text-slate-700">Billable</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Time Entry"
        message="Are you sure you want to delete this time entry? This action cannot be undone."
        confirmLabel="Delete"
        danger loading={deleting}
      />
    </div>
  )
}
