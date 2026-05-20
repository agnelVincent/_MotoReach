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
  const [sidebarTab, setSidebarTab] = useState('info');
  const [ratingState, setRatingState] = useState({
    workshop_rating: { rating: 0, comment: '' },
    mechanic_ratings: {}
  });
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Track hero height for accurate content area calculation
  const heroRef = useRef(null);
  const [heroHeight, setHeroHeight] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!heroRef.current) return;
    const observer = new ResizeObserver(() => {
      setHeroHeight(heroRef.current?.offsetHeight ?? 0);
    });
    observer.observe(heroRef.current);
    setHeroHeight(heroRef.current.offsetHeight);
    return () => observer.disconnect();
  }, []);

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
    { key: 'CREATED', label: 'Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified', icon: Shield }
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
  const showOtp = currentRequest?.execution?.escrow_paid && currentStatus !== 'VERIFIED';
  const isVerified = currentStatus === 'VERIFIED';

  const activeEstimate = estimates && estimates.length > 0
    ? (estimates.find(e => e.status === 'SENT' || e.status === 'APPROVED') || estimates[0])
    : null;

  // Content area height = 100dvh minus hero height minus body padding (top 20px + bottom 20px = 40px)
  const CONTENT_PADDING = 40;
  const contentHeight = heroHeight > 0 ? `calc(100dvh - ${heroHeight}px - ${CONTENT_PADDING}px)` : '70vh';

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans flex flex-col">
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
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 80ms; }
        .delay-200 { animation-delay: 160ms; }

        .section-label {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.68rem;
        }

        .status-node-done   { background: linear-gradient(135deg,#10b981,#059669); }
        .status-node-active { background: linear-gradient(135deg,#a78bfa,#818cf8); box-shadow: 0 0 0 3px rgba(167,139,250,0.35); }
        .status-node-idle   { background: rgba(255,255,255,0.18); }

        .sf-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
          transition: box-shadow 0.25s ease;
        }
        .sf-card:hover { box-shadow: 0 6px 24px rgba(99,102,241,0.07); }

        .tab-btn { transition: all 0.18s ease; }

        .action-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .action-btn:hover { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        .otp-box { transition: border-color 0.2s, box-shadow 0.2s, background 0.2s; }
        .otp-box:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.2); background: white; outline: none; }

        .star-btn { transition: transform 0.15s ease; }
        .star-btn:hover { transform: scale(1.2); }

        /* ── KEY FIX: 2-col layout that fills exactly the remaining viewport height ── */
        .flow-layout {
          display: flex;
          flex-direction: column;
          flex: 1 1 0;
          min-height: 0;
        }

        .flow-grid {
          display: grid;
          grid-template-columns: 1fr 360px;
          gap: 1.25rem;
          align-items: stretch; /* both cols same height */
          flex: 1 1 0;
          min-height: 0;
        }

        /* Left column: chat stretches to fill, no fixed viewport math */
        .chat-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          min-width: 0;
        }

        /* The chat card itself fills the column */
        .chat-col > * {
          flex: 1 1 0;
          min-height: 0;
        }

        /* Right sidebar: scroll within its own column, never overflow */
        .sidebar-col {
          display: flex;
          flex-direction: column;
          min-height: 0;
          min-width: 0;
          gap: 0.75rem;
        }

        .sidebar-scroll {
          flex: 1 1 0;
          min-height: 0;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #e2e8f0 transparent;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* Actions pinned to bottom of sidebar */
        .sidebar-actions {
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .flow-grid {
            grid-template-columns: 1fr;
            /* On tablet/mobile don't force a fixed height — let content flow */
            align-items: start;
            flex: none;
          }
          .chat-col {
            /* Give chat a sensible fixed height on mobile instead of flex-fill */
            height: 500px;
            flex: none;
          }
          .sidebar-col {
            flex: none;
          }
          .sidebar-scroll {
            flex: none;
            max-height: 600px;
          }
        }

        @media (max-width: 640px) {
          .chat-col {
            height: 420px;
          }
        }
      `}</style>

      {/* ── HERO + STATUS STRIP ── */}
      <section ref={heroRef} className="hero-gradient hero-noise relative overflow-hidden flex-shrink-0">
        <div className="glow-dot w-80 h-80 bg-indigo-500 opacity-20 top-[-60px] left-[-40px]" />
        <div className="glow-dot w-56 h-56 bg-violet-400 opacity-15 bottom-0 right-10" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          {/* Top row */}
          <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 badge-pill px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="section-label text-white/80 text-[0.62rem]">Live Tracking</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                Service{' '}
                <span className="bg-gradient-to-r from-violet-300 to-indigo-200 bg-clip-text text-transparent">
                  Tracking
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-lg text-xs font-semibold">
                #{requestId}
              </span>
              {currentRequest?.created_at && (
                <span className="section-label text-white/40 text-[0.62rem]">
                  {new Date(currentRequest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                    background: 'linear-gradient(90deg,#a78bfa,#818cf8)'
                  }}
                />
                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const completed = isStatusCompleted(index);
                  const current = isStatusCurrent(index);
                  return (
                    <div key={status.key} className="relative z-10 flex flex-col items-center flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white/20 transition-all duration-300 ${completed ? 'status-node-done' : current ? 'status-node-active scale-110' : 'status-node-idle'}`}>
                        <Icon className={`w-3.5 h-3.5 text-white ${current ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className={`text-[9px] text-center mt-1.5 font-display font-bold px-0.5 max-w-[60px] leading-tight ${completed ? 'text-white/70' : current ? 'text-white' : 'text-white/30'}`}>
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Step counter */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 flex items-center justify-end">
          <span className="section-label text-white/40 text-[0.6rem]">
            Step {getCurrentStatusIndex() + 1} of {statusFlow.length}
          </span>
        </div>
      </section>

      {/* ── MAIN CONTENT: fills remaining viewport height ── */}
      <div
        className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-5 flow-layout"
        style={{ height: contentHeight }}
      >
        <div className="flow-grid">

          {/* ── LEFT: Chat or Rating ── */}
          <div className="chat-col">
            {isVerified ? (
              /* Rating panel */
              <div className="sf-card overflow-y-auto p-6">
                <div className="text-center mb-5">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <span className="section-label text-emerald-500 mb-1 block">Service Complete</span>
                  <h2 className="font-display font-bold text-2xl text-gray-900 mb-1">Service Verified!</h2>
                  <p className="font-body text-sm text-gray-500">Payment has been released. Thank you for using MotoReach!</p>
                </div>

                {!ratingSubmitted ? (
                  <div className="space-y-4 max-w-lg mx-auto">
                    <div className="text-center mb-2">
                      <h4 className="font-display font-bold text-lg text-gray-900">Rate your experience</h4>
                    </div>

                    {/* Workshop rating */}
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-xl flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-indigo-600" />
                        </div>
                        <p className="font-display font-bold text-gray-900">{connection?.workshop_name || 'Workshop'}</p>
                      </div>
                      <div className="flex gap-2 mb-3">
                        {[1,2,3,4,5].map(star => (
                          <button key={`ws-${star}`} onClick={() => setRatingState(prev => ({ ...prev, workshop_rating: { ...prev.workshop_rating, rating: star } }))} className="star-btn">
                            <Star className={`w-7 h-7 ${star <= ratingState.workshop_rating.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                          </button>
                        ))}
                      </div>
                      <textarea
                        className="w-full font-body text-sm p-3 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                        rows={2}
                        placeholder="Leave a comment about the workshop…"
                        value={ratingState.workshop_rating.comment}
                        onChange={e => setRatingState(prev => ({ ...prev, workshop_rating: { ...prev.workshop_rating, comment: e.target.value } }))}
                      />
                    </div>

                    {/* Mechanic ratings */}
                    {currentRequest?.execution?.mechanics?.length > 0 && currentRequest.execution.mechanics.map(mechanic => (
                      <div key={`mech-${mechanic.id}`} className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
                            {mechanic.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-display font-bold text-gray-900 text-sm">{mechanic.name}</p>
                            <span className="section-label text-gray-400 text-[0.6rem]">Mechanic</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mb-3">
                          {[1,2,3,4,5].map(star => {
                            const cur = ratingState.mechanic_ratings[mechanic.id]?.rating || 0;
                            return (
                              <button key={`mech-${mechanic.id}-${star}`} onClick={() => setRatingState(prev => ({ ...prev, mechanic_ratings: { ...prev.mechanic_ratings, [mechanic.id]: { ...prev.mechanic_ratings[mechanic.id], rating: star } } }))} className="star-btn">
                                <Star className={`w-6 h-6 ${star <= cur ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'}`} />
                              </button>
                            );
                          })}
                        </div>
                        <textarea
                          className="w-full font-body text-sm p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:outline-none resize-none"
                          rows={2}
                          placeholder={`Comment about ${mechanic.name}…`}
                          value={ratingState.mechanic_ratings[mechanic.id]?.comment || ''}
                          onChange={e => setRatingState(prev => ({ ...prev, mechanic_ratings: { ...prev.mechanic_ratings, [mechanic.id]: { ...prev.mechanic_ratings[mechanic.id], comment: e.target.value } } }))}
                        />
                      </div>
                    ))}

                    <button
                      onClick={handleSubmitRatings}
                      disabled={submittingRating}
                      className="action-btn w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-display font-bold shadow-lg disabled:opacity-70"
                    >
                      {submittingRating ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center bg-emerald-50 border border-emerald-100 rounded-2xl p-8 max-w-sm mx-auto">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <h4 className="font-display font-bold text-gray-900 text-lg mb-1">Thank you!</h4>
                    <p className="font-body text-sm text-gray-500">Your feedback helps us improve.</p>
                  </div>
                )}
              </div>
            ) : (
              /* Chat — must fill its container height */
              <Chat
                key={requestId}
                serviceRequestId={requestId}
                canChat={!!connection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)}
                headerTitle={connection ? connection.workshop_name : 'Finding Workshop...'}
                headerSubtitle={connection ? 'Connected' : 'Pending'}
                headerIcon={Wrench}
                gradientFrom="from-indigo-600"
                gradientTo="to-violet-600"
                disabledMessage="Chat will be available once a workshop accepts your request."
                // Pass className so Chat itself can fill height; 
                // also ensure Chat's own container uses h-full internally
                className="h-full"
              />
            )}
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="sidebar-col">

            {/* Tab switcher — never scrolls, always visible */}
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

            {/* Scrollable tab content */}
            <div className="sidebar-scroll">

              {/* ── INFO TAB ── */}
              {sidebarTab === 'info' && (
                <>
                  {connection ? (
                    <div className="sf-card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                          <Wrench className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <span className="section-label text-indigo-500 block text-[0.62rem]">Connected Workshop</span>
                          <p className="font-display font-bold text-gray-900 text-sm">{connection.workshop_name}</p>
                        </div>
                        <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex-shrink-0">
                          <CheckCircle className="w-3 h-3" /> Live
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <p className="font-body text-xs text-gray-600 leading-relaxed">{connection.address}</p>
                        </div>
                        {connection.workshop_phone && (
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                            <Phone className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                            <p className="font-body text-xs font-semibold text-gray-700">{connection.workshop_phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="sf-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-slate-300" />
                        </div>
                        <div>
                          <span className="section-label text-gray-400 block text-[0.62rem]">Workshop</span>
                          <p className="font-display font-bold text-gray-500 text-sm">Searching nearby…</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-body">
                        <Clock className="w-3.5 h-3.5" /> You'll be notified when a workshop connects
                      </div>
                    </div>
                  )}

                  {currentRequest?.execution && (
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
                        {currentRequest.execution.lead_technician && (
                          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {currentRequest.execution.lead_technician.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-display font-bold text-gray-900 text-xs truncate">{currentRequest.execution.lead_technician.name}</p>
                              <span className="section-label text-indigo-500 text-[0.58rem]">Lead Technician</span>
                            </div>
                            <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[80px]">{currentRequest.execution.lead_technician.email}</span>
                            </div>
                          </div>
                        )}
                        {currentRequest.execution.mechanics?.map(mechanic => (
                          <div key={mechanic.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {mechanic.name.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-display font-bold text-gray-900 text-xs truncate">{mechanic.name}</p>
                              <span className="section-label text-gray-400 text-[0.58rem]">Mechanic</span>
                            </div>
                            {mechanic.contact_number && (
                              <div className="flex items-center gap-1 text-[10px] text-gray-400 flex-shrink-0">
                                <Phone className="w-3 h-3" />{mechanic.contact_number}
                              </div>
                            )}
                          </div>
                        ))}
                        {!currentRequest.execution.lead_technician && (!currentRequest.execution.mechanics || currentRequest.execution.mechanics.length === 0) && (
                          <div className="text-center py-5 border-2 border-dashed border-slate-200 rounded-xl">
                            <User className="w-6 h-6 text-slate-300 mx-auto mb-1" />
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
                      <span className="section-label text-emerald-500 block text-[0.62rem]">Cost Breakdown</span>
                      <p className="font-display font-bold text-gray-900 text-sm">Service Estimate</p>
                    </div>
                  </div>

                  {activeEstimate ? (
                    <div className="space-y-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        activeEstimate.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                        activeEstimate.status === 'SENT' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                        activeEstimate.status === 'REJECTED' ? 'bg-red-50 border-red-200 text-red-700' :
                        'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        {activeEstimate.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                        {activeEstimate.status}
                      </span>

                      {activeEstimate.line_items?.length > 0 && (
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                          <p className="section-label text-gray-400 text-[0.62rem] mb-1">Items</p>
                          {activeEstimate.line_items.map((item, i) => (
                            <div key={i} className="flex justify-between items-start pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                              <div className="flex-1 pr-2">
                                <p className="font-display font-semibold text-xs text-gray-800">{item.description}</p>
                                <p className="font-body text-[10px] text-gray-400">{item.item_type} · {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}</p>
                              </div>
                              <p className="font-display font-bold text-xs text-gray-800">₹{parseFloat(item.total).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between font-body text-xs">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-semibold text-gray-800">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
                        </div>
                        {parseFloat(activeEstimate.tax_amount) > 0 && (
                          <div className="flex justify-between font-body text-xs">
                            <span className="text-gray-500">Tax ({activeEstimate.tax_rate}%)</span>
                            <span className="font-semibold text-gray-800">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(activeEstimate.discount_amount) > 0 && (
                          <div className="flex justify-between font-body text-xs">
                            <span className="text-gray-500">Discount</span>
                            <span className="font-semibold text-emerald-600">-₹{parseFloat(activeEstimate.discount_amount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-1.5 border-t border-indigo-200">
                          <span className="font-display font-bold text-gray-900 text-sm">Total</span>
                          <span className="font-display font-bold text-lg text-indigo-600">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
                        </div>
                      </div>

                      {activeEstimate.notes && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <p className="section-label text-amber-700 text-[0.62rem] mb-1">Workshop Notes</p>
                          <p className="font-body text-xs text-gray-700">{activeEstimate.notes}</p>
                        </div>
                      )}

                      {activeEstimate.status === 'SENT' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleApproveEstimate(activeEstimate.id)}
                            disabled={!!(activeEstimate.expires_at && new Date(activeEstimate.expires_at) < new Date())}
                            className="action-btn flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-display font-bold text-xs disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectEstimate(activeEstimate.id)}
                            className="action-btn flex-1 py-2.5 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 rounded-xl font-display font-bold text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      )}

                      {activeEstimate.status === 'APPROVED' && currentRequest?.execution && !currentRequest.execution.escrow_paid && (
                        <div>
                          <button
                            onClick={() => handlePayEscrow(activeEstimate.id)}
                            disabled={escrowLoading}
                            className="action-btn w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-display font-bold text-sm disabled:opacity-70 flex items-center justify-center gap-2 shadow-md"
                          >
                            <CreditCard className="w-4 h-4" />
                            {escrowLoading ? 'Redirecting…' : `Pay ₹${parseFloat(activeEstimate.total_amount).toFixed(2)}`}
                          </button>
                          <p className="font-body text-[10px] text-gray-400 mt-1.5 text-center">Held securely in escrow until service is verified</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-indigo-300" />
                      </div>
                      <p className="font-display font-semibold text-xs text-gray-500">Awaiting estimate</p>
                      <p className="font-body text-[10px] text-gray-400 text-center">You'll be notified once ready</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── ACTIONS: pinned to bottom, never scrolls out of view ── */}
            <div className="sidebar-actions sf-card p-4 space-y-3">
              <span className="section-label text-gray-400 text-[0.62rem] block">Actions</span>

              {showOtp && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-indigo-500" />
                    <p className="font-display font-bold text-sm text-indigo-900">Verify Service OTP</p>
                  </div>
                  <p className="font-body text-[10px] text-indigo-700 leading-relaxed">Enter the 6-digit OTP provided by the workshop to release payment.</p>
                  <div className="flex gap-1.5 justify-center" onPaste={handleOtpPaste}>
                    {otpValues.map((value, index) => (
                      <input
                        key={index}
                        id={`otp-input-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={value}
                        onChange={e => handleOtpChange(index, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(index, e)}
                        disabled={verifyingOtp}
                        className="otp-box w-9 h-10 text-center font-display font-bold text-base bg-white border-2 border-indigo-200 rounded-lg disabled:opacity-50"
                        autoComplete="off"
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpValues.join('').length !== 6}
                    className="action-btn w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-display font-bold text-xs disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {verifyingOtp ? (
                      <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" /> Verifying…</>
                    ) : (
                      <><CheckCircle className="w-3.5 h-3.5" /> Verify &amp; Complete</>
                    )}
                  </button>
                </div>
              )}

              {showCancelButton && (
                <button
                  onClick={handleCancelConnection}
                  className="action-btn w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Ban className="w-3.5 h-3.5" /> Cancel Connection
                </button>
              )}

              <button
                onClick={() => setShowComplaintModal(true)}
                className="action-btn w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Report a Problem
              </button>
            </div>

          </div>
        </div>
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