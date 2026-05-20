import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMechanicWallet } from '../../redux/slices/mechanicWalletSlice';
import {
  Wallet,
  TrendingUp,
  Gift,
  Wrench,
  ArrowDownLeft,
  Calendar,
  BadgeCheck,
  Star,
  IndianRupee,
  Clock,
  Search,
  Users,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

const FILTER_OPTIONS = [
  { label: 'All Transactions', value: 'ALL' },
  { label: 'Service Share', value: 'SERVICE_SHARE' },
  { label: 'Bonus', value: 'BONUS' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const MechanicWallet = () => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [mounted, setMounted] = useState(false);
  const dispatch = useDispatch();

  const { balance, totalEarned, thisMonth, totalBonuses, totalServices, earnings, loading, error } =
    useSelector((state) => state.mechanicWallet);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchMechanicWallet());
  }, [dispatch]);

  const filtered = earnings.filter((e) => {
    const matchFilter = activeFilter === 'ALL' || e.earning_type === activeFilter;
    const matchSearch =
      search === '' ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.service_execution?.service_request?.issue_category?.toLowerCase().includes(search.toLowerCase()) ||
      e.service_execution?.service_request?.vehicle_model?.toLowerCase().includes(search.toLowerCase()) ||
      String(e.service_execution?.service_request?.id).includes(search);
    return matchFilter && matchSearch;
  });

  const stats = [
    { label: 'Total Earned',      value: formatCurrency(totalEarned),  icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
    { label: 'This Month',        value: formatCurrency(thisMonth),     icon: Calendar,   color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Bonuses Received',  value: formatCurrency(totalBonuses),  icon: Gift,       color: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100' },
    { label: 'Services Done',     value: totalServices,                  icon: Wrench,     color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100' },
  ];

  const serviceShare = totalEarned > 0 ? ((totalEarned - totalBonuses) / totalEarned * 100).toFixed(1) : 0;
  const bonusShare   = totalEarned > 0 ? (totalBonuses / totalEarned * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');

        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

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
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }

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
        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid #f1f5f9;
        }
        .feature-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 8px 30px rgba(99,102,241,0.08);
          transform: translateY(-3px);
        }

        /* Balance hero */
        .balance-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
        }

        /* Filter tabs */
        .filter-active {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: white;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }
        .filter-idle {
          background: #f1f5f9;
          color: #64748b;
        }
        .filter-idle:hover { background: #e0e7ff; color: #4f46e5; }

        /* Transaction row */
        .tx-row {
          transition: background 0.15s ease;
        }
        .tx-row:hover { background: #f8f7ff; }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient hero-noise relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-64 h-64 bg-violet-400 opacity-15 top-10 right-0" />
        <div className="glow-dot w-72 h-72 bg-blue-400 opacity-10 bottom-0 left-1/3" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full mb-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">Earnings Dashboard</span>
          </div>

          <h1 className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            My{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              Wallet
            </span>
          </h1>

          <p className={`font-body text-white/60 text-base max-w-md leading-relaxed opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            Your earnings, service shares, and bonus history at a glance.
          </p>

          {/* ── Inline Balance Card ── */}
          <div className={`mt-8 bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 opacity-0 ${mounted ? 'animate-fade-up delay-300' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              {/* Balance */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span className="section-label text-white/60">Available Balance</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-4xl md:text-5xl text-white tracking-tight">
                    {showBalance ? formatCurrency(balance) : '₹ ••••••'}
                  </span>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    title={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showBalance ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
                <p className="font-body text-white/40 text-xs mt-2">Withdrawals will be available in a future update</p>
              </div>

              {/* Quick stats */}
              <div className="flex gap-3">
                <div className="badge-pill rounded-2xl px-5 py-4 text-center">
                  <p className="section-label text-white/50 mb-1">This Month</p>
                  <p className="font-display font-bold text-white text-lg">{formatCurrency(thisMonth)}</p>
                </div>
                <div className="badge-pill rounded-2xl px-5 py-4 text-center">
                  <p className="section-label text-white/50 mb-1 flex items-center gap-1 justify-center">
                    <Star className="w-3 h-3" /> Bonuses
                  </p>
                  <p className="font-display font-bold text-white text-lg">{formatCurrency(totalBonuses)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="grid-lines max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6">

        {/* ── STATS GRID ── */}
        <div>
          <span className="section-label text-indigo-500 mb-4 block">Overview</span>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`feature-card bg-white rounded-2xl p-5 group cursor-default`}>
                  <div className={`w-11 h-11 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <p className="font-display font-bold text-gray-900 text-xl">{s.value}</p>
                  <p className="font-body text-gray-500 text-xs mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── EARNINGS BREAKDOWN BAR ── */}
        <div className="feature-card bg-white rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <span className="section-label text-indigo-500 mb-0.5 block">Composition</span>
              <h3 className="font-display font-bold text-gray-900">Earnings Breakdown</h3>
            </div>
          </div>

          {/* Bar */}
          <div className="flex items-center gap-1.5 mb-3 h-3 rounded-full overflow-hidden bg-slate-100">
            <div
              className="h-full rounded-l-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all duration-700"
              style={{ width: `${serviceShare}%` }}
            />
            <div
              className="h-full rounded-r-full bg-gradient-to-r from-violet-400 to-pink-500 transition-all duration-700"
              style={{ width: `${bonusShare}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <span className="font-body text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block flex-shrink-0" />
              Service Share — <span className="font-semibold text-gray-700">{formatCurrency(totalEarned - totalBonuses)}</span>
            </span>
            <span className="font-body text-xs text-gray-500 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block flex-shrink-0" />
              Bonuses — <span className="font-semibold text-gray-700">{formatCurrency(totalBonuses)}</span>
            </span>
          </div>
        </div>

        {/* ── TRANSACTION HISTORY ── */}
        <div className="feature-card bg-white rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <span className="section-label text-indigo-500 mb-0.5 block">Ledger</span>
                <h2 className="font-display font-bold text-xl text-gray-900">Transaction History</h2>
                <p className="font-body text-sm text-gray-400 mt-0.5">
                  {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search service, vehicle…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="font-body pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 w-full sm:w-56 transition bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
              {FILTER_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setActiveFilter(f.value)}
                  className={`px-4 py-1.5 rounded-full section-label transition-all duration-200 ${activeFilter === f.value ? 'filter-active' : 'filter-idle'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction list */}
          <div className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center">
                  <IndianRupee className="w-7 h-7 text-slate-300" />
                </div>
                <p className="font-display font-semibold text-gray-500">No transactions found</p>
                <p className="font-body text-sm text-gray-400">Try adjusting your filter or search</p>
              </div>
            ) : (
              filtered.map((earning) => {
                const isBonus = earning.earning_type === 'BONUS';
                const sr = earning.service_execution?.service_request;

                return (
                  <div key={earning.id} className="tx-row flex items-start gap-4 px-6 py-5">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center border ${
                      isBonus
                        ? 'bg-violet-50 border-violet-100'
                        : 'bg-indigo-50 border-indigo-100'
                    }`}>
                      {isBonus
                        ? <Gift className="w-5 h-5 text-violet-600" />
                        : <Wrench className="w-5 h-5 text-indigo-600" />
                      }
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`section-label px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                          isBonus
                            ? 'bg-violet-50 border border-violet-200 text-violet-700'
                            : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                        }`}>
                          {isBonus ? <Gift className="w-3 h-3" /> : <BadgeCheck className="w-3 h-3" />}
                          {isBonus ? 'Bonus' : 'Service Share'}
                        </span>
                        {sr && (
                          <span className="font-mono text-xs text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg">
                            REQ #{sr.id}
                          </span>
                        )}
                      </div>

                      <p className="font-display font-semibold text-sm text-gray-900 truncate">
                        {sr ? `${sr.issue_category} — ${sr.vehicle_model}` : 'Bonus Payment'}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(earning.created_at)} · {formatTime(earning.created_at)}
                        </span>
                        {!isBonus && earning.service_execution?.mechanic_count && (
                          <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {earning.service_execution.mechanic_count} mechanic{earning.service_execution.mechanic_count > 1 ? 's' : ''} — 20% pool split equally
                          </span>
                        )}
                        {isBonus && (
                          <span className="font-body text-xs text-violet-500 italic truncate max-w-xs">
                            {earning.description.replace('Bonus from workshop admin: ', '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-center gap-1 font-display font-bold text-lg text-emerald-600">
                        <ArrowDownLeft className="w-4 h-4" />
                        ₹{parseFloat(earning.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="font-body text-xs text-gray-400 mt-0.5">Credited</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
            <p className="font-body text-xs text-gray-400 text-center">
              All amounts are credited automatically after service OTP verification or when a bonus is sent by your workshop admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicWallet;