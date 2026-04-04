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
const PLATFORM_FEE = 5.00;

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
    if (paymentCanceled && !urlParamsCleared) {
      setTimeout(() => {
        navigate(`/user/workshops-nearby/${requestId}`, { replace: true });
        setUrlParamsCleared(true);
      }, 100);
    }
  }, [paymentCanceled, requestId, navigate, urlParamsCleared]);

  useEffect(() => {
    if (paymentSuccess && !urlParamsCleared) {
      dispatch(fetchNearbyWorkshops(requestId));
      const timer = setTimeout(() => {
        navigate(`/user/workshops-nearby/${requestId}`, { replace: true });
        setUrlParamsCleared(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [paymentSuccess, requestId, navigate, dispatch, urlParamsCleared]);

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
                  <div>
                    <p style={styles.feeTotalLabel}>Total Amount Due</p>
                    <p style={styles.feeNote}>One-time fee · Valid for this service request</p>
                  </div>
                  <div style={styles.feeAmount}>${PLATFORM_FEE.toFixed(2)}</div>
                </div>
                <div style={styles.feeInfoRow}>
                  <Info size={13} color="#6B7280" />
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <p style={styles.methodName}>Wallet Balance</p>
                      <span style={{ ...styles.balanceBadge, ...(insufficientBalance ? styles.balanceBadgeInsufficient : styles.balanceBadgeSufficient) }}>
                        ${Number(balance).toFixed(2)}
                      </span>
                    </div>
                    {insufficientBalance
                      ? <p style={styles.methodSubDanger}>Insufficient balance — need ${PLATFORM_FEE.toFixed(2)}</p>
                      : <p style={styles.methodSub}>After payment: ${(Number(balance) - PLATFORM_FEE).toFixed(2)} remaining</p>
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
                    <>Pay ${PLATFORM_FEE.toFixed(2)} <ArrowRight size={16} /></>
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
              <h3 style={{ ...styles.modalTitle, textAlign: 'center', marginBottom: 8 }}>Disconnect Workshop?</h3>
              <p style={styles.disconnectBody}>
                You're about to cancel your connection with this workshop. Any ongoing communication will end immediately.
              </p>
              <div style={styles.warningBox}>
                <AlertCircle size={15} color="#B45309" />
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

        {/* ── PAGE CONTENT ───────────────────────────────────────────────── */}
        <div style={styles.container}>

          {/* Toast banners */}
          {showSuccessMessage && (
            <div style={{ ...styles.toast, ...styles.toastSuccess }}>
              <CheckCircle size={18} color="#059669" />
              <div>
                <p style={styles.toastTitle}>Payment Successful</p>
                <p style={styles.toastSub}>Platform fee paid. Connection request sent.</p>
              </div>
              <button style={styles.toastClose} onClick={() => setShowSuccessMessage(false)}><X size={15} /></button>
            </div>
          )}
          {showCancelMessage && (
            <div style={{ ...styles.toast, ...styles.toastDanger }}>
              <AlertCircle size={18} color="#DC2626" />
              <div>
                <p style={styles.toastTitle}>Payment Cancelled</p>
                <p style={styles.toastSub}>Pay the platform fee to connect with workshops.</p>
              </div>
              <button style={styles.toastClose} onClick={() => setShowCancelMessage(false)}><X size={15} /></button>
            </div>
          )}

          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <span style={styles.pill}><Zap size={12} />  Live Results</span>
              <h1 style={styles.heading}>Nearby Workshops</h1>
              <p style={styles.subheading}>
                <MapPin size={15} color="#6366F1" style={{ marginRight: 6 }} />
                Showing results near your location
              </p>
            </div>
            {/* Fee notice if not yet paid */}
            {!currentRequest?.platform_fee_paid && (
              <div style={styles.feeNotice}>
                <div style={styles.feeNoticeIcon}><CreditCard size={16} color="#4F46E5" /></div>
                <div>
                  <p style={styles.feeNoticeLabel}>One-time platform fee</p>
                  <p style={styles.feeNoticeAmount}>${PLATFORM_FEE.toFixed(2)}</p>
                </div>
                <div style={styles.feeNoticeBadge}>Required to connect</div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={styles.statsGrid}>
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
          <div style={styles.toolbar}>
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
          <div style={styles.cardGrid}>
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
  page: {
    minHeight: '100vh',
    background: '#F8F9FC',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
  },
  container: { maxWidth: 1200, margin: '0 auto', padding: '40px 24px 64px' },

  // Loading
  loadingScreen: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: '#F8F9FC' },
  spinnerWrap: { position: 'relative', width: 56, height: 56 },
  spinnerRing: { position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid #E0E7FF' },
  spinnerCore: { position: 'absolute', inset: 0, borderRadius: '50%', border: '3px solid transparent', borderTopColor: '#6366F1', animation: 'spin 0.8s linear infinite' },
  loadingText: { color: '#6B7280', fontWeight: 600, fontSize: 15 },

  // Header
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20, marginBottom: 36 },
  headerLeft: {},
  pill: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 100, marginBottom: 12, letterSpacing: 0.3 },
  heading: { fontSize: 34, fontWeight: 800, color: '#111827', margin: '0 0 8px', letterSpacing: -0.5 },
  subheading: { display: 'flex', alignItems: 'center', color: '#6B7280', fontSize: 15, margin: 0 },

  // Fee notice
  feeNotice: { display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1.5px solid #E0E7FF', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 6px rgba(99,102,241,0.08)' },
  feeNoticeIcon: { width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  feeNoticeLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  feeNoticeAmount: { fontSize: 22, fontWeight: 800, color: '#4F46E5', lineHeight: 1 },
  feeNoticeBadge: { background: '#FFF7ED', color: '#C2410C', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6, border: '1px solid #FED7AA', marginLeft: 4 },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 },
  statCard: { background: '#fff', borderRadius: 14, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 14, border: '1.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
  statIcon: { width: 42, height: 42, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.4 },
  statValue: { fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1 },

  // Toolbar
  toolbar: { display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' },
  searchWrap: { flex: 1, minWidth: 220, position: 'relative' },
  searchIcon: { position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '11px 14px 11px 40px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#111827', background: '#fff', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  sortWrap: { position: 'relative', minWidth: 170 },
  sortIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },
  sortSelect: { width: '100%', padding: '11px 36px 11px 36px', border: '1.5px solid #E5E7EB', borderRadius: 11, fontSize: 14, color: '#374151', background: '#fff', outline: 'none', appearance: 'none', fontFamily: 'inherit', cursor: 'pointer' },
  sortChevron: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' },

  // Cards
  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 },
  card: { background: '#fff', borderRadius: 18, border: '1.5px solid #F3F4F6', overflow: 'hidden', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' },
  cardStrip: { padding: '14px 18px', background: '#FAFAFA', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardDistanceBadge: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '4px 10px', borderRadius: 8 },
  verifiedBadge: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#6B7280' },
  cardBody: { padding: '18px 20px 14px' },
  cardName: { fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 8px', lineHeight: 1.3 },
  cardAddress: { display: 'flex', gap: 6, alignItems: 'flex-start', color: '#6B7280', fontSize: 13, marginBottom: 14, lineHeight: 1.5 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 6 },
  stars: { display: 'flex', gap: 1 },
  ratingNum: { fontWeight: 700, fontSize: 14, color: '#111827' },
  ratingCount: { fontSize: 12, color: '#9CA3AF' },
  cardDivider: { height: 1, background: '#F3F4F6', margin: '0 20px' },
  cardFooter: { padding: '14px 18px' },

  // Action buttons
  actionRow: { display: 'flex', gap: 8 },
  btnConnect: { width: '100%', padding: '11px 16px', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', border: 'none', borderRadius: 11, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' },
  btnPending: { flex: 1, padding: '11px 14px', background: '#F9FAFB', color: '#6B7280', border: '1.5px solid #E5E7EB', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  btnConnected: { flex: 1, padding: '11px 14px', background: '#ECFDF5', color: '#059669', border: '1.5px solid #A7F3D0', borderRadius: 11, fontWeight: 700, fontSize: 13, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  btnUnavailable: { width: '100%', padding: '11px 14px', background: '#F9FAFB', color: '#9CA3AF', border: '1.5px solid #E5E7EB', borderRadius: 11, fontWeight: 600, fontSize: 13, cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit' },
  btnXSmall: { padding: '11px 13px', background: '#FEF2F2', color: '#EF4444', border: '1.5px solid #FECACA', borderRadius: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' },

  // Backdrop / Modal
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 },
  modal: { background: '#fff', borderRadius: 22, width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' },

  // Modal header
  modalHeader: { background: 'linear-gradient(135deg,#6366F1,#4338CA)', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  modalHeaderInner: { display: 'flex', alignItems: 'center', gap: 14 },
  modalIcon: { width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 },
  modalClose: { background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, padding: 7, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center' },

  // Fee breakdown
  feeBanner: { padding: '20px 24px', borderBottom: '1px solid #F3F4F6' },
  feeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feeLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 },
  feeWorkshop: { fontSize: 13, fontWeight: 700, color: '#374151', maxWidth: 260, textAlign: 'right' },
  feeDivider: { height: 1, background: '#F3F4F6', marginBottom: 14 },
  feeAmountRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feeTotalLabel: { fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 3 },
  feeNote: { fontSize: 12, color: '#9CA3AF' },
  feeAmount: { fontSize: 32, fontWeight: 900, color: '#4F46E5', letterSpacing: -1 },
  feeInfoRow: { display: 'flex', alignItems: 'flex-start', gap: 7, background: '#F8F9FF', borderRadius: 8, padding: '10px 12px' },
  feeInfoText: { fontSize: 12, color: '#6B7280', lineHeight: 1.5 },

  // Method picker
  methodHeading: { fontSize: 12, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, padding: '0 24px', margin: '18px 0 10px' },
  methodList: { display: 'flex', flexDirection: 'column', gap: 10, padding: '0 24px 20px' },
  methodCard: { display: 'flex', alignItems: 'center', gap: 12, border: '1.5px solid #E5E7EB', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' },
  methodCardActive: { borderColor: '#6366F1', background: '#F5F3FF' },
  methodCardDisabled: { opacity: 0.55, cursor: 'not-allowed' },
  methodIconBox: { width: 38, height: 38, borderRadius: 10, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodIconBoxActive: { background: '#6366F1' },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 3px' },
  methodSub: { fontSize: 12, color: '#9CA3AF' },
  methodSubDanger: { fontSize: 12, color: '#EF4444', fontWeight: 600 },
  methodRadio: { width: 18, height: 18, borderRadius: '50%', border: '2px solid #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  methodRadioActive: { borderColor: '#6366F1' },
  methodRadioDot: { width: 8, height: 8, borderRadius: '50%', background: '#6366F1' },
  balanceBadge: { fontSize: 13, fontWeight: 800, padding: '2px 10px', borderRadius: 8 },
  balanceBadgeSufficient: { background: '#ECFDF5', color: '#059669' },
  balanceBadgeInsufficient: { background: '#FEF2F2', color: '#EF4444' },

  // Modal actions
  modalActions: { display: 'flex', gap: 10, padding: '0 24px 24px' },
  btnCancel: { flex: 1, padding: '12px', border: '1.5px solid #E5E7EB', borderRadius: 12, background: '#fff', color: '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  btnPay: { flex: 2, padding: '12px', background: 'linear-gradient(135deg,#6366F1,#4338CA)', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' },
  btnDanger: { flex: 2, padding: '12px', background: '#EF4444', border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'inherit' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  btnSpinner: { display: 'inline-block', width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' },

  // Disconnect modal
  disconnectIconWrap: { display: 'flex', justifyContent: 'center', paddingTop: 28, paddingBottom: 12 },
  disconnectBody: { textAlign: 'center', color: '#6B7280', fontSize: 14, lineHeight: 1.6, padding: '0 24px 16px' },
  warningBox: { margin: '0 24px 20px', display: 'flex', gap: 8, alignItems: 'flex-start', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '12px 14px' },
  warningText: { fontSize: 13, color: '#92400E', lineHeight: 1.5 },

  // Expired
  expiredOverlay: { position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(8px)', zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  expiredCard: { background: '#fff', borderRadius: 20, padding: '40px 36px', maxWidth: 440, width: '100%', textAlign: 'center', border: '1.5px solid #FEE2E2', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' },
  expiredIcon: { width: 64, height: 64, borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  expiredTitle: { fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 12px' },
  expiredBody: { color: '#6B7280', fontSize: 15, lineHeight: 1.6, marginBottom: 28 },
  btnBack: { padding: '13px 28px', background: '#111827', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' },

  // Toasts
  toast: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, marginBottom: 24, border: '1.5px solid' },
  toastSuccess: { background: '#ECFDF5', borderColor: '#A7F3D0', color: '#065F46' },
  toastDanger: { background: '#FEF2F2', borderColor: '#FECACA', color: '#991B1B' },
  toastTitle: { fontWeight: 700, fontSize: 14, marginBottom: 2 },
  toastSub: { fontSize: 12, opacity: 0.8 },
  toastClose: { marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'inherit', opacity: 0.6 },

  // Empty
  empty: { background: '#fff', borderRadius: 18, padding: '60px 24px', textAlign: 'center', border: '1.5px solid #F3F4F6' },
  emptyIcon: { width: 72, height: 72, borderRadius: 18, background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  emptyTitle: { fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#9CA3AF' },
};

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.7s linear infinite; }
  .modal-enter { animation: modalIn 0.22s cubic-bezier(.22,1,.36,1); }
  @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(12px); } to { opacity:1; transform:none; } }
  .card-hover:hover { box-shadow: 0 8px 30px rgba(99,102,241,0.12) !important; transform: translateY(-3px) !important; border-color: #C7D2FE !important; }
  .btn-connect-hover:hover { filter: brightness(1.07); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,0.35); }
  input:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
  select:focus { border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important; }
  @media (max-width: 640px) {
    .stats-grid { grid-template-columns: 1fr !important; }
  }
`;

export default UserWorkshopNearby;