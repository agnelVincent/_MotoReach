import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWorkshopRequests,
  acceptRequest,
  rejectRequest,
  cancelRequestWorkshop
} from '../../redux/slices/serviceRequestSlice';
import {
  FileText, User, Car, Wrench, Eye, CheckCircle, XCircle,
  Clock, Ban, X, Calendar, Image, Filter, ArrowUpDown,
  AlertCircle, ZoomIn, ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Pagination from '../../components/Pagination';

/* ── Expiration countdown ── */
const ExpirationTimer = ({ requestedAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const expires = new Date(new Date(requestedAt).getTime() + 30 * 60 * 1000);
      const diff = expires - new Date();
      if (diff <= 0) { setIsExpired(true); setTimeLeft('Expired'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}m ${s < 10 ? '0' : ''}${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [requestedAt]);

  if (isExpired) return <span className="rl-expired-chip">Expired</span>;
  return (
    <span className="rl-timer-chip">
      <Clock size={11} />
      {timeLeft}
    </span>
  );
};

/* ── Status config ── */
const STATUS_CONFIG = {
  REQUESTED:          { label: 'Pending',        bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
  ACCEPTED:           { label: 'Accepted',        bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  REJECTED:           { label: 'Rejected',        bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', dot: '#EF4444' },
  AUTO_REJECTED:      { label: 'Auto-rejected',   bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#F97316' },
  CANCELLED:          { label: 'Cancelled',       bg: '#F9FAFB', color: '#6B7280', border: '#E5E7EB', dot: '#9CA3AF' },
  EXPIRED:            { label: 'Expired',         bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA', dot: '#F97316' },
  IN_PROGRESS:        { label: 'In Progress',     bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6' },
  ESTIMATE_SHARED:    { label: 'Estimate Shared', bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE', dot: '#8B5CF6' },
  SERVICE_AMOUNT_PAID:{ label: 'Amount Paid',     bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  COMPLETED:          { label: 'Completed',       bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', dot: '#10B981' },
  VERIFIED:           { label: 'Verified',        bg: '#EEF2FF', color: '#3730A3', border: '#C7D2FE', dot: '#6366F1' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.CANCELLED;
  return (
    <span className="rl-status-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
      <span className="rl-status-dot" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

/* ── Avatar colours ── */
const AVATAR_COLORS = [
  ['#EEF2FF','#4F46E5'], ['#ECFDF5','#059669'], ['#FFF7ED','#C2410C'],
  ['#F0FDFA','#0F766E'], ['#FDF4FF','#9333EA'], ['#FFF1F2','#E11D48'],
];
const avatarColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];

const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatDateTime = (d) =>
  new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ════════════════════════════════════════════════ */
const WorkshopRequestList = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { workshopRequests, loading } = useSelector(s => s.serviceRequest);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [enlargedImage,   setEnlargedImage]   = useState(null);
  const [sortBy,          setSortBy]          = useState('newest');
  const [filterStatus,    setFilterStatus]    = useState('All');
  const [mounted,         setMounted]         = useState(false);
  const [currentPage,     setCurrentPage]     = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { setMounted(true); dispatch(fetchWorkshopRequests()); }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, filterStatus]);

  const getDisplayStatus = (req) => {
    const conn = req.status;
    const svc  = req.service_request.status;
    const activeStatuses = ['IN_PROGRESS','ESTIMATE_SHARED','SERVICE_AMOUNT_PAID','COMPLETED','VERIFIED'];
    if (conn === 'ACCEPTED' && activeStatuses.includes(svc)) return svc;
    if (svc === 'EXPIRED') return 'EXPIRED';
    return conn;
  };

  const handleApprove = async (id) => {
    try {
      await dispatch(acceptRequest(id)).unwrap();
      toast.success('Request accepted');
      if (selectedRequest?.id === id) setSelectedRequest(r => ({ ...r, status: 'ACCEPTED' }));
    } catch { toast.error('Failed to accept request'); }
  };

  const handleReject = async (id) => {
    try {
      await dispatch(rejectRequest(id)).unwrap();
      toast.success('Request rejected');
      setSelectedRequest(null);
    } catch { toast.error('Failed to reject request'); }
  };

  const handleCancel = async (id) => {
    try {
      await dispatch(cancelRequestWorkshop(id)).unwrap();
      toast.success('Connection cancelled');
      setSelectedRequest(null);
    } catch { toast.error('Failed to cancel connection'); }
  };

  const filtered = workshopRequests.filter(r =>
    filterStatus === 'All' || getDisplayStatus(r) === filterStatus
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.requested_at) - new Date(a.requested_at);
    if (sortBy === 'oldest') return new Date(a.requested_at) - new Date(b.requested_at);
    return getDisplayStatus(a).localeCompare(getDisplayStatus(b));
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const currentRequests = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total:     workshopRequests.length,
    pending:   workshopRequests.filter(r => r.status === 'REQUESTED').length,
    active:    workshopRequests.filter(r => ['ACCEPTED','IN_PROGRESS','ESTIMATE_SHARED','SERVICE_AMOUNT_PAID'].includes(getDisplayStatus(r))).length,
    completed: workshopRequests.filter(r => ['COMPLETED','VERIFIED'].includes(getDisplayStatus(r))).length,
  };

  if (loading && workshopRequests.length === 0) {
    return (
      <>
        <style>{css}</style>
        <div className="rl-loading">
          <div className="rl-spinner-wrap"><div className="rl-track"/><div className="rl-head"/></div>
          <p className="rl-loading-text">Loading requests…</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="rl-page">

        {/* ── HEADER ── */}
        <header className="rl-header">
          <div className="rl-header-inner">
            <div className={`rl-header-text ${mounted ? 'rl-fade-up' : 'rl-invisible'}`}>
              <h1 className="rl-title">Service Requests</h1>
              <p className="rl-subtitle">Manage incoming service requests from customers</p>
            </div>
          </div>
          <div className="rl-curve" />
        </header>

        <div className="rl-container">

          {/* ── STATS ── */}
          <div className="rl-stats">
            {[
              { label: 'Total Requests', value: stats.total,     color: '#4F46E5', bg: 'linear-gradient(135deg,#6366F1,#4338CA)', icon: <FileText size={17} color="#fff"/> },
              { label: 'Pending',        value: stats.pending,   color: '#D97706', bg: 'linear-gradient(135deg,#F59E0B,#D97706)', icon: <Clock size={17} color="#fff"/>     },
              { label: 'Active Jobs',    value: stats.active,    color: '#1D4ED8', bg: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', icon: <Wrench size={17} color="#fff"/>    },
              { label: 'Completed',      value: stats.completed, color: '#059669', bg: 'linear-gradient(135deg,#10B981,#059669)', icon: <CheckCircle size={17} color="#fff"/> },
            ].map((s, i) => (
              <div className={`rl-stat-card ${mounted ? 'rl-fade-up' : 'rl-invisible'}`} style={{ animationDelay: `${i * 60}ms` }} key={s.label}>
                <div className="rl-stat-icon" style={{ background: s.bg }}>{s.icon}</div>
                <div>
                  <p className="rl-stat-label">{s.label}</p>
                  <p className="rl-stat-value" style={{ color: s.color }}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── TOOLBAR ── */}
          <div className={`rl-toolbar ${mounted ? 'rl-fade-up' : 'rl-invisible'}`} style={{ animationDelay: '260ms' }}>
            <div className="rl-select-wrap">
              <ArrowUpDown size={14} color="#9CA3AF" className="rl-select-icon" />
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rl-select">
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="status">By Status</option>
              </select>
              <ChevronDown size={12} color="#9CA3AF" className="rl-select-chevron" />
            </div>

            <div className="rl-select-wrap">
              <Filter size={14} color="#9CA3AF" className="rl-select-icon" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="rl-select">
                <option value="All">All Requests</option>
                <optgroup label="Connection Phase">
                  <option value="REQUESTED">Pending</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="AUTO_REJECTED">Auto-rejected</option>
                  <option value="CANCELLED">Cancelled</option>
                </optgroup>
                <optgroup label="Service Active">
                  <option value="ACCEPTED">Accepted</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="ESTIMATE_SHARED">Estimate Shared</option>
                  <option value="SERVICE_AMOUNT_PAID">Amount Paid</option>
                </optgroup>
                <optgroup label="Completion">
                  <option value="COMPLETED">Completed</option>
                  <option value="VERIFIED">Verified</option>
                </optgroup>
              </select>
              <ChevronDown size={12} color="#9CA3AF" className="rl-select-chevron" />
            </div>

            <span className="rl-count-chip">{sorted.length} result{sorted.length !== 1 ? 's' : ''}</span>
          </div>

          {/* ── REQUEST LIST ── */}
          <div className="rl-list">
            {currentRequests.map((req, idx) => {
              const status  = getDisplayStatus(req);
              const [bg, fg] = avatarColor(req.id);
              return (
                <div
                  key={req.id}
                  className={`rl-card ${mounted ? 'rl-fade-up' : 'rl-invisible'}`}
                  style={{ animationDelay: `${300 + idx * 45}ms` }}
                >
                  <div className="rl-card-main">
                    {/* Left: avatar + info */}
                    <div className="rl-card-left">
                      <div className="rl-avatar" style={{ background: bg, color: fg }}>
                        {req.user_name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="rl-card-info">
                        <div className="rl-card-name-row">
                          <h3 className="rl-card-name">{req.user_name}</h3>
                          <StatusBadge status={status} />
                        </div>
                        <p className="rl-card-date">
                          <Calendar size={11} />
                          {formatDateTime(req.requested_at)}
                          {status === 'REQUESTED' && <ExpirationTimer requestedAt={req.requested_at} />}
                        </p>
                        <div className="rl-card-meta">
                          <span className="rl-meta-chip"><Car size={11} /> {req.service_request.vehicle_type}</span>
                          <span className="rl-meta-chip"><Wrench size={11} /> {req.service_request.issue_category}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: action */}
                    <button className="rl-btn-view" onClick={() => setSelectedRequest(req)}>
                      <Eye size={14} /> View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {sorted.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={sorted.length}
              itemsPerPage={itemsPerPage}
            />
          )}

          {/* Empty state */}
          {sorted.length === 0 && !loading && (
            <div className="rl-empty">
              <div className="rl-empty-icon"><AlertCircle size={28} color="#D1D5DB" /></div>
              <p className="rl-empty-title">No requests found</p>
              <p className="rl-empty-sub">Try adjusting your filters to see results.</p>
            </div>
          )}
        </div>

        {/* ══ DETAIL MODAL ══ */}
        {selectedRequest && (() => {
          const req    = selectedRequest;
          const status = getDisplayStatus(req);
          const sr     = req.service_request;
          const [bg, fg] = avatarColor(req.id);
          const canAct = sr.status !== 'EXPIRED' && !['AUTO_REJECTED','EXPIRED'].includes(req.status);

          return (
            <div className="rl-backdrop" onClick={() => setSelectedRequest(null)}>
              <div className="rl-modal rl-modal-enter" onClick={e => e.stopPropagation()}>

                {/* Modal header */}
                <div className="rl-modal-header">
                  <div className="rl-modal-header-left">
                    <div className="rl-modal-header-icon"><FileText size={18} color="#fff" /></div>
                    <div>
                      <span className="rl-modal-eyebrow">Request #{req.id}</span>
                      <h2 className="rl-modal-heading">Request Details</h2>
                    </div>
                  </div>
                  <button className="rl-icon-btn-ghost" onClick={() => setSelectedRequest(null)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="rl-modal-body">

                  {/* Status banner */}
                  <div className="rl-status-banner" style={{ background: STATUS_CONFIG[status]?.bg || '#F9FAFB', borderColor: STATUS_CONFIG[status]?.border || '#E5E7EB' }}>
                    <span className="rl-status-dot" style={{ background: STATUS_CONFIG[status]?.dot || '#9CA3AF', width: 10, height: 10 }} />
                    <span style={{ color: STATUS_CONFIG[status]?.color || '#374151', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13 }}>
                      {STATUS_CONFIG[status]?.label || status}
                    </span>
                    {status === 'REQUESTED' && <ExpirationTimer requestedAt={req.requested_at} />}
                  </div>

                  {/* Info grid */}
                  <div className="rl-info-grid">
                    {/* Customer */}
                    <div className="rl-info-section">
                      <p className="rl-section-label">Customer</p>
                      <div className="rl-info-card">
                        <div className="rl-info-row">
                          <div className="rl-info-avatar" style={{ background: bg, color: fg }}>
                            {req.user_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="rl-info-val">{req.user_name}</p>
                            <p className="rl-info-sub">
                              <Calendar size={11} /> {formatDate(req.requested_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle */}
                    <div className="rl-info-section">
                      <p className="rl-section-label">Vehicle</p>
                      <div className="rl-info-card">
                        <div className="rl-info-kv">
                          <Car size={13} color="#9CA3AF" />
                          <span className="rl-info-key">Model</span>
                          <span className="rl-info-val">{sr.vehicle_model}</span>
                        </div>
                        <div className="rl-info-kv">
                          <Car size={13} color="#9CA3AF" />
                          <span className="rl-info-key">Type</span>
                          <span className="rl-info-val">{sr.vehicle_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Issue */}
                  <div className="rl-info-section">
                    <p className="rl-section-label">Issue Details</p>
                    <div className="rl-info-card">
                      <div className="rl-info-kv" style={{ marginBottom: 10 }}>
                        <Wrench size={13} color="#9CA3AF" />
                        <span className="rl-info-key">Category</span>
                        <span className="rl-info-val">{sr.issue_category}</span>
                      </div>
                      <p className="rl-description">{sr.description}</p>
                    </div>
                  </div>

                  {/* Photos */}
                  {sr.image_urls?.filter(p => typeof p === 'string').length > 0 && (
                    <div className="rl-info-section">
                      <p className="rl-section-label">
                        <Image size={13} style={{ display: 'inline', marginRight: 5 }} />
                        Uploaded Photos
                      </p>
                      <div className="rl-photo-grid">
                        {sr.image_urls.filter(p => typeof p === 'string').map((photo, i) => (
                          <div key={i} className="rl-photo-thumb" onClick={() => setEnlargedImage(photo)}>
                            <img src={photo} alt={`Photo ${i + 1}`} onError={e => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }} />
                            <div className="rl-photo-overlay"><ZoomIn size={18} color="#fff" /></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action footer */}
                  <div className="rl-modal-actions">
                    {req.status === 'REQUESTED' && canAct && (
                      <>
                        <button className="rl-btn-approve" onClick={() => handleApprove(req.id)}>
                          <CheckCircle size={15} /> Approve
                        </button>
                        <button className="rl-btn-reject" onClick={() => handleReject(req.id)}>
                          <XCircle size={15} /> Reject
                        </button>
                      </>
                    )}
                    {req.status === 'ACCEPTED' && canAct && (
                      <>
                        <button className="rl-btn-track" onClick={() => navigate(`/workshop/service-flow/${sr.id}`)}>
                          <Wrench size={15} /> Track Service
                        </button>
                        <button className="rl-btn-cancel-conn" onClick={() => handleCancel(req.id)}>
                          <Ban size={15} /> Cancel Connection
                        </button>
                      </>
                    )}
                    {['REJECTED','CANCELLED'].includes(req.status) && canAct && (
                      <div className="rl-no-action">
                        <p className="rl-no-action-title">No actions available</p>
                        <p className="rl-no-action-sub">This request has been {req.status.toLowerCase()}.</p>
                      </div>
                    )}
                    {(!canAct || ['AUTO_REJECTED','EXPIRED'].includes(status)) && (
                      <div className="rl-expired-notice">
                        <AlertCircle size={16} color="#C2410C" />
                        <div>
                          <p className="rl-expired-title">Request Expired</p>
                          <p className="rl-expired-sub">This request has expired. No further actions can be taken.</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {/* ── LIGHTBOX ── */}
        {enlargedImage && (
          <div className="rl-lightbox" onClick={() => setEnlargedImage(null)}>
            <button className="rl-lightbox-close" onClick={() => setEnlargedImage(null)}><X size={18} /></button>
            <img src={enlargedImage} alt="Enlarged" className="rl-lightbox-img" onClick={e => e.stopPropagation()} />
          </div>
        )}

      </div>
    </>
  );
};

/* ─── CSS ─────────────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --indigo: #6366F1;
    --indigo-dark: #4338CA;
    --indigo-mid: #4F46E5;
    --indigo-light: #EEF2FF;
    --surface: #ffffff;
    --bg: #F4F5FA;
    --border: #EAECF2;
    --border-mid: #E0E3EE;
    --text-1: #0F1120;
    --text-2: #4B5163;
    --text-3: #9CA3AF;
    --green: #059669;
    --red: #EF4444;
    --red-bg: #FEF2F2;
    --shadow-card: 0 2px 12px rgba(15,17,32,0.06), 0 0 0 1px var(--border);
    --shadow-hover: 0 10px 36px rgba(99,102,241,0.12), 0 0 0 1px #e0e7ff;
    --shadow-modal: 0 32px 72px rgba(15,17,32,0.2);
    --r-md: 14px;
    --r-lg: 18px;
    --r-xl: 22px;
  }



  .rl-page {
    min-height: calc(100vh - 64px);
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text-1);
  }

  /* ── HEADER ── */
  .rl-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
    padding: 72px 32px 110px;
    position: relative; overflow: hidden;
  }
  .rl-header::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .rl-curve {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 52px; background: var(--bg);
    clip-path: ellipse(58% 100% at 50% 100%); z-index: 4;
  }
  .rl-header-inner { position: relative; z-index: 5; max-width: 1200px; margin: 0 auto; }
  .rl-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2rem, 4.5vw, 3rem);
    font-weight: 800; color: #fff;
    letter-spacing: -0.025em; line-height: 1.1; margin-bottom: 8px;
  }
  .rl-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); }

  /* ── CONTAINER ── */
  .rl-container { max-width: 1200px; margin: -36px auto 0; padding: 0 28px 72px; position: relative; z-index: 10; }
  @media (max-width: 640px) {
    .rl-header    { padding: 52px 20px 80px; }
    .rl-container { padding: 0 16px 56px; margin-top: -24px; }
  }

  /* ── STATS ── */
  .rl-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin-bottom: 22px;
  }
  @media (max-width: 900px) { .rl-stats { grid-template-columns: repeat(2,1fr); } }
  @media (max-width: 480px) { .rl-stats { grid-template-columns: 1fr; } }

  .rl-stat-card {
    background: var(--surface);
    border-radius: var(--r-lg);
    padding: 18px 20px;
    display: flex; align-items: center; gap: 14px;
    box-shadow: var(--shadow-card);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .rl-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(0,0,0,0.08); }
  .rl-stat-icon {
    width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .rl-stat-label {
    font-size: 11px; color: var(--text-3); font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;
  }
  .rl-stat-value {
    font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
    color: var(--text-1); line-height: 1;
  }

  /* ── TOOLBAR ── */
  .rl-toolbar {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    margin-bottom: 22px;
  }
  .rl-select-wrap { position: relative; min-width: 170px; flex: 1; max-width: 240px; }
  .rl-select-icon   { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .rl-select-chevron { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); pointer-events: none; }
  .rl-select {
    width: 100%; padding: 9px 34px 9px 34px;
    border: 1.5px solid var(--border-mid); border-radius: var(--r-md);
    font-size: 13px; font-family: 'DM Sans', sans-serif;
    color: var(--text-2); background: var(--surface);
    outline: none; appearance: none; cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .rl-select:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  .rl-count-chip {
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
    color: var(--text-3);
    background: var(--surface); border: 1.5px solid var(--border);
    padding: 5px 13px; border-radius: 100px;
    margin-left: auto;
    white-space: nowrap;
  }

  /* ── REQUEST CARDS ── */
  .rl-list { display: flex; flex-direction: column; gap: 12px; }

  .rl-card {
    background: var(--surface);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-card);
    overflow: hidden;
    transition: all 0.22s ease;
  }
  .rl-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-hover); }

  .rl-card-main {
    display: flex; align-items: center; justify-content: space-between;
    gap: 16px; padding: 18px 20px;
    flex-wrap: wrap;
  }

  .rl-card-left { display: flex; align-items: flex-start; gap: 14px; flex: 1; min-width: 220px; }

  .rl-avatar {
    width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800;
  }

  .rl-card-info { flex: 1; }
  .rl-card-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 5px; }
  .rl-card-name { font-family: 'Syne', sans-serif; font-size: 15.5px; font-weight: 700; color: var(--text-1); }
  .rl-card-date {
    display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
    font-size: 12px; color: var(--text-3); margin-bottom: 8px;
  }
  .rl-card-meta { display: flex; flex-wrap: wrap; gap: 6px; }

  .rl-meta-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--text-2);
    background: var(--bg); border: 1px solid var(--border);
    padding: 3px 10px; border-radius: 8px;
  }

  .rl-status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'Syne', sans-serif; font-size: 11.5px; font-weight: 700;
    padding: 4px 11px; border-radius: 100px; border: 1.5px solid;
    white-space: nowrap;
  }
  .rl-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
    flex-shrink: 0;
  }

  .rl-timer-chip {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 11.5px; font-weight: 700; font-family: monospace;
    background: #FFF7ED; color: #C2410C; border: 1px solid #FED7AA;
    padding: 2px 8px; border-radius: 7px;
  }
  .rl-expired-chip {
    font-size: 11.5px; font-weight: 700;
    background: var(--red-bg); color: var(--red); border: 1px solid #FECACA;
    padding: 2px 8px; border-radius: 7px;
  }

  .rl-btn-view {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 18px;
    background: linear-gradient(135deg, #6366F1, #4338CA);
    color: #fff; border: none; border-radius: var(--r-md);
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; white-space: nowrap;
    transition: filter 0.15s, transform 0.15s;
    flex-shrink: 0;
  }
  .rl-btn-view:hover { filter: brightness(1.1); transform: translateY(-1px); }

  /* ── EMPTY STATE ── */
  .rl-empty {
    background: var(--surface); border-radius: var(--r-xl);
    padding: 60px 24px; text-align: center;
    box-shadow: var(--shadow-card);
  }
  .rl-empty-icon {
    width: 66px; height: 66px; border-radius: 18px; background: var(--bg);
    display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;
  }
  .rl-empty-title { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; margin-bottom: 6px; }
  .rl-empty-sub   { font-size: 13.5px; color: var(--text-3); }

  /* ── LOADING ── */
  .rl-loading {
    min-height: calc(100vh - 64px); display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; background: var(--bg);
  }
  .rl-spinner-wrap { position: relative; width: 46px; height: 46px; }
  .rl-track { position: absolute; inset: 0; border-radius: 50%; border: 3px solid #E0E7FF; }
  .rl-head  { position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--indigo); animation: rl-spin 0.8s linear infinite; }
  .rl-loading-text { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: var(--text-3); }

  /* ── MODAL ── */
  .rl-backdrop {
    position: fixed; inset: 0;
    background: rgba(10,12,30,0.55); backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
    z-index: 50; padding: 20px;
  }
  .rl-modal {
    background: var(--surface);
    border-radius: var(--r-xl);
    width: 100%; max-width: 580px;
    max-height: 90vh; overflow-y: auto;
    box-shadow: var(--shadow-modal);
  }

  .rl-modal-header {
    position: sticky; top: 0; z-index: 10;
    background: linear-gradient(135deg, #6366F1, #4338CA);
    padding: 18px 22px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .rl-modal-header-left { display: flex; align-items: center; gap: 13px; }
  .rl-modal-header-icon {
    width: 38px; height: 38px; border-radius: 11px;
    background: rgba(255,255,255,0.18);
    display: flex; align-items: center; justify-content: center;
  }
  .rl-modal-eyebrow {
    display: block; font-size: 10.5px; font-weight: 600;
    color: rgba(255,255,255,0.65); text-transform: uppercase;
    letter-spacing: 0.5px; margin-bottom: 2px;
  }
  .rl-modal-heading {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800; color: #fff;
  }
  .rl-icon-btn-ghost {
    background: rgba(255,255,255,0.14); border: none; border-radius: 8px;
    padding: 7px; color: rgba(255,255,255,0.9); cursor: pointer; line-height: 1;
    transition: background 0.15s;
  }
  .rl-icon-btn-ghost:hover { background: rgba(255,255,255,0.22); }

  .rl-modal-body { padding: 20px 22px 22px; display: flex; flex-direction: column; gap: 18px; }

  .rl-status-banner {
    display: flex; align-items: center; gap: 10px;
    border: 1.5px solid; border-radius: var(--r-md);
    padding: 11px 16px;
  }

  .rl-info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  }
  @media (max-width: 520px) { .rl-info-grid { grid-template-columns: 1fr; } }

  .rl-info-section {}
  .rl-section-label {
    font-family: 'Syne', sans-serif; font-size: 10.5px; font-weight: 700;
    color: var(--text-3); text-transform: uppercase; letter-spacing: 0.06em;
    margin-bottom: 8px; display: block;
  }
  .rl-info-card {
    background: var(--bg); border-radius: var(--r-md);
    padding: 14px 16px; border: 1px solid var(--border);
  }
  .rl-info-row { display: flex; align-items: center; gap: 11px; }
  .rl-info-avatar {
    width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800;
  }
  .rl-info-kv { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .rl-info-kv:last-child { margin-bottom: 0; }
  .rl-info-key { font-size: 12px; color: var(--text-3); flex: 0 0 56px; }
  .rl-info-val { font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 700; color: var(--text-1); }
  .rl-info-sub { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-3); margin-top: 2px; }

  .rl-description {
    font-size: 13.5px; color: var(--text-2); line-height: 1.65;
    border-top: 1px solid var(--border); padding-top: 10px; margin-top: 4px;
  }

  /* Photos */
  .rl-photo-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; }
  @media (max-width: 480px) { .rl-photo-grid { grid-template-columns: repeat(2,1fr); } }
  .rl-photo-thumb {
    aspect-ratio: 1; border-radius: 10px; overflow: hidden;
    cursor: pointer; position: relative;
    border: 1px solid var(--border);
  }
  .rl-photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .rl-photo-overlay {
    position: absolute; inset: 0;
    background: rgba(0,0,0,0);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .rl-photo-thumb:hover .rl-photo-overlay { background: rgba(0,0,0,0.45); }
  .rl-photo-overlay svg { opacity: 0; transition: opacity 0.2s; }
  .rl-photo-thumb:hover .rl-photo-overlay svg { opacity: 1; }

  /* Modal actions */
  .rl-modal-actions {
    display: flex; gap: 10px; flex-wrap: wrap;
    padding-top: 4px; border-top: 1px solid var(--border);
  }
  .rl-btn-approve, .rl-btn-reject, .rl-btn-track, .rl-btn-cancel-conn {
    flex: 1; min-width: 120px; padding: 11px 14px;
    border-radius: var(--r-md);
    font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 700;
    cursor: pointer; border: none;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: filter 0.15s, transform 0.1s;
  }
  .rl-btn-approve { background: linear-gradient(135deg,#10B981,#059669); color: #fff; }
  .rl-btn-reject  { background: var(--red-bg); color: var(--red); border: 1.5px solid #FECACA; }
  .rl-btn-track   { background: linear-gradient(135deg,#6366F1,#4338CA); color: #fff; }
  .rl-btn-cancel-conn { background: var(--bg); color: var(--text-2); border: 1.5px solid var(--border-mid); }
  .rl-btn-approve:hover, .rl-btn-track:hover { filter: brightness(1.08); transform: translateY(-1px); }
  .rl-btn-reject:hover, .rl-btn-cancel-conn:hover { filter: brightness(0.96); }

  .rl-no-action {
    flex: 1; background: var(--bg); border: 1.5px solid var(--border);
    border-radius: var(--r-md); padding: 14px 18px; text-align: center;
  }
  .rl-no-action-title { font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 700; color: var(--text-2); margin-bottom: 3px; }
  .rl-no-action-sub   { font-size: 12px; color: var(--text-3); }

  .rl-expired-notice {
    flex: 1; display: flex; align-items: flex-start; gap: 10px;
    background: #FFF7ED; border: 1.5px solid #FED7AA;
    border-radius: var(--r-md); padding: 14px 16px;
  }
  .rl-expired-title { font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 700; color: #C2410C; margin-bottom: 2px; }
  .rl-expired-sub   { font-size: 12px; color: #92400E; line-height: 1.5; }

  /* ── LIGHTBOX ── */
  .rl-lightbox {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.92);
    z-index: 60; display: flex; align-items: center; justify-content: center; padding: 24px;
    cursor: zoom-out;
  }
  .rl-lightbox-close {
    position: absolute; top: 18px; right: 18px;
    background: rgba(255,255,255,0.15); border: none; border-radius: 50%;
    width: 38px; height: 38px;
    display: flex; align-items: center; justify-content: center;
    color: #fff; cursor: pointer;
    transition: background 0.15s;
  }
  .rl-lightbox-close:hover { background: rgba(255,255,255,0.25); }
  .rl-lightbox-img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 12px; cursor: default; }

  /* ── ANIMATIONS ── */
  @keyframes rl-spin { to { transform: rotate(360deg); } }
  @keyframes rl-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes rl-modalIn {
    from { opacity: 0; transform: scale(0.96) translateY(12px); }
    to   { opacity: 1; transform: none; }
  }

  .rl-invisible { opacity: 0; }
  .rl-fade-up   { animation: rl-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .rl-modal-enter { animation: rl-modalIn 0.22s cubic-bezier(0.22,1,0.36,1); }
`;

export default WorkshopRequestList;