import { X, AlertTriangle, Loader2 } from 'lucide-react'
import { ReactNode } from 'react'
import { classNames } from '../../utils'

// ─── Modal ─────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: string
}
export function Modal({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={classNames('modal-content', maxWidth)}>
        <div className="modal-header">
          <h3 className="text-lg font-bold text-slate-900 font-display">{title}</h3>
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

// ─── Loading Spinner ────────────────────────────────────────────────────────
export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <div className={classNames('flex items-center justify-center', className)}>
      <Loader2 size={size} className="animate-spin text-brand-600" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center h-full min-h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-brand-600" />
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    </div>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Confirm Dialog ─────────────────────────────────────────────────────────
interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
}
export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', danger = false, loading = false,
}: ConfirmDialogProps) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-sm">
        <div className="modal-body pt-6">
          <div className={classNames(
            'w-12 h-12 rounded-2xl flex items-center justify-center mb-4',
            danger ? 'bg-red-50' : 'bg-amber-50'
          )}>
            <AlertTriangle size={22} className={danger ? 'text-red-500' : 'text-amber-500'} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2 font-display">{title}</h3>
          <p className="text-sm text-slate-600">{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={danger ? 'btn-danger' : 'btn-primary'}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  icon?: ReactNode
  iconBg?: string
  accent?: string
}
export function StatCard({ title, value, subtitle, trend, icon, iconBg = 'bg-brand-50', accent = 'text-brand-600' }: StatCardProps) {
  const isPositive = trend ? trend.value >= 0 : null
  return (
    <div className="stat-card hover:shadow-card-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{title}</p>
          <p className={classNames('text-2xl font-bold tracking-tight', accent)}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={classNames('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', iconBg)}>
            <span className={accent}>{icon}</span>
          </div>
        )}
      </div>
      {trend && (
        <div className={classNames(
          'flex items-center gap-1 mt-3 text-xs font-medium',
          isPositive ? 'text-emerald-600' : 'text-red-500'
        )}>
          <span>{isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%</span>
          <span className="text-slate-400 font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  )
}

// ─── Badge ──────────────────────────────────────────────────────────────────
export function Badge({ children, variant = 'default', className = '' }: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple';
  className?: string;
}) {
  const variantClasses = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error:   'bg-red-50 text-red-700',
    info:    'bg-blue-50 text-blue-700',
    purple:  'bg-purple-50 text-purple-700',
  }
  return (
    <span className={classNames('badge', variantClasses[variant], className)}>
      {children}
    </span>
  )
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'bg-brand-600', height = 'h-2', showLabel = false }: {
  value: number; max?: number; color?: string; height?: string; showLabel?: boolean;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{value.toFixed(0)} / {max.toFixed(0)}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className={classNames('w-full bg-slate-100 rounded-full overflow-hidden', height)}>
        <div
          className={classNames('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Section Header ─────────────────────────────────────────────────────────
export function SectionHeader({ title, action, description }: {
  title: string; action?: ReactNode; description?: string;
}) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
