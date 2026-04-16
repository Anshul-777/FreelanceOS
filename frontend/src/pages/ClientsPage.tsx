import { useEffect, useState } from 'react'
import {
  Plus, Users, Search, Mail, Phone, Globe,
  Pencil, Trash2, Building2, TrendingUp, FolderOpen, Loader2,
} from 'lucide-react'
import { clientsApi } from '../api'
import {
  Modal, ConfirmDialog, EmptyState, PageLoader, SectionHeader,
} from '../components/UI'
import {
  formatCurrency, getInitials, getAvatarColor, classNames,
} from '../utils'
import toast from 'react-hot-toast'

const INDUSTRIES = [
  'Technology','Digital Marketing','Design','E-commerce','Finance',
  'Healthcare','Education','Real Estate','Non-profit','Consulting','Other',
]

const EMPTY_FORM = {
  name: '', company: '', email: '', phone: '', website: '',
  address: '', city: '', country: 'United States', industry: '',
  notes: '', hourly_rate: '', is_active: true,
}

export default function ClientsPage() {
  const [clients, setClients]     = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [selected, setSelected]   = useState<any | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editClient, setEditClient] = useState<any | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null)
  const [form, setForm]           = useState<any>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [clientNotes, setClientNotes] = useState<any[]>([])
  const [newNote, setNewNote]     = useState('')
  const [addingNote, setAddingNote] = useState(false)

  const load = () => clientsApi.list().then((r) => setClients(r.data))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selected) {
      clientsApi.getNotes(selected.id).then((r) => setClientNotes(r.data))
    }
  }, [selected])

  const filtered = clients.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.company || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditClient(null); setForm(EMPTY_FORM); setModalOpen(true) }
  const openEdit = (c: any) => {
    setEditClient(c)
    setForm({
      name: c.name, company: c.company || '', email: c.email || '',
      phone: c.phone || '', website: c.website || '', address: c.address || '',
      city: c.city || '', country: c.country || 'United States',
      industry: c.industry || '', notes: c.notes || '',
      hourly_rate: c.hourly_rate || '', is_active: c.is_active ?? true,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Client name is required')
    setSaving(true)
    try {
      const payload = {
        ...form,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      }
      if (editClient) {
        await clientsApi.update(editClient.id, payload)
        toast.success('Client updated')
      } else {
        await clientsApi.create(payload)
        toast.success('Client added!')
      }
      setModalOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save client')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await clientsApi.delete(deleteTarget.id)
      toast.success('Client deleted')
      setDeleteTarget(null)
      if (selected?.id === deleteTarget.id) setSelected(null)
      await load()
    } catch { toast.error('Failed to delete client') }
    finally { setDeleting(false) }
  }

  const handleAddNote = async () => {
    if (!newNote.trim() || !selected) return
    setAddingNote(true)
    try {
      await clientsApi.addNote(selected.id, newNote)
      const r = await clientsApi.getNotes(selected.id)
      setClientNotes(r.data)
      setNewNote('')
    } catch { toast.error('Failed to add note') }
    finally { setAddingNote(false) }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container max-w-[1600px]">
      <SectionHeader
        title="Clients"
        description={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> New Client
          </button>
        }
      />

      <div className="flex gap-4 h-[calc(100vh-12rem)]">
        {/* Left: Client List */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="input-field pl-9 py-2"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filtered.length === 0 ? (
              <div className="card">
                <EmptyState
                  icon={<Users size={24} />}
                  title="No clients found"
                  description="Add your first client to get started."
                  action={<button onClick={openCreate} className="btn-primary text-sm">+ Add Client</button>}
                />
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={classNames(
                    'w-full text-left card p-4 hover:shadow-card-md transition-all duration-200',
                    selected?.id === c.id ? 'ring-2 ring-brand-500 shadow-card-md' : ''
                  )}>
                  <div className="flex items-center gap-3">
                    <div className="avatar w-10 h-10 text-sm flex-shrink-0"
                      style={{ backgroundColor: getAvatarColor(c.name) }}>
                      {getInitials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate">{c.company || c.email || 'No company'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-semibold text-emerald-600">
                        {c.total_paid > 0 ? `$${(c.total_paid / 1000).toFixed(1)}k` : '—'}
                      </p>
                      <p className="text-xs text-slate-400">{c.total_projects}p</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Client Detail */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="card h-full flex items-center justify-center">
              <EmptyState
                icon={<Users size={28} />}
                title="Select a client"
                description="Click on a client in the list to view their details, projects, and notes."
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Client Header */}
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="avatar w-16 h-16 text-xl"
                      style={{ backgroundColor: getAvatarColor(selected.name) }}>
                      {getInitials(selected.name)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 font-display">{selected.name}</h2>
                      {selected.company && (
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1">
                          <Building2 size={14} />
                          <span className="text-sm">{selected.company}</span>
                        </div>
                      )}
                      {selected.industry && (
                        <span className="badge bg-brand-50 text-brand-700 mt-2">{selected.industry}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(selected)} className="btn-secondary">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(selected)} className="btn-danger">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                  {selected.email && (
                    <a href={`mailto:${selected.email}`}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors">
                      <Mail size={15} className="text-slate-400" />
                      <span className="truncate">{selected.email}</span>
                    </a>
                  )}
                  {selected.phone && (
                    <a href={`tel:${selected.phone}`}
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors">
                      <Phone size={15} className="text-slate-400" />
                      <span>{selected.phone}</span>
                    </a>
                  )}
                  {selected.website && (
                    <a href={selected.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors">
                      <Globe size={15} className="text-slate-400" />
                      <span className="truncate">{selected.website.replace(/^https?:\/\//, '')}</span>
                    </a>
                  )}
                  {(selected.city || selected.country) && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <span>📍</span>
                      <span>{[selected.city, selected.country].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-4 text-center">
                  <TrendingUp size={20} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(selected.total_paid)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Total Paid</p>
                </div>
                <div className="card p-4 text-center">
                  <FolderOpen size={20} className="mx-auto text-brand-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-900">{selected.total_projects}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Projects</p>
                </div>
                <div className="card p-4 text-center">
                  <span className="text-xl mb-2 block">💰</span>
                  <p className="text-2xl font-bold text-slate-900">
                    {selected.hourly_rate ? `$${selected.hourly_rate}/hr` : '—'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Hourly Rate</p>
                </div>
              </div>

              {/* Notes section */}
              <div className="card p-5">
                <h3 className="font-bold text-slate-900 mb-4 font-display">Client Notes</h3>
                {selected.notes && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg mb-4 text-sm text-amber-900">
                    {selected.notes}
                  </div>
                )}
                <div className="space-y-3 mb-4">
                  {clientNotes.map((note) => (
                    <div key={note.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                      <p className="text-sm text-slate-700">{note.content}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(note.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  ))}
                  {clientNotes.length === 0 && !selected.notes && (
                    <p className="text-sm text-slate-400 text-center py-4">No notes yet. Add your first note below.</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newNote} onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAddNote()}
                    placeholder="Add a note…"
                    className="input-field flex-1"
                  />
                  <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
                    className="btn-primary py-2">
                    {addingNote ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editClient ? 'Edit Client' : 'New Client'}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary" disabled={saving}>Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {editClient ? 'Save Changes' : 'Add Client'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="input-label">Contact Name *</label>
            <input className="input-field" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Smith" />
          </div>
          <div className="form-group">
            <label className="input-label">Company</label>
            <input className="input-field" value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Acme Corp" />
          </div>
          <div className="form-group">
            <label className="input-label">Email</label>
            <input type="email" className="input-field" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jane@acmecorp.com" />
          </div>
          <div className="form-group">
            <label className="input-label">Phone</label>
            <input type="tel" className="input-field" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group">
            <label className="input-label">Website</label>
            <input type="url" className="input-field" value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com" />
          </div>
          <div className="form-group">
            <label className="input-label">Industry</label>
            <select className="select-field" value={form.industry}
              title="Select Industry"
              onChange={(e) => setForm({ ...form, industry: e.target.value })}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="input-label">City</label>
            <input className="input-field" value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="San Francisco" />
          </div>
          <div className="form-group">
            <label className="input-label">Country</label>
            <input className="input-field" value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="United States" />
          </div>
          <div className="form-group">
            <label className="input-label">Custom Hourly Rate ($/hr)</label>
            <input type="number" className="input-field" step="0.01" value={form.hourly_rate}
              onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
              placeholder="Leave blank to use default" />
          </div>
          <div className="form-group col-span-2">
            <label className="input-label">Address</label>
            <input className="input-field" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="123 Main St, Suite 400" />
          </div>
          <div className="form-group col-span-2">
            <label className="input-label">Notes</label>
            <textarea className="input-field resize-none" rows={3} value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes about this client…" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Delete "${deleteTarget?.name}"? This will not delete their projects or invoices.`}
        confirmLabel="Delete Client"
        danger
        loading={deleting}
      />
    </div>
  )
}
