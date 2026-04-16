import { useEffect, useState, useMemo } from 'react'
import {
  DollarSign, Clock, FolderOpen, FileText,
  TrendingUp, AlertCircle, Calendar, Users,
  Zap, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  CheckCircle2, Plus, Search, Filter, MessageSquare,
  Star, Target, Sparkles, Coffee, ShieldCheck,
  Briefcase, MousePointer2, ExternalLink
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import { dashboardApi } from '../api'
import {
  PageLoader, ProgressBar,
} from '../components/UI'
import {
  formatCurrency, formatCurrencyCompact, formatDate,
  getInvoiceStatusClass, getDaysUntil, classNames, getInitials, getAvatarColor
} from '../utils'
import { useAuthStore } from '../store'

// ─── Constants & Mock Assets ───────────────────────────────────────────────

const TIPS = [
  "Don't forget to track your expenses for tax season!",
  "Take a 5-minute break every hour to stay productive.",
  "Follow up on invoices that are more than 3 days overdue.",
  "Your best client is a happy client. Send a quick update!",
  "Review your project roadmap every Monday morning."
]

// ─── Sub-Components ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-xl shadow-card-lg p-3 text-xs animate-scale-in">
      <p className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1.5 last:mb-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-slate-600 font-medium capitalize">{p.name}:</span>
          </div>
          <span className="font-bold text-slate-900">{formatCurrency(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

const SimpleStat = ({ title, value, trend, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-card transition-all group">
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${colorClass}`}>
        <Icon size={20} />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
          {Math.abs(trend)}%
        </div>
      )}
    </div>
    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-bold text-slate-900 font-display mt-0.5">{value}</p>
  </div>
)

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTip, setActiveTip] = useState(0)

  useEffect(() => {
    dashboardApi.get()
      .then((r) => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))

    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    const tipTimer = setInterval(() => {
      setActiveTip(prev => (prev + 1) % TIPS.length)
    }, 10000)

    return () => {
      clearInterval(timer)
      clearInterval(tipTimer)
    }
  }, [])

  const greeting = useMemo(() => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }, [currentTime])

  if (loading) return <PageLoader />
  if (!data) return null

  const { stats, revenue_chart, recent_activity, top_clients, upcoming_deadlines } = data
  const topClientTotal = top_clients.reduce((s: number, c: any) => s + c.total_paid, 0) || 1

  return (
    <div className="page-container max-w-[1700px] animate-fade-in p-0 pt-6 px-6">
      
      {/* ─── Hero Section ──────────────────────────────────────────────────── */}
      <div className="relative mb-8 rounded-3xl overflow-hidden h-72 lg:h-80 shadow-card-lg animate-slide-up">
        {/* Background Image */}
        <img 
          src="/images/dashboard-hero.png" 
          alt="Hero background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-12 z-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="avatar w-14 h-14 border-4 border-white/20 shadow-xl text-xl" style={{ backgroundColor: getAvatarColor(user?.full_name || '') }}>
                {getInitials(user?.full_name || '?')}
             </div>
             <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 backdrop-blur-md border border-brand-400/30 text-brand-100 text-[10px] font-bold uppercase tracking-widest rounded-full mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Premium Workspace
                </span>
                <h1 className="text-3xl lg:text-4xl font-bold font-display text-white">
                  {greeting}, <span className="text-brand-300">{user?.full_name.split(' ')[0]}!</span>
                </h1>
             </div>
          </div>
          
          <p className="text-slate-300 max-w-lg text-sm lg:text-base leading-relaxed mb-8">
            You have <span className="text-white font-bold">{stats.active_projects} active projects</span> and <span className="text-white font-bold">{stats.outstanding_count} pending invoices</span>. 
            Your revenue is up <span className="text-emerald-400 font-bold">{stats.revenue_change_pct}%</span> this month. Keep it up!
          </p>

          <div className="flex flex-wrap gap-3">
             <button className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-brand-500/30 transition-all active:scale-95 flex items-center gap-2">
               <Plus size={18} /> New Project
             </button>
             <button className="px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-sm transition-all flex items-center gap-2">
               <Coffee size={18} /> Take Break
             </button>
          </div>
        </div>

        {/* Time Widget */}
        <div className="absolute top-8 right-8 hidden xl:flex flex-col items-end text-white z-10">
           <p className="text-4xl font-bold font-display">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
           <p className="text-slate-300 font-medium">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* ─── Main 3-Column Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Analytics & Invoices (Col 1-8) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* Detailed Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SimpleStat 
              title="Revenue" 
              value={formatCurrencyCompact(stats.total_revenue_this_month)} 
              trend={stats.revenue_change_pct} 
              icon={TrendingUp} 
              colorClass="bg-emerald-100 text-emerald-600" 
            />
            <SimpleStat 
              title="Expenses" 
              value={formatCurrencyCompact(stats.total_expenses_this_month)} 
              icon={ArrowDownRight} 
              colorClass="bg-red-100 text-red-600" 
            />
            <SimpleStat 
              title="Billable Hours" 
              value={`${stats.total_hours_this_month}h`} 
              trend={stats.hours_change_pct} 
              icon={Clock} 
              colorClass="bg-blue-100 text-blue-600" 
            />
            <SimpleStat 
              title="Net Profile" 
              value={formatCurrencyCompact(stats.net_income_this_month)} 
              icon={Star} 
              colorClass="bg-purple-100 text-purple-600" 
            />
          </div>

          {/* Growth Chart Container */}
          <div className="card p-6 min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-slate-900 font-display">Financial Pulse</h2>
                <p className="text-xs text-slate-500">Revenue and expenses trend over the last 6 months</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded-lg border border-brand-100">
                  REVENUE
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                  EXPENSES
                </span>
              </div>
            </div>
            
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={1500}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#F59E0B" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    fillOpacity={1} 
                    fill="url(#colorExp)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Clients - Visual Distribution */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 font-display">Client Impact</h3>
                <Sparkles size={18} className="text-brand-500" />
              </div>
              <div className="space-y-6">
                {top_clients.map((client: any, i: number) => (
                  <div key={client.id} className="group">
                    <div className="flex justify-between items-center mb-2">
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${['bg-brand-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'][i % 5]}`} />
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">{client.name}</p>
                       </div>
                       <p className="text-xs font-bold text-slate-900">{formatCurrencyCompact(client.total_paid)}</p>
                    </div>
                    <ProgressBar 
                      value={client.total_paid} 
                      max={topClientTotal} 
                      height="h-1.5"
                      color={['bg-brand-500', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'][i % 5]} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Invoicing Status */}
            <div className="card p-6 h-full flex flex-col">
              <h3 className="font-bold text-slate-900 font-display mb-6">Cashflow Status</h3>
              <div className="flex-1 grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex flex-col justify-between">
                    <CheckCircle2 size={18} className="text-emerald-500 mb-2" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Paid Total</p>
                      <p className="text-xl font-bold text-emerald-900">{formatCurrencyCompact(stats.total_revenue_this_month)}</p>
                    </div>
                 </div>
                 <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex flex-col justify-between">
                    <AlertCircle size={18} className="text-amber-500 mb-2" />
                    <div>
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Outstanding</p>
                      <p className="text-xl font-bold text-amber-900">{formatCurrencyCompact(stats.outstanding_invoices)}</p>
                    </div>
                 </div>
              </div>
              <button className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                <FileText size={16} /> View All Invoices
              </button>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Project Pulse & Activities (Col 9-12) */}
        {/* We will split the remaining 4 cols into sub-columns if wide enough, or just a rich feed */}
        <div className="xl:col-span-4 space-y-6">
          
          {/* Productivity Assistant (The 3rd Scroll - Right Sidebar Component) */}
          <div className="card bg-slate-900 text-white overflow-hidden p-6 relative">
             <div className="absolute top-0 right-0 p-6 opacity-10">
               <Sparkles size={120} />
             </div>
             
             <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                   <Target size={20} className="text-brand-400" />
                   <h3 className="font-bold font-display text-lg">Freelance Compass</h3>
                </div>

                <div className="mb-8">
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Focus Goal</p>
                      <p className="text-[10px] font-bold text-brand-300">80% Reached</p>
                   </div>
                   <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full w-[80%] transition-all duration-1000" />
                   </div>
                   <p className="text-xs text-slate-400 mt-2">6.4h tracked of your 8h daily goal</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 transition-transform hover:translate-x-1 cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg">
                        <Sparkles size={20} />
                     </div>
                     <div>
                        <p className="text-sm font-bold">New Prospect Alert</p>
                        <p className="text-xs text-slate-400">Review lead from ACME Corp</p>
                     </div>
                     <ArrowUpRight size={16} className="ml-auto text-slate-500" />
                  </div>
                  
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 transition-transform hover:translate-x-1 cursor-pointer">
                     <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg">
                        <Coffee size={20} />
                     </div>
                     <div>
                        <p className="text-sm font-bold">Break Time Recommended</p>
                        <p className="text-xs text-slate-400">Rest for optimal creativity</p>
                     </div>
                     <ArrowUpRight size={16} className="ml-auto text-slate-500" />
                  </div>
                </div>

                {/* Rotating Tip */}
                <div className="mt-8 pt-6 border-t border-white/10">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Daily Professional Tip</p>
                   <p className="text-sm text-slate-300 italic leading-relaxed animate-fade-in" key={activeTip}>
                     "{TIPS[activeTip]}"
                   </p>
                </div>
             </div>
          </div>

          {/* Recent Activity List - Nested Scrolling Column */}
          <div className="card overflow-hidden h-[500px] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-slate-900 font-display">Live Tracking</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Real-time workspace events</p>
              </div>
              <button title="Filter activity" className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors">
                <Filter size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
              {recent_activity.length === 0 ? (
                <div className="py-20 text-center">
                  <MousePointer2 size={32} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-sm text-slate-400">Waiting for activity...</p>
                </div>
              ) : (
                recent_activity.map((item: any) => (
                  <div key={`${item.type}-${item.id}`} className="group relative flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                    <div className="relative flex flex-col items-center">
                       <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 z-10 shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: item.color + '15', color: item.color }}>
                          {item.type === 'time_entry' && <Clock size={16} />}
                          {item.type === 'invoice' && <FileText size={16} />}
                          {item.type === 'project' && <Briefcase size={16} />}
                       </div>
                       <div className="flex-1 w-px bg-slate-100 my-1 group-last:hidden" />
                    </div>
                    
                    <div className="flex-1 pt-0.5">
                       <div className="flex justify-between items-start mb-0.5">
                          <p className="text-sm font-semibold text-slate-800 leading-tight pr-4">
                            {item.description}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{item.date}</span>
                       </div>
                       <p className="text-xs text-slate-400 mb-2 truncate max-w-[200px]">System update processed</p>
                       
                       {item.amount > 0 && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-100 rounded-lg shadow-sm">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                             <span className="text-[10px] font-bold text-slate-900">{formatCurrencyCompact(item.amount)}</span>
                          </div>
                       )}
                    </div>
                    
                    <button title="More options" className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-slate-600">
                       <MoreHorizontal size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-slate-50 bg-slate-50/50">
               <button className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors">
                  View Full History
               </button>
            </div>
          </div>

          {/* Upcoming Deadlines Widget */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
               <h3 className="font-bold text-slate-900 font-display">Deadlines</h3>
               <Calendar size={18} className="text-rose-500" />
            </div>
            
            <div className="space-y-4">
               {upcoming_deadlines.length === 0 ? (
                 <p className="text-sm text-slate-400 text-center py-6">All caught up!</p>
               ) : (
                 upcoming_deadlines.slice(0, 3).map((d: any) => {
                   const daysLeft = getDaysUntil(d.due_date)
                   const urgent = daysLeft !== null && daysLeft <= 7
                   return (
                     <div key={d.id} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: d.color }} />
                        <div className="flex-1 min-w-0">
                           <p className="text-sm font-bold text-slate-900 truncate">{d.name}</p>
                           <p className="text-xs text-slate-500 truncate">{d.client_name}</p>
                        </div>
                        <div className="text-right">
                           <p className={classNames(
                             'text-xs font-black uppercase tracking-widest',
                             urgent ? 'text-rose-600' : 'text-slate-500'
                           )}>
                             {daysLeft === 0 ? 'Today!' : daysLeft === 1 ? '1D' : `${daysLeft}D`}
                           </p>
                        </div>
                     </div>
                   )
                 })
               )}
            </div>
            <button className="mt-6 w-full py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
               Open Roadmap <ExternalLink size={12} />
            </button>
          </div>

        </div>
      </div>

      {/* ─── Footer Details Section ────────────────────────────────────────── */}
      <div className="mt-12 mb-12 grid grid-cols-1 md:grid-cols-3 gap-8 border-t border-slate-100 pt-12">
         <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 flex-shrink-0">
               <Sparkles size={24} />
            </div>
            <div>
               <h4 className="font-bold text-slate-900 mb-1">Encrypted Workspace</h4>
               <p className="text-xs text-slate-500 max-w-xs">Your financial and client data is protected with industry-standard security protocols.</p>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
               <Zap size={24} />
            </div>
            <div>
               <h4 className="font-bold text-slate-900 mb-1">Optimized Performance</h4>
               <p className="text-xs text-slate-500 max-w-xs">Running on the latest version of FreelanceOS for maximum speed and productivity.</p>
            </div>
         </div>
         <div className="flex gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
               <MessageSquare size={24} />
            </div>
            <div>
               <h4 className="font-bold text-slate-900 mb-1">Priority Support</h4>
               <p className="text-xs text-slate-500 max-w-xs">Reach out anytime for help with your workspace or business operations.</p>
            </div>
         </div>
      </div>
    </div>
  )
}
