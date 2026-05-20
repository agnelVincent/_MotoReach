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
  FileCheck,
  CreditCard,
  Link2,
  CheckCircle,
  DollarSign,
  Wrench,
  Shield,
  Users,
  Mail,
  Phone,
  Key,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useServiceFlowSocket } from '../../hooks/useServiceFlowSocket';
import Chat from '../../components/Chat';
import ServiceActionButton from '../../components/ServiceActionButton';

const MechanicServiceFlow = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();
  const [mounted, setMounted] = useState(false);
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
    { key: 'CREATED', label: 'Request Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Platform Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate Shared', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Service Amount Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'Service In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Service Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified & Closed', icon: Shield },
  ];

  const getCurrentStatusIndex = () => statusFlow.findIndex((s) => s.key === currentStatus);
  const isStatusCompleted = (index) => index < getCurrentStatusIndex();
  const isStatusCurrent = (index) => index === getCurrentStatusIndex();

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
          <p className="font-display text-sm font-semibold text-gray-400 tracking-wide uppercase">Loading service details…</p>
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
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
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
        .feature-card {
          transition: all 0.3s ease;
          border: 1px solid #f1f5f9;
        }
        .feature-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 8px 30px rgba(99,102,241,0.08);
        }
        .action-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .action-btn:hover  { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        /* Status tracker */
        .status-node-done   { background: linear-gradient(135deg,#10b981,#059669); }
        .status-node-active { background: linear-gradient(135deg,#4f46e5,#7c3aed); box-shadow: 0 0 0 4px rgba(99,102,241,0.2); }
        .status-node-idle   { background: #e2e8f0; }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient hero-noise relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-64 h-64 bg-violet-400 opacity-15 bottom-0 right-10" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full mb-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="section-label text-white/80">Mechanic View</span>
          </div>

          <h1 className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Service{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              Flow
            </span>
          </h1>

          <div className={`flex flex-wrap items-center gap-3 opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="section-label text-white/50">Request</span>
              <span className="font-mono bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-lg text-sm font-semibold">
                #{requestId}
              </span>
            </div>
            {currentRequest?.user_name && (
              <>
                <span className="text-white/20">·</span>
                <span className="section-label text-white/50">
                  Customer: <span className="text-white/70 normal-case font-body font-medium tracking-normal">{currentRequest.user_name}</span>
                </span>
              </>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── MAIN ── */}
      <div className="grid-lines max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6">

        {/* ── STATUS TRACKER ── */}
        <div className="feature-card bg-white rounded-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <span className="section-label text-indigo-500 mb-1 block">Service Progress</span>
              <h2 className="font-display font-bold text-xl md:text-2xl text-gray-900">Step-by-step status</h2>
            </div>
            <span className="section-label text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-1.5 rounded-full">
              Step {getCurrentStatusIndex() + 1} / {statusFlow.length}
            </span>
          </div>

          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <div className="min-w-[720px] md:min-w-0">
              <div className="flex items-start justify-between relative">
                <div className="absolute top-5 left-0 w-full h-1.5 bg-slate-100 rounded-full" />
                <div
                  className="absolute top-5 left-0 h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${(getCurrentStatusIndex() / (statusFlow.length - 1)) * 100}%`,
                    background: 'linear-gradient(90deg,#4f46e5,#7c3aed)',
                  }}
                />
                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const completed = isStatusCompleted(index);
                  const current = isStatusCurrent(index);
                  return (
                    <div key={status.key} className="relative z-10 flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-all duration-300 ${completed ? 'status-node-done' : current ? 'status-node-active scale-110' : 'status-node-idle'}`}>
                        <Icon className={`w-4 h-4 text-white ${current ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className={`text-[10px] font-display font-bold text-center mt-2.5 px-1 max-w-[72px] leading-tight ${completed || current ? 'text-gray-800' : 'text-gray-400'}`}>
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── SERVICE ACTION BUTTON ── */}
        <ServiceActionButton
          currentStatus={currentStatus}
          onStart={async () => {
            try {
              await dispatch(startService(requestId)).unwrap();
              toast.success('Service started successfully!');
            } catch (e) {
              toast.error(e || 'Failed to start service');
            }
          }}
          onEnd={async () => {
            toast((t) => (
              <div className="flex flex-col gap-3">
                <div className="font-display font-semibold text-gray-900">
                  Are you sure the service is completely finished?
                </div>
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
                      } catch (e) {
                        toast.error(e || 'Failed to finish service');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ), { position: 'top-center' });
          }}
          loading={loading}
          disabled={loading}
        />

        {/* ── CHAT + SIDEBAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chat */}
          <div className="lg:col-span-2">
            <Chat
              serviceRequestId={requestId}
              canChat={!!currentRequest?.active_connection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)}
              headerTitle="Service Chat Area"
              headerSubtitle="Connected with Workshop and Client"
              gradientFrom="from-indigo-600"
              gradientTo="to-violet-600"
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Request Details */}
            {currentRequest && (
              <div className="feature-card bg-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="section-label text-indigo-500 block">Vehicle info</span>
                    <h3 className="font-display font-bold text-gray-900 text-base">Request Details</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                    <p className="section-label text-indigo-400 mb-0.5">Vehicle</p>
                    <p className="font-display font-bold text-gray-900">
                      {currentRequest.vehicle_type} — {currentRequest.vehicle_model}
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <p className="section-label text-gray-400 mb-0.5">Issue</p>
                    <p className="font-display font-semibold text-gray-800 text-sm">{currentRequest.issue_category}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <p className="section-label text-gray-400 mb-1">Description</p>
                    <p className="font-body text-sm text-gray-600 leading-relaxed">{currentRequest.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Estimate Breakdown */}
            {estimates && estimates.length > 0 && (() => {
              const activeEstimate = estimates.find(e => e.status === 'SENT' || e.status === 'APPROVED') || estimates[0];
              return (
                <div className="feature-card bg-white rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <span className="section-label text-emerald-500 block">Read-only</span>
                      <h3 className="font-display font-bold text-gray-900 text-base">Estimate Breakdown</h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Status */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      activeEstimate.status === 'APPROVED'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    }`}>
                      {activeEstimate.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                      {activeEstimate.status}
                    </span>

                    {/* Line items */}
                    {activeEstimate.line_items?.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                        {activeEstimate.line_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="flex-1 pr-3">
                              <p className="font-display font-semibold text-sm text-gray-800">{item.description}</p>
                              <p className="font-body text-xs text-gray-400 mt-0.5">
                                {item.item_type} · {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-display font-bold text-sm text-gray-800">₹{parseFloat(item.total).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1.5 text-sm">
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
                      <div className="flex justify-between pt-2 border-t border-indigo-200">
                        <span className="font-display font-bold text-gray-900">Total</span>
                        <span className="font-display font-bold text-lg text-indigo-600">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Escrow status */}
                    <div className="flex justify-between items-center px-1">
                      <span className="section-label text-gray-400">Escrow</span>
                      <span className={`font-display font-bold text-sm ${execution?.escrow_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {execution?.escrow_paid ? '✓ Paid (held)' : 'Not yet paid'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Service Personnel */}
            {execution && (
              <div className="feature-card bg-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <span className="section-label text-violet-500 block">Assigned team</span>
                    <h3 className="font-display font-bold text-gray-900 text-base">Service Personnel</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {execution.lead_technician && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-md flex-shrink-0">
                          {execution.lead_technician.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-gray-900">{execution.lead_technician.name}</p>
                          <span className="section-label text-indigo-600 block mb-2">Workshop Admin (Lead)</span>
                          <div className="inline-flex items-center gap-1.5 bg-white border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-gray-500 max-w-full">
                            <Mail className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <span className="truncate">{execution.lead_technician.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {execution.mechanics?.length > 0 && execution.mechanics.map((mechanic) => (
                    <div key={mechanic.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-md flex-shrink-0">
                          {mechanic.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-display font-bold text-gray-900">{mechanic.name}</p>
                          <span className="section-label text-gray-400 block mb-2">Mechanic</span>
                          {mechanic.contact_number && (
                            <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-gray-500">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {mechanic.contact_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {!execution.lead_technician && (!execution.mechanics || execution.mechanics.length === 0) && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Users className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="font-display font-semibold text-sm text-gray-500">No personnel assigned yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Completion OTP */}
            {execution?.escrow_paid && currentStatus === 'COMPLETED' && (
              <div className="feature-card bg-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Key className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <span className="section-label text-amber-500 block">Final step</span>
                    <h3 className="font-display font-bold text-gray-900 text-base">Completion OTP</h3>
                  </div>
                </div>

                <p className="font-body text-sm text-gray-500 leading-relaxed mb-4">
                  Generate an OTP to send to the customer. They must enter it to confirm completion and release payment.
                </p>

                <button
                  onClick={handleGenerateOtp}
                  disabled={!execution?.escrow_paid}
                  className="action-btn w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-display font-bold text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                >
                  <Key className="w-4 h-4" />
                  {execution?.escrow_paid ? 'Send OTP to Customer' : 'Waiting for escrow payment'}
                </button>

                {!execution?.escrow_paid && (
                  <p className="font-body text-xs text-gray-400 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    OTP can only be generated after the customer pays the escrow.
                  </p>
                )}
              </div>
            )}

            {/* Service Timing */}
            {execution && (
              <div className="feature-card bg-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <span className="section-label text-gray-400 block">Timestamps</span>
                    <h3 className="font-display font-bold text-gray-900 text-base">Service Timing</h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <span className="section-label text-gray-400">Started At</span>
                    <span className="font-body text-sm font-semibold text-gray-700">
                      {execution.started_at ? new Date(execution.started_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                    <span className="section-label text-gray-400">Completed At</span>
                    <span className="font-body text-sm font-semibold text-gray-700">
                      {execution.completed_at ? new Date(execution.completed_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicServiceFlow;