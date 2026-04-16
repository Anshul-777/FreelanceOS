import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

// ─── Currency ─────────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000)     return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toFixed(2)}`
}

// ─── Duration ─────────────────────────────────────────────────────────────
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatHours(minutes: number): string {
  const h = (minutes / 60).toFixed(1)
  return `${h}h`
}

export function minutesToDecimalHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10
}

// ─── Dates ────────────────────────────────────────────────────────────────
export function formatDate(dateStr: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return format(d, fmt)
  } catch { return '—' }
}

export function formatRelativeDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = parseISO(dateStr)
    if (isToday(d)) return 'Today'
    if (isYesterday(d)) return 'Yesterday'
    return formatDistanceToNow(d, { addSuffix: true })
  } catch { return '' }
}

export function getDaysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null
  try {
    const d = parseISO(dateStr)
    const now = new Date()
    now.setHours(0,0,0,0)
    return Math.round((d.getTime() - now.getTime()) / 86400000)
  } catch { return null }
}

// ─── Status Helpers ───────────────────────────────────────────────────────
export function getInvoiceStatusClass(status: string): string {
  const map: Record<string, string> = {
    paid:      'status-badge-paid',
    sent:      'status-badge-sent',
    draft:     'status-badge-draft',
    overdue:   'status-badge-overdue',
    viewed:    'status-badge-viewed',
    cancelled: 'status-badge-cancelled',
  }
  return map[status] || 'badge bg-slate-100 text-slate-600'
}

export function getProjectStatusClass(status: string): string {
  const map: Record<string, string> = {
    active:    'badge bg-emerald-50 text-emerald-700',
    on_hold:   'badge bg-amber-50 text-amber-700',
    completed: 'badge bg-blue-50 text-blue-700',
    lead:      'badge bg-purple-50 text-purple-700',
    cancelled: 'badge bg-slate-100 text-slate-500',
  }
  return map[status] || 'badge bg-slate-100 text-slate-600'
}

export function getTaskStatusClass(status: string): string {
  const map: Record<string, string> = {
    todo:        'badge bg-slate-100 text-slate-600',
    in_progress: 'badge bg-blue-50 text-blue-700',
    review:      'badge bg-purple-50 text-purple-700',
    done:        'badge bg-emerald-50 text-emerald-700',
  }
  return map[status] || 'badge bg-slate-100 text-slate-600'
}

export function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    urgent: 'priority-urgent',
    high:   'priority-high',
    medium: 'priority-medium',
    low:    'priority-low',
  }
  return map[priority] || 'priority-medium'
}

// ─── Avatar ────────────────────────────────────────────────────────────────
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('')
}

const AVATAR_COLORS = [
  '#4F46E5','#0EA5E9','#10B981','#F59E0B','#EC4899',
  '#8B5CF6','#06B6D4','#F97316','#84CC16','#EF4444',
]
export function getAvatarColor(name: string): string {
  let hash = 0
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

// ─── Misc ─────────────────────────────────────────────────────────────────
export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
