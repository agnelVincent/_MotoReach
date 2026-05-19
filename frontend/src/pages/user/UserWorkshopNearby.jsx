import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  MapPin, ArrowRight, Shield, Search, SlidersHorizontal,
  CheckCircle, AlertCircle, X, CreditCard, AlertTriangle, Clock,
  Wallet, Zap, Award, ChevronDown, Info
} from 'lucide-react';
import { fetchNearbyWorkshops, userCancelConnection, userConnectToWorkshop } from '../../redux/slices/serviceRequestSlice';
import { initiatePlatformFeePayment, payPlatformFeeWithWallet } from '../../redux/slices/paymentSlice';
import { fetchWallet } from '../../redux/slices/walletSlice'; 
import { toast } from 'react-hot-toast';

// ─── PLATFORM FEE CONSTANT ────────────────────────────────────────────────────
const PLATFORM_FEE = 200.00;

const UserWorkshopNearby = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { requestId } = useParams();

  const { nearbyWorkshops, currentRequest, loading } = useSelector((state) => state.serviceRequest);
  const { balance } = useSelector((state) => state.wallet);

  const queryParams = new URLSearchParams(location.search);
  const paymentSuccess = queryParams.get('payment_success');
  const paymentCanceled = queryParams.get('payment_canceled');
  const [showSuccessMessage, setShowSuccessMessage] = useState(!!paymentSuccess);
  const [showCancelMessage, setShowCancelMessage] = useState(!!paymentCanceled);
  const [urlParamsCleared, setUrlParamsCleared] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  useEffect(() => {
    if (!currentRequest || currentRequest.id !== parseInt(requestId)) {
      dispatch(fetchNearbyWorkshops(requestId));
    }
  }, [dispatch, requestId]);

  useEffect(() => {
    if (paymentCanceled) {
        navigate(`/user/workshops-nearby/${requestId}`, { replace: true });
    }
  }, [paymentCanceled, requestId, navigate]);

  useEffect(() => {
    if (paymentSuccess) {
      dispatch(fetchNearbyWorkshops(requestId));
        navigate(`/user/workshops-nearby/${requestId}`, { replace: true });
    }
  }, [paymentSuccess, requestId, navigate, dispatch]);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.spinnerWrap}>
          <div style={styles.spinnerRing}></div>
          <div style={styles.spinnerCore}></div>
        </div>
        <p style={styles.loadingText}>Locating nearby workshops…</p>
      </div>
    );
  }

  const filteredWorkshops = nearbyWorkshops.filter(w =>
    w.workshop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.address_line.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedWorkshops = [...filteredWorkshops].sort((a, b) =>
    sortBy === 'rating' ? b.rating_avg - a.rating_avg : a.distance - b.distance
  );

  const handleConnect = async (workshopId, workshopName) => {
    if (!currentRequest?.platform_fee_paid) {
      await dispatch(fetchWallet());
      setSelectedWorkshop({ id: workshopId, name: workshopName });
      setShowPaymentModal(true);
      return;
    }
    await connectToWorkshop(workshopId);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    try {
      if (paymentMethod === 'wallet') {
        const resultAction = await dispatch(payPlatformFeeWithWallet({
          serviceRequestId: currentRequest.id,
          workshopId: selectedWorkshop?.id
        }));
        if (payPlatformFeeWithWallet.fulfilled.match(resultAction)) {
          toast.success("Payment successful! Connection request sent.");
          await dispatch(fetchNearbyWorkshops(requestId));
          await dispatch(fetchWallet());
          setShowPaymentModal(false);
        } else {
          toast.error(resultAction.payload || "Wallet payment failed.");
        }
      } else {
        const resultAction = await dispatch(initiatePlatformFeePayment({
          serviceRequestId: currentRequest.id,
          workshopId: selectedWorkshop?.id
        }));
        if (initiatePlatformFeePayment.fulfilled.match(resultAction)) {
          const data = resultAction.payload;
          if (data.message === 'Platform fee already paid') {
            await dispatch(fetchNearbyWorkshops(requestId));
            setShowPaymentModal(false);
            await connectToWorkshop(selectedWorkshop.id);
          } else if (data.url) {
            window.location.href = data.url;
          }
        } else {
          toast.error(resultAction.payload || "Failed to initiate payment.");
          setShowPaymentModal(false);
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
      setShowPaymentModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const connectToWorkshop = async (workshopId) => {
    try {
      await dispatch(userConnectToWorkshop({ requestId, workshopId })).unwrap();
      toast.success("Connection request sent successfully!");
      dispatch(fetchNearbyWorkshops(requestId));
    } catch (error) {
      const msg = error.error || error.message || "Failed to connect.";
      toast.error(msg);
    }
  };

  const handleDisconnectClick = (serviceRequestId) => {
    setShowDisconnectModal(true);
  };

  const handleDisconnectConfirm = async () => {
    setIsProcessing(true);
    try {
      await dispatch(userCancelConnection(requestId)).unwrap();
      toast.success("Disconnected successfully");
      dispatch(fetchNearbyWorkshops(requestId));
      setShowDisconnectModal(false);
    } catch (error) {
      toast.error("Failed to disconnect");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const half = !filled && i === Math.floor(rating) && rating % 1 >= 0.5;
      return (
        <span key={i} style={{ color: filled || half ? '#F59E0B' : '#D1D5DB', fontSize: 14 }}>
          {filled ? '★' : half ? '⯨' : '☆'}
        </span>
      );
    });
  };

  const insufficientBalance = balance < PLATFORM_FEE;

  return (
    <>
      <style>{css}</style>
      <div style={styles.page}>

        {/* ── PAYMENT MODAL ──────────────────────────────────────────────── */}
        {showPaymentModal && (
          <div style={styles.backdrop}>
            <div style={styles.modal} className="modal-enter">

              {/* Modal Header */}
              <div style={styles.modalHeader}>
                <div style={styles.modalHeaderInner}>
                  <div style={styles.modalIcon}>
                    <CreditCard size={22} color="#fff" />
                  </div>
                  <div>
                    <p style={styles.modalLabel}>One-time charge</p>
                    <h3 style={styles.modalTitle}>Platform Access Fee</h3>
                  </div>
                </div>
                <button style={styles.modalClose} onClick={() => setShowPaymentModal(false)}>
                  <X size={18} />
                </button>
              </div>

              {/* Fee Breakdown */}
              <div style={styles.feeBanner}>
                <div style={styles.feeRow}>
                  <span style={styles.feeLabel}>Connecting to</span>
                  <span style={styles.feeWorkshop}>{selectedWorkshop?.name}</span>
                </div>
                <div style={styles.feeDivider} />
                <div style={styles.feeAmountRow}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={styles.feeTotalLabel}>Total Amount Due</p>
                    <p style={styles.feeNote}>One-time fee · Valid for this service request</p>
                  </div>
                  <div style={styles.feeAmount}>₹{PLATFORM_FEE.toFixed(2)}</div>
                </div>
                <div style={styles.feeInfoRow}>
                  <Info size={13} color="#6B7280" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={styles.feeInfoText}>This fee allows you to connect with any workshop for this request.</span>
                </div>
              </div>

              {/* Payment Method */}
              <p style={styles.methodHeading}>Select payment method</p>
              <div style={styles.methodList}>
                {/* Card */}
                <div
                  style={{ ...styles.methodCard, ...(paymentMethod === 'stripe' ? styles.methodCardActive : {}) }}
                  onClick={() => setPaymentMethod('stripe')}
                >
                  <div style={{ ...styles.methodIconBox, ...(paymentMethod === 'stripe' ? styles.methodIconBoxActive : {}) }}>
                    <CreditCard size={18} color={paymentMethod === 'stripe' ? '#fff' : '#6B7280'} />
                  </div>
                  <div style={styles.methodInfo}>
                    <p style={styles.methodName}>Debit / Credit Card</p>
                    <p style={styles.methodSub}>Secured by Stripe · All major cards accepted</p>
                  </div>
                  <div style={{ ...styles.methodRadio, ...(paymentMethod === 'stripe' ? styles.methodRadioActive : {}) }}>
                    {paymentMethod === 'stripe' && <div style={styles.methodRadioDot} />}
                  </div>
                </div>

                {/* Wallet */}
                <div
                  style={{ ...styles.methodCard, ...(paymentMethod === 'wallet' ? styles.methodCardActive : {}), ...(insufficientBalance ? styles.methodCardDisabled : {}) }}
                  onClick={() => !insufficientBalance && setPaymentMethod('wallet')}
                >
                  <div style={{ ...styles.methodIconBox, ...(paymentMethod === 'wallet' ? styles.methodIconBoxActive : {}) }}>
                    <Wallet size={18} color={paymentMethod === 'wallet' ? '#fff' : '#6B7280'} />
                  </div>
                  <div style={styles.methodInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <p style={styles.methodName}>Wallet Balance</p>
                      <span style={{ ...styles.balanceBadge, ...(insufficientBalance ? styles.balanceBadgeInsufficient : styles.balanceBadgeSufficient) }}>
                        ₹{Number(balance).toFixed(2)}
                      </span>
                    </div>
                    {insufficientBalance
                      ? <p style={styles.methodSubDanger}>Insufficient balance — need ₹{PLATFORM_FEE.toFixed(2)}</p>
                      : <p style={styles.methodSub}>After payment: ₹{(Number(balance) - PLATFORM_FEE).toFixed(2)} remaining</p>
                    }
                  </div>
                  <div style={{ ...styles.methodRadio, ...(paymentMethod === 'wallet' ? styles.methodRadioActive : {}) }}>
                    {paymentMethod === 'wallet' && <div style={styles.methodRadioDot} />}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div style={styles.modalActions}>
                <button style={styles.btnCancel} onClick={() => setShowPaymentModal(false)} disabled={isProcessing}>
                  Cancel
                </button>
                <button
                  style={{ ...styles.btnPay, ...(isProcessing ? styles.btnDisabled : {}) }}
                  onClick={handlePaymentConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <><span style={styles.btnSpinner} className="spin" /> Processing…</>
                  ) : (
                    <>Pay ₹{PLATFORM_FEE.toFixed(2)} <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── DISCONNECT MODAL ───────────────────────────────────────────── */}
        {showDisconnectModal && (
          <div style={styles.backdrop}>
            <div style={{ ...styles.modal, maxWidth: 440 }} className="modal-enter">
              <div style={styles.disconnectIconWrap}>
                <AlertTriangle size={28} color="#EF4444" />
              </div>
              <h3 style={{ ...styles.modalTitle, textAlign: 'center', marginBottom: 8, color: '#111827', padding: '0 24px' }}>Disconnect Workshop?</h3>
              <p style={styles.disconnectBody}>
                You're about to cancel your connection with this workshop. Any ongoing communication will end immediately.
              </p>
              <div style={styles.warningBox}>
                <AlertCircle size={15} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={styles.warningText}>This action cannot be undone. You'll need to send a new connection request.</span>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.btnCancel} onClick={() => setShowDisconnectModal(false)} disabled={isProcessing}>
                  Keep Connected
                </button>
                <button
                  style={{ ...styles.btnDanger, ...(isProcessing ? styles.btnDisabled : {}) }}
                  onClick={handleDisconnectConfirm}
                  disabled={isProcessing}
                >
                  {isProcessing ? <><span style={styles.btnSpinner} className="spin" /> Disconnecting…</> : 'Yes, Disconnect'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── EXPIRED OVERLAY ────────────────────────────────────────────── */}
        {currentRequest?.status === 'EXPIRED' && (
          <div style={styles.expiredOverlay}>
            <div style={styles.expiredCard}>
              <div style={styles.expiredIcon}><Clock size={32} color="#EF4444" /></div>
              <h2 style={styles.expiredTitle}>Request Expired</h2>
              <p style={styles.expiredBody}>
                This service request has expired and is no longer active.
                {currentRequest.platform_fee_paid
                  ? ' The platform fee has been refunded to your wallet.'
                  : ' Please create a new request to continue.'}
              </p>
              <button style={styles.btnBack} onClick={() => navigate('/user/services')}>
                Back to Services
              </button>
            </div>
          </div>
        )}

        {/* ── HERO ── */}
        <section style={styles.hero}>
          <div style={styles.heroBlobA} />
          <div style={styles.heroBlobB} />
          <div className="nw-ring" style={styles.heroRing}>
            <div style={styles.heroRingInner} />
            <div style={{ ...styles.heroRingInner, inset: 32 }} />
            <div style={styles.heroRingCenter}><MapPin size={28} color="rgba(255,255,255,0.15)" /></div>
          </div>
          <div style={styles.heroContent}>
            {/* Badge */}
            <div style={styles.heroBadge}>
              <span style={styles.heroPulseDot} />
              <span style={styles.heroBadgeText}>Live Results</span>
            </div>
            {/* Title */}
            <h1 style={styles.heroTitle}>
              Nearby{' '}
              <span style={styles.heroTitleGrad}>Workshops</span>
            </h1>
            <p style={styles.heroSub}>
              <MapPin size={15} color="#a78bfa" style={{ marginRight: 6, flexShrink: 0 }} />
              Showing verified workshops near your location
            </p>
            {/* Fee notice */}
            {!currentRequest?.platform_fee_paid && (
              <div style={styles.heroFeeNotice}>
                <div style={styles.heroFeeIcon}><CreditCard size={15} color="#4F46E5" /></div>
                <span style={styles.heroFeeText}>One-time platform fee of</span>
                <span style={styles.heroFeeAmt}>₹{PLATFORM_FEE.toFixed(2)}</span>
                <span style={styles.heroFeeBadge}>Required to connect</span>
              </div>
            )}
          </div>
          <div style={styles.heroCurve} />
        </section>

        {/* ── PAGE CONTENT ── */}
        <div style={styles.container}>
          {/* Toast banners */}
          {showSuccessMessage && (
            <div style={{ ...styles.toast, ...styles.toastSuccess }}>
              <CheckCircle size={18} color="#059669" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.toastTitle}>Payment Successful</p>
                <p style={styles.toastSub}>Platform fee paid. Connection request sent.</p>
              </div>
              <button style={styles.toastClose} onClick={() => setShowSuccessMessage(false)}><X size={15} /></button>
            </div>
          )}
          {showCancelMessage && (
            <div style={{ ...styles.toast, ...styles.toastDanger }}>
              <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={styles.toastTitle}>Payment Cancelled</p>
                <p style={styles.toastSub}>Pay the platform fee to connect with workshops.</p>
              </div>
              <button style={styles.toastClose} onClick={() => setShowCancelMessage(false)}><X size={15} /></button>
            </div>
          )}

          {/* Stats */}
          <div style={styles.statsGrid} className="stats-grid">
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg,#6366F1,#4F46E5)' }}>
                <MapPin size={18} color="#fff" />
              </div>
              <div>
                <p style={styles.statLabel}>Workshops Found</p>
                <p style={styles.statValue}>{nearbyWorkshops.length}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                <Shield size={18} color="#fff" />
              </div>
              <div>
                <p style={styles.statLabel}>Closest Workshop</p>
                <p style={{ ...styles.statValue, color: '#059669' }}>
                  {nearbyWorkshops.length > 0 ? `${nearbyWorkshops[0].distance} km` : 'N/A'}
                </p>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                <Award size={18} color="#fff" />
              </div>
              <div>
                <p style={styles.statLabel}>Highest Rating</p>
                <p style={{ ...styles.statValue, color: '#D97706' }}>
                  {nearbyWorkshops.length > 0
                    ? Math.max(...nearbyWorkshops.map(w => w.rating_avg)).toFixed(1)
                    : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Sort */}
          <div style={styles.toolbar} className="toolbar">
            <div style={styles.searchWrap}>
              <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name or location…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>
            <div style={styles.sortWrap}>
              <SlidersHorizontal size={15} color="#9CA3AF" style={styles.sortIcon} />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={styles.sortSelect}
              >
                <option value="distance">Nearest First</option>
                <option value="rating">Top Rated</option>
              </select>
              <ChevronDown size={14} color="#9CA3AF" style={styles.sortChevron} />
            </div>
          </div>

          {/* Cards */}
          <div style={styles.cardGrid} className="card-grid">
            {sortedWorkshops.map((workshop, idx) => {
              const connection = currentRequest?.active_connection;
              const isConnectedToThis = connection?.workshop_id === workshop.id;
              const isConnectedToAny = !!connection;

              return (
                <div key={workshop.id} style={styles.card} className="card-hover">
                  {/* Card top strip */}
                  <div style={styles.cardStrip}>
                    <div style={styles.cardDistanceBadge}>
                      <MapPin size={12} color="#6366F1" />
                      <span>{workshop.distance} km away</span>
                    </div>
                    <div style={styles.verifiedBadge}>
                      <Shield size={11} />
                      <span>Verified</span>
                    </div>
                  </div>

                  {/* Workshop info */}
                  <div style={styles.cardBody}>
                    <h3 style={styles.cardName}>{workshop.workshop_name}</h3>
                    <div style={styles.cardAddress}>
                      <MapPin size={13} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{workshop.address_line}, {workshop.city}</span>
                    </div>

                    {/* Rating */}
                    <div style={styles.ratingRow}>
                      <div style={styles.stars}>{renderStars(workshop.rating_avg)}</div>
                      <span style={styles.ratingNum}>{Number(workshop.rating_avg).toFixed(1)}</span>
                      <span style={styles.ratingCount}>rating</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={styles.cardDivider} />

                  {/* Action */}
                  <div style={styles.cardFooter}>
                    {(() => {
                      if (isConnectedToThis) {
                        if (connection.status === 'REQUESTED') {
                          return (
                            <div style={styles.actionRow}>
                              <button style={styles.btnPending} disabled>
                                <Clock size={15} /> Request Sent
                              </button>
                              <button style={styles.btnXSmall} onClick={() => handleDisconnectClick(currentRequest.id)} title="Cancel">
                                <X size={15} />
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div style={styles.actionRow}>
                            <button style={styles.btnConnected} disabled>
                              <CheckCircle size={15} /> Connected
                            </button>
                            <button style={styles.btnXSmall} onClick={() => handleDisconnectClick(currentRequest.id)} title="Disconnect">
                              <X size={15} />
                            </button>
                          </div>
                        );
                      }
                      if (isConnectedToAny) {
                        return (
                          <button style={styles.btnUnavailable} disabled>
                            <Shield size={15} /> Unavailable
                          </button>
                        );
                      }
                      return (
                        <button
                          style={styles.btnConnect}
                          onClick={() => handleConnect(workshop.id, workshop.workshop_name)}
                          className="btn-connect-hover"
                        >
                          Connect Now <ArrowRight size={15} />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty state */}
          {sortedWorkshops.length === 0 && (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}><MapPin size={32} color="#D1D5DB" /></div>
              <h3 style={styles.emptyTitle}>No Workshops Found</h3>
              <p style={styles.emptySub}>
                {searchTerm ? 'Try adjusting your search term.' : 'No workshops found within 20 km of your location.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// ─── STYLES ───────────────────────────────────────────────────────────────────
const styles = {
  /* ── Hero ── */
  hero: { background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 40%,#312e81 70%,#1e3a5f 100%)', position: 'relative', overflow: 'hidden', paddingBottom: 56 },
  heroBlobA: { position: 'absolute', width: 340, height: 340, borderRadius: '50%', background: '#6366F1', opacity: 0.18, filter: 'blur(80px)', top: -80, left: -60, pointerEvents: 'none' },
  heroBlobB: { position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: '#818cf8', opacity: 0.13, filter: 'blur(80px)', top: 20, right: 40, pointerEvents: 'none' },
  heroRing: { position: 'absolute', right: 48, top: 40, width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', animation: 'float 6s ease-in-out infinite' },
  heroRingInner: { position: 'absolute', inset: 16, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)' },
  heroRingCenter: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  heroContent: { position: 'relative', zIndex: 10, maxWidth: 1200, margin: '0 auto', padding: '64px 24px 20px' },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: 100, marginBottom: 20 },
  heroPulseDot: { width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' },
  heroBadgeText: { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' },
  heroTitle: { fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 800, color: '#fff', lineHeight: 1.05, margin: '0 0 14px', letterSpacing: '-0.02em' },
  heroTitleGrad: { background: 'linear-gradient(to right,#c4b5fd,#e0e7ff,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' },
  heroSub: { display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '1rem', margin: '0 0 24px', flexWrap: 'wrap' },
  heroFeeNotice: { display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '12px 18px' },
  heroFeeIcon: { width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroFeeText: { fontSize: 13, color: 'rgba(255,255,255,0.65)' },
  heroFeeAmt: { fontSize: 18, fontWeight: 800, color: '#c4b5fd' },
  heroFeeBadge: { fontSize: 11, fontWeight: 700, background: '#FFF7ED', color: '#C2410C', padding: '4px 10px', borderRadius: 6, border: '1px solid #FED7AA' },
  heroCurve: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 56, background: '#F8F9FC', clipPath: 'ellipse(55% 100% at 50% 100%)' },
  page: { minHeight: '100vh', background: '#F8F9FC', fontFamily: "'DM Sans','Segoe UI',sans-serif" },
  container: { maxWidth: 1200, margin: '0 auto', padding: '40px 16px 64px', backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' },

  // Loading
  loadingScreen: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#F8F9FC' },
  spinnerWrap: { position: 'relative', width: 56, height: 56 },
  spinnerRing: { position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #E0E7FF' },
  spinnerCore: { position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#6B7280', fontWeight: 600, fontSize: 15 },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 },
  statCard: { background: '#fff', borderRadius: 16, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid #F3F4F6', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', transition: 'transform 0.2s ease,box-shadow 0.2s ease', cursor: 'default' },
  statIcon: { width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: 700, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' },
  statValue: { fontSize: 24, fontWeight: 800, color: '#111827', lineHeight: 1 },

  // Toolbar
  toolbar: { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  searchWrap: { flex: 1, minWidth: 200, position: 'relative' },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '11px 14px 11px 40px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  sortWrap: { position: 'relative', minWidth: 160 },
  sortIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  sortSelect: { width: '100%', padding: '11px 36px 11px 36px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#374151', background: '#fff', outline: 'none', appearance: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  sortChevron: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },

  // Cards
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 20, border: '1.5px solid #F1F5F9', overflow: 'hidden', transition: 'box-shadow 0.3s ease,transform 0.3s ease,border-color 0.3s ease', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardStrip: { padding: '12px 18px', background: 'linear-gradient(to right,#FAFBFF,#F5F3FF)', borderBottom: '1px solid #EEF2FF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardDistanceBadge: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '5px 11px', borderRadius: 9 },
  verifiedBadge: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#10B981', background: '#ECFDF5', padding: '4px 9px', borderRadius: 7 },
  cardBody: { padding: '18px 20px 12px' },
  cardName: { fontSize: 17, fontWeight: 800, color: '#111827', margin: '0 0 8px', lineHeight: 1.25 },
  cardAddress: { display: 'flex', gap: 6, alignItems: 'flex-start', color: '#6B7280', fontSize: 13, marginBottom: 12, lineHeight: 1.55 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 7 },
  stars: { display: 'flex', gap: 1 },
  ratingNum: { fontWeight: 800, fontSize: 14, color: '#111827' },
  ratingCount: { fontSize: 12, color: '#9CA3AF' },
  cardDivider: { height: 1, background: '#F3F4F6', margin: '0 20px' },
  cardFooter: { padding: '12px 18px' },

  // Action buttons
  actionRow: { display: 'flex', gap: 8 },
  btnConnect: { width: '100%', padding: '11px 16px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' },
  btnPending: { flex: 1, padding: '11px 14px', background: '#F9FAFB', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  btnConnected: { flex: 1, padding: '11px 14px', background: '#ECFDF5', color: '#059669', border: '1.5px solid #A7F3D0', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  btnUnavailable: { width: '100%', padding: '11px 14px', background: '#F9FAFB', color: '#9CA3AF', border: '1.5px solid #E5E7EB', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  btnXSmall: { padding: '11px 13px', background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA', borderRadius: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },

  // Backdrop / Modal
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50, padding: '0' },
  modal: { background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: '100%', boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '92vh', overflowY: 'auto' },

  // Modal header
  modalHeader: { background: 'linear-gradient(135deg,#6366F1,#4338CA)', padding: '20px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 1 },
  modalHeaderInner: { display: 'flex', alignItems: 'center', gap: 14 },
  modalIcon: { width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  modalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  modalTitle: { fontSize: 18, fontWeight: 800, color: '#fff', margin: 0 },
  modalClose: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 7, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 },

  // Fee breakdown
  feeBanner: { padding: '18px 20px', borderBottom: '1px solid #F3F4F6' },
  feeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
  feeLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, flexShrink: 0 },
  feeWorkshop: { fontSize: 13, fontWeight: 700, color: '#374151', textAlign: 'right', wordBreak: 'break-word' },
  feeDivider: { height: 1, background: '#F3F4F6', marginBottom: 14 },
  feeAmountRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 12 },
  feeTotalLabel: { fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3 },
  feeNote: { fontSize: 12, color: '#9CA3AF' },
  feeAmount: { fontSize: 28, fontWeight: 900, color: '#4F46E5', letterSpacing: -1, flexShrink: 0 },
  feeInfoRow: { display: 'flex', alignItems: 'flex-start', gap: 7, background: '#F8F9FF', borderRadius: 8, padding: '10px 12px' },
  feeInfoText: { fontSize: 12, color: '#6B7280', lineHeight: 1.5 },

  // Method picker
  methodHeading: { fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 20px', margin: '16px 0 10px' },
  methodList: { display: 'flex', flexDirection: 'column', gap: 10, padding: '0 20px 18px' },
  methodCard: { display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '14px 14px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' },
  methodCardActive: { borderColor: '#6366F1', background: '#F5F3FF' },
  methodCardDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  methodIconBox: { width: 36, height: 36, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodIconBoxActive: { background: '#6366F1' },
  methodInfo: { flex: 1, minWidth: 0 },
  methodName: { fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 3px' },
  methodSub: { fontSize: 12, color: '#9CA3AF' },
  methodSubDanger: { fontSize: 12, color: '#EF4444', fontWeight: 600 },
  methodRadio: { width: 18, height: 18, borderRadius: '50%', border: '2px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodRadioActive: { borderColor: '#6366F1' },
  methodRadioDot: { width: 8, height: 8, borderRadius: '50%', background: '#6366F1' },
  balanceBadge: { fontSize: 12, fontWeight: 800, padding: '2px 8px', borderRadius: 8 },
  balanceBadgeSufficient: { background: '#ECFDF5', color: '#059669' },
  balanceBadgeInsufficient: { background: '#FEF2F2', color: '#EF4444' },

  // Modal actions
  modalActions: { display: 'flex', gap: 10, padding: '0 20px 24px' },
  btnCancel: { flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  btnPay: { flex: 2, padding: '12px', background: 'linear-gradient(135deg,#6366F1,#4338CA)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' },
  btnDanger: { flex: 2, padding: '12px', background: '#EF4444', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  btnSpinner: { display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' },

  // Disconnect modal
  disconnectIconWrap: { display: 'flex', justifyContent: 'center', paddingTop: 28, paddingBottom: 12 },
  disconnectBody: { textAlign: 'center', color: '#6B7280', fontSize: 14, lineHeight: 1.6, padding: '0 20px 16px' },
  warningBox: { margin: '0 20px 20px', display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px' },
  warningText: { fontSize: 13, color: '#92400E', lineHeight: 1.5 },

  // Expired
  expiredOverlay: { position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  expiredCard: { background: '#fff', borderRadius: 20, padding: '36px 24px', maxWidth: 440, width: '100%', textAlign: 'center', border: '1.5px solid #FEE2E2', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' },
  expiredIcon: { width: 64, height: 64, borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  expiredTitle: { fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 12px' },
  expiredBody: { color: '#6B7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 },
  btnBack: { padding: '13px 28px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },

  // Toasts
  toast: { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px', borderRadius: 14, marginBottom: 20, border: '1.5px solid' },
  toastSuccess: { background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' },
  toastDanger: { background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' },
  toastTitle: { fontWeight: 700, fontSize: 14, marginBottom: 2 },
  toastSub: { fontSize: 12, opacity: 0.8 },
  toastClose: { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'inherit', opacity: 0.6, flexShrink: 0 },

  // Empty
  empty: { background: '#fff', borderRadius: 18, padding: '52px 20px', textAlign: 'center', border: '1.5px solid #F3F4F6' },
  emptyIcon: { width: 72, height: 72, borderRadius: 18, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
};

const css = `
  @keyframes spin  { to { transform: rotate(360deg); } }
  @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes modalIn { from { opacity:0; transform:translateY(40px); } to { opacity:1; transform:translateY(0); } }
  .spin         { animation: spin 0.7s linear infinite; }
  .modal-enter  { animation: modalIn 0.28s cubic-bezier(.22,1,.36,1); }
  .card-hover:hover { box-shadow: 0 12px 36px rgba(99,102,241,0.14) !important; transform: translateY(-4px) !important; border-color: #C7D2FE !important; }
  .btn-connect-hover { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
  .btn-connect-hover:hover { filter: brightness(1.08); transform: translateY(-2px) scale(1.01); box-shadow: 0 8px 24px rgba(99,102,241,0.38); }
  .btn-connect-hover:active { transform: scale(0.98); }
  input:focus  { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
  select:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
  .nw-ring { display: none; }

  /* ── Tablet+ (≥ 640px): modal as centered dialog ── */
  @media (min-width: 640px) {
    .nw-ring { display: block; }
    .modal-backdrop-center {
      align-items: center !important;
      padding: 20px !important;
    }
  }

  /* ── Stats grid: 3-col → 1-col with horizontal scroll on tiny screens ── */
  @media (max-width: 480px) {
    .stats-grid {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }
  }
  @media (min-width: 481px) and (max-width: 767px) {
    .stats-grid {
      grid-template-columns: repeat(3,1fr) !important;
    }
    .stats-grid > div {
      padding: 14px 12px !important;
      gap: 10px !important;
    }
  }

  /* ── Toolbar: stack on mobile ── */
  @media (max-width: 480px) {
    .toolbar {
      flex-direction: column !important;
    }
    .toolbar > div {
      width: 100% !important;
      min-width: unset !important;
    }
  }

  /* ── Card grid: 1 col on mobile ── */
  @media (max-width: 600px) {
    .card-grid {
      grid-template-columns: 1fr !important;
      gap: 14px !important;
    }
  }

  /* ── Modal: bottom sheet on mobile, centered dialog on tablet+ ── */
  @media (min-width: 640px) {
    [data-modal-backdrop] {
      align-items: center !important;
      padding: 20px !important;
    }
    [data-modal-sheet] {
      border-radius: 22px !important;
      max-width: 520px !important;
    }
    [data-modal-disconnect] {
      border-radius: 22px !important;
      max-width: 440px !important;
    }
  }

  /* ── Hero content padding on mobile ── */
  @media (max-width: 480px) {
    .hero-content-inner {
      padding-top: 48px !important;
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
  }

  /* ── Container padding on mobile ── */
  @media (max-width: 480px) {
    .page-container {
      padding-left: 12px !important;
      padding-right: 12px !important;
      padding-top: 28px !important;
    }
  }

  /* ── Stat value font on small screens ── */
  @media (max-width: 360px) {
    .stat-val { font-size: 18px !important; }
    .stat-lbl { font-size: 9px !important; }
  }
`;

// ─── Responsive Modal wrapper that switches between bottom-sheet and centered ──
// We use a small wrapper component to apply different layout depending on viewport
const ResponsiveBackdrop = ({ children, maxWidth = 520 }) => (
  <div
    style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'flex-end',      // bottom sheet by default (mobile)
      justifyContent: 'center',
      zIndex: 50,
      padding: 0,
    }}
    className="resp-backdrop"
  >
    <style>{`
      @media (min-width: 640px) {
        .resp-backdrop {
          align-items: center !important;
          padding: 20px !important;
        }
        .resp-modal {
          border-radius: 22px !important;
          max-width: ${maxWidth}px !important;
        }
      }
    `}</style>
    <div
      className="resp-modal modal-enter"
      style={{
        background: '#fff',
        borderRadius: '22px 22px 0 0',
        width: '100%',
        maxWidth: '100%',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        overflow: 'hidden',
        maxHeight: '92vh',
        overflowY: 'auto',
      }}
    >
      {children}
    </div>
  </div>
);

export default UserWorkshopNearby;