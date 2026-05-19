import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircle, Phone, Star, MapPin, Mail, AlertCircle, Ban,
  DollarSign, FileCheck, Wrench, CreditCard, Shield, Clock, Link2, User, Users
} from 'lucide-react';
import { fetchNearbyWorkshops, userCancelConnection, fetchServiceRequestDetails, fetchEstimates, approveEstimate, rejectEstimate, verifyServiceOTP, submitServiceRating, clearCurrentRequest } from '../../redux/slices/serviceRequestSlice';
import { createEscrowCheckout, resetPaymentState } from '../../redux/slices/paymentSlice';
import Chat from '../../components/Chat';
import toast from 'react-hot-toast';
import { useServiceFlowSocket } from '../../hooks/useServiceFlowSocket';
import ReportComplaintModal from '../../components/ReportComplaintModal';

const UserServiceFlow = () => {
  const { requestId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { currentRequest, loading, estimates } = useSelector((state) => state.serviceRequest);
  const { checkoutUrl: escrowCheckoutUrl, loading: escrowLoading } = useSelector((state) => state.payment);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ratingState, setRatingState] = useState({
    workshop_rating: { rating: 0, comment: '' },
    mechanic_ratings: {}
  });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (requestId) {
      dispatch(fetchServiceRequestDetails(requestId));
    }
    return () => { dispatch(clearCurrentRequest()); };
  }, [dispatch, requestId]);

  const currentRequestRef = useRef(currentRequest);
  useEffect(() => { currentRequestRef.current = currentRequest; }, [currentRequest]);

  useServiceFlowSocket(requestId, () => {
    if (requestId) {
      dispatch(fetchServiceRequestDetails(requestId));
      const connectionId = currentRequestRef.current?.active_connection?.id;
      if (connectionId) dispatch(fetchEstimates(connectionId));
    }
  });

  useEffect(() => {
    if (currentRequest?.active_connection?.id) {
      dispatch(fetchEstimates(currentRequest.active_connection.id));
    }
  }, [dispatch, currentRequest?.active_connection?.id, currentRequest?.status]);

  useEffect(() => {
    const escrowSuccess = searchParams.get('escrow_success');
    const escrowCanceled = searchParams.get('escrow_canceled');
    if (escrowSuccess === 'true') {
      toast.success('Payment successful. Amount is held in escrow until service completion.', { id: 'escrow-success' });
      setSearchParams({}, { replace: true });
    }
    if (escrowCanceled === 'true') {
      toast.error('Payment was canceled.', { id: 'escrow-canceled' });
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch, requestId]);

  useEffect(() => {
    if (escrowCheckoutUrl) {
      window.location.href = escrowCheckoutUrl;
      dispatch(resetPaymentState());
    }
  }, [escrowCheckoutUrl, dispatch]);

  const handleCancelConnection = async () => {
    if (!requestId) return;
    if (currentRequest?.status === 'PLATFORM_FEE_PAID' && !currentRequest?.active_connection) {
      toast.success("Connection already cancelled");
      return;
    }
    try {
      const result = await dispatch(userCancelConnection(requestId)).unwrap();
      if (result) {
        toast.success("Connection cancelled successfully");
        dispatch(fetchNearbyWorkshops(requestId));
      }
    } catch (error) {
      console.error(error);
      toast.error(typeof error === 'string' ? error : "Failed to cancel connection");
    }
  };

  const currentStatus = currentRequest?.status || 'CREATED';
  const connection = currentRequest?.active_connection;

  const statusFlow = [
    { key: 'CREATED', label: 'Request Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Platform Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Workshop Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate Shared', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Service Amount Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'Service In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Service Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified & Closed', icon: Shield }
  ];

  const getCurrentStatusIndex = () => statusFlow.findIndex(s => s.key === currentStatus);
  const isStatusCompleted = (index) => index < getCurrentStatusIndex();
  const isStatusCurrent = (index) => index === getCurrentStatusIndex();

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otpValues];
      newOtp[index] = value;
      setOtpValues(newOtp);
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtpValues(newOtp.slice(0, 6));
      const nextIndex = Math.min(pastedData.length, 5);
      const nextInput = document.getElementById(`otp-input-${nextIndex}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleApproveEstimate = async (estimateId) => {
    try {
      await dispatch(approveEstimate({ estimateId })).unwrap();
      toast.success('Estimate approved. Please pay to proceed.');
      if (currentRequest?.active_connection?.id) dispatch(fetchEstimates(currentRequest.active_connection.id));
    } catch (e) {
      toast.error(e?.error || 'Failed to approve estimate');
    }
  };

  const handleRejectEstimate = async (estimateId) => {
    try {
      await dispatch(rejectEstimate({ estimateId })).unwrap();
      toast.success('Estimate rejected. Workshop can send a new one.');
      if (currentRequest?.active_connection?.id) dispatch(fetchEstimates(currentRequest.active_connection.id));
    } catch (e) {
      toast.error(e?.error || 'Failed to reject estimate');
    }
  };

  const handlePayEscrow = async (estimateId) => {
    try {
      await dispatch(createEscrowCheckout({ estimateId })).unwrap();
    } catch (e) {
      toast.error(typeof e === 'string' ? e : e?.error || 'Failed to start payment');
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) { toast.error('Enter 6-digit OTP'); return; }
    const executionId = currentRequest?.execution?.id;
    if (!executionId) { toast.error('No service execution found'); return; }
    setVerifyingOtp(true);
    try {
      await dispatch(verifyServiceOTP({ executionId, otp, requestId })).unwrap();
      toast.success('Service verified. Payment has been released to the workshop.');
      setOtpValues(['', '', '', '', '', '']);
    } catch (e) {
      toast.error(e?.error || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmitRatings = async () => {
    const executionId = currentRequest?.execution?.id;
    if (!executionId) return;
    const mechanicArray = [];
    Object.keys(ratingState.mechanic_ratings).forEach(mechId => {
      if (ratingState.mechanic_ratings[mechId].rating > 0) {
        mechanicArray.push({
          mechanic_id: mechId,
          rating: ratingState.mechanic_ratings[mechId].rating,
          comment: ratingState.mechanic_ratings[mechId].comment
        });
      }
    });
    const payload = {
      workshop_rating: ratingState.workshop_rating.rating > 0 ? ratingState.workshop_rating : null,
      mechanic_ratings: mechanicArray
    };
    if (!payload.workshop_rating && payload.mechanic_ratings.length === 0) {
      toast.error("Please provide at least one rating.");
      return;
    }
    setSubmittingRating(true);
    try {
      await dispatch(submitServiceRating({ executionId, ratingData: payload })).unwrap();
      toast.success("Ratings submitted successfully! Thank you for your feedback.");
      setRatingSubmitted(true);
    } catch(e) {
      toast.error(e?.error || "Failed to submit ratings.");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading && !currentRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="font-display text-sm font-semibold text-gray-500 tracking-wide uppercase">Loading request…</p>
        </div>
      </div>
    );
  }

  const showCancelButton = !['SERVICE_AMOUNT_PAID', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'].includes(currentStatus);

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
        .badge-pill {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
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
        .action-btn {
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .action-btn:hover { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        /* Status tracker */
        .status-node-done { background: linear-gradient(135deg, #10b981, #059669); }
        .status-node-active { background: linear-gradient(135deg, #4f46e5, #7c3aed); box-shadow: 0 0 0 4px rgba(99,102,241,0.2); }
        .status-node-idle { background: #e2e8f0; }

        /* OTP inputs */
        .otp-box {
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .otp-box:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
          background: white;
          outline: none;
        }

        /* Star rating */
        .star-btn { transition: transform 0.15s ease; }
        .star-btn:hover { transform: scale(1.2); }
      `}</style>

      {/* ── HERO ── */}
      <section className="hero-gradient hero-noise relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-64 h-64 bg-violet-400 opacity-15 bottom-0 right-10" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">Live Tracking</span>
          </div>

          <h1 className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-3 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Service{' '}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
              Tracking
            </span>
          </h1>

          <div className={`flex flex-wrap items-center gap-3 opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            <div className="flex items-center gap-2">
              <span className="section-label text-white/50">Request ID</span>
              <span className="font-mono bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-lg text-sm font-semibold">
                #{requestId}
              </span>
            </div>
            {currentRequest?.created_at && (
              <span className="section-label text-white/40">
                {new Date(currentRequest.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── MAIN CONTENT ── */}
      <div className="grid-lines max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">

        {/* ── STATUS TRACKER ── */}
        <div className="feature-card bg-white rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <span className="section-label text-indigo-500 mb-1 block">Service Progress</span>
              <h2 className="font-display font-bold text-xl md:text-2xl text-gray-900">Step-by-step status</h2>
            </div>
            <span className="badge-pill !bg-indigo-50 !border-indigo-100 !backdrop-filter-none px-4 py-1.5 rounded-full section-label text-indigo-600">
              Step {getCurrentStatusIndex() + 1} / {statusFlow.length}
            </span>
          </div>

          <div className="overflow-x-auto -mx-2 px-2 pb-2">
            <div className="min-w-[720px] md:min-w-0">
              <div className="flex items-start justify-between relative">
                {/* Track background */}
                <div className="absolute top-5 left-0 w-full h-1.5 bg-slate-100 rounded-full" />
                {/* Track fill */}
                <div
                  className="absolute top-5 left-0 h-1.5 rounded-full transition-all duration-700"
                  style={{
                    width: `${(getCurrentStatusIndex() / (statusFlow.length - 1)) * 100}%`,
                    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)'
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
                      <p className={`text-[10px] text-center mt-2.5 font-display font-bold px-1 max-w-[72px] leading-tight ${completed || current ? 'text-gray-800' : 'text-gray-400'}`}>
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── CHAT + SIDEBAR ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Chat */}
          <div className="lg:col-span-2">
            <Chat
              key={requestId}
              serviceRequestId={requestId}
              canChat={!!connection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)}
              headerTitle={connection ? connection.workshop_name : 'Finding Workshop...'}
              headerSubtitle={connection ? 'Connected' : 'Pending'}
              headerIcon={Wrench}
              gradientFrom="from-indigo-600"
              gradientTo="to-violet-600"
              disabledMessage="Chat will be available once a workshop accepts your request and the connection is active."
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Workshop Details */}
            {connection && (
              <div className="feature-card bg-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <span className="section-label text-indigo-500 block">Connected to</span>
                    <h3 className="font-display font-bold text-gray-900 text-base">Workshop Details</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex items-center justify-between">
                    <p className="font-display font-bold text-gray-900 text-base">{connection.workshop_name}</p>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-xs font-bold">
                      <CheckCircle className="w-3.5 h-3.5" /> Connected
                    </span>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="section-label text-gray-400 mb-0.5">Address</p>
                        <p className="font-body text-sm text-gray-700 leading-relaxed">{connection.address}</p>
                      </div>
                    </div>
                    {connection.workshop_phone && (
                      <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                        <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div>
                          <p className="section-label text-gray-400 mb-0.5">Contact</p>
                          <p className="font-body text-sm font-semibold text-gray-800">{connection.workshop_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Service Personnel */}
            {currentRequest?.execution && (
              <div className="feature-card bg-white rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <span className="section-label text-violet-500 block">Assigned team</span>
                    <h3 className="font-display font-bold text-gray-900 text-base">Service Personnel</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {currentRequest.execution.lead_technician && (
                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-md flex-shrink-0">
                          {currentRequest.execution.lead_technician.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-gray-900">{currentRequest.execution.lead_technician.name}</p>
                          <span className="section-label text-indigo-600 block mb-2">Lead Technician</span>
                          <div className="inline-flex items-center gap-1.5 bg-white border border-indigo-100 rounded-lg px-2.5 py-1 text-xs text-gray-600 truncate max-w-full">
                            <Mail className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                            <span className="truncate">{currentRequest.execution.lead_technician.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentRequest.execution.mechanics?.length > 0 && currentRequest.execution.mechanics.map((mechanic) => (
                    <div key={mechanic.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-md flex-shrink-0">
                          {mechanic.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-display font-bold text-gray-900">{mechanic.name}</p>
                          <span className="section-label text-gray-500 block mb-2">Mechanic</span>
                          {mechanic.contact_number && (
                            <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              {mechanic.contact_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {!currentRequest.execution.lead_technician && (!currentRequest.execution.mechanics || currentRequest.execution.mechanics.length === 0) && (
                    <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                      <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-7 h-7 text-slate-300" />
                      </div>
                      <p className="font-display font-semibold text-sm text-gray-500">No personnel assigned yet</p>
                      <p className="font-body text-xs text-gray-400 mt-1">The workshop will assign technicians soon</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Service Estimate */}
            <div className="feature-card bg-white rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <span className="section-label text-emerald-500 block">Cost breakdown</span>
                  <h3 className="font-display font-bold text-gray-900 text-base">Service Estimate</h3>
                </div>
              </div>

              {estimates && estimates.length > 0 ? (() => {
                const activeEstimate = estimates.find(e => e.status === 'SENT' || e.status === 'APPROVED') || estimates[0];
                return (
                  <div className="space-y-4">
                    {/* Status badge */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        activeEstimate.status === 'APPROVED' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' :
                        activeEstimate.status === 'SENT' ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' :
                        activeEstimate.status === 'REJECTED' ? 'bg-red-50 border border-red-200 text-red-700' :
                        'bg-slate-50 border border-slate-200 text-slate-700'
                      }`}>
                        {activeEstimate.status === 'APPROVED' && <CheckCircle className="w-3.5 h-3.5" />}
                        {activeEstimate.status}
                      </span>
                      {activeEstimate.expires_at && (
                        <span className="text-xs text-gray-400 font-body">
                          Expires {new Date(activeEstimate.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Line items */}
                    {activeEstimate.line_items?.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3">
                        <p className="section-label text-gray-500 mb-2">Cost breakdown</p>
                        {activeEstimate.line_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                            <div className="flex-1 pr-3">
                              <p className="font-display font-semibold text-sm text-gray-800">{item.description}</p>
                              <p className="font-body text-xs text-gray-400 mt-0.5">
                                {item.item_type} · {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                              </p>
                            </div>
                            <p className="font-display font-bold text-gray-800 text-sm">₹{parseFloat(item.total).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Financial summary */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between font-body text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-semibold text-gray-800">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
                      </div>
                      {parseFloat(activeEstimate.tax_amount) > 0 && (
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-gray-500">Tax ({activeEstimate.tax_rate}%)</span>
                          <span className="font-semibold text-gray-800">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                        </div>
                      )}
                      {parseFloat(activeEstimate.discount_amount) > 0 && (
                        <div className="flex justify-between font-body text-sm">
                          <span className="text-gray-500">Discount</span>
                          <span className="font-semibold text-emerald-600">-₹{parseFloat(activeEstimate.discount_amount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                        <span className="font-display font-bold text-gray-900">Total</span>
                        <span className="font-display font-bold text-xl text-indigo-600">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Workshop notes */}
                    {activeEstimate.notes && (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                        <p className="section-label text-amber-700 mb-1">Workshop Notes</p>
                        <p className="font-body text-sm text-gray-700">{activeEstimate.notes}</p>
                      </div>
                    )}

                    {/* Approve / Reject */}
                    {activeEstimate.status === 'SENT' && (
                      <div className="space-y-2 pt-1">
                        {activeEstimate.expires_at && new Date(activeEstimate.expires_at) < new Date() && (
                          <p className="font-body text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            This estimate has expired. You can still reject it or ask the workshop for a new one.
                          </p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveEstimate(activeEstimate.id)}
                            disabled={!!(activeEstimate.expires_at && new Date(activeEstimate.expires_at) < new Date())}
                            className="action-btn flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectEstimate(activeEstimate.id)}
                            className="action-btn flex-1 py-3 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl font-display font-bold text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pay escrow */}
                    {activeEstimate.status === 'APPROVED' && currentRequest?.execution && !currentRequest.execution.escrow_paid && (
                      <div className="pt-1">
                        <button
                          onClick={() => handlePayEscrow(activeEstimate.id)}
                          disabled={escrowLoading}
                          className="action-btn w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-display font-bold text-sm disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
                        >
                          <CreditCard className="w-4 h-4" />
                          {escrowLoading ? 'Redirecting…' : `Pay ₹${parseFloat(activeEstimate.total_amount).toFixed(2)} (Escrow)`}
                        </button>
                        <p className="font-body text-xs text-gray-400 mt-2 text-center">
                          Amount is held securely until you verify service completion.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })() : (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-indigo-400" />
                  </div>
                  <p className="font-display font-semibold text-sm text-gray-600 text-center">Waiting for estimate</p>
                  <p className="font-body text-xs text-gray-400 text-center">You'll be notified once the estimate is ready</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {showCancelButton && (
                <button
                  onClick={handleCancelConnection}
                  className="action-btn w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-2xl font-display font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <Ban className="w-4 h-4" />
                  Cancel Connection
                </button>
              )}
              <button
                onClick={() => setShowComplaintModal(true)}
                className="action-btn w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-display font-bold flex items-center justify-center gap-2 shadow-lg"
              >
                <AlertCircle className="w-4 h-4" />
                Report a Problem
              </button>
            </div>
          </div>
        </div>

        {/* ── OTP VERIFICATION ── */}
        {currentRequest?.execution?.escrow_paid && currentRequest?.status !== 'VERIFIED' && (
          <div className="feature-card bg-white rounded-2xl p-8 md:p-10 mb-8">
            <div className="max-w-lg mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 mb-4">
                  <Shield className="w-8 h-8 text-indigo-600" />
                </div>
                <span className="section-label text-indigo-500 mb-2 block">Secure Verification</span>
                <h3 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-3">
                  Service Completion Verification
                </h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                  Once the service is completed, the workshop will provide you with a 6-digit OTP. Enter it below to verify and release payment.
                </p>
              </div>

              {/* OTP boxes */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 md:p-8 mb-5">
                <p className="section-label text-gray-400 text-center mb-5">Enter 6-Digit OTP</p>
                <div className="flex gap-2 md:gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={verifyingOtp || currentRequest?.status === 'VERIFIED'}
                      className="otp-box w-11 h-11 md:w-14 md:h-14 text-center font-display font-bold text-xl md:text-2xl bg-white border-2 border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      autoComplete="off"
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || currentRequest?.status === 'VERIFIED' || otpValues.join('').length !== 6}
                  className="action-btn w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-display font-bold text-base shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify & Complete Service
                    </>
                  )}
                </button>

                <p className="font-body text-xs text-gray-400 text-center mt-4">
                  💡 You can paste the OTP directly into the first box
                </p>
              </div>

              {/* Security note */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-display font-bold text-sm text-indigo-900 mb-0.5">Secure Payment Release</p>
                  <p className="font-body text-xs text-indigo-700 leading-relaxed">
                    Your payment is held securely in escrow and will only be released after you verify completion with the OTP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SERVICE VERIFIED + RATING ── */}
        {currentRequest?.status === 'VERIFIED' && (
          <div className="feature-card bg-white rounded-2xl p-8 md:p-10">
            <div className="max-w-2xl mx-auto">
              {/* Success banner */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <span className="section-label text-emerald-500 mb-2 block">Service Complete</span>
                <h3 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-3">
                  Service Verified Successfully!
                </h3>
                <p className="font-body text-sm text-gray-500 leading-relaxed">
                  Payment has been released to the workshop. Thank you for using our service!
                </p>
              </div>

              {!ratingSubmitted ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <span className="section-label text-indigo-500 mb-1 block">Your feedback</span>
                    <h4 className="font-display font-bold text-xl text-gray-900">Rate your experience</h4>
                  </div>

                  {/* Workshop rating */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-indigo-100 border border-indigo-200 rounded-xl flex items-center justify-center">
                        <Wrench className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="font-display font-bold text-gray-900">
                        {connection?.workshop_name || 'Workshop'}
                      </p>
                    </div>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={`ws-${star}`}
                          onClick={() => setRatingState(prev => ({ ...prev, workshop_rating: { ...prev.workshop_rating, rating: star } }))}
                          className="star-btn"
                        >
                          <Star className={`w-7 h-7 ${star <= ratingState.workshop_rating.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full font-body text-sm p-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                      rows={2}
                      placeholder="Leave a comment about the workshop…"
                      value={ratingState.workshop_rating.comment}
                      onChange={(e) => setRatingState(prev => ({ ...prev, workshop_rating: { ...prev.workshop_rating, comment: e.target.value } }))}
                    />
                  </div>

                  {/* Mechanic ratings */}
                  {currentRequest?.execution?.mechanics?.length > 0 && currentRequest.execution.mechanics.map(mechanic => (
                    <div key={`mech-${mechanic.id}`} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-display font-bold text-base">
                          {mechanic.name.charAt(0)}
                        </div>
                        <p className="font-display font-bold text-gray-900">{mechanic.name}</p>
                        <span className="section-label text-gray-400">Mechanic</span>
                      </div>
                      <div className="flex gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const currentRating = ratingState.mechanic_ratings[mechanic.id]?.rating || 0;
                          return (
                            <button
                              key={`mech-${mechanic.id}-${star}`}
                              onClick={() => setRatingState(prev => ({
                                ...prev,
                                mechanic_ratings: { ...prev.mechanic_ratings, [mechanic.id]: { ...prev.mechanic_ratings[mechanic.id], rating: star } }
                              }))}
                              className="star-btn"
                            >
                              <Star className={`w-6 h-6 ${star <= currentRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                            </button>
                          );
                        })}
                      </div>
                      <textarea
                        className="w-full font-body text-sm p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                        rows={2}
                        placeholder={`Leave a comment about ${mechanic.name}…`}
                        value={ratingState.mechanic_ratings[mechanic.id]?.comment || ''}
                        onChange={(e) => setRatingState(prev => ({
                          ...prev,
                          mechanic_ratings: { ...prev.mechanic_ratings, [mechanic.id]: { ...prev.mechanic_ratings[mechanic.id], comment: e.target.value } }
                        }))}
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleSubmitRatings}
                    disabled={submittingRating}
                    className="action-btn w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-display font-bold shadow-lg disabled:opacity-70"
                  >
                    {submittingRating ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              ) : (
                <div className="text-center bg-emerald-50 border border-emerald-100 rounded-2xl p-8">
                  <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                  <h4 className="font-display font-bold text-gray-900 text-lg mb-1">Thank you!</h4>
                  <p className="font-body text-sm text-gray-500">Your feedback helps us improve our service.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ReportComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        serviceRequestId={requestId}
      />
    </div>
  );
};

export default UserServiceFlow;