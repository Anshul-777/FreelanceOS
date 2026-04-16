import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FolderOpen, Users, FileText, Clock, Receipt, X, ArrowRight } from 'lucide-react'
import { projectsApi, clientsApi, invoicesApi } from '../../api'
import { formatCurrency, getProjectStatusClass, capitalize, classNames } from '../../utils'

interface SearchResult {
  id: number
  type: 'project' | 'client' | 'invoice'
  title: string
  subtitle?: string
  badge?: string
  badgeClass?: string
  value?: string
  url: string
}

interface GlobalSearchProps {
  open: boolean
  onClose: () => void
}

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<SearchResult[]>([])
  const [loading, setLoading]   = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef                = useRef<HTMLInputElement>(null)
  const navigate                = useNavigate()

  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const [projRes, clientRes, invRes] = await Promise.all([
          projectsApi.list({ status_filter: '' }),
          clientsApi.list({ search: query }),
          invoicesApi.list(),
        ])

        const q = query.toLowerCase()

        const projectResults: SearchResult[] = projRes.data
          .filter((p: any) =>
            p.name.toLowerCase().includes(q) ||
            (p.description || '').toLowerCase().includes(q) ||
            (p.client_name || '').toLowerCase().includes(q)
          )
          .slice(0, 4)
          .map((p: any) => ({
            id: p.id,
            type: 'project' as const,
            title: p.name,
            subtitle: p.client_name || 'No client',
            badge: capitalize(p.status),
            badgeClass: getProjectStatusClass(p.status),
            url: `/projects/${p.id}`,
          }))

        const clientResults: SearchResult[] = clientRes.data
          .slice(0, 4)
          .map((c: any) => ({
            id: c.id,
            type: 'client' as const,
            title: c.name,
            subtitle: c.company || c.email || '',
            value: c.total_paid > 0 ? formatCurrency(c.total_paid) : undefined,
            url: `/clients`,
          }))

        const invoiceResults: SearchResult[] = invRes.data
          .filter((i: any) =>
            i.invoice_number.toLowerCase().includes(q) ||
            (i.client_name || '').toLowerCase().includes(q)
          )
          .slice(0, 3)
          .map((i: any) => ({
            id: i.id,
            type: 'invoice' as const,
            title: i.invoice_number,
            subtitle: i.client_name || 'No client',
            value: formatCurrency(i.total),
            badge: capitalize(i.status),
            badgeClass: `badge ${i.status === 'paid' ? 'bg-emerald-50 text-emerald-700' : i.status === 'overdue' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`,
            url: `/invoices`,
          }))

        setResults([...projectResults, ...clientResults, ...invoiceResults])
        setSelected(0)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    navigate(result.url)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, 0))
    } else if (e.key === 'Enter' && results[selected]) {
      handleSelect(results[selected])
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  const ICONS = {
    project: <FolderOpen size={15} className="text-brand-500" />,
    client:  <Users size={15} className="text-blue-500" />,
    invoice: <FileText size={15} className="text-emerald-500" />,
  }

  const TYPE_LABELS = {
    project: 'Project',
    client:  'Client',
    invoice: 'Invoice',
  }

  const QUICK_LINKS = [
    { label: 'New Project',  url: '/projects?new=1',  icon: <FolderOpen size={14} /> },
    { label: 'Log Time',     url: '/time?log=1',      icon: <Clock size={14} /> },
    { label: 'New Invoice',  url: '/invoices?new=1',  icon: <FileText size={14} /> },
    { label: 'Add Expense',  url: '/expenses?new=1',  icon: <Receipt size={14} /> },
  ]

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-card-lg w-full max-w-xl overflow-hidden animate-scale-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search size={18} className="text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, clients, invoices…"
            className="flex-1 text-sm text-slate-900 bg-transparent outline-none placeholder-slate-400"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={15} />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-slate-400 bg-slate-100 rounded border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-6 text-center text-sm text-slate-400">Searching…</div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-slate-500">No results for "<strong>{query}</strong>"</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="py-1.5">
              {results.map((result, i) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  onMouseEnter={() => setSelected(i)}
                  className={classNames(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    selected === i ? 'bg-brand-50' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {ICONS[result.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{result.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{TYPE_LABELS[result.type]}</span>
                      {result.subtitle && (
                        <span className="text-xs text-slate-500 truncate">· {result.subtitle}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {result.badge && (
                      <span className={result.badgeClass}>{result.badge}</span>
                    )}
                    {result.value && (
                      <span className="text-sm font-semibold text-slate-700">{result.value}</span>
                    )}
                    {selected === i && (
                      <ArrowRight size={14} className="text-brand-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick links when no query */}
          {!query && (
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Quick Actions
              </p>
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.label}
                  onClick={() => { navigate(link.url); onClose() }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
                    {link.icon}
                  </div>
                  <span className="text-sm text-slate-700">{link.label}</span>
                  <ArrowRight size={13} className="ml-auto text-slate-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="px-4 py-2.5 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">↑↓</kbd> Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">↵</kbd> Open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">ESC</kbd> Close
          </span>
        </div>
      </div>
    </div>
  )
}
