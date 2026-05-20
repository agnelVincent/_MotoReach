import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, MapPin, IndianRupee, Calendar, PackageCheck, Shield,
  Clock, Sparkles, Users, Zap, ArrowRight, ChevronRight,
  CheckCircle, Building2, User, Gauge, Star, TrendingUp
} from 'lucide-react';

const features = [
  { icon: MapPin,       title: 'Nearby Workshops',       desc: 'Browse verified workshops near you with detailed profiles and specializations.', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
  { icon: Wrench,       title: 'On-Site Mechanic',        desc: 'Request skilled mechanics to come directly to your location for fast repairs.',   color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-100'  },
  { icon: IndianRupee,  title: 'Transparent Pricing',     desc: 'Clear pricing with no hidden charges — know exactly what you pay upfront.',       color: 'text-emerald-600',bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { icon: Calendar,     title: 'Easy Scheduling',         desc: 'Book appointments instantly with real-time availability from service providers.',  color: 'text-orange-600', bg: 'bg-orange-50',  border: 'border-orange-100'  },
  { icon: PackageCheck, title: 'Live Service Tracking',   desc: 'Track your service status in real-time from booking all the way to completion.',   color: 'text-rose-600',   bg: 'bg-rose-50',    border: 'border-rose-100'    },
  { icon: Shield,       title: 'Secure Payments',         desc: 'Multiple encrypted payment methods for complete peace of mind every time.',       color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100'   },
];

const steps = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up in minutes as a user, workshop, or mechanic — no paperwork needed.' },
  { num: '02', title: 'Book a Service',       desc: 'Search nearby workshops or request an on-site mechanic with one tap.'         },
  { num: '03', title: 'Track & Pay',          desc: 'Monitor your service live and pay securely once the job is done.'              },
];

const partners = [
  { icon: Building2, role: 'Workshop Owner', headline: 'List your workshop', body: 'Reach more customers, manage your mechanics, and track revenue — all from one powerful dashboard.', cta: 'Register Workshop', path: '/register' },
  { icon: Wrench,    role: 'Mechanic',       headline: 'Join as a mechanic',  body: 'Find workshops that match your skills, manage your jobs, and build your professional reputation.',  cta: 'Register as Mechanic', path: '/register' },
];

const stats = [
  { value: '500+', label: 'Verified Workshops' },
  { value: '10k+', label: 'Happy Customers'    },
  { value: '98%',  label: 'Satisfaction Rate'  },
  { value: '24/7', label: 'Support Available'  },
];

const LandingPage = () => {
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'Geist', 'Inter', sans-serif; }

        .hero-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
        }
        .hero-noise::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
          pointer-events: none;
        }
        .glow-dot {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .badge-pill {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .section-label {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }
        .grid-lines {
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-12px); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.65s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }

        .cta-primary {
          background: white;
          color: #1e1b4b;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
          transition: all 0.25s ease;
        }
        .cta-primary:hover {
          background: #f5f3ff;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }
        .cta-ghost {
          background: rgba(255,255,255,0.08);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }
        .cta-ghost:hover {
          background: rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }

        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid #f1f5f9;
        }
        .feature-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 8px 30px rgba(99,102,241,0.08);
          transform: translateY(-4px);
        }

        .step-connector {
          position: absolute;
          top: 28px;
          left: calc(50% + 2.5rem);
          width: calc(100% - 5rem);
          height: 1px;
          background: linear-gradient(90deg, #e0e7ff, transparent);
        }

        .partner-card {
          transition: all 0.3s ease;
          border: 1px solid #f1f5f9;
        }
        .partner-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 12px 40px rgba(99,102,241,0.10);
          transform: translateY(-4px);
        }

        .stat-item {
          position: relative;
        }
        .stat-item + .stat-item::before {
          content: '';
          position: absolute;
          left: 0; top: 15%; height: 70%;
          width: 1px;
          background: rgba(255,255,255,0.12);
        }

        .action-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .action-btn:hover { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient hero-noise relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-80px]" />
        <div className="glow-dot w-80 h-80 bg-violet-400 opacity-15 top-20 right-[-20px]" />
        <div className="glow-dot w-72 h-72 bg-blue-400 opacity-10 bottom-10 left-1/3" />

        {/* Floating decoration */}
        <div
          className="absolute right-16 top-20 w-56 h-56 rounded-full border border-white/5 hidden lg:flex items-center justify-center"
          style={{ animation: 'float 7s ease-in-out infinite' }}
        >
          <div className="absolute inset-6 rounded-full border border-white/5" />
          <div className="absolute inset-12 rounded-full border border-white/5" />
          <Gauge className="w-14 h-14 text-white/15" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full mb-7 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">Now Live Across India</span>
          </div>

          {/* Headline */}
          <h1 className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.05] mb-6 max-w-4xl opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Your vehicle,{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              expertly cared for.
            </span>
          </h1>

          <p className={`font-body text-white/55 text-lg md:text-xl max-w-2xl leading-relaxed mb-10 opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            MotoReach connects vehicle owners with trusted workshops and skilled mechanics.
            Book, track, and pay for automotive services — all in one place.
          </p>

          {/* CTAs */}
          <div className={`flex flex-col sm:flex-row gap-3 opacity-0 ${mounted ? 'animate-fade-up delay-300' : ''}`}>
            <button
              onClick={() => navigate('/register')}
              className="cta-primary font-display font-bold text-base px-8 py-4 rounded-2xl flex items-center justify-center gap-2 group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="cta-ghost font-display font-bold text-base px-8 py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              Sign In
              <ChevronRight className="w-4 h-4 opacity-60" />
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className={`relative z-10 border-t border-white/10 opacity-0 ${mounted ? 'animate-fade-up delay-400' : ''}`}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {stats.map((s, i) => (
                <div key={i} className="stat-item text-center py-2 px-4">
                  <div className="font-display font-bold text-2xl md:text-3xl text-white">{s.value}</div>
                  <div className="font-body text-white/45 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 md:py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="section-label text-indigo-500 block mb-2">Simple process</span>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            Up and running in{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">3 steps</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Connector line (desktop only, between cards) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block step-connector" />
              )}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-200 flex-shrink-0 relative z-10">
                <span className="font-display font-bold text-white text-lg">{step.num}</span>
              </div>
              <h3 className="font-display font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
              <p className="font-body text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── KEY FEATURES ── */}
      <section className="grid-lines py-16 md:py-24 bg-[#f8f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
            <div>
              <span className="section-label text-indigo-500 block mb-2">Platform features</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 leading-tight">
                Everything you need,<br className="hidden sm:block" /> in one place.
              </h2>
            </div>
            <p className="font-body text-gray-400 text-sm max-w-xs leading-relaxed">
              Built around transparency, speed, and trust — for every kind of vehicle owner.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="feature-card bg-white rounded-2xl p-6 group cursor-default">
                  <div className={`w-11 h-11 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-display font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                  <p className="font-body text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── WHY MOTOREACH ── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <span className="section-label text-indigo-500 block mb-3">Why us</span>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 leading-tight mb-5">
                A platform built on{' '}
                <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">trust.</span>
              </h2>
              <p className="font-body text-gray-500 leading-relaxed mb-8 max-w-md">
                We don't just connect you with service providers — we verify them, back every transaction with security, and keep you informed at every step.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-bold text-sm px-7 py-3.5 rounded-2xl shadow-lg shadow-indigo-200 group"
              >
                Join MotoReach
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right — checklist */}
            <div className="space-y-4">
              {[
                { icon: Shield,     text: 'Verified workshops & mechanics', sub: 'Every provider is background-checked before listing.' },
                { icon: Star,       text: 'Ratings & reviews',              sub: 'Transparent feedback from real customers.'              },
                { icon: Zap,        text: 'Instant booking',                sub: 'No wait times — confirm your slot in seconds.'           },
                { icon: TrendingUp, text: 'Real-time tracking',             sub: 'Live status updates from start to finish.'               },
                { icon: CheckCircle,text: 'Satisfaction guaranteed',        sub: 'Dispute resolution & customer support always ready.'    },
              ].map(({ icon: Icon, text, sub }, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-[#f1f5f9] bg-[#f8f9fc] hover:border-indigo-100 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-gray-900 text-sm">{text}</p>
                    <p className="font-body text-gray-400 text-xs mt-0.5 leading-relaxed">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOR PARTNERS ── */}
      <section className="grid-lines py-16 md:py-24 bg-[#f8f9fc]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-label text-indigo-500 block mb-2">For service providers</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
              Grow your business with MotoReach
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {partners.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={i} className="partner-card bg-white rounded-2xl p-8 group">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <p className="section-label text-indigo-400 mb-2">{p.role}</p>
                  <h3 className="font-display font-bold text-gray-900 text-xl mb-3">{p.headline}</h3>
                  <p className="font-body text-gray-500 text-sm leading-relaxed mb-6">{p.body}</p>
                  <button
                    onClick={() => navigate(p.path)}
                    className="action-btn inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-semibold text-sm px-6 py-3 rounded-xl shadow-md shadow-indigo-100 group/btn"
                  >
                    {p.cta}
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 md:p-14 overflow-hidden">
          <div className="glow-dot w-64 h-64 bg-white opacity-5 -top-16 -right-10" />
          <div className="glow-dot w-48 h-48 bg-violet-300 opacity-10 bottom-0 left-10" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="section-label text-white/70">Ready to get started?</span>
              </div>
              <h3 className="font-display font-bold text-white text-2xl md:text-3xl leading-snug">
                Your vehicle is waiting.<br />
                <span className="text-violet-200">Let's get it sorted.</span>
              </h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={() => navigate('/register')}
                className="action-btn cta-primary font-display font-bold text-indigo-700 px-8 py-4 rounded-2xl flex items-center gap-2 group shadow-xl"
              >
                <User className="w-4 h-4 text-indigo-500" />
                Create Account
                <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="action-btn cta-ghost font-display font-bold px-8 py-4 rounded-2xl flex items-center gap-2"
              >
                Sign In
                <ChevronRight className="w-4 h-4 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;