import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  endService,
  fetchEstimates,
  fetchServiceRequestDetails,
  generateServiceOTP,
  startService,
} from '../../redux/slices/serviceRequestSlice';
import {
  FileCheck, CreditCard, Link2, CheckCircle, DollarSign,
  Wrench, Shield, Users, Mail, Phone, Key, Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useServiceFlowSocket } from '../../hooks/useServiceFlowSocket';
import Chat from '../../components/Chat';

const MechanicServiceFlow = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('info');
  const { currentRequest, loading, estimates } = useSelector((state) => state.serviceRequest);

  const currentRequestRef = useRef(currentRequest);
  useEffect(() => { currentRequestRef.current = currentRequest; }, [currentRequest]);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!requestId) return;
    dispatch(fetchServiceRequestDetails(requestId));
  }, [dispatch, requestId]);

  useServiceFlowSocket(requestId, () => {
    if (requestId) dispatch(fetchServiceRequestDetails(requestId));
    const connectionId = currentRequestRef.current?.active_connection?.id;
    if (connectionId) dispatch(fetchEstimates(connectionId));
  }, 'mechanic');

  useEffect(() => {
    if (currentRequest?.active_connection?.id) {
      dispatch(fetchEstimates(currentRequest.active_connection.id));
    }
  }, [dispatch, currentRequest?.active_connection?.id, currentRequest?.status]);

  const currentStatus = currentRequest?.status || 'CREATED';
  const execution = currentRequest?.execution;

  const statusFlow = [
    { key: 'CREATED',              label: 'Created',    icon: FileCheck  },
    { key: 'PLATFORM_FEE_PAID',    label: 'Fee Paid',   icon: CreditCard },
    { key: 'CONNECTING',           label: 'Connecting', icon: Link2      },
    { key: 'CONNECTED',            label: 'Connected',  icon: CheckCircle},
    { key: 'ESTIMATE_SHARED',      label: 'Estimate',   icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID',  label: 'Paid',       icon: CreditCard },
    { key: 'IN_PROGRESS',          label: 'In Progress',icon: Wrench     },
    { key: 'COMPLETED',            label: 'Completed',  icon: CheckCircle},
    { key: 'VERIFIED',             label: 'Verified',   icon: Shield     },
  ];

  const getCurrentStatusIndex = () => statusFlow.findIndex((s) => s.key === currentStatus);
  const isStatusCompleted = (index) => index < getCurrentStatusIndex();
  const isStatusCurrent  = (index) => index === getCurrentStatusIndex();

  const handleGenerateOtp = async () => {
    const executionId = execution?.id;
    if (!executionId) { toast.error('No execution found for this request'); return; }
    try {
      await dispatch(generateServiceOTP(executionId)).unwrap();
      toast.success('OTP generated and sent to the customer via email.');
    } catch (e) {
      toast.error(typeof e === 'string' ? e : e?.error || 'Failed to generate OTP');
    }
  };

  if (loading && !currentRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" />
          <p className="font-display text-sm font-semibold text-gray-400 tracking-wide uppercase">
            Loading service details…
          </p>
        </div>
      </div>
    );
  }

  const activeEstimate = estimates?.length > 0
    ? (estimates.find(e => e.status === 'SENT' || e.status === 'APPROVED') || estimates[0])
    : null;

  const showOtp            = execution?.escrow_paid && currentStatus === 'COMPLETED';
  const showServiceActions = ['SERVICE_AMOUNT_PAID', 'IN_PROGRESS'].includes(currentStatus);

  return (
    <div className="sf-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'Geist', 'Inter', sans-serif; }

        /* ─────────────────────────────────────────
           PAGE SKELETON
           The page is a vertical flex column:
             sf-root  (flex col, min-h-screen)
               sf-hero   (flex-shrink: 0 — never grows)
               sf-body   (flex: 1 — absorbs all remaining height)
                 sf-body-inner (max-width wrapper, also flex col)
                   sf-grid  (2-col grid on desktop, single col on mobile)
        ───────────────────────────────────────── */
        .sf-root {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f8f9fc;
          font-family: 'Geist', 'Inter', sans-serif;
        }

        /* Hero never stretches */
        .sf-hero {
          flex-shrink: 0;
          background: linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#312e81 70%,#1e3a5f 100%);
          position: relative;
          overflow: hidden;
        }
        .sf-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
          pointer-events: none;
        }

        /* Body grows to fill remaining viewport */
        .sf-body {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          min-height: 0; /* allow flex children to shrink below natural content size */
        }

        .sf-body-inner {
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          min-height: 0;
          max-width: 1152px;
          width: 100%;
          margin: 0 auto;
          padding: 1.25rem 1rem 1.5rem;
          box-sizing: border-box;
        }
        @media (min-width: 640px)  { .sf-body-inner { padding-left: 1.5rem; padding-right: 1.5rem; } }
        @media (min-width: 1024px) { .sf-body-inner { padding-left: 2rem;   padding-right: 2rem;   } }

        /* ─────────────────────────────────────────
           TWO-COLUMN GRID
           • Mobile  (< 1024px): stacked, each column auto height
           • Desktop (≥ 1024px): side-by-side, BOTH columns
             stretch to the same height via align-items: stretch
        ───────────────────────────────────────── */
        .sf-grid {
          flex: 1 1 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          min-height: 0;
          align-items: start; /* mobile: each stacks naturally */
        }
        @media (min-width: 1024px) {
          .sf-grid {
            grid-template-columns: 1fr 360px;
            align-items: stretch; /* desktop: both columns same height */
          }
        }

        /* ─────────────────────────────────────────
           CHAT COLUMN
           Mobile: fixed height so chat is usable
           Desktop: fills the full grid-row height so
                    Chat can use height: 100% inside
        ───────────────────────────────────────── */
        .sf-chat-col {
          display: flex;
          flex-direction: column;
          min-height: 480px;
          height: 540px; /* sensible mobile default */
        }
        @media (min-width: 1024px) {
          .sf-chat-col {
            height: auto;          /* let grid control the height */
            min-height: 500px;
          }
        }
        /* Chat component should fill its column fully */
        .sf-chat-col > * {
          flex: 1 1 auto;
          min-height: 0;
          /* If Chat uses height: 100%, it will fill this space */
        }

        /* ─────────────────────────────────────────
           SIDEBAR COLUMN
           Mobile: stacked below chat, natural height
           Desktop: sticky, scrolls independently
                    so it never pushes/overlaps the chat
        ───────────────────────────────────────── */
        .sf-sidebar-col {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-height: 0;
        }
        @media (min-width: 1024px) {
          .sf-sidebar-col {
            position: sticky;
            top: 1.25rem;
            /* cap sidebar height to viewport; scroll within */
            max-height: calc(100vh - 180px);
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #e2e8f0 transparent;
            /* padding so content doesn't clip against scrollbar */
            padding-right: 2px;
          }
        }

        /* Decorative blobs in hero */
        .glow-dot {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }

        /* ── Misc reusable ── */
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
          font-size: 0.68rem;
        }

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .animate-fade-up { animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100       { animation-delay: 80ms;  }
        .delay-200       { animation-delay: 160ms; }

        .status-node-done   { background: linear-gradient(135deg,#10b981,#059669); }
        .status-node-active {
          background: linear-gradient(135deg,#a78bfa,#818cf8);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.35);
        }
        .status-node-idle { background: rgba(255,255,255,0.18); }

        .sf-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
          transition: box-shadow 0.25s ease;
        }
        .sf-card:hover { box-shadow: 0 6px 24px rgba(99,102,241,0.07); }

        .action-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .action-btn:hover  { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        .tab-btn { transition: all 0.18s ease; }
      `}</style>

      {/* ──────────────── HERO ──────────────── */}
      <header className="sf-hero">
        <div
          className="glow-dot"
          style={{ width:'24rem', height:'24rem', background:'rgba(99,102,241,0.2)', top:'-60px', left:'-40px' }}
        />
        <div
          className="glow-dot"
          style={{ width:'16rem', height:'16rem', background:'rgba(167,139,250,0.15)', bottom:0, right:'2.5rem' }}
        />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">

          {/* Top row */}
          <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 badge-pill px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="section-label text-white/80 text-[0.62rem]">Mechanic View</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                Service{' '}
                <span style={{ background:'linear-gradient(to right,#c4b5fd,#a5b4fc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                  Flow
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-lg text-xs font-semibold">
                #{requestId}
              </span>
              {currentRequest?.user_name && (
                <span className="section-label text-white/50 text-[0.62rem]">
                  Customer:{' '}
                  <span className="text-white/70 normal-case font-body font-medium tracking-normal">
                    {currentRequest.user_name}
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Status strip */}
          <div className={`opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            <div className="overflow-x-auto pb-0">
              <div className="min-w-[580px] md:min-w-0 relative flex items-start justify-between py-3">
                <div className="absolute top-[22px] left-0 w-full h-0.5 bg-white/10 rounded-full" />
                <div
                  className="absolute top-[22px] left-0 h-0.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${(getCurrentStatusIndex() / (statusFlow.length - 1)) * 100}%`,
                    background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
                  }}
                />
                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const completed = isStatusCompleted(index);
                  const current   = isStatusCurrent(index);
                  return (
                    <div key={status.key} className="relative z-10 flex flex-col items-center flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white/20 transition-all duration-300 ${completed ? 'status-node-done' : current ? 'status-node-active scale-110' : 'status-node-idle'}`}>
                        <Icon className={`w-3.5 h-3.5 text-white ${current ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className={`text-[9px] font-display font-bold text-center mt-1.5 px-0.5 max-w-[60px] leading-tight ${completed ? 'text-white/70' : current ? 'text-white' : 'text-white/30'}`}>
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 flex justify-end">
          <span className="section-label text-white/40 text-[0.6rem]">
            Step {getCurrentStatusIndex() + 1} of {statusFlow.length}
          </span>
        </div>
      </header>

      {/* ──────────────── BODY ──────────────── */}
      <main className="sf-body">
        <div className="sf-body-inner">
          <div className="sf-grid">

            {/* ── LEFT: Chat ── */}
            <div className="sf-chat-col">
              <Chat
                serviceRequestId={requestId}
                canChat={!!currentRequest?.active_connection && !['EXPIRED','CANCELLED'].includes(currentStatus)}
                headerTitle="Service Chat Area"
                headerSubtitle="Connected with Workshop and Client"
                gradientFrom="from-indigo-600"
                gradientTo="to-violet-600"
              />
            </div>

            {/* ── RIGHT: Sidebar ── */}
            <div className="sf-sidebar-col">

              {/* Tab switcher */}
              <div className="sf-card p-1.5 flex-shrink-0">
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {['info', 'estimate'].map(t => (
                    <button
                      key={t}
                      onClick={() => setSidebarTab(t)}
                      className={`tab-btn flex-1 py-1.5 text-xs font-display font-bold rounded-lg capitalize ${sidebarTab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {t === 'info' ? 'Info' : 'Estimate'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── INFO TAB ── */}
              {sidebarTab === 'info' && (
                <>
                  {currentRequest && (
                    <div className="sf-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <span className="section-label text-indigo-500 block text-[0.62rem]">Vehicle Info</span>
                          <p className="font-display font-bold text-gray-900 text-sm">Request Details</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                          <p className="section-label text-indigo-400 text-[0.6rem] mb-0.5">Vehicle</p>
                          <p className="font-display font-bold text-gray-900 text-sm">
                            {currentRequest.vehicle_type} — {currentRequest.vehicle_model}
                          </p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          <p className="section-label text-gray-400 text-[0.6rem] mb-0.5">Issue</p>
                          <p className="font-display font-semibold text-gray-800 text-xs">{currentRequest.issue_category}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          <p className="section-label text-gray-400 text-[0.6rem] mb-1">Description</p>
                          <p className="font-body text-xs text-gray-600 leading-relaxed">{currentRequest.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {execution && (
                    <div className="sf-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <span className="section-label text-gray-400 block text-[0.62rem]">Timestamps</span>
                          <p className="font-display font-bold text-gray-900 text-sm">Service Timing</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          <span className="section-label text-gray-400 text-[0.6rem]">Started At</span>
                          <span className="font-body text-xs font-semibold text-gray-700">
                            {execution.started_at ? new Date(execution.started_at).toLocaleString() : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          <span className="section-label text-gray-400 text-[0.6rem]">Completed At</span>
                          <span className="font-body text-xs font-semibold text-gray-700">
                            {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {execution && (
                    <div className="sf-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-violet-600" />
                        </div>
                        <div>
                          <span className="section-label text-violet-500 block text-[0.62rem]">Assigned Team</span>
                          <p className="font-display font-bold text-gray-900 text-sm">Service Personnel</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {execution.lead_technician && (
                          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {execution.lead_technician.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-display font-bold text-gray-900 text-xs truncate">{execution.lead_technician.name}</p>
                              <span className="section-label text-indigo-600 text-[0.58rem]">Workshop Admin (Lead)</span>
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                <Mail className="w-2.5 h-2.5 text-indigo-400" />
                                <span className="truncate">{execution.lead_technician.email}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {execution.mechanics?.length > 0 && execution.mechanics.map(mechanic => (
                          <div key={mechanic.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {mechanic.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-display font-bold text-gray-900 text-xs truncate">{mechanic.name}</p>
                              <span className="section-label text-gray-400 text-[0.58rem]">Mechanic</span>
                              {mechanic.contact_number && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                  <Phone className="w-2.5 h-2.5" />{mechanic.contact_number}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {!execution.lead_technician && (!execution.mechanics || execution.mechanics.length === 0) && (
                          <div className="text-center py-5 border-2 border-dashed border-slate-200 rounded-xl">
                            <Users className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                            <p className="font-body text-xs text-gray-400">No personnel assigned yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── ESTIMATE TAB ── */}
              {sidebarTab === 'estimate' && (
                <div className="sf-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="section-label text-emerald-500 block text-[0.62rem]">Read-only</span>
                      <p className="font-display font-bold text-gray-900 text-sm">Estimate Breakdown</p>
                    </div>
                  </div>

                  {activeEstimate ? (
                    <div className="space-y-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        activeEstimate.status === 'APPROVED'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}>
                        {activeEstimate.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                        {activeEstimate.status}
                      </span>

                      {activeEstimate.line_items?.length > 0 && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                          {activeEstimate.line_items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                              <div className="flex-1 pr-2">
                                <p className="font-display font-semibold text-xs text-gray-800">{item.description}</p>
                                <p className="font-body text-[10px] text-gray-400">
                                  {item.item_type} · {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                                </p>
                              </div>
                              <p className="font-display font-bold text-xs text-gray-800 flex-shrink-0">
                                ₹{parseFloat(item.total).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1.5 text-xs">
                        <div className="flex justify-between font-body">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-semibold text-gray-800">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
                        </div>
                        {parseFloat(activeEstimate.tax_amount) > 0 && (
                          <div className="flex justify-between font-body">
                            <span className="text-gray-500">Tax</span>
                            <span className="font-semibold text-gray-800">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-1.5 border-t border-indigo-200">
                          <span className="font-display font-bold text-gray-900">Total</span>
                          <span className="font-display font-bold text-lg text-indigo-600">
                            ₹{parseFloat(activeEstimate.total_amount).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                        <span className="section-label text-gray-400 text-[0.6rem]">Escrow</span>
                        <span className={`font-display font-bold text-xs ${execution?.escrow_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {execution?.escrow_paid ? '✓ Paid (held)' : 'Not yet paid'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2">
                      <DollarSign className="w-8 h-8 text-slate-200" />
                      <p className="font-body text-xs text-gray-400">No estimate available yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* ── ACTIONS ── */}
              <div className="sf-card p-4 space-y-2.5 flex-shrink-0">
                <span className="section-label text-gray-400 text-[0.62rem] block">Actions</span>

                {showServiceActions && (
                  <>
                    {currentStatus === 'SERVICE_AMOUNT_PAID' && (
                      <button
                        onClick={async () => {
                          try {
                            await dispatch(startService(requestId)).unwrap();
                            toast.success('Service started successfully!');
                          } catch (e) { toast.error(e || 'Failed to start service'); }
                        }}
                        disabled={loading}
                        className="action-btn w-full py-2.5 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                        style={{ background: 'linear-gradient(to right,#10b981,#14b8a6)' }}
                      >
                        <Wrench className="w-3.5 h-3.5" /> Start Service
                      </button>
                    )}
                    {currentStatus === 'IN_PROGRESS' && (
                      <button
                        onClick={() => {
                          toast((t) => (
                            <div className="flex flex-col gap-3">
                              <div className="font-display font-semibold text-gray-900">Service completely finished?</div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toast.dismiss(t.id)}
                                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-600 font-medium hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={async () => {
                                    toast.dismiss(t.id);
                                    try {
                                      await dispatch(endService(requestId)).unwrap();
                                      dispatch(fetchServiceRequestDetails(requestId));
                                      toast.success('Service marked as completed!');
                                    } catch (e) { toast.error(e || 'Failed to finish service'); }
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                                >
                                  Confirm
                                </button>
                              </div>
                            </div>
                          ), { position: 'top-center' });
                        }}
                        disabled={loading}
                        className="action-btn w-full py-2.5 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                        style={{ background: 'linear-gradient(to right,#8b5cf6,#6366f1)' }}
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark as Completed
                      </button>
                    )}
                  </>
                )}

                {showOtp && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-500" />
                      <p className="font-display font-bold text-sm text-indigo-900">Completion OTP</p>
                    </div>
                    <p className="font-body text-[10px] text-indigo-700 leading-relaxed">
                      Generate and send OTP to the customer to confirm service completion and release payment.
                    </p>
                    <button
                      onClick={handleGenerateOtp}
                      className="action-btn w-full py-2.5 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                      style={{ background: 'linear-gradient(to right,#4f46e5,#7c3aed)' }}
                    >
                      <Key className="w-3.5 h-3.5" /> Send OTP to Customer
                    </button>
                  </div>
                )}

                {!showServiceActions && !showOtp && (
                  <div className="text-center py-3">
                    <p className="font-body text-xs text-gray-400">No actions available at this stage</p>
                  </div>
                )}
              </div>

            </div>{/* /sidebar */}
          </div>{/* /grid */}
        </div>{/* /body-inner */}
      </main>
    </div>
  );
};

export default MechanicServiceFlow;