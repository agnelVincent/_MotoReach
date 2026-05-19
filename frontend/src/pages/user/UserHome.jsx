import React, { useState, useEffect } from 'react';
import {
  FileText,
  MapPin,
  PackageCheck,
  CreditCard,
  History,
  DollarSign,
  Building2,
  Wrench,
  Shield,
  Clock,
  Zap,
  CheckCircle,
  Star,
  Sparkles,
  ChevronRight,
  ArrowRight,
  TrendingUp,
  Award,
  Activity,
  Gauge
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const UserHome = () => {
  const [mounted, setMounted] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Shield,
      title: 'Verified Workshops',
      description: 'Every service provider undergoes thorough background checks for your safety.',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'Know your exact cost upfront — no hidden charges, no surprises.',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      icon: Clock,
      title: 'Fast Scheduling',
      description: 'Book instantly with real-time availability and quick turnaround.',
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      icon: PackageCheck,
      title: 'Real-Time Tracking',
      description: 'Live status updates from booking to delivery, every step.',
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Multiple encrypted payment methods for complete peace of mind.',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
    {
      icon: Star,
      title: 'Smooth Experience',
      description: 'Effortless navigation and service booking built around you.',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');

        .font-display { font-family: 'Syne', sans-serif; }
        .font-body { font-family: 'Geist', 'Inter', sans-serif; }

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

        .card-hover {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.09);
        }

        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        }

        .action-btn {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .action-btn:hover {
          transform: translateY(-2px) scale(1.02);
        }
        .action-btn:active {
          transform: scale(0.98);
        }

        .cta-btn {
          background: white;
          color: #1e1b4b;
          transition: all 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
        }
        .cta-btn:hover {
          background: #f5f3ff;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2);
          transform: translateY(-2px);
        }

        .badge-pill {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }

        .section-label {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }

        .grid-lines {
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid #f1f5f9;
        }
        .feature-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 8px 30px rgba(99,102,241,0.08);
          transform: translateY(-3px);
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient hero-noise relative overflow-hidden">
        {/* Glow blobs */}
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-20 right-10" />
        <div className="glow-dot w-80 h-80 bg-blue-400 opacity-10 bottom-0 left-1/3" />

        {/* Floating decorative circle */}
        <div className="absolute right-10 top-16 w-48 h-48 md:w-64 md:h-64 rounded-full border border-white/5 hidden md:block" style={{ animation: 'float 6s ease-in-out infinite' }}>
          <div className="absolute inset-4 rounded-full border border-white/5" />
          <div className="absolute inset-8 rounded-full border border-white/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Gauge className="w-12 h-12 text-white/20" />
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-7 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">Platform Active</span>
          </div>

          {/* Headline */}
          <h1 className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.05] mb-5 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Welcome back,{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                {user?.full_name?.split(' ')[0] || 'User'}
              </span>
              <svg className="absolute -bottom-1 left-0 w-full" height="6" viewBox="0 0 200 6" fill="none">
                <path d="M0 5 Q50 1 100 5 Q150 9 200 5" stroke="url(#ul)" strokeWidth="2" strokeLinecap="round" fill="none" />
                <defs>
                  <linearGradient id="ul" x1="0" y1="0" x2="200" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a78bfa" />
                    <stop offset="1" stopColor="#818cf8" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>

          <p className={`font-body text-white/60 text-lg md:text-xl max-w-xl mb-10 leading-relaxed opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            Your vehicle deserves the best care. Book, track, and manage every service — all in one place.
          </p>

          {/* CTA */}
          <div className={`flex flex-col sm:flex-row gap-3 opacity-0 ${mounted ? 'animate-fade-up delay-300' : ''}`}>
            <button
              onClick={() => navigate('/user/request')}
              className="cta-btn font-display font-bold text-base px-8 py-4 rounded-2xl flex items-center justify-center gap-3 group"
            >
              <FileText className="w-5 h-5 text-indigo-600 group-hover:rotate-6 transition-transform" />
              Request a Service
              <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>



      {/* ── WHY MOTORREACH ── */}
      <section className="grid-lines max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="section-label text-indigo-500 mb-2 block">Why choose us</span>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900 leading-tight">
              Built for trust,<br className="hidden sm:block" /> built for you.
            </h2>
          </div>
          <p className="font-body text-gray-500 text-sm max-w-xs leading-relaxed">
            Every feature is designed to give you confidence, clarity, and control over your vehicle's care.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className={`feature-card bg-white rounded-2xl p-6 group cursor-default`}>
                <div className={`w-11 h-11 rounded-2xl ${f.bg} border ${f.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${f.color}`} />
                </div>
                <h3 className="font-display font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                <p className="font-body text-gray-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 md:p-12 overflow-hidden">
          <div className="glow-dot w-64 h-64 bg-white opacity-5 -top-16 -right-10" />
          <div className="glow-dot w-48 h-48 bg-violet-300 opacity-10 bottom-0 left-10" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-yellow-300" />
                <span className="section-label text-white/70">Ready when you are</span>
              </div>
              <h3 className="font-display font-bold text-white text-2xl md:text-3xl leading-snug">
                Your vehicle is waiting.<br />
                <span className="text-violet-200">Let's get it sorted.</span>
              </h3>
            </div>
            <button
              onClick={() => navigate('/user/request')}
              className="flex-shrink-0 bg-white font-display font-bold text-indigo-700 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-indigo-50 transition-all hover:-translate-y-1 shadow-xl hover:shadow-2xl group"
            >
              <FileText className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              Book a Service
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UserHome;