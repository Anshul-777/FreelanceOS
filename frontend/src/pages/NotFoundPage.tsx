import { useNavigate } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="font-display text-[120px] font-bold text-slate-200 leading-none mb-4 select-none">
          404
        </div>
        <h1 className="text-2xl font-bold text-slate-900 font-display mb-2">Page not found</h1>
        <p className="text-slate-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-secondary">
            <ArrowLeft size={15} /> Go Back
          </button>
          <button onClick={() => navigate('/app/dashboard')} className="btn-primary">
            <Home size={15} /> Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}
