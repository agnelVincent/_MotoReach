import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMechanicAssignedServices } from '../../redux/slices/serviceRequestSlice';
import {
  Wrench,
  Clock,
  Shield,
  MapPin,
  AlertCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';

const statusConfig = (status) => {
  switch (status) {
    case 'CONNECTED':
      return { classes: 'bg-violet-50 border border-violet-200 text-violet-700', dot: 'bg-violet-400' };
    case 'ESTIMATE_SHARED':
      return { classes: 'bg-indigo-50 border border-indigo-200 text-indigo-700', dot: 'bg-indigo-400' };
    case 'SERVICE_AMOUNT_PAID':
      return { classes: 'bg-blue-50 border border-blue-200 text-blue-700', dot: 'bg-blue-400' };
    case 'IN_PROGRESS':
      return { classes: 'bg-amber-50 border border-amber-200 text-amber-700', dot: 'bg-amber-400 animate-pulse' };
    case 'COMPLETED':
      return { classes: 'bg-emerald-50 border border-emerald-200 text-emerald-700', dot: 'bg-emerald-400' };
    case 'VERIFIED':
      return { classes: 'bg-emerald-50 border border-emerald-200 text-emerald-700', dot: 'bg-emerald-500' };
    default:
      return { classes: 'bg-slate-50 border border-slate-200 text-slate-600', dot: 'bg-slate-400' };
  }
};

const MechanicRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const { mechanicAssignedRequests, loading, error } = useSelector(
    (state) => state.serviceRequest
  );

  useEffect(() => {
    setMounted(true);
    dispatch(fetchMechanicAssignedServices());
  }, [dispatch]);

  if (loading && !mechanicAssignedRequests.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="font-display text-sm font-semibold text-gray-400 tracking-wide uppercase">Loading services…</p>
        </div>
      </div>
    );
  }

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
        .animate-fade-up  { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }

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

        /* Request card */
        .req-card {
          border: 1px solid #f1f5f9;
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .req-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 12px 36px rgba(99,102,241,0.10);
          transform: translateY(-3px);
        }
        .req-card:active { transform: translateY(-1px); }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient hero-noise relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-64 h-64 bg-violet-400 opacity-15 bottom-0 right-10" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="section-label text-white/80">Mechanic Portal</span>
          </div>

          <h1 className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Assigned{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              Services
            </span>
          </h1>

          <p className={`font-body text-white/60 text-base md:text-lg max-w-md leading-relaxed opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            View all service requests assigned to you by the workshop.
          </p>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── CONTENT ── */}
      <div className="grid-lines max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-body text-sm">{typeof error === 'string' ? error : 'Failed to load requests'}</p>
          </div>
        )}

        {mechanicAssignedRequests && mechanicAssignedRequests.length > 0 ? (
          <>
            {/* Count label */}
            <div className="mb-5 flex items-center justify-between">
              <span className="section-label text-indigo-500">
                {mechanicAssignedRequests.length} {mechanicAssignedRequests.length === 1 ? 'request' : 'requests'}
              </span>
            </div>

            <div className="space-y-4">
              {mechanicAssignedRequests.map((request) => {
                const { classes: badgeClasses, dot } = statusConfig(request.status);
                const statusLabel = request.status === 'VERIFIED'
                  ? 'VERIFIED & COMPLETED'
                  : request.status.replace(/_/g, ' ');

                return (
                  <div
                    key={request.id}
                    className="req-card bg-white rounded-2xl p-5 md:p-6 cursor-pointer"
                    onClick={() => navigate(`/mechanic/service-flow/${request.id}`)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      {/* Left: vehicle + meta */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Wrench className="w-4 h-4 text-indigo-600" />
                          </div>
                          <h3 className="font-display font-bold text-gray-900 text-lg leading-tight truncate">
                            {request.vehicle_type} — {request.vehicle_model}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 ml-11">
                          <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            #{request.id}
                          </span>
                          <span className="text-gray-200">·</span>
                          <span className="font-body text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(request.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Right: status badge + chevron */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full section-label ${badgeClasses}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                          {statusLabel}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block" />
                      </div>
                    </div>

                    {/* Issue description */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 mb-4">
                      <p className="font-display font-semibold text-sm text-gray-700 mb-0.5">
                        {request.issue_category}
                      </p>
                      <p className="font-body text-sm text-gray-500 line-clamp-2 leading-relaxed">
                        {request.description}
                      </p>
                    </div>

                    {/* Workshop info */}
                    {request.active_connection && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm text-gray-900">
                            {request.active_connection.workshop_name}
                          </p>
                          <p className="font-body text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-indigo-400" />
                            {request.active_connection.address}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-indigo-300" />
            </div>
            <span className="section-label text-indigo-400 mb-2 block">Nothing here yet</span>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-2">
              No assigned services
            </h2>
            <p className="font-body text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              Once your workshop admin assigns you to a service request, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicRequests;