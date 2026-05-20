import React, { useState, useEffect } from 'react';
import {
  Car, User, Briefcase, Clock, CheckCircle, AlertCircle,
  IndianRupee, Wrench, MapPin, Calendar, ArrowRight, Star, FileText
} from 'lucide-react';
import MechanicNavbar from '../../components/navbars/MechanicNavbar';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const MechanicDashboard = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    todays_earnings: 0.00,
    completed_today: 0,
    active_jobs: 0,
    rating: '0.0',
    workshop_join_state: 'PENDING',
    workshop_name: null,
    recent_requests: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/service-request/mechanic/dashboard-stats/');
        setDashboardData(response.data);
      } catch (error) {
        console.error("Dashboard stats error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    {
      label: 'Completed Today',
      value: dashboardData.completed_today?.toString() || '0',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Active Jobs',
      value: dashboardData.active_jobs?.toString() || '0',
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: "Today's Earnings",
      value: `₹${dashboardData.todays_earnings || '0'}`,
      icon: IndianRupee,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      border: 'border-orange-100',
    },
    {
      label: 'Rating',
      value: dashboardData.rating?.toString() || '0.0',
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
  ];

  const recentRequests = dashboardData.recent_requests || [];

  const getStatusConfig = (status) => {
    const map = {
      'Completed':   { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-400' },
      'In Progress': { bg: 'bg-indigo-100',  text: 'text-indigo-700',  dot: 'bg-indigo-400' },
      'Scheduled':   { bg: 'bg-violet-100',  text: 'text-violet-700',  dot: 'bg-violet-400' },
      'Pending':     { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400' },
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
  };

  const getPriorityBar = (priority) => {
    const map = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-emerald-400' };
    return map[priority] || 'bg-gray-300';
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

        .section-label {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
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
        .grid-lines {
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }

        .stat-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          border: 1px solid #f1f5f9;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(99,102,241,0.08);
          border-color: #e0e7ff;
        }
        .request-card {
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          border: 1px solid #f1f5f9;
        }
        .request-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.07);
          border-color: #e0e7ff;
        }
        .action-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .action-btn:hover  { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        .cta-btn {
          background: white;
          color: #1e1b4b;
          transition: all 0.25s ease;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
        }
        .cta-btn:hover {
          background: #f5f3ff;
          box-shadow: 0 16px 48px rgba(0,0,0,0.3);
          transform: translateY(-2px);
        }
      `}</style>

      <MechanicNavbar />

      {/* ── HERO ── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-16 right-10" />
        <div className="glow-dot w-64 h-64 bg-blue-400 opacity-10 bottom-0 left-1/3" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-28 md:pb-20">
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-6 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">Mechanic Portal</span>
          </div>

          <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            <div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-[1.05] mb-3">
                Your{' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="font-body text-white/50 text-sm flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {dashboardData.workshop_name && (
              <div className={`badge-pill px-5 py-2.5 rounded-2xl flex items-center gap-2 opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
                <Wrench className="w-4 h-4 text-indigo-300" />
                <span className="font-display font-semibold text-white text-sm">{dashboardData.workshop_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── BODY ── */}
      <div className="grid-lines max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ── STATS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="stat-card bg-white rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="font-display font-bold text-gray-900 text-3xl mb-1">{stat.value}</p>
                <p className="section-label text-gray-400">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* ── JOIN WORKSHOP BANNER ── */}
        {dashboardData.workshop_join_state !== 'ACCEPTED' && (
          <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 rounded-3xl p-8 md:p-10 overflow-hidden">
            <div className="glow-dot w-64 h-64 bg-white opacity-5 -top-16 -right-10" />
            <div className="glow-dot w-48 h-48 bg-violet-300 opacity-10 bottom-0 left-10" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="section-label text-white/60">Opportunity</span>
                  </div>
                  <h2 className="font-display font-bold text-white text-2xl md:text-3xl leading-tight">
                    Join a Workshop
                  </h2>
                  <p className="font-body text-white/55 text-sm mt-1">
                    Connect with verified workshops and expand your opportunities.
                  </p>
                </div>
              </div>

              <Link
                to="/mechanic/workshop"
                className="cta-btn flex-shrink-0 font-display font-bold text-indigo-700 text-sm px-7 py-4 rounded-2xl inline-flex items-center gap-2.5 group"
              >
                <Briefcase className="w-4 h-4 text-indigo-500 group-hover:rotate-6 transition-transform" />
                Apply Now
                <ArrowRight className="w-4 h-4 text-indigo-500 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        )}

        {/* ── RECENT REQUESTS ── */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8">
          <div className="flex items-end justify-between mb-7">
            <div>
              <span className="section-label text-indigo-500 block mb-2">Work Queue</span>
              <h2 className="font-display font-bold text-gray-900 text-2xl md:text-3xl leading-tight">
                Recent Requests
              </h2>
            </div>
            <button
              onClick={() => navigate('/mechanic/requests')}
              className="action-btn flex items-center gap-1.5 font-display font-semibold text-sm text-indigo-600 hover:text-indigo-700 px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {recentRequests.length > 0 ? (
            <div className="space-y-4">
              {recentRequests.map((request, i) => {
                const statusCfg = getStatusConfig(request.status);
                return (
                  <div key={i} className="request-card bg-[#f8f9fc] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Priority bar */}
                    <div className={`w-full h-1 lg:w-1 lg:h-16 rounded-full flex-shrink-0 ${getPriorityBar(request.priority)}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5 mb-2">
                        <h3 className="font-display font-bold text-gray-900 text-base">{request.problem}</h3>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-display font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {request.status}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-body text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> {request.customerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" /> {request.requestId}
                        </span>
                        <span className="flex items-center gap-1 text-indigo-500 font-medium">
                          <Clock className="w-3.5 h-3.5" /> {request.scheduledTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-violet-400" /> {request.location}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => navigate(`/mechanic/service-flow/${request.requestId.replace('REQ-', '')}`)}
                      className="action-btn flex-shrink-0 w-full lg:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-semibold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-7 h-7 text-indigo-300" />
              </div>
              <p className="font-display font-bold text-gray-900 text-lg mb-1">No recent requests</p>
              <p className="font-body text-gray-400 text-sm">Assigned work will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default MechanicDashboard;