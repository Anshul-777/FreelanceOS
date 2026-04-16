import { useState, useEffect } from 'react'
import { authApi } from '../api'
import { useAuthStore } from '../store'
import { SectionHeader } from '../components/UI'
import { Save, Loader2, User, Building2, CreditCard, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { getInitials, getAvatarColor } from '../utils'

const CURRENCIES = ['USD','EUR','GBP','CAD','AUD','SGD','INR','JPY','CHF','NZD']

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore()
  const [tab, setTab] = useState<'profile' | 'business' | 'billing' | 'security'>('profile')
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        company_name: user.company_name || '',
        phone: user.phone || '',
        bio: user.bio || '',
        website: user.website || '',
        address: user.address || '',
        city: user.city || '',
        country: user.country || 'United States',
        currency: user.currency || 'USD',
        hourly_rate: user.hourly_rate || 75,
        tax_number: user.tax_number || '',
        invoice_prefix: user.invoice_prefix || 'INV',
        invoice_notes: user.invoice_notes || '',
        payment_terms: user.payment_terms || 30,
      })
    }
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authApi.updateMe(form)
      updateUser(res.data)
      toast.success('Settings saved!')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  const handleChangePw = async () => {
    if (pwForm.next !== pwForm.confirm) return toast.error('Passwords do not match')
    if (pwForm.next.length < 6) return toast.error('Password must be at least 6 characters')
    setSavingPw(true)
    try {
      await authApi.changePassword(pwForm.current, pwForm.next)
      toast.success('Password changed successfully!')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to change password')
    } finally { setSavingPw(false) }
  }

  const TABS = [
    { id: 'profile',  label: 'Profile',         icon: User },
    { id: 'business', label: 'Business',         icon: Building2 },
    { id: 'billing',  label: 'Invoicing',        icon: CreditCard },
    { id: 'security', label: 'Security',         icon: Shield },
  ]

  const initials = user ? getInitials(user.full_name) : '?'
  const avatarBg = user ? getAvatarColor(user.full_name) : '#4F46E5'

  return (
    <div className="page-container max-w-[1600px] space-y-6">
      <SectionHeader title="Settings" description="Manage your account and preferences" />

      {/* Profile Banner */}
      <div className="card p-6 flex items-center gap-5">
        <div className="avatar w-16 h-16 text-2xl" style={{ backgroundColor: avatarBg }}>
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">{user?.full_name}</h2>
          <p className="text-slate-500">{user?.email}</p>
          {user?.company_name && (
            <p className="text-sm text-brand-600 font-medium">{user.company_name}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full sm:w-auto sm:inline-flex">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
              tab === id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ─────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-slate-900 font-display">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <input className="input-field" value={form.full_name || ''}
                title="Full Name"
                placeholder="Enter your full name"
                onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Phone</label>
              <input type="tel" className="input-field" value={form.phone || ''}
                title="Phone Number"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 (555) 000-0000" />
            </div>
            <div className="form-group">
              <label className="input-label">Website</label>
              <input type="url" className="input-field" value={form.website || ''}
                title="Website URL"
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yoursite.com" />
            </div>
            <div className="form-group">
              <label className="input-label">City</label>
              <input className="input-field" value={form.city || ''}
                title="City"
                placeholder="City"
                onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Country</label>
              <input className="input-field" value={form.country || ''}
                title="Country"
                placeholder="Country"
                onChange={(e) => setForm({ ...form, country: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Address</label>
              <input className="input-field" value={form.address || ''}
                title="Address"
                placeholder="Address"
                onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group sm:col-span-2">
              <label className="input-label">Bio</label>
              <textarea className="input-field resize-none" rows={3} value={form.bio || ''}
                title="Personal Bio"
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="A brief introduction about yourself…" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Business Tab ─────────────────────────────────────────────── */}
      {tab === 'business' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-slate-900 font-display">Business Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group sm:col-span-2">
              <label className="input-label">Company / Business Name</label>
              <input className="input-field" value={form.company_name || ''}
                title="Company Name"
                onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                placeholder="Your Freelance Company LLC" />
            </div>
            <div className="form-group">
              <label className="input-label">Default Hourly Rate ($/hr)</label>
              <input type="number" className="input-field" step="0.5" min="0"
                value={form.hourly_rate || ''}
                title="Hourly Rate"
                placeholder="0.00"
                onChange={(e) => setForm({ ...form, hourly_rate: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label className="input-label">Currency</label>
              <select className="select-field" value={form.currency || 'USD'}
                title="Select Currency"
                onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Tax / VAT / EIN Number</label>
              <input className="input-field" value={form.tax_number || ''}
                title="Tax Identification Number"
                onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                placeholder="e.g. EIN: 12-3456789" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Business Info
            </button>
          </div>
        </div>
      )}

      {/* ── Billing / Invoicing Tab ──────────────────────────────────── */}
      {tab === 'billing' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-slate-900 font-display">Invoice Defaults</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="input-label">Invoice Number Prefix</label>
              <input className="input-field" value={form.invoice_prefix || 'INV'}
                title="Invoice Prefix"
                onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value })}
                placeholder="INV" />
              <p className="text-xs text-slate-400 mt-1">
                Example: {form.invoice_prefix || 'INV'}-0001
              </p>
            </div>
            <div className="form-group">
              <label className="input-label">Default Payment Terms (days)</label>
              <input type="number" className="input-field" min="1" max="365"
                value={form.payment_terms || 30}
                title="Payment Terms"
                placeholder="30"
                onChange={(e) => setForm({ ...form, payment_terms: Number(e.target.value) })} />
            </div>
            <div className="form-group sm:col-span-2">
              <label className="input-label">Default Invoice Notes / Payment Instructions</label>
              <textarea className="input-field resize-none" rows={5}
                value={form.invoice_notes || ''}
                title="Default Invoice Notes"
                onChange={(e) => setForm({ ...form, invoice_notes: e.target.value })}
                placeholder="Bank details, payment methods, late fee policy…" />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Invoice Settings
            </button>
          </div>
        </div>
      )}

      {/* ── Security Tab ─────────────────────────────────────────────── */}
      {tab === 'security' && (
        <div className="card p-6 space-y-5">
          <h3 className="font-bold text-slate-900 font-display">Change Password</h3>
          <div className="max-w-sm space-y-4">
            <div className="form-group">
              <label className="input-label">Current Password</label>
              <input type="password" className="input-field" value={pwForm.current}
                title="Current Password"
                placeholder="••••••••"
                onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">New Password</label>
              <input type="password" className="input-field" value={pwForm.next}
                title="New Password"
                placeholder="••••••••"
                onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="input-label">Confirm New Password</label>
              <input type="password" className="input-field" value={pwForm.confirm}
                title="Confirm New Password"
                placeholder="••••••••"
                onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
            </div>
            <button onClick={handleChangePw} className="btn-primary" disabled={savingPw}>
              {savingPw ? <Loader2 size={14} className="animate-spin" /> : <Shield size={14} />}
              Update Password
            </button>
          </div>

          <div className="border-t border-slate-100 pt-5 mt-5">
            <h3 className="font-bold text-slate-900 mb-3 font-display">Session</h3>
            <p className="text-sm text-slate-500 mb-4">
              You are currently logged in as <strong>{user?.email}</strong>.
              JWT tokens expire after 30 days.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
