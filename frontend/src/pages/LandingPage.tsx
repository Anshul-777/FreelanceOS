import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Zap, CheckCircle, ArrowRight, BarChart3, Clock, Receipt, Users, 
  ShieldCheck, Globe, Rocket, Award, CreditCard, Play, ChevronDown, 
  Menu, X, Check, Laptop, Smartphone, Database, Heart, Mail, Github,
  Twitter, Linkedin, Instagram, HelpCircle, ArrowUpRight, Sparkles, Star
} from 'lucide-react'

// ─── Constants & Content ───────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Product', href: '#product' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
]

const CUSTOMER_LOGOS = [
  { name: 'Vectoria', icon: <div className="w-8 h-8 rounded bg-slate-200" /> },
  { name: 'Lumina', icon: <div className="w-8 h-8 rounded bg-slate-200" /> },
  { name: 'Stellar', icon: <div className="w-8 h-8 rounded bg-slate-200" /> },
  { name: 'HyperFlow', icon: <div className="w-8 h-8 rounded bg-slate-200" /> },
  { name: 'ApexLabs', icon: <div className="w-8 h-8 rounded bg-slate-200" /> },
]

const ALL_FEATURES = [
  {
    title: 'Precision Time Tracking',
    desc: 'Capture every billable minute with one-click timers or manual entries. Seamlessly link time to specific projects and tasks.',
    category: 'PRODUCTIVITY',
    icon: <Clock size={24} className="text-brand-500" />
  },
  {
    title: 'Automated Invoicing',
    desc: 'Convert tracked time into professional PDF invoices in seconds. Track statuses, send reminders, and get paid faster.',
    category: 'FINANCE',
    icon: <Receipt size={24} className="text-emerald-500" />
  },
  {
    title: 'Workflow Kanban',
    desc: 'Visualize your workload with drag-and-drop boards. Manage status across multiple projects without breaking flow.',
    category: 'MANAGEMENT',
    icon: <Zap size={24} className="text-amber-500" />
  },
  {
    title: 'Client Management',
    desc: 'A unified CRM for your independent business. Store contacts, project history, and communication notes in one secure vault.',
    category: 'CRM',
    icon: <Users size={24} className="text-blue-500" />
  },
  {
    title: 'Strategic Analytics',
    desc: 'Gain deep insights into your business health. Visualize revenue streams, expense ratios, and project profitability.',
    category: 'GROWTH',
    icon: <BarChart3 size={24} className="text-purple-500" />
  },
  {
    title: 'Expense Ledger',
    desc: 'Ditch the spreadsheets. Log business expenses by category and keep your finances audit-ready at all times.',
    category: 'FINANCE',
    icon: <ShieldCheck size={24} className="text-rose-500" />
  }
]

const PRICING_PLANS = [
  {
    name: 'Essence',
    price: '0',
    desc: 'Perfect for new freelancers getting their first clients.',
    features: ['Up to 3 Active Projects', 'Unlimited Clients', 'Manual Time Tracking', 'Simple Invoicing', 'Basic Dashboard'],
    cta: 'Start for Free',
    highlight: false
  },
  {
    name: 'Professional',
    price: '19',
    desc: 'Everything you need to run a high-volume business.',
    features: ['Unlimited Projects', 'Automated Invoicing', 'Smart Expense Tracker', 'PDF Report Generation', 'Advanced Analytics', 'Priority Email Support'],
    cta: 'Get Started',
    highlight: true,
    badge: 'MOST POPULAR'
  },
  {
    name: 'Enterprise',
    price: '49',
    desc: 'Custom solutions for small teams and power freelancers.',
    features: ['Everything in Professional', 'Team Collaboration (3 seats)', 'API Access', 'White-label Invoices', 'Dedicated Account Manager', 'Custom Support'],
    cta: 'Contact Sales',
    highlight: false
  }
]

const TESTIMONIALS = [
  {
    quote: "FreelanceOS completely replaced four different apps I was paying for. It’s intuitive, fast, and beautiful.",
    author: "Sarah Jenkins",
    role: "Product Designer",
    company: "Vectoria Design"
  },
  {
    quote: "The invoicing system alone saved me 5 hours a week. I finally feel in control of my finances.",
    author: "Marcello Russo",
    role: "Full-stack Developer",
    company: "Lumina Apps"
  },
  {
    quote: "I’ve tried every tool out there. This is the only one that feels like it was built by freelancers, for freelancers.",
    author: "Aisha Khan",
    role: "Content Strategist",
    company: "ApexLabs"
  },
  {
    quote: "Clean UI, robust features, and zero fluff. Exactly what I needed to scale my agency.",
    author: "David Chen",
    role: "Founder",
    company: "Stellar Studio"
  }
]

