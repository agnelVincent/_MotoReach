import InputField from "../../components/InputField";
import { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, Shield, Clock, Zap, ChevronRight, Wrench, Gauge } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, googleLogin } from '../../redux/slices/authSlice';
import { getRolePath } from "../../routes/AuthRedirect";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading: authLoading, error: authError, isAuthenticated, user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [localError, setLocalError] = useState('');

  const displayError = authError || localError;
  const isLoading = authLoading;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const path = getRolePath(user.role);
      navigate(path, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
    if (authError) dispatch(clearError());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!formData.email) { setLocalError('Email is required.'); return; }
    if (!formData.password) { setLocalError('Password is required.'); return; }
    dispatch(loginUser(formData));
  };

  const isFormValid = formData.email && formData.password;

  const highlights = [
    { icon: Shield, label: 'Verified Workshops', color: 'text-violet-300' },
    { icon: Zap,    label: 'Instant Booking',    color: 'text-amber-300'  },
    { icon: Clock,  label: 'Real-Time Tracking', color: 'text-emerald-300'},
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');

        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'Geist', 'Inter', sans-serif; }

        .login-hero {
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

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        .animate-fade-up    { animation: fadeSlideUp   0.65s cubic-bezier(0.16,1,0.3,1) forwards; }
        .animate-fade-right { animation: fadeSlideRight 0.65s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }

        .highlight-row {
          transition: background 0.2s ease, transform 0.2s ease;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 0.875rem;
        }
        .highlight-row:hover {
          background: rgba(255,255,255,0.07);
          transform: translateX(4px);
        }

        .form-card {
          background: white;
          border-radius: 1.75rem;
          box-shadow: 0 8px 48px rgba(30,27,75,0.10), 0 1px 0 rgba(255,255,255,0.8);
          border: 1px solid #f1f5f9;
        }

        .login-input-wrap {
          transition: box-shadow 0.2s ease;
        }
        .login-input-wrap:focus-within {
          box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
          border-radius: 0.75rem;
        }

        .submit-btn {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          box-shadow: 0 4px 16px rgba(79,70,229,0.35);
        }
        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%);
          box-shadow: 0 8px 28px rgba(79,70,229,0.45);
          transform: translateY(-2px) scale(1.01);
        }
        .submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .submit-btn:disabled {
          background: #e2e8f0;
          box-shadow: none;
        }

        .google-wrap > div {
          width: 100% !important;
        }
        .google-wrap iframe {
          width: 100% !important;
        }

        .divider-line {
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
          height: 1px;
          flex: 1;
        }
      `}</style>

      {/* ── LEFT PANEL — Branding ── */}
      <div className="login-hero hero-noise relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden px-12 py-12">
        {/* Glow blobs */}
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-32 right-0" />
        <div className="glow-dot w-80 h-80 bg-blue-400 opacity-10 bottom-0 left-1/3" />

        {/* Floating decorative ring */}
        <div
          className="absolute right-12 top-16 w-56 h-56 rounded-full border border-white/5"
          style={{ animation: 'float 7s ease-in-out infinite' }}
        >
          <div className="absolute inset-5 rounded-full border border-white/5" />
          <div className="absolute inset-10 rounded-full border border-white/5" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Gauge className="w-14 h-14 text-white/15" />
          </div>
        </div>

        {/* Top logo */}
        <div className={`relative z-10 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
          <div className="inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">MotoReach Platform</span>
          </div>
        </div>

        {/* Centre content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className={`opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            <p className="section-label text-indigo-300 mb-4">Welcome back</p>
            <h1 className="font-display font-bold text-5xl xl:text-6xl text-white leading-[1.05] mb-5">
              Your vehicle,{' '}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                our care.
              </span>
            </h1>
            <p className="font-body text-white/50 text-base leading-relaxed max-w-sm mb-10">
              Sign in to book services, track repairs, and manage your vehicle's health — all in one place.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-3">
            {highlights.map(({ icon: Icon, label, color }, i) => (
              <div
                key={i}
                className={`highlight-row flex items-center gap-3 px-4 py-3 opacity-0 ${mounted ? `animate-fade-up` : ''}`}
                style={{ animationDelay: `${200 + i * 100}ms` }}
              >
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="font-body text-white/75 text-sm">{label}</span>
                <ChevronRight className="w-4 h-4 text-white/25 ml-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <div className={`relative z-10 opacity-0 ${mounted ? 'animate-fade-up delay-500' : ''}`}>
          <p className="font-body text-white/30 text-xs">
            © {new Date().getFullYear()} MotoReach · Trusted vehicle service platform
          </p>
        </div>

        {/* Bottom curve */}
        <div
          className="absolute bottom-0 right-0 w-28 h-full bg-[#f8f9fc] opacity-100"
          style={{ clipPath: 'ellipse(100% 55% at 100% 50%)' }}
        />
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Mobile branding badge */}
        <div className={`lg:hidden mb-8 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
          <div className="flex items-center gap-2 justify-center mb-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <span className="font-display font-bold text-xl text-gray-900">MotoReach</span>
          </div>
          <p className="font-body text-gray-400 text-sm text-center">Vehicle service, simplified</p>
        </div>

        <div className={`w-full max-w-md opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
          <div className="form-card px-8 py-10">

            {/* Header */}
            <div className="mb-8">
              <p className="section-label text-indigo-500 mb-2">Sign in</p>
              <h2 className="font-display font-bold text-3xl text-gray-900 leading-tight">
                Welcome back
              </h2>
              <p className="font-body text-gray-400 text-sm mt-1.5">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors hover:underline"
                >
                  Register
                </button>
              </p>
            </div>

            {/* Error banner */}
            {displayError && (
              <div className={`mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="font-body text-sm text-red-700">
                  {typeof displayError === 'object' && 'detail' in displayError ? displayError.detail :
                   typeof displayError === 'object' && 'error'  in displayError ? displayError.error  :
                   displayError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="login-input-wrap">
                <InputField
                  label="Email Address"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  icon={Mail}
                />
              </div>

              {/* Password */}
              <div className="login-input-wrap">
                <InputField
                  label="Password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  icon={Lock}
                  isPassword={true}
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword(!showPassword)}
                />
              </div>

              {/* Forgot password */}
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="font-body text-sm text-indigo-500 hover:text-indigo-700 font-medium transition-colors hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={!isFormValid || isLoading}
                className="submit-btn w-full py-3.5 font-display font-bold text-white rounded-2xl flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="divider-line" />
              <span className="font-body text-gray-400 text-xs whitespace-nowrap">or continue with</span>
              <div className="divider-line" />
            </div>

            {/* Google Login */}
            <div className="google-wrap flex justify-center">
              <GoogleLogin
                onSuccess={(credentialResponse) => {
                  dispatch(googleLogin(credentialResponse.credential));
                }}
                onError={() => {}}
                width="100%"
              />
            </div>

          </div>

          {/* Footer note */}
          <p className="font-body text-center text-gray-400 text-xs mt-6">
            By signing in you agree to MotoReach's{' '}
            <span className="text-indigo-500 cursor-pointer hover:underline">Terms</span>
            {' '}and{' '}
            <span className="text-indigo-500 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;