import { useEffect, useState } from 'react'
import {
  Plus, FileText, Search, Download, Send, CheckCircle,
  Pencil, Trash2, Loader2, Eye, DollarSign,
} from 'lucide-react'
import { invoicesApi, clientsApi, projectsApi } from '../api'
import {
  Modal, ConfirmDialog, PageLoader, SectionHeader, EmptyState,
} from '../components/UI'
import {
  formatCurrency, formatDate, getInvoiceStatusClass, capitalize,
  downloadBlob, classNames,
} from '../utils'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_OPTS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
]

const EMPTY_ITEM = { description: '', quantity: 1, unit_price: 0 }

const EMPTY_FORM = {
  client_id: '', project_id: '', status: 'draft',
  issue_date: format(new Date(), 'yyyy-MM-dd'),
  due_date: '', tax_rate: 0, discount_amount: 0,
  currency: 'USD', notes: '', payment_terms: 30,
  items: [{ ...EMPTY_ITEM }],
}

export default function InvoicesPage() {
  const [invoices, setInvoices]   = useState<any[]>([])
  const [clients, setClients]     = useState<any[]>([])
  const [projects, setProjects]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editInvoice, setEditInvoice] = useState<any | null>(null)
  const [viewInvoice, setViewInvoice] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [form, setForm]           = useState<any>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [downloading, setDownloading] = useState<number | null>(null)
  const [markingPaid, setMarkingPaid] = useState<number | null>(null)
  const [markingSent, setMarkingSent] = useState<number | null>(null)

  const load = (params?: any) =>
    invoicesApi.list(params).then((r) => setInvoices(r.data))

  useEffect(() => {
    Promise.all([
      load(statusFilter ? { status_filter: statusFilter } : undefined),
      clientsApi.list().then((r) => setClients(r.data)),
      projectsApi.list().then((r) => setProjects(r.data)),
    ]).finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = invoices.filter((inv) =>
    !search ||
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    (inv.client_name || '').toLowerCase().includes(search.toLowerCase())
  )

  // Aggregate stats
  const totalPaid      = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
  const totalOutstanding = invoices.filter(i => ['sent', 'viewed', 'overdue'].includes(i.status)).reduce((s, i) => s + i.total, 0)
  const totalOverdue   = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0)

  const openCreate = () => {
    setEditInvoice(null)
    const due = new Date(); due.setDate(due.getDate() + 30)
    setForm({ ...EMPTY_FORM, due_date: format(due, 'yyyy-MM-dd'), items: [{ ...EMPTY_ITEM }] })
    setModalOpen(true)
  }
  const openEdit = (inv: any) => {
    setEditInvoice(inv)
    setForm({
      client_id: inv.client_id || '',
      project_id: inv.project_id || '',
      status: inv.status,
      issue_date: inv.issue_date || '',
      due_date: inv.due_date || '',
      tax_rate: inv.tax_rate || 0,
      discount_amount: inv.discount_amount || 0,
      currency: inv.currency || 'USD',
      notes: inv.notes || '',
      payment_terms: inv.payment_terms || 30,
      items: inv.items?.length > 0
        ? inv.items.map((it: any) => ({
            description: it.description,
            quantity: it.quantity,
            unit_price: it.unit_price,
          }))
        : [{ ...EMPTY_ITEM }],
    })
    setModalOpen(true)
  }

  const addItem = () => setForm((f: any) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))
  const removeItem = (i: number) =>
    setForm((f: any) => ({ ...f, items: f.items.filter((_: any, idx: number) => idx !== i) }))
  const updateItem = (i: number, field: string, value: any) =>
    setForm((f: any) => ({
      ...f,
      items: f.items.map((item: any, idx: number) =>
        idx === i ? { ...item, [field]: value } : item
      ),
    }))

  const subtotal = form.items.reduce((s: number, it: any) =>
    s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const taxAmount = subtotal * ((Number(form.tax_rate) || 0) / 100)
  const totalCalc = subtotal + taxAmount - (Number(form.discount_amount) || 0)

  const handleSave = async () => {
    if (!form.issue_date || !form.due_date) return toast.error('Issue date and due date required')
    if (form.items.length === 0) return toast.error('Add at least one line item')
    setSaving(true)
    try {
      const payload = {
        ...form,
        client_id:  form.client_id  ? Number(form.client_id)  : null,
        project_id: form.project_id ? Number(form.project_id) : null,
        items: form.items.map((it: any) => ({
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          amount: Number(it.quantity) * Number(it.unit_price),
        })),
      }
      if (editInvoice) {
        await invoicesApi.update(editInvoice.id, payload)
        toast.success('Invoice updated')
      } else {
        await invoicesApi.create(payload)
        toast.success('Invoice created!')
      }
      setModalOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save invoice')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await invoicesApi.delete(deleteTarget.id)
      toast.success('Invoice deleted')
      setDeleteTarget(null)
      await load()
    } catch { toast.error('Failed to delete') }
    finally { setDeleting(false) }
  }

  const handleMarkSent = async (id: number) => {
    setMarkingSent(id)
    try {
      await invoicesApi.markSent(id)
      toast.success('Invoice marked as sent')
      await load()
    } catch { toast.error('Failed to update') }
    finally { setMarkingSent(null) }
  }

  const handleMarkPaid = async (id: number) => {
    setMarkingPaid(id)
    try {
      await invoicesApi.markPaid(id)
      toast.success('Invoice marked as paid! 🎉')
      await load()
    } catch { toast.error('Failed to update') }
    finally { setMarkingPaid(null) }
  }

  const handleDownloadPdf = async (inv: any) => {
    setDownloading(inv.id)
    try {
      const res = await invoicesApi.downloadPdf(inv.id)
      downloadBlob(res.data, `Invoice-${inv.invoice_number}.pdf`)
      toast.success('PDF downloaded!')
    } catch { toast.error('Failed to generate PDF') }
    finally { setDownloading(null) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container space-y-5 max-w-[1600px]">
      <SectionHeader
        title="Invoices"
        description={`${invoices.length} invoice${invoices.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> New Invoice
          </button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <DollarSign size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</p>
            <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding</p>
            <p className="text-xl font-bold text-amber-700">{formatCurrency(totalOutstanding)}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-bold text-red-700">{formatCurrency(totalOverdue)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices…" className="input-field pl-9 py-2" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="select-field w-auto py-2">
          {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Invoice Table */}
      {filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={28} />}
            title="No invoices found"
            description="Create professional invoices and get paid faster."
            action={<button onClick={openCreate} className="btn-primary">+ New Invoice</button>}
          />
        </div>
      ) : (
        <div className="table-container">
          <table className="w-full">
            <thead>
              <tr>
                {['Invoice #','Client','Issue Date','Due Date','Total','Status','Actions'].map((h) => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="table-row">
                  <td className="table-td">
                    <button onClick={() => setViewInvoice(inv)}
                      className="font-mono font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                      {inv.invoice_number}
                    </button>
                  </td>
                  <td className="table-td">
                    <p className="font-medium text-slate-900">{inv.client_name || '—'}</p>
                    {inv.project_name && <p className="text-xs text-slate-400">{inv.project_name}</p>}
                  </td>
                  <td className="table-td text-slate-500">{formatDate(inv.issue_date)}</td>
                  <td className="table-td text-slate-500">
                    <span className={inv.status === 'overdue' ? 'text-red-600 font-semibold' : ''}>
                      {formatDate(inv.due_date)}
                    </span>
                  </td>
                  <td className="table-td">
                    <span className="font-semibold text-slate-900 font-mono">{formatCurrency(inv.total)}</span>
                  </td>
                  <td className="table-td">
                    <span className={getInvoiceStatusClass(inv.status)}>{capitalize(inv.status)}</span>
                  </td>
                  <td className="table-td">
                    <div className="flex items-center gap-1">
                      {inv.status === 'draft' && (
                        <button
                          onClick={() => handleMarkSent(inv.id)}
                          disabled={markingSent === inv.id}
                          title="Mark as Sent"
                          className="btn-ghost p-1.5 text-blue-500 hover:bg-blue-50">
                          {markingSent === inv.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Send size={14} />}
                        </button>
                      )}
                      {['sent','viewed','overdue'].includes(inv.status) && (
                        <button
                          onClick={() => handleMarkPaid(inv.id)}
                          disabled={markingPaid === inv.id}
                          title="Mark as Paid"
                          className="btn-ghost p-1.5 text-emerald-500 hover:bg-emerald-50">
                          {markingPaid === inv.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <CheckCircle size={14} />}
                        </button>
                      )}
                      <button onClick={() => handleDownloadPdf(inv)}
                        disabled={downloading === inv.id}
                        title="Download PDF"
                        className="btn-ghost p-1.5">
                        {downloading === inv.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Download size={14} />}
                      </button>
                      <button onClick={() => openEdit(inv)} className="btn-ghost p-1.5">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(inv)}
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

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editInvoice ? `Edit ${editInvoice.invoice_number}` : 'New Invoice'}
        maxWidth="max-w-3xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editInvoice ? 'Save Changes' : 'Create Invoice'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="input-label">Client</label>
              <select className="select-field" value={form.client_id}
                onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">No client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Project</label>
              <select className="select-field" value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}>
                <option value="">No project</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Issue Date</label>
              <input type="date" className="input-field" value={form.issue_date}
                onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Due Date</label>
              <input type="date" className="input-field" value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">Line Items</label>
              <button type="button" onClick={addItem} className="btn-ghost text-xs py-1 px-2">
                <Plus size={12} /> Add Item
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-2">
                <span className="col-span-6 text-xs font-semibold text-slate-500">Description</span>
                <span className="col-span-2 text-xs font-semibold text-slate-500 text-right">Qty</span>
                <span className="col-span-3 text-xs font-semibold text-slate-500 text-right">Unit Price</span>
                <span className="col-span-1" />
              </div>
              {form.items.map((item: any, i: number) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="input-field col-span-6 py-2" value={item.description}
                    onChange={(e) => updateItem(i, 'description', e.target.value)}
                    placeholder="Service description" />
                  <input type="number" className="input-field col-span-2 py-2 text-right" step="0.5"
                    value={item.quantity}
                    onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                    min="0" />
                  <input type="number" className="input-field col-span-3 py-2 text-right font-mono" step="0.01"
                    value={item.unit_price}
                    onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                    min="0" placeholder="0.00" />
                  <button type="button" onClick={() => removeItem(i)}
                    className="col-span-1 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-3 items-start">
            <div className="space-y-3">
              <div className="form-group">
                <label className="input-label">Tax Rate (%)</label>
                <input type="number" className="input-field" step="0.1" min="0" max="100"
                  value={form.tax_rate}
                  onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="input-label">Discount ($)</label>
                <input type="number" className="input-field" step="0.01" min="0"
                  value={form.discount_amount}
                  onChange={(e) => setForm({ ...form, discount_amount: e.target.value })} />
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {Number(form.tax_rate) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Tax ({form.tax_rate}%)</span>
                  <span className="font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {Number(form.discount_amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-semibold text-red-600">− {formatCurrency(Number(form.discount_amount))}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="text-brand-700">{formatCurrency(totalCalc)}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Notes / Payment Instructions</label>
            <textarea className="input-field resize-none" rows={3} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Payment instructions, bank details, thank you note…" />
          </div>
        </div>
      </Modal>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <Modal open={!!viewInvoice} onClose={() => setViewInvoice(null)}
          title={`Invoice ${viewInvoice.invoice_number}`}
          maxWidth="max-w-2xl"
          footer={
            <div className="flex items-center gap-2">
              <button onClick={() => { openEdit(viewInvoice); setViewInvoice(null) }} className="btn-secondary">
                <Pencil size={14} /> Edit
              </button>
              <button onClick={() => handleDownloadPdf(viewInvoice)} className="btn-primary">
                {downloading === viewInvoice.id
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Download size={14} />}
                Download PDF
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <span className={getInvoiceStatusClass(viewInvoice.status)}>{capitalize(viewInvoice.status)}</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Client</p>
                <p className="text-sm font-semibold text-slate-900">{viewInvoice.client_name || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Due Date</p>
                <p className="text-sm font-semibold text-slate-900">{formatDate(viewInvoice.due_date)}</p>
              </div>
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-th text-left">Description</th>
                    <th className="table-th text-right">Qty</th>
                    <th className="table-th text-right">Rate</th>
                    <th className="table-th text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {viewInvoice.items?.map((item: any) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="table-td">{item.description}</td>
                      <td className="table-td text-right">{item.quantity}</td>
                      <td className="table-td text-right font-mono">{formatCurrency(item.unit_price)}</td>
                      <td className="table-td text-right font-mono font-semibold">{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="table-td text-right font-bold text-lg text-slate-900">Total</td>
                    <td className="table-td text-right font-bold text-lg text-brand-700 font-mono">
                      {formatCurrency(viewInvoice.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {viewInvoice.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-sm text-slate-600 whitespace-pre-wrap">
                {viewInvoice.notes}
              </div>
            )}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Delete invoice "${deleteTarget?.invoice_number}"? This cannot be undone.`}
        confirmLabel="Delete Invoice"
        danger loading={deleting}
      />
    </div>
  )
}