const FAQS = [
  {
    q: "Is my data secure?",
    a: "Yes. We use industry-standard AES-256 encryption for all sensitive data and regular backups to ensure your business information is safe and accessible."
  },
  {
    q: "Can I export my data?",
    a: "Absolutely. You can export your invoices, time entries, and expenses in CSV/PDF formats anytime without limitations."
  },
  {
    q: "Do you support multiple currencies?",
    a: "Yes, FreelanceOS supports all major global currencies (USD, EUR, GBP, INR, etc.) for both clients and invoicing."
  },
  {
    q: "Is there a mobile app?",
    a: "Our platform is fully responsive and works perfectly as a PWA on mobile devices. Native iOS/Android apps are on our roadmap for late 2026."
  },
  {
    q: "Can I transition from another tool?",
    a: "We offer CSV import tools to help you bring your clients and historical data from tools like FreshBooks or Harvest."
  }
]

// ─── UI Components ──────────────────────────────────────────────────────────

const SectionHeader = ({ tag, title, desc, centered = true }: any) => (
  <div className={`mb-16 ${centered ? 'text-center' : ''}`}>
    {tag && (
      <span className="inline-block py-1 px-3 mb-4 text-[10px] font-black tracking-[0.2em] text-brand-600 bg-brand-50 rounded-full uppercase">
        {tag}
      </span>
    )}
    <h2 className="text-3xl lg:text-5xl font-display font-extrabold text-slate-900 mb-6 leading-[1.1]">
      {title}
    </h2>
    {desc && <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">{desc}</p>}
  </div>
)

const PricingCard = ({ plan, i }: any) => (
  <div className={`relative p-8 rounded-3xl transition-all duration-300 ${
    plan.highlight 
      ? 'bg-slate-900 text-white scale-105 shadow-2xl xl:z-10 ring-4 ring-brand-500/20' 
      : 'bg-white border border-slate-100 hover:border-brand-200 hover:shadow-xl'
  }`}>
    {plan.badge && (
      <span className="absolute top-0 right-8 -translate-y-1/2 py-1 px-3 bg-brand-500 text-white text-[10px] font-bold rounded-full">
        {plan.badge}
      </span>
    )}
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
      <p className={`text-sm ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>
    </div>
    <div className="mb-8 flex items-baseline gap-1">
      <span className="text-4xl font-bold font-display">${plan.price}</span>
      <span className={`text-sm ${plan.highlight ? 'text-slate-400' : 'text-slate-500'}`}>/month</span>
    </div>
    <ul className="space-y-4 mb-10">
      {plan.features.map((f: string) => (
        <li key={f} className="flex items-center gap-3 text-sm">
          <Check size={16} className="text-brand-500 flex-shrink-0" />
          <span className={plan.highlight ? 'text-slate-300' : 'text-slate-600'}>{f}</span>
        </li>
      ))}
    </ul>
    <Link to="/register" className={`w-full py-4 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
      plan.highlight 
        ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-500/30' 
        : 'bg-slate-100 hover:bg-brand-600 hover:text-white text-slate-900'
    }`}>
      {plan.cta}
      <ArrowRight size={16} />
    </Link>
  </div>
)

const FAQItem = ({ faq }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-slate-100">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{faq.q}</span>
        <ChevronDown size={20} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-brand-500' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
        <p className="text-slate-500 leading-relaxed">{faq.a}</p>
      </div>
    </div>
  )
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#FBFCFE] text-slate-900 font-sans selection:bg-brand-100 selection:text-brand-700 overflow-x-hidden">
      
      {/* ─── Navigation ─────────────────────────────────────────────────── */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 lg:px-12 ${
        scrolled ? 'py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm' : 'py-8'
      }`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                <Zap size={20} className="text-brand-400 fill-current" />
              </div>
              <span className="font-display text-2xl font-black tracking-tight text-slate-900">
                Freelance<span className="text-brand-600">OS</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              {NAV_LINKS.map(link => (
                <a key={link.label} href={link.href} className="text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-sm font-black text-slate-600 hover:text-brand-600 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary py-2.5 px-6 rounded-xl text-xs font-black shadow-lg shadow-brand-500/25">
              Start Free Workspace
            </Link>
            <button title="Open mobile menu" className="lg:hidden p-2 text-slate-900" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[200] bg-white transition-transform duration-500 ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-8 flex flex-col h-full">
            <div className="flex justify-between items-center mb-12">
               <span className="font-display text-2xl font-black">FreelanceOS</span>
               <button title="Close mobile menu" onClick={() => setMobileMenuOpen(false)}><X size={32} /></button>
            </div>
            <div className="flex flex-col gap-8 flex-1">
               {NAV_LINKS.map(link => (
                 <a key={link.label} href={link.href} className="text-3xl font-display font-black text-slate-900" onClick={() => setMobileMenuOpen(false)}>
                   {link.label}
                 </a>
               ))}
            </div>
            <Link to="/register" className="btn-primary py-6 text-xl rounded-2xl justify-center shadow-xl">Join the Platform</Link>
         </div>
      </div>

      <main>
        {/* ─── Hero Section ─────────────────────────────────────────────── */}
        <section className="relative pt-48 pb-32 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-50 pointer-events-none -z-10 rounded-l-[100px]" />
          
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 border border-brand-100 rounded-full mb-8">
                <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-700">VERSION 2.4 IS LIVE</span>
              </div>
              
              <h1 className="text-5xl lg:text-[84px] font-display font-black tracking-tight text-slate-900 mb-8 !leading-[0.95]">
                The Operating System for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-500">Professional Creators.</span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-slate-500 mb-12 leading-relaxed font-medium max-w-xl">
                One unified platform to manage projects, track time, automate invoices, and visualize your growth. Built for the modern independent professional.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link to="/register" className="btn-primary w-full sm:w-auto px-10 py-5 text-lg rounded-2xl group shadow-2xl shadow-brand-500/40">
                  Secure Your Workspace
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#product" className="w-full sm:w-auto px-10 py-5 text-lg font-black text-slate-700 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2">
                  <Play size={18} className="text-brand-600 fill-current" /> View Tour
                </a>
              </div>
              
              <div className="mt-12 flex items-center gap-8 text-slate-400">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck size={16} className="text-emerald-500" /> AES-256 SECURED
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                  <CheckCircle size={16} className="text-emerald-500" /> GDPR COMPLIANT
                </div>
              </div>
            </div>

            <div className="relative animate-fade-in delay-200">
               <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-900/10 border-[12px] border-slate-900 ring-4 ring-slate-100">
                 <img src="/images/product-preview.png" alt="FreelanceOS Dashboard" className="w-full h-auto" />
               </div>
               
               {/* Decorative floating widgets */}
               <div className="absolute top-1/4 -left-12 z-20 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 hidden xl:block animate-slide-up duration-1000">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <ArrowUpRight size={20} className="text-emerald-600" />
                     </div>
                     <div>
                        <p className="text-xs font-bold text-slate-400">NET PROFIT</p>
                        <p className="text-lg font-black text-slate-900">+$12,400</p>
                     </div>
                  </div>
               </div>
               
               <div className="absolute bottom-1/4 -right-12 z-20 bg-slate-900 p-4 rounded-3xl shadow-2xl hidden xl:block animate-slide-up delay-300">
                  <div className="flex items-center gap-3">
                     <Sparkles size={24} className="text-brand-400" />
                     <p className="text-sm font-bold text-white">8 Active Projects</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* ─── Social Proof ─────────────────────────────────────────────── */}
        <section className="py-20 border-y border-slate-100 bg-white overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <p className="text-center text-[10px] font-black tracking-[0.3em] text-slate-400 mb-12 uppercase">JOIN 5,000+ TOP-TIER FREELANCERS FROM</p>
            <div className="flex flex-wrap justify-center items-center gap-12 lg:gap-24 opacity-40 grayscale">
              {CUSTOMER_LOGOS.map(logo => (
                <div key={logo.name} className="flex items-center gap-3 group cursor-default hover:grayscale-0 hover:opacity-100 transition-all">
                  {logo.icon}
                  <span className="font-display text-2xl font-black text-slate-900">{logo.name}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Product Preview Section ───────────────────────────────────── */}
        <section id="product" className="py-32 bg-slate-50">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <SectionHeader 
              tag="THE WORKSPACE"
              title="Focus on what matters. Leave the management to us."
              desc="Built by freelancers who were tired of switching between five different apps to run a single project."
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
               <div className="bg-white rounded-[40px] p-10 lg:p-16 border border-slate-100 shadow-sm flex flex-col justify-center">
                  <Sparkles size={48} className="text-brand-600 mb-8" />
                  <h3 className="text-4xl font-display font-black text-slate-900 mb-6 tracking-tight">One Dashboard. Total Clarity.</h3>
                  <p className="text-lg text-slate-500 mb-10 leading-relaxed">
                    Instantly see your project health, workload, and financial status in real-time. No more guessing how your business is performing this month.
                  </p>
                  <ul className="space-y-4 mb-10">
                    {['Real-time financial pulse', 'Upcoming deadline radar', 'Project Kanban controls', 'Workload balancing overview'].map(f => (
                      <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                        <CheckCircle size={18} className="text-brand-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="inline-flex items-center gap-2 text-brand-600 font-black text-lg hover:underline underline-offset-8">
                     Explore the Workspace <ArrowRight size={20} />
                  </Link>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                     <Clock size={32} className="text-brand-600 mb-6" />
                     <h4 className="text-xl font-bold mb-4">Precision Tracking</h4>
                     <p className="text-sm text-slate-500 leading-relaxed">Capture every minute with context-aware timers that link directly to projects and tasks.</p>
                  </div>
                  <div className="bg-slate-900 p-8 rounded-[40px] text-white shadow-xl shadow-slate-900/20">
                     <Receipt size={32} className="text-brand-400 mb-6" />
                     <h4 className="text-xl font-bold mb-4 text-white">Smart Invoicing</h4>
                     <p className="text-sm text-slate-400 leading-relaxed">Beautifully formatted PDF invoices generated from your tracked hours with one click.</p>
                  </div>
                  <div className="bg-blue-50 p-8 rounded-[40px] border border-blue-100">
                     <Users size={32} className="text-blue-600 mb-6" />
                     <h4 className="text-xl font-bold mb-4">Unified CRM</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">Every client interaction, contact detail, and project history organized in a central vault.</p>
                  </div>
                  <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100">
                     <BarChart3 size={32} className="text-emerald-600 mb-6" />
                     <h4 className="text-xl font-bold mb-4">Live Reports</h4>
                     <p className="text-sm text-slate-600 leading-relaxed">Automatic growth metrics, tax-ready expense logs, and profitability deep-dives.</p>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* ─── Detailed Feature Grid ────────────────────────────────────── */}
        <section id="features" className="py-32 bg-white">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <SectionHeader 
              tag="CORE CAPABILITIES"
              title="A feature set designed for business growth."
              desc="We don't just track tasks; we manage your entire professional ecosystem."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {ALL_FEATURES.map((feature, i) => (
                <div key={i} className="group p-10 rounded-[40px] border border-slate-50 bg-[#FBFCFE] hover:bg-white hover:border-brand-200 hover:shadow-2xl hover:shadow-brand-500/5 transition-all duration-300">
                  <div className="mb-8 flex items-center justify-between">
                     <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all">
                        {feature.icon}
                     </div>
                     <span className="text-[10px] font-black text-slate-300 tracking-[0.2em]">{feature.category}</span>
                  </div>
                  <h3 className="text-2xl font-display font-black text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-base mb-8">
                    {feature.desc}
                  </p>
                  <div className="pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-400 group-hover:text-brand-600 transition-colors">
                     LEARN MORE <ArrowRight size={14} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Testimonials ─────────────────────────────────────────────── */}
        <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_50%)]" />
           <div className="max-w-[1600px] mx-auto px-6 lg:px-12 relative z-10 text-center">
              <SectionHeader 
                tag="SOCIAL PROOF"
                title="Don't just take our word for it."
                desc="Join the world's most successful freelancers who have unified their workflow with FreelanceOS."
              />
              {/* Overriding section header colors for dark mode */}
              <style>{`#social-proof-h2 { color: white !important; }`}</style>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                 {TESTIMONIALS.map((t, i) => (
                    <div key={i} className="p-10 bg-white/5 border border-white/10 rounded-[40px] hover:bg-white/10 transition-all group">
                       <div className="flex gap-1 mb-8">
                          {[...Array(5)].map((_, j) => <Star key={j} size={16} className="text-brand-400 fill-current" />)}
                       </div>
                       <p className="text-2xl font-display font-medium text-slate-200 mb-10 leading-relaxed italic">
                         "{t.quote}"
                       </p>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-brand-500 shadow-lg" />
                          <div>
                             <p className="font-bold text-white">{t.author}</p>
                             <p className="text-xs text-slate-400">{t.role} • {t.company}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* ─── Pricing Section ────────────────────────────────────────────── */}
        <section id="pricing" className="py-32 bg-slate-50">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <SectionHeader 
               tag="PRICING PLANS"
               title="Scalable pricing for every career stage."
               desc="Choose a plan that fits your growth trajectory. No hidden fees, cancel anytime."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {PRICING_PLANS.map((plan, i) => (
                <PricingCard key={plan.name} plan={plan} i={i} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ Section ────────────────────────────────────────────────── */}
        <section id="faq" className="py-32 bg-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <SectionHeader 
               tag="RESOURCES"
               title="Frequently Asked Questions"
               desc="Got questions? We have clear answers. If you need more details, our team is always here to help."
            />
            <div className="mt-12">
              {FAQS.map((faq, i) => <FAQItem key={i} faq={faq} />)}
            </div>
            <div className="mt-16 text-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
               <p className="text-sm font-bold text-slate-600 mb-4">STILL HAVE QUESTIONS?</p>
               <button className="inline-flex items-center gap-2 text-brand-600 font-display font-black text-xl hover:underline">
                  Chat with our Support Specialists <ArrowRight size={24} />
               </button>
            </div>
          </div>
        </section>

        {/* ─── CTA Banner ─────────────────────────────────────────────────── */}
        <section className="px-6 lg:px-12 pb-32">
           <div className="max-w-[1600px] mx-auto bg-brand-600 rounded-[60px] p-12 lg:p-24 relative overflow-hidden shadow-2xl shadow-brand-500/40">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-900/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                 <div className="text-white">
                    <h2 className="text-4xl lg:text-6xl font-display font-extrabold mb-8 leading-tight">Ready to build your <br />professional legacy?</h2>
                    <p className="text-brand-100 text-xl max-w-lg mb-12 font-medium">
                      Join 5,000+ freelancers who have upgraded their business operating system. Sign up today and experience total clarity.
                    </p>
                    <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-lg shadow-xl hover:bg-slate-50 transition-all group">
                       Claim Your Lifetime Access
                       <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    {[
                      { icon: <Sparkles />, title: 'Premium Support' },
                      { icon: <ShieldCheck />, title: 'Ultra Secure' },
                      { icon: <Globe />, title: 'Global Ready' },
                      { icon: <CheckCircle />, title: 'Free Updates' },
                    ].map(item => (
                      <div key={item.title} className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center text-white">
                         <div className="mb-4 text-brand-200 opacity-80">{item.icon}</div>
                         <p className="font-bold text-sm">{item.title}</p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 pt-32 pb-12 text-white">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                 <Zap size={20} className="text-brand-600 fill-current" />
               </div>
               <span className="font-display text-2xl font-black text-white">FreelanceOS</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-8">
              The only workspace designed to help independent professionals scale their business, recapture their time, and grow their profit.
            </p>
            <div className="flex items-center gap-4">
                {[
                  { Icon: Github, name: 'GitHub' },
                  { Icon: Twitter, name: 'Twitter' },
                  { Icon: Linkedin, name: 'LinkedIn' },
                  { Icon: Instagram, name: 'Instagram' }
                ].map(({ Icon, name }) => (
                  <a key={name} href="#" title={`Visit our ${name} page`} className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                     <Icon size={20} />
                  </a>
                ))}
            </div>
          </div>

          <div>
             <h4 className="font-bold text-white mb-8 border-b border-white/10 pb-4 inline-block pr-8 uppercase tracking-widest text-[10px]">Product</h4>
             <ul className="space-y-4">
                {['General Overview', 'Time Tracker Pro', 'Smart Invoices', 'Analytics Engine', 'Client CRM System'].map(l => (
                  <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
             </ul>
          </div>

          <div>
             <h4 className="font-bold text-white mb-8 border-b border-white/10 pb-4 inline-block pr-8 uppercase tracking-widest text-[10px]">Company</h4>
             <ul className="space-y-4">
                {['Abous Us', 'Our Vision', 'Customer Stories', 'Career Portal', 'Partnership Program'].map(l => (
                   <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
             </ul>
          </div>

          <div>
             <h4 className="font-bold text-white mb-8 border-b border-white/10 pb-4 inline-block pr-8 uppercase tracking-widest text-[10px]">Resources</h4>
             <ul className="space-y-4">
                {['Help Documentation', 'Freelance Guide', 'System Updates', 'API Documentation', 'Community Forum'].map(l => (
                   <li key={l}><a href="#" className="text-slate-400 text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
             </ul>
          </div>
        </div>
        
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
           <p className="text-slate-500 text-sm">
             © {new Date().getFullYear()} FreelanceOS Inc. Built with <Heart size={14} className="inline text-rose-500 mx-1" /> in New York.
           </p>
           <div className="flex items-center gap-8">
             <a href="#" className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Privacy Policy</a>
             <a href="#" className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Terms of Service</a>
             <a href="#" className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Security Audit</a>
           </div>
        </div>
      </footer>
    </div>
  )
}
