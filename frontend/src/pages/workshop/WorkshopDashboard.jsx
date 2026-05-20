import {
  FileText, Users,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Calendar,
  Award,
  Activity,
  Gauge,
  Sparkles
} from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkshopStats } from '../../redux/slices/workshopMechanicSlice';

const WorkshopDashboard = () => {
  const { stats } = useSelector((state) => state.workshopMechanic);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchWorkshopStats());
  }, [dispatch]);

  const recentRequests = stats.recent_requests || [];
  const topMechanics = stats.top_mechanics || [];
  const monthlyData = stats.monthly_data || [];
  const maxRevenue = monthlyData.length ? Math.max(...monthlyData.map(d => d.revenue)) : 1;

  const metrics = [
    {
      title: 'Total Revenue',
      value: `₹${stats.total_revenue ?? 0}`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      title: 'Active Requests',
      value: stats.active_requests ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      title: 'Completed Services',
      value: stats.completed_services ?? 0,
      icon: CheckCircle,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
      border: 'border-violet-100',
    },
    {
      title: 'Active Mechanics',
      value: stats.active_mechanics ?? 0,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
  ];

  const statusStyle = (status) => {
    if (status === 'Completed') return 'bg-emerald-50 border-emerald-100 text-emerald-700';
    if (status === 'In Progress') return 'bg-blue-50 border-blue-100 text-blue-700';
    return 'bg-amber-50 border-amber-100 text-amber-700';
  };

  const priorityColor = (priority) => {
    if (priority === 'high') return 'bg-rose-500';
    if (priority === 'medium') return 'bg-amber-400';
    return 'bg-emerald-400';
  };

  const rankStyle = (i) => {
    if (i === 0) return 'bg-amber-400 text-white';
    if (i === 1) return 'bg-slate-300 text-white';
    return 'bg-orange-200 text-orange-700';
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

        .dash-hero {
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
        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid #f1f5f9;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.08);
        }
        .card {
          background: white;
          border-radius: 1.5rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
        }
        .tx-row {
          border: 1px solid #f1f5f9;
          border-radius: 1rem;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }
        .tx-row:hover {
          background: #fafbff;
          border-color: #e0e7ff;
          transform: translateX(2px);
        }
        .bar-track {
          background: #f1f5f9;
          border-radius: 0.5rem;
          overflow: hidden;
          height: 36px;
        }
        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
          transition: width 1s cubic-bezier(0.16,1,0.3,1);
          min-width: 36px;
        }
        .grid-lines {
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── HERO ── */}
      <section className="dash-hero hero-noise relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-10 right-10" />

        {/* Floating decorative */}
        <div className="absolute right-8 top-8 w-40 h-40 rounded-full border border-white/5 hidden lg:flex items-center justify-center">
          <div className="absolute inset-4 rounded-full border border-white/5" />
          <Gauge className="w-10 h-10 text-white/15" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pt-14 md:pb-32">
          <div className="inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/80 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/70">Live Dashboard</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                Workshop{' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="font-body text-white/40 text-sm mt-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {today}
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="badge-pill px-4 py-2 rounded-xl flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="font-display font-semibold text-white/80 text-sm">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── METRIC CARDS ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className={`stat-card bg-white rounded-2xl p-5 shadow-sm fade-up`} style={{ animationDelay: `${i * 60}ms` }}>
                <div className={`w-9 h-9 rounded-xl ${m.bg} border ${m.border} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <div className={`font-display font-bold text-2xl md:text-3xl ${m.color}`}>{m.value}</div>
                <div className="font-body text-gray-500 text-xs mt-0.5">{m.title}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── MAIN GRID ── */}
      <section className="grid-lines max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT: Revenue + Recent Requests */}
          <div className="lg:col-span-2 space-y-4">

            {/* Revenue chart */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <span className="section-label text-indigo-500 block mb-0.5">Performance</span>
                  <h2 className="font-display font-bold text-gray-900 text-xl">Revenue Overview</h2>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="font-display font-bold text-emerald-700 text-xs">6 Months</span>
                </div>
              </div>

              <div className="space-y-3">
                {monthlyData.length > 0 ? monthlyData.map((data, i) => {
                  const pct = maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="font-display font-semibold text-gray-400 text-xs w-10 flex-shrink-0">{data.month}</span>
                      <div className="flex-1 bar-track">
                        <div className="bar-fill" style={{ width: `${pct}%` }}>
                          {data.revenue > 0 && (
                            <span className="font-display font-bold text-white text-xs whitespace-nowrap">
                              ₹{Number(data.revenue).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="font-body text-gray-400 text-sm text-center py-8">No revenue data available</p>
                )}
              </div>
            </div>

            {/* Recent requests */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="section-label text-indigo-500 block mb-0.5">Activity</span>
                  <h2 className="font-display font-bold text-gray-900 text-xl">Recent Requests</h2>
                </div>
                <button className="font-display font-semibold text-indigo-600 hover:text-indigo-800 text-xs flex items-center gap-1 transition-colors">
                  View All <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {recentRequests.length > 0 ? recentRequests.map((req, i) => (
                  <div key={i} className="tx-row flex items-center justify-between p-3.5 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${priorityColor(req.priority)}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display font-semibold text-gray-900 text-sm">{req.customer}</p>
                          <span className="font-body text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg">{req.id}</span>
                        </div>
                        <p className="font-body text-gray-400 text-xs mt-0.5 truncate">{req.service}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-300" />
                          <span className="font-body text-xs text-gray-400">{req.time}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 ml-3 font-display font-bold text-[11px] px-3 py-1 rounded-xl border ${statusStyle(req.status)}`}>
                      {req.status}
                    </span>
                  </div>
                )) : (
                  <p className="font-body text-gray-400 text-sm text-center py-8">No recent requests found</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Top Mechanics */}
          <div>
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <span className="section-label text-indigo-500 block mb-0.5">Leaderboard</span>
                  <h2 className="font-display font-bold text-gray-900 text-xl">Top Mechanics</h2>
                </div>
                <div className="w-9 h-9 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center">
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
              </div>

              <div className="space-y-2">
                {topMechanics.length > 0 ? topMechanics.map((mechanic, i) => (
                  <div key={i} className="tx-row flex items-center gap-3 p-3.5 bg-white">
                    {/* Rank badge */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold text-sm flex-shrink-0 ${rankStyle(i)}`}>
                      {i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display font-semibold text-gray-900 text-sm truncate">{mechanic.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <CheckCircle className="w-3 h-3 text-indigo-400" />
                        <span className="font-body text-xs text-indigo-600 font-medium">{mechanic.completed} services</span>
                      </div>
                    </div>

                    {/* Sparkle for top performer */}
                    {i === 0 && (
                      <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                  </div>
                )) : (
                  <p className="font-body text-gray-400 text-sm text-center py-8">No mechanic data available</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default WorkshopDashboard;