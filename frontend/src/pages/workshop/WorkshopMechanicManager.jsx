import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Phone, Mail, Calendar,
  CheckCircle, Star, Trash2, ChevronRight, Clock, AlertTriangle, X
} from 'lucide-react';
import {
  fetchMechanicRequests, fetchMyMechanics,
  respondToRequest, clearMessages, removeMechanic
} from '../../redux/slices/workshopMechanicSlice';
import { toast } from 'react-hot-toast';

const WorkshopMechanicManager = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    mechanicRequests, myMechanics,
    requestsLoading, fetchLoading, error, successMessage
  } = useSelector(state => state.workshopMechanic);

  const [activeTab, setActiveTab] = useState('active');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(fetchMechanicRequests());
    dispatch(fetchMyMechanics());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearMessages());
      dispatch(fetchMechanicRequests());
      dispatch(fetchMyMechanics());
    }
    if (error) {
      toast.error(error);
      dispatch(clearMessages());
    }
  }, [successMessage, error, dispatch]);

  const handleRemove = (mechanicId, mechanicName) => {
    toast((t) => (
      <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={16} color="#EF4444" />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, marginBottom: 2 }}>Remove mechanic?</p>
            <p style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.5 }}>
              <strong style={{ color: '#374151' }}>{mechanicName}</strong> will be removed from your team.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => toast.dismiss(t.id)}
            style={{ flex: 1, padding: '8px 0', border: '1.5px solid #E5E7EB', borderRadius: 9, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => { dispatch(removeMechanic(mechanicId)); toast.dismiss(t.id); }}
            style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Remove
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const handleApproveConfirm = (mechanicId, mechanicName) => {
    toast((t) => (
      <div style={{ fontFamily: "'DM Sans', sans-serif", minWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ECFDF5', border: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle size={16} color="#059669" />
          </div>
          <div>
            <p style={{ fontWeight: 700, color: '#111827', fontSize: 14, marginBottom: 2 }}>Approve mechanic?</p>
            <p style={{ fontSize: 12.5, color: '#6B7280', lineHeight: 1.5 }}>
              <strong style={{ color: '#374151' }}>{mechanicName}</strong> will join your team.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => toast.dismiss(t.id)}
            style={{ flex: 1, padding: '8px 0', border: '1.5px solid #E5E7EB', borderRadius: 9, background: '#fff', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => { dispatch(respondToRequest({ mechanicId, action: 'APPROVE' })); toast.dismiss(t.id); }}
            style={{ flex: 1, padding: '8px 0', border: 'none', borderRadius: 9, background: '#4F46E5', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Approve
          </button>
        </div>
      </div>
    ), { duration: 6000, position: 'top-center' });
  };

  const handleReject = (mechanicId) => {
    dispatch(respondToRequest({ mechanicId, action: 'REJECT' }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : '?';

  const avatarColors = [
    ['#EEF2FF', '#4F46E5'], ['#ECFDF5', '#059669'], ['#FFF7ED', '#C2410C'],
    ['#F0FDFA', '#0F766E'], ['#FDF4FF', '#9333EA'], ['#FFF1F2', '#E11D48'],
  ];
  const getAvatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];

  const isLoading = (activeTab === 'active' && fetchLoading) || (activeTab === 'requests' && requestsLoading);

  return (
    <>
      <style>{css}</style>
      <div className="mm-page">

        {/* ── PAGE HEADER ── */}
        <div className="mm-header">
          <div className="mm-header-text">
            <h1 className="mm-title">Team Management</h1>
            <p className="mm-subtitle">Manage your mechanics and review joining requests</p>
          </div>
        </div>

        <div className="mm-container">

          {/* ── STAT CARDS ── */}
          <div className="mm-stats">
            <div className={`mm-stat-card ${mounted ? 'mm-fade-up' : 'mm-invisible'}`} style={{ animationDelay: '0ms' }}>
              <div className="mm-stat-icon" style={{ background: 'linear-gradient(135deg,#6366F1,#4338CA)' }}>
                <Users size={17} color="#fff" />
              </div>
              <div>
                <p className="mm-stat-label">Active Mechanics</p>
                <p className="mm-stat-value">{myMechanics.length}</p>
              </div>
            </div>
            <div className={`mm-stat-card ${mounted ? 'mm-fade-up' : 'mm-invisible'}`} style={{ animationDelay: '80ms' }}>
              <div className="mm-stat-icon" style={{ background: 'linear-gradient(135deg,#F59E0B,#D97706)' }}>
                <UserPlus size={17} color="#fff" />
              </div>
              <div>
                <p className="mm-stat-label">Pending Requests</p>
                <p className="mm-stat-value" style={{ color: mechanicRequests.length > 0 ? '#D97706' : undefined }}>
                  {mechanicRequests.length}
                </p>
              </div>
            </div>
          </div>

          {/* ── TAB PANEL ── */}
          <div className={`mm-panel ${mounted ? 'mm-fade-up' : 'mm-invisible'}`} style={{ animationDelay: '140ms' }}>

            {/* Tab bar */}
            <div className="mm-tabs">
              <button
                className={`mm-tab ${activeTab === 'active' ? 'mm-tab--active' : ''}`}
                onClick={() => setActiveTab('active')}
              >
                <Users size={14} />
                Active Mechanics
                <span className={`mm-tab-count ${activeTab === 'active' ? 'mm-tab-count--active' : ''}`}>
                  {myMechanics.length}
                </span>
              </button>
              <button
                className={`mm-tab ${activeTab === 'requests' ? 'mm-tab--active' : ''}`}
                onClick={() => setActiveTab('requests')}
              >
                <UserPlus size={14} />
                Joining Requests
                {mechanicRequests.length > 0 && (
                  <span className="mm-tab-badge">{mechanicRequests.length}</span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="mm-tab-content">

              {/* Loading */}
              {isLoading && (
                <div className="mm-loading">
                  <div className="mm-spinner-wrap">
                    <div className="mm-spinner-track" />
                    <div className="mm-spinner-head" />
                  </div>
                  <p className="mm-loading-text">Loading…</p>
                </div>
              )}

              {/* ── ACTIVE MECHANICS ── */}
              {activeTab === 'active' && !fetchLoading && (
                <>
                  {myMechanics.length === 0 ? (
                    <div className="mm-empty">
                      <div className="mm-empty-icon"><Users size={28} color="#D1D5DB" /></div>
                      <p className="mm-empty-title">No mechanics yet</p>
                      <p className="mm-empty-sub">Mechanics who join your workshop will appear here.</p>
                    </div>
                  ) : (
                    <div className="mm-card-grid">
                      {myMechanics.map((m, idx) => {
                        const [bgColor, fgColor] = getAvatarColor(m.mechanic_id);
                        return (
                          <div
                            key={m.mechanic_id}
                            className="mm-mechanic-card"
                            style={{ animationDelay: `${idx * 40}ms` }}
                            onClick={() => navigate(`/workshop/team/${m.mechanic_id}`)}
                          >
                            {/* Card top */}
                            <div className="mm-mcard-top">
                              <div className="mm-avatar" style={{ background: bgColor, color: fgColor }}>
                                {getInitials(m.mechanic_name)}
                              </div>
                              <span className={`mm-avail-badge ${m.availability === 'AVAILABLE' ? 'mm-avail-badge--available' : 'mm-avail-badge--busy'}`}>
                                <span className="mm-avail-dot" />
                                {m.availability === 'AVAILABLE' ? 'Available' : 'Busy'}
                              </span>
                            </div>

                            {/* Name + rating */}
                            <div className="mm-mcard-name-row">
                              <h3 className="mm-mcard-name">{m.mechanic_name}</h3>
                              <div className="mm-rating-pill">
                                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                                <span>{m.rating_avg ? Number(m.rating_avg).toFixed(1) : '—'}</span>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="mm-mcard-details">
                              <div className="mm-detail-row">
                                <Mail size={12} color="#C4C9D4" />
                                <span>{m.email}</span>
                              </div>
                              <div className="mm-detail-row">
                                <Phone size={12} color="#C4C9D4" />
                                <span>{m.contact_number}</span>
                              </div>
                              <div className="mm-detail-row">
                                <Calendar size={12} color="#C4C9D4" />
                                <span>Joined {formatDate(m.created_at)}</span>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="mm-mcard-footer">
                              <button
                                className="mm-btn-remove"
                                onClick={(e) => { e.stopPropagation(); handleRemove(m.mechanic_id, m.mechanic_name); }}
                              >
                                <Trash2 size={12} />
                                Remove
                              </button>
                              <div className="mm-view-link">
                                View profile <ChevronRight size={12} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

              {/* ── JOINING REQUESTS ── */}
              {activeTab === 'requests' && !requestsLoading && (
                <>
                  {mechanicRequests.length === 0 ? (
                    <div className="mm-empty">
                      <div className="mm-empty-icon"><UserPlus size={28} color="#D1D5DB" /></div>
                      <p className="mm-empty-title">No pending requests</p>
                      <p className="mm-empty-sub">New joining requests from mechanics will appear here.</p>
                    </div>
                  ) : (
                    <div className="mm-requests-list">
                      {mechanicRequests.map((req, idx) => {
                        const [bgColor, fgColor] = getAvatarColor(req.mechanic_id);
                        return (
                          <div key={req.mechanic_id} className="mm-request-row" style={{ animationDelay: `${idx * 40}ms` }}>
                            {/* Avatar + name */}
                            <div className="mm-req-identity">
                              <div className="mm-avatar mm-avatar--sm" style={{ background: bgColor, color: fgColor }}>
                                {getInitials(req.mechanic_name)}
                              </div>
                              <div>
                                <p className="mm-req-name">{req.mechanic_name}</p>
                                <p className="mm-req-email">{req.email}</p>
                              </div>
                            </div>

                            {/* Meta chips */}
                            <div className="mm-req-meta">
                              <span className="mm-meta-chip">
                                <Phone size={11} color="#9CA3AF" />
                                {req.contact_number}
                              </span>
                              <span className="mm-meta-chip">
                                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                                {req.rating_avg ? Number(req.rating_avg).toFixed(1) : 'No ratings'}
                              </span>
                              <span className="mm-meta-chip">
                                <Clock size={11} color="#9CA3AF" />
                                {formatDate(req.created_at)}
                              </span>
                            </div>

                            {/* Action buttons */}
                            <div className="mm-req-actions">
                              <button className="mm-btn-reject" onClick={() => handleReject(req.mechanic_id)}>
                                <X size={13} />
                                Reject
                              </button>
                              <button className="mm-btn-approve" onClick={() => handleApproveConfirm(req.mechanic_id, req.mechanic_name)}>
                                <CheckCircle size={13} />
                                Approve
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
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
    --green-bg: #ECFDF5;
    --amber: #D97706;
    --red: #EF4444;
    --red-bg: #FEF2F2;
    --shadow-card: 0 2px 12px rgba(15,17,32,0.06), 0 0 0 1px var(--border);
    --shadow-hover: 0 10px 36px rgba(99,102,241,0.12), 0 0 0 1px #e0e7ff;
    --r-md: 14px;
    --r-lg: 18px;
    --r-xl: 22px;
  }



  .mm-page {
    min-height: calc(100vh - 64px);
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text-1);
  }

  /* ── PAGE HEADER ── */
  .mm-header {
    background: linear-gradient(145deg, #0B0F2A 0%, #1a1652 45%, #2d2fa3 80%, #1b3a6e 100%);
    padding: 40px 28px 48px;
    position: relative;
    overflow: hidden;
  }
  .mm-header::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }
  .mm-header::after {
    content: '';
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 52px; background: var(--bg);
    clip-path: ellipse(58% 100% at 50% 100%);
    z-index: 4;
  }
  .mm-header-text { position: relative; z-index: 5; max-width: 1200px; margin: 0 auto; }
  .mm-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.9rem, 4vw, 2.8rem);
    font-weight: 800; color: #fff;
    letter-spacing: -0.02em; line-height: 1.1;
    margin-bottom: 8px;
  }
  .mm-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); }

  /* ── CONTAINER ── */
  .mm-container {
    max-width: 1200px; margin: 0 auto;
    padding: 32px 28px 64px;
  }
  @media (max-width: 640px) {
    .mm-header   { padding: 32px 18px 44px; }
    .mm-container { padding: 24px 16px 56px; }
  }

  /* ── STATS ── */
  .mm-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 24px;
  }
  @media (max-width: 480px) { .mm-stats { grid-template-columns: 1fr; } }

  .mm-stat-card {
    background: var(--surface);
    border-radius: var(--r-lg);
    padding: 18px 20px;
    display: flex; align-items: center; gap: 14px;
    box-shadow: var(--shadow-card);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .mm-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 26px rgba(0,0,0,0.08); }
  .mm-stat-icon {
    width: 42px; height: 42px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .mm-stat-label {
    font-size: 11px; color: var(--text-3); font-weight: 500;
    text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;
  }
  .mm-stat-value {
    font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
    color: var(--text-1); line-height: 1;
  }

  /* ── TAB PANEL ── */
  .mm-panel {
    background: var(--surface);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  .mm-tabs {
    display: flex; gap: 0;
    border-bottom: 1.5px solid var(--border);
    padding: 0 22px;
    background: #FAFBFF;
  }
  .mm-tab {
    display: flex; align-items: center; gap: 7px;
    padding: 16px 4px;
    margin-right: 28px;
    background: none; border: none;
    font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 600;
    color: var(--text-3); cursor: pointer;
    position: relative;
    transition: color 0.15s;
    white-space: nowrap;
  }
  .mm-tab:hover { color: var(--text-2); }
  .mm-tab--active { color: var(--indigo-mid); }
  .mm-tab--active::after {
    content: '';
    position: absolute; bottom: -1.5px; left: 0; right: 0;
    height: 2px; background: var(--indigo-mid); border-radius: 2px;
  }

  .mm-tab-count {
    font-size: 11px; font-weight: 700;
    background: var(--border); color: var(--text-3);
    padding: 2px 8px; border-radius: 100px;
    transition: background 0.15s, color 0.15s;
  }
  .mm-tab-count--active { background: var(--indigo-light); color: var(--indigo-mid); }

  .mm-tab-badge {
    font-size: 10.5px; font-weight: 800;
    background: #FEF2F2; color: var(--red);
    padding: 2px 8px; border-radius: 100px;
    border: 1px solid #FECACA;
  }

  .mm-tab-content { padding: 24px 22px; min-height: 360px; }

  /* ── LOADING ── */
  .mm-loading {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 14px; padding: 60px 0;
  }
  .mm-spinner-wrap { position: relative; width: 44px; height: 44px; }
  .mm-spinner-track {
    position: absolute; inset: 0; border-radius: 50%;
    border: 3px solid #E0E7FF;
  }
  .mm-spinner-head {
    position: absolute; inset: 0; border-radius: 50%;
    border: 3px solid transparent; border-top-color: var(--indigo);
    animation: mm-spin 0.8s linear infinite;
  }
  .mm-loading-text { font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; color: var(--text-3); }

  /* ── EMPTY STATE ── */
  .mm-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 64px 24px; text-align: center;
  }
  .mm-empty-icon {
    width: 66px; height: 66px; border-radius: 18px;
    background: var(--bg);
    display: flex; align-items: center; justify-content: center; margin-bottom: 16px;
  }
  .mm-empty-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700; color: var(--text-1); margin-bottom: 6px; }
  .mm-empty-sub   { font-size: 13.5px; color: var(--text-3); line-height: 1.5; max-width: 280px; }

  /* ── MECHANIC CARDS GRID ── */
  .mm-card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
    gap: 16px;
  }
  @media (max-width: 640px) { .mm-card-grid { grid-template-columns: 1fr; } }

  .mm-mechanic-card {
    border: 1.5px solid var(--border);
    border-radius: var(--r-lg);
    padding: 18px;
    cursor: pointer;
    transition: all 0.22s ease;
    animation: mm-fadeUp 0.45s cubic-bezier(0.16,1,0.3,1) both;
  }
  .mm-mechanic-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-hover);
    border-color: #c7d2fe;
  }

  .mm-mcard-top {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 14px;
  }

  .mm-avatar {
    width: 46px; height: 46px; border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 800;
    flex-shrink: 0;
  }
  .mm-avatar--sm { width: 38px; height: 38px; border-radius: 11px; font-size: 15px; }

  .mm-avail-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 100px;
    border: 1.5px solid;
  }
  .mm-avail-badge--available { background: var(--green-bg); color: var(--green); border-color: #A7F3D0; }
  .mm-avail-badge--busy      { background: #FFF7ED; color: #C2410C; border-color: #FED7AA; }
  .mm-avail-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: currentColor;
    animation: mm-pulse 2s ease-in-out infinite;
  }

  .mm-mcard-name-row {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 12px;
  }
  .mm-mcard-name {
    font-family: 'Syne', sans-serif; font-size: 15.5px; font-weight: 700;
    color: var(--text-1); line-height: 1.2;
  }
  .mm-rating-pill {
    display: inline-flex; align-items: center; gap: 4px;
    background: #FFFBEB; border: 1px solid #FDE68A;
    padding: 3px 8px; border-radius: 8px;
    font-family: 'Syne', sans-serif; font-size: 11.5px; font-weight: 800;
    color: #92400E; flex-shrink: 0;
  }

  .mm-mcard-details { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
  .mm-detail-row {
    display: flex; align-items: center; gap: 8px;
    font-size: 12.5px; color: var(--text-2); line-height: 1;
  }

  .mm-mcard-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .mm-btn-remove {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
    color: var(--red); background: none; border: none; cursor: pointer;
    padding: 5px 8px; border-radius: 8px;
    transition: background 0.12s;
  }
  .mm-btn-remove:hover { background: var(--red-bg); }

  .mm-view-link {
    display: inline-flex; align-items: center; gap: 3px;
    font-size: 12px; font-weight: 500; color: var(--indigo-mid);
    opacity: 0.7;
    transition: opacity 0.12s;
  }
  .mm-mechanic-card:hover .mm-view-link { opacity: 1; }

  /* ── REQUESTS LIST ── */
  .mm-requests-list { display: flex; flex-direction: column; gap: 10px; }

  .mm-request-row {
    display: flex; align-items: center; gap: 16px;
    border: 1.5px solid var(--border); border-radius: var(--r-lg);
    padding: 14px 16px;
    transition: border-color 0.15s, box-shadow 0.15s;
    animation: mm-fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both;
    flex-wrap: wrap;
  }
  .mm-request-row:hover { border-color: #c7d2fe; box-shadow: 0 4px 16px rgba(99,102,241,0.08); }

  .mm-req-identity {
    display: flex; align-items: center; gap: 11px;
    flex: 1; min-width: 160px;
  }
  .mm-req-name  { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--text-1); margin-bottom: 2px; }
  .mm-req-email { font-size: 12px; color: var(--text-3); }

  .mm-req-meta {
    display: flex; flex-wrap: wrap; gap: 6px;
    flex: 1;
  }
  .mm-meta-chip {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 12px; color: var(--text-2);
    background: var(--bg); border: 1px solid var(--border);
    padding: 4px 10px; border-radius: 8px;
  }

  .mm-req-actions {
    display: flex; gap: 8px; flex-shrink: 0;
  }

  .mm-btn-reject {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 14px;
    border: 1.5px solid #FECACA; border-radius: 10px;
    background: var(--red-bg); color: var(--red);
    font-family: 'Syne', sans-serif; font-size: 12.5px; font-weight: 700;
    cursor: pointer; transition: filter 0.12s;
  }
  .mm-btn-reject:hover { filter: brightness(0.96); }

  .mm-btn-approve {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 8px 16px;
    border: none; border-radius: 10px;
    background: linear-gradient(135deg, #6366F1, #4338CA);
    color: #fff;
    font-family: 'Syne', sans-serif; font-size: 12.5px; font-weight: 700;
    cursor: pointer;
    transition: filter 0.12s, transform 0.12s;
  }
  .mm-btn-approve:hover { filter: brightness(1.1); transform: translateY(-1px); }

  @media (max-width: 640px) {
    .mm-request-row { flex-direction: column; align-items: flex-start; }
    .mm-req-actions { width: 100%; }
    .mm-btn-reject, .mm-btn-approve { flex: 1; justify-content: center; }
  }

  /* ── ANIMATIONS ── */
  @keyframes mm-spin    { to { transform: rotate(360deg); } }
  @keyframes mm-pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes mm-fadeUp  {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
  }

  .mm-invisible { opacity: 0; }
  .mm-fade-up   { animation: mm-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
`;

export default WorkshopMechanicManager;