import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Zap, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react'
import { authApi } from '../api'
import { useAuthStore } from '../store'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const { login }               = useAuthStore()
  const navigate                = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      login(res.data.access_token, res.data.user)
      toast.success(`Welcome back, ${res.data.user.full_name.split(' ')[0]}!`)
      navigate('/app/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white animate-fade-in relative">
      {/* Close button */}
      <button 
        onClick={() => navigate('/')}
        title="Back to home"
        className="absolute top-6 left-6 z-50 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all"
      >
        <span className="sr-only">Close</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      {/* Left: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 max-w-2xl">
        {/* Logo */}
        <div className="mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-brand">
              <Zap size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl font-bold text-slate-900">
              Freelance<span className="text-brand-600">OS</span>
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 font-display tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-slate-500 text-base">
            Sign in to your workspace and keep building.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="form-group">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label className="input-label">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                title={showPass ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 text-sm">
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ArrowRight size={16} />
            )}
            {loading ? 'Signing in…' : 'Sign In to FreelanceOS'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Need a workspace?{' '}
          <Link to="/register" className="text-brand-600 font-bold hover:underline">
            Create one for free
          </Link>
        </p>

        <p className="mt-8 text-xs text-slate-400 text-center">
          FreelanceOS — The complete operating system for independent professionals.
        </p>
      </div>

      {/* Right: Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-brand-900 to-slate-900 flex-col justify-center px-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-500/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10">
          <div className="mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-600/30 border border-brand-500/30 text-brand-300 text-xs font-semibold rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              All-in-one platform
            </span>
            <h2 className="text-4xl font-bold font-display text-white leading-tight">
              Everything you need<br />
              <span className="text-brand-400">to run your freelance<br />business.</span>
            </h2>
            <p className="text-slate-400 mt-4 text-base leading-relaxed">
              Projects, time tracking, invoicing, expenses, and analytics
              — all connected in one beautiful workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-10">
            {[
              { label: 'Time Tracking',      emoji: '⏱',  desc: 'Real-time timer' },
              { label: 'Smart Invoices',     emoji: '🧾',  desc: 'PDF generation' },
              { label: 'Project Kanban',     emoji: '📋',  desc: 'Drag & drop tasks' },
              { label: 'Revenue Analytics',  emoji: '📊',  desc: 'Visual reports' },
              { label: 'Expense Tracking',   emoji: '💸',  desc: 'By category' },
              { label: 'Client CRM',         emoji: '👥',  desc: 'Full contact mgmt' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                <span className="text-xl">{f.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
