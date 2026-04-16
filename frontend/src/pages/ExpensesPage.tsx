import { useEffect, useState } from 'react'
import {
  Plus, Receipt, Search, Pencil, Trash2, Loader2,
  TrendingDown, BarChart2,
} from 'lucide-react'
import { expensesApi, projectsApi } from '../api'
import {
  Modal, ConfirmDialog, PageLoader, SectionHeader, EmptyState,
} from '../components/UI'
import { formatCurrency, formatDate, capitalize } from '../utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CATEGORIES = [
  'software','hardware','travel','office','marketing',
  'education','utilities','contractor','other',
]

const CATEGORY_COLORS: Record<string, string> = {
  software:   '#4F46E5',
  hardware:   '#0EA5E9',
  travel:     '#F59E0B',
  office:     '#10B981',
  marketing:  '#EC4899',
  education:  '#8B5CF6',
  utilities:  '#06B6D4',
  contractor: '#F97316',
  other:      '#94A3B8',
}

const EMPTY_FORM = {
  category: 'software', description: '', amount: '', currency: 'USD',
  date: format(new Date(), 'yyyy-MM-dd'), vendor: '',
  project_id: '', is_billable: false, is_reimbursed: false, notes: '',
}

export default function ExpensesPage() {
  const [expenses, setExpenses]   = useState<any[]>([])
  const [projects, setProjects]   = useState<any[]>([])
  const [summary, setSummary]     = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [form, setForm]           = useState<any>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)

  const load = async () => {
    const params: any = {}
    if (catFilter) params.category = catFilter
    const [expRes, sumRes] = await Promise.all([
      expensesApi.list(params),
      expensesApi.summary(),
    ])
    setExpenses(expRes.data)
    setSummary(sumRes.data)
  }

  useEffect(() => {
    Promise.all([
      load(),
      projectsApi.list().then((r) => setProjects(r.data)),
    ]).finally(() => setLoading(false))
  }, [catFilter])

  const filtered = expenses.filter((e) =>
    !search ||
    e.description.toLowerCase().includes(search.toLowerCase()) ||
    (e.vendor || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalThisMonth = expenses.reduce((s, e) => {
    const d = new Date(e.date)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      ? s + e.amount : s
  }, 0)

  const openCreate = () => { setEditExpense(null); setForm({ ...EMPTY_FORM }); setModalOpen(true) }
  const openEdit = (e: any) => {
    setEditExpense(e)
    setForm({
      category: e.category, description: e.description, amount: e.amount,
      currency: e.currency, date: e.date, vendor: e.vendor || '',
      project_id: e.project_id || '', is_billable: e.is_billable,
      is_reimbursed: e.is_reimbursed, notes: e.notes || '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.description.trim()) return toast.error('Description is required')
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Amount must be greater than 0')
    setSaving(true)
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        project_id: form.project_id ? Number(form.project_id) : null,
      }
      if (editExpense) {
        await expensesApi.update(editExpense.id, payload)
        toast.success('Expense updated')
      } else {
        await expensesApi.create(payload)
        toast.success('Expense added!')
      }
      setModalOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save expense')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await expensesApi.delete(deleteTarget.id)
      toast.success('Expense deleted')
      setDeleteTarget(null)
      await load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  if (loading) return <PageLoader />

  const chartData = summary?.by_category?.map((c: any) => ({
    name: capitalize(c.category),
    value: c.amount,
    color: CATEGORY_COLORS[c.category] || '#94A3B8',
  })) || []

  return (
    <div className="page-container space-y-5 max-w-[1600px]">
      <SectionHeader
        title="Expenses"
        description={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> Add Expense
          </button>
        }
      />

      {/* Summary row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">This Month</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalThisMonth)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <BarChart2 size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">YTD Total</p>
            <p className="text-xl font-bold text-amber-700">{formatCurrency(summary?.total || 0)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Receipt size={18} className="text-slate-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Entries</p>
            <p className="text-xl font-bold text-slate-800">{summary?.count || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Chart */}
        {chartData.length > 0 && (
          <div className="card p-5">
            <h3 className="font-bold text-slate-900 mb-4 font-display">By Category</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  paddingAngle={3} dataKey="value">
                  {chartData.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Expense List */}
        <div className="xl:col-span-2 space-y-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search expenses…" className="input-field pl-9 py-2" />
            </div>
            <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
              className="select-field w-auto py-2">
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{capitalize(c)}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Receipt size={24} />}
                title="No expenses found"
                description="Track your business expenses to monitor profitability."
                action={<button onClick={openCreate} className="btn-primary text-sm">+ Add Expense</button>}
              />
            </div>
          ) : (
            <div className="table-container">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Date','Description','Category','Amount','Vendor','Billable',''].map((h) => (
                      <th key={h} className="table-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="table-row">
                      <td className="table-td text-slate-500 whitespace-nowrap">{formatDate(e.date)}</td>
                      <td className="table-td">
                        <p className="font-medium text-slate-900">{e.description}</p>
                        {e.project_name && <p className="text-xs text-slate-400">{e.project_name}</p>}
                      </td>
                      <td className="table-td">
                        <span className="badge text-xs"
                          style={{
                            background: (CATEGORY_COLORS[e.category] || '#94A3B8') + '18',
                            color: CATEGORY_COLORS[e.category] || '#64748B',
                          }}>
                          {capitalize(e.category)}
                        </span>
                      </td>
                      <td className="table-td">
                        <span className="font-mono font-semibold text-red-600">
                          − {formatCurrency(e.amount)}
                        </span>
                      </td>
                      <td className="table-td text-slate-500">{e.vendor || '—'}</td>
                      <td className="table-td">
                        {e.is_billable ? (
                          <span className="badge bg-brand-50 text-brand-700">Billable</span>
                        ) : (
                          <span className="badge bg-slate-100 text-slate-500">Personal</span>
                        )}
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEdit(e)} className="btn-ghost p-1.5"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTarget(e)}
                            className="btn-ghost p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editExpense ? 'Edit Expense' : 'Add Expense'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editExpense ? 'Save Changes' : 'Add Expense'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Category</label>
              <select className="select-field" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{capitalize(c)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Date</label>
              <input type="date" className="input-field" value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Description *</label>
            <input className="input-field" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Adobe Creative Cloud subscription" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Amount ($) *</label>
              <input type="number" className="input-field" step="0.01" min="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="input-label">Vendor</label>
              <input className="input-field" value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="Company name" />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Project (Optional)</label>
            <select className="select-field" value={form.project_id}
              onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
              <option value="">No project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Notes</label>
            <textarea className="input-field resize-none" rows={2} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Additional details…" />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.is_billable}
                onChange={(e) => setForm({ ...form, is_billable: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-brand-600" />
              <span className="text-sm font-medium text-slate-700">Billable to client</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={form.is_reimbursed}
                onChange={(e) => setForm({ ...form, is_reimbursed: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-brand-600" />
              <span className="text-sm font-medium text-slate-700">Reimbursed</span>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.description}"?`}
        confirmLabel="Delete"
        danger loading={deleting}
      />
    </div>
  )
}
