import { useState, useEffect } from 'react';
import { User, Building2, Wrench, Shield, Zap, DollarSign, MapPin, Star, Clock, ChevronRight, Gauge } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearError } from '../../redux/slices/authSlice';
import UserRegister from './Register forms/UserRegister';
import MechanicRegister from './Register forms/MechanicRegister';
import WorkshopRegister from './Register forms/WorkshopRegister';

const roleConfig = {
  user: {
    label: 'Vehicle Owner',
    headline: 'Book trusted\nvehicle services.',
    sub: 'Connect with verified workshops near you and get your vehicle serviced — fast, safe, and transparent.',
    highlights: [
      { icon: Shield,   text: 'Verified Workshops',    color: 'text-violet-300' },
      { icon: Zap,      text: 'Instant Booking',        color: 'text-amber-300'  },
      { icon: Clock,    text: 'Real-Time Tracking',     color: 'text-emerald-300'},
    ],
  },
  mechanic: {
    label: 'Mechanic',
    headline: 'Join as a skilled\nmechanic.',
    sub: 'Find workshops that need your skills, manage your jobs, and grow your career with MotoReach.',
    highlights: [
      { icon: MapPin,   text: 'Find Nearby Workshops',  color: 'text-violet-300' },
      { icon: Star,     text: 'Build Your Reputation',  color: 'text-amber-300'  },
      { icon: DollarSign, text: 'Track Your Earnings',  color: 'text-emerald-300'},
    ],
  },
  workshop: {
    label: 'Workshop Owner',
    headline: 'List your workshop\nand grow.',
    sub: 'Reach more customers, manage your team of mechanics, and track revenue — all from one dashboard.',
    highlights: [
      { icon: User,      text: 'Attract More Customers', color: 'text-violet-300' },
      { icon: Wrench,    text: 'Manage Your Mechanics',  color: 'text-amber-300'  },
      { icon: DollarSign,text: 'Monitor Revenue',        color: 'text-emerald-300'},
    ],
  },
};

const roles = [
  { id: 'user',     name: 'User',     icon: User     },
  { id: 'workshop', name: 'Workshop', icon: Building2 },
  { id: 'mechanic', name: 'Mechanic', icon: Wrench   },
];

const Register = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { isRegistered, pendingEmail } = useSelector((state) => state.auth);
  const [selectedRole, setSelectedRole] = useState('user');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isRegistered && pendingEmail) navigate('/verify-otp');
    dispatch(clearError());
  }, [isRegistered, pendingEmail, navigate, dispatch, selectedRole]);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    dispatch(clearError());
  };

  const cfg = roleConfig[selectedRole];

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'Geist', 'Inter', sans-serif; }

        .reg-hero {
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
        .highlight-row {
          transition: background 0.2s ease, transform 0.2s ease;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.875rem;
        }
        .highlight-row:hover {
          background: rgba(255,255,255,0.07);
          transform: translateX(4px);
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }

        .form-card {
          background: white;
          border-radius: 1.75rem;
          box-shadow: 0 8px 48px rgba(30,27,75,0.10), 0 1px 0 rgba(255,255,255,0.8);
          border: 1px solid #f1f5f9;
        }

        .role-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          border-radius: 0.75rem;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          cursor: pointer;
          border: none;
          background: transparent;
          color: #64748b;
        }
        .role-tab:hover:not(.active) {
          background: #f1f5f9;
          color: #334155;
        }
        .role-tab.active {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(79,70,229,0.30);
          transform: scale(1.02);
        }
        .role-switcher {
          background: #f8f9fc;
          border: 1px solid #f1f5f9;
          border-radius: 1rem;
          padding: 0.35rem;
          display: flex;
          gap: 0.25rem;
        }

        .divider-line {
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          height: 1px;
          flex: 1;
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="reg-hero hero-noise relative hidden lg:flex lg:w-[45%] flex-col justify-between overflow-hidden px-12 py-12 flex-shrink-0">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-32 right-0" />
        <div className="glow-dot w-80 h-80 bg-blue-400 opacity-10 bottom-0 left-1/3" />

        {/* Floating ring */}
        <div
          className="absolute right-12 top-16 w-52 h-52 rounded-full border border-white/5"
          style={{ animation: 'float 7s ease-in-out infinite' }}
        >
          <div className="absolute inset-5 rounded-full border border-white/5" />
          <div className="absolute inset-10 rounded-full border border-white/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Gauge className="w-12 h-12 text-white/15" />
          </div>
        </div>

        {/* Top badge */}
        <div className={`relative z-10 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
          <div className="inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">MotoReach Platform</span>
          </div>
        </div>

        {/* Centre — changes per role */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div key={selectedRole} className={`opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            <p className="section-label text-indigo-300 mb-4">Create account · {cfg.label}</p>
            <h1 className="font-display font-bold text-5xl text-white leading-[1.1] mb-5 whitespace-pre-line">
              {cfg.headline.split('\n').map((line, i) =>
                i === 1
                  ? <span key={i} className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent block">{line}</span>
                  : <span key={i} className="block">{line}</span>
              )}
            </h1>
            <p className="font-body text-white/50 text-base leading-relaxed max-w-sm mb-10">{cfg.sub}</p>
          </div>

          <div className="space-y-3">
            {cfg.highlights.map(({ icon: Icon, text, color }, i) => (
              <div
                key={`${selectedRole}-${i}`}
                className={`highlight-row flex items-center gap-3 px-4 py-3 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="font-body text-white/75 text-sm">{text}</span>
                <ChevronRight className="w-4 h-4 text-white/25 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`relative z-10 opacity-0 ${mounted ? 'animate-fade-up delay-400' : ''}`}>
          <p className="font-body text-white/30 text-xs">
            © {new Date().getFullYear()} MotoReach · Trusted vehicle service platform
          </p>
        </div>

        {/* Right edge curve */}
        <div
          className="absolute bottom-0 right-0 w-28 h-full bg-[#f8f9fc]"
          style={{ clipPath: 'ellipse(100% 55% at 100% 50%)' }}
        />
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center px-6 py-12">

        {/* Mobile badge */}
        <div className={`lg:hidden mb-8 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
          <div className="flex items-center gap-2 justify-center mb-1">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <span className="font-display font-bold text-xl text-gray-900">MotoReach</span>
          </div>
          <p className="font-body text-gray-400 text-sm text-center">Create your account</p>
        </div>

        <div className={`w-full max-w-xl opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
          <div className="form-card px-8 py-10">

            {/* Header */}
            <div className="mb-6">
              <p className="section-label text-indigo-500 mb-2">Get started</p>
              <h2 className="font-display font-bold text-3xl text-gray-900 leading-tight">Create an account</h2>
              <p className="font-body text-gray-400 text-sm mt-1.5">
                Already have one?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors hover:underline"
                >
                  Sign in
                </button>
              </p>
            </div>

            {/* Role Switcher */}
            <div className="role-switcher mb-8">
              {roles.map(({ id, name, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => handleRoleChange(id)}
                  className={`role-tab ${selectedRole === id ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden sm:inline">{name}</span>
                </button>
              ))}
            </div>

            {/* Sub-form */}
            {selectedRole === 'user'     && <UserRegister />}
            {selectedRole === 'mechanic' && <MechanicRegister />}
            {selectedRole === 'workshop' && <WorkshopRegister />}

          </div>

          <p className="font-body text-center text-gray-400 text-xs mt-6">
            By registering you agree to MotoReach's{' '}
            <span className="text-indigo-500 cursor-pointer hover:underline">Terms</span>
            {' '}and{' '}
            <span className="text-indigo-500 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;