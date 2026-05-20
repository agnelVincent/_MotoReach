import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  User, Mail, Phone, Camera, Building2, FileText,
  MapPin, Lock, Edit2, Save, X, CheckCircle,
  Shield, AlertTriangle, RotateCw, Eye, EyeOff
} from 'lucide-react';
import {
  getProfile, updateProfile, changePassword, clearStatus
} from '../../redux/slices/ProfileSlice';
import ProfileInput from '../../components/ProfileInput';

const WorkshopProfile = () => {
  const dispatch = useDispatch();
  const { profile, loading, error, success } = useSelector(s => s.profile);

  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [mounted, setMounted] = useState(false);

  const [editedOwnerData, setEditedOwnerData] = useState({ fullName: '', contactNumber: '', profilePicture: null });
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => { setMounted(true); dispatch(getProfile()); }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setEditedOwnerData({
        fullName: profile.full_name || '',
        contactNumber: profile.role_details?.contact_number || '',
        profilePicture: profile.profile_picture || null,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (success) notify(success, 'success');
    if (error) notify(typeof error === 'string' ? error : error.detail || 'An unknown error occurred.', 'error');
    const t = setTimeout(() => dispatch(clearStatus()), 50);
    return () => clearTimeout(t);
  }, [success, error, dispatch]);

  const notify = (msg, type) => {
    if (type === 'success') { setSuccessMessage(msg); setErrorMessage(''); }
    else { setErrorMessage(msg); setSuccessMessage(''); }
    setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3500);
  };

  const handleEditToggle = () => {
    if (isEditMode && profile) {
      setEditedOwnerData({
        fullName: profile.full_name || '',
        contactNumber: profile.role_details?.contact_number || '',
        profilePicture: profile.profile_picture || null,
      });
      setProfilePictureFile(null);
    }
    setIsEditMode(v => !v);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setEditedOwnerData(prev => ({ ...prev, profilePicture: URL.createObjectURL(file) }));
    }
  };

  const handleSaveProfile = () => {
    if (loading || !profile) return;
    const fd = new FormData();
    if (editedOwnerData.fullName !== profile.full_name) fd.append('full_name', editedOwnerData.fullName);
    if (editedOwnerData.contactNumber !== profile.role_details?.contact_number) fd.append('contact_number', editedOwnerData.contactNumber);
    if (profilePictureFile) fd.append('profile_picture', profilePictureFile);
    dispatch(updateProfile(fd)).unwrap().then(() => { setIsEditMode(false); setProfilePictureFile(null); }).catch(() => {});
  };

  const handlePasswordUpdate = () => {
    if (!isPasswordFormValid) return;
    dispatch(changePassword({ old_password: passwordData.currentPassword, new_password: passwordData.newPassword }))
      .unwrap()
      .then(() => setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }))
      .catch(err => {
        const msg = err.old_password?.[0] || err.new_password?.[0] || err.non_field_errors?.[0] || 'Password update failed.';
        notify(msg, 'error');
      });
  };

  const passwordMatchError = passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword ? 'Passwords do not match' : '';
  const isPasswordFormValid = passwordData.currentPassword && passwordData.newPassword && passwordData.confirmPassword && !passwordMatchError;

  const d = {
    fullName: profile?.full_name || 'N/A',
    email: profile?.email || 'N/A',
    contactNumber: profile?.role_details?.contact_number || 'N/A',
    profilePicture: profile?.profile_picture || null,
    workshopName: profile?.role_details?.workshop_name || 'N/A',
    licenseNumber: profile?.role_details?.license_number || 'N/A',
    addressLine: profile?.role_details?.address_line || 'N/A',
    locality: profile?.role_details?.locality || 'N/A',
    city: profile?.role_details?.city || 'N/A',
    state: profile?.role_details?.state || 'N/A',
    pincode: profile?.role_details?.pincode || 'N/A',
    workshopType: profile?.role_details?.type || 'N/A',
    verificationStatus: profile?.role_details?.verification_status || 'Unverified',
  };

  const verifiedStatus = d.verificationStatus?.toUpperCase() === 'VERIFIED';

  /* ── Loading screen ── */
  if (loading && !profile) return (
    <>
      <style>{css}</style>
      <div className="wp-loading">
        <div className="wp-spinner-wrap"><div className="wp-track" /><div className="wp-head" /></div>
        <p className="wp-loading-text">Loading profile…</p>
      </div>
    </>
  );

  /* ── Error screen ── */
  if (!profile && error) return (
    <>
      <style>{css}</style>
      <div className="wp-error-screen">
        <div className="wp-error-icon"><AlertTriangle size={26} color="#EF4444" /></div>
        <h2 className="wp-error-title">Couldn't Load Profile</h2>
        <p className="wp-error-sub">{typeof error === 'string' ? error : error.detail || 'Failed to load profile data.'}</p>
        <button className="wp-btn-primary" onClick={() => dispatch(getProfile())}>Try Again</button>
      </div>
    </>
  );

  return (
    <>
      <style>{css}</style>
      <div className="wp-page">

        {/* ── TOAST ── */}
        {(successMessage || errorMessage) && (
          <div className={`wp-toast wp-toast-enter ${successMessage ? 'wp-toast-success' : 'wp-toast-error'}`}>
            {successMessage ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            <span>{successMessage || errorMessage}</span>
          </div>
        )}

        {/* ── HEADER ── */}
        <header className="wp-header">
          <div className="wp-header-orb wp-orb-1" />
          <div className="wp-header-orb wp-orb-2" />
          <div className="wp-header-grid" />
          <div className="wp-header-inner">
            <div className={`${mounted ? 'wp-fade-up' : 'wp-invisible'}`}>
              <h1 className="wp-title">Workshop Profile</h1>
              <p className="wp-subtitle">Manage your account settings and view workshop details</p>
            </div>
          </div>
          <div className="wp-curve" />
        </header>

        {/* ── MAIN ── */}
        <div className="wp-container">

          {/* ══ SECTION 1: Owner Details ══ */}
          <div className={`wp-card ${mounted ? 'wp-fade-up' : 'wp-invisible'}`} style={{ animationDelay: '60ms' }}>
            <div className="wp-card-header">
              <div className="wp-section-title-row">
                <div className="wp-section-icon" style={{ background: 'linear-gradient(135deg,#6366F1,#4338CA)' }}>
                  <User size={18} color="#fff" />
                </div>
                <div>
                  <h2 className="wp-section-title">Owner Details</h2>
                  <p className="wp-section-sub">Manage your personal information</p>
                </div>
              </div>

              <div className="wp-edit-actions">
                {!isEditMode ? (
                  <button className="wp-btn-edit" onClick={handleEditToggle} disabled={loading}>
                    <Edit2 size={14} />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <>
                    <button className="wp-btn-save" onClick={handleSaveProfile} disabled={loading}>
                      {loading ? <RotateCw size={14} className="spin" /> : <Save size={14} />}
                      <span>{loading ? 'Saving…' : 'Save Changes'}</span>
                    </button>
                    <button className="wp-btn-cancel-edit" onClick={handleEditToggle} disabled={loading}>
                      <X size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Avatar + name block */}
            <div className="wp-avatar-block">
              <div className="wp-avatar-wrap">
                <div className="wp-avatar">
                  {(editedOwnerData.profilePicture || d.profilePicture) ? (
                    <img src={editedOwnerData.profilePicture || d.profilePicture} alt="Profile" className="wp-avatar-img" />
                  ) : (
                    <User size={34} color="#fff" />
                  )}
                </div>
                {isEditMode && (
                  <label htmlFor="picInput" className="wp-avatar-overlay">
                    <Camera size={18} color="#fff" />
                    <input id="picInput" type="file" accept="image/*" className="wp-hidden" onChange={handleProfilePicChange} />
                  </label>
                )}
              </div>
              <div className="wp-avatar-info">
                <p className="wp-display-name">{d.fullName}</p>
                <p className="wp-display-email">{d.email}</p>
                <span className={`wp-verify-badge ${verifiedStatus ? 'wp-verify-ok' : 'wp-verify-no'}`}>
                  {verifiedStatus ? <CheckCircle size={11} /> : <Shield size={11} />}
                  {d.verificationStatus}
                </span>
              </div>
            </div>

            {/* Editable fields */}
            <div className="wp-fields-grid">
              <div className="wp-field-group">
                <label className="wp-field-label">Full Name</label>
                <div className={`wp-field-wrap ${isEditMode ? 'wp-field-wrap--active' : ''}`}>
                  <User size={14} color="#9CA3AF" className="wp-field-icon" />
                  {isEditMode
                    ? <input className="wp-field-input" type="text" value={editedOwnerData.fullName} onChange={e => setEditedOwnerData(p => ({ ...p, fullName: e.target.value }))} />
                    : <span className="wp-field-value">{d.fullName}</span>}
                </div>
              </div>

              <div className="wp-field-group">
                <label className="wp-field-label">Contact Number</label>
                <div className={`wp-field-wrap ${isEditMode ? 'wp-field-wrap--active' : ''}`}>
                  <Phone size={14} color="#9CA3AF" className="wp-field-icon" />
                  {isEditMode
                    ? <input className="wp-field-input" type="tel" value={editedOwnerData.contactNumber} onChange={e => setEditedOwnerData(p => ({ ...p, contactNumber: e.target.value }))} />
                    : <span className="wp-field-value">{d.contactNumber}</span>}
                </div>
              </div>

              <div className="wp-field-group wp-col-span-2">
                <label className="wp-field-label">Email <span className="wp-readonly-tag">Read-only</span></label>
                <div className="wp-field-wrap">
                  <Mail size={14} color="#9CA3AF" className="wp-field-icon" />
                  <span className="wp-field-value">{d.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ SECTION 2: Workshop Details ══ */}
          <div className={`wp-card ${mounted ? 'wp-fade-up' : 'wp-invisible'}`} style={{ animationDelay: '130ms' }}>
            <div className="wp-card-header wp-card-header--nb">
              <div className="wp-section-title-row">
                <div className="wp-section-icon" style={{ background: 'linear-gradient(135deg,#8B5CF6,#6D28D9)' }}>
                  <Building2 size={18} color="#fff" />
                </div>
                <div>
                  <h2 className="wp-section-title">Workshop Details</h2>
                  <p className="wp-section-sub">Your registered workshop information</p>
                </div>
              </div>
            </div>

            <div className="wp-fields-grid">
              {[
                { label: 'Workshop Name', value: d.workshopName,    Icon: Building2 },
                { label: 'License Number', value: d.licenseNumber,   Icon: FileText  },
                { label: 'Workshop Type',  value: d.workshopType,    Icon: Building2 },
                { label: 'City',           value: d.city,            Icon: MapPin    },
                { label: 'State',          value: d.state,           Icon: MapPin    },
                { label: 'Pincode',        value: d.pincode,         Icon: MapPin    },
              ].map(({ label, value, Icon }) => (
                <div className="wp-field-group" key={label}>
                  <label className="wp-field-label">{label}</label>
                  <div className="wp-field-wrap">
                    <Icon size={14} color="#9CA3AF" className="wp-field-icon" />
                    <span className="wp-field-value">{value}</span>
                  </div>
                </div>
              ))}

              <div className="wp-field-group wp-col-span-2">
                <label className="wp-field-label">Address Line</label>
                <div className="wp-field-wrap">
                  <MapPin size={14} color="#9CA3AF" className="wp-field-icon" />
                  <span className="wp-field-value">{d.addressLine}</span>
                </div>
              </div>

              <div className="wp-field-group">
                <label className="wp-field-label">Locality</label>
                <div className="wp-field-wrap">
                  <MapPin size={14} color="#9CA3AF" className="wp-field-icon" />
                  <span className="wp-field-value">{d.locality}</span>
                </div>
              </div>

              <div className="wp-field-group">
                <label className="wp-field-label">Verification Status</label>
                <div className="wp-field-wrap">
                  <Shield size={14} color="#9CA3AF" className="wp-field-icon" />
                  <span className={`wp-verify-inline ${verifiedStatus ? 'wp-verify-inline--ok' : 'wp-verify-inline--no'}`}>
                    {verifiedStatus ? <CheckCircle size={12} /> : <Shield size={12} />}
                    {d.verificationStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ══ SECTION 3: Change Password ══ */}
          <div className={`wp-card ${mounted ? 'wp-fade-up' : 'wp-invisible'}`} style={{ animationDelay: '200ms' }}>
            <div className="wp-card-header wp-card-header--nb">
              <div className="wp-section-title-row">
                <div className="wp-section-icon" style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)' }}>
                  <Lock size={18} color="#fff" />
                </div>
                <div>
                  <h2 className="wp-section-title">Change Password</h2>
                  <p className="wp-section-sub">Keep your account secure with a strong password</p>
                </div>
              </div>
            </div>

            <div className="wp-pw-grid">
              {/* Current password */}
              {[
                { key: 'currentPassword', label: 'Current Password', show: showCurrentPw, toggle: () => setShowCurrentPw(v => !v) },
                { key: 'newPassword',     label: 'New Password',     show: showNewPw,     toggle: () => setShowNewPw(v => !v) },
                { key: 'confirmPassword', label: 'Confirm New Password', show: showConfirmPw, toggle: () => setShowConfirmPw(v => !v), error: passwordMatchError },
              ].map(({ key, label, show, toggle, error: fieldErr }) => (
                <div className="wp-field-group" key={key}>
                  <label className="wp-field-label">{label}</label>
                  <div className={`wp-field-wrap wp-field-wrap--active ${fieldErr ? 'wp-field-wrap--error' : ''}`}>
                    <Lock size={14} color="#9CA3AF" className="wp-field-icon" />
                    <input
                      className="wp-field-input"
                      type={show ? 'text' : 'password'}
                      value={passwordData[key]}
                      onChange={e => setPasswordData(p => ({ ...p, [key]: e.target.value }))}
                      placeholder="••••••••"
                    />
                    <button type="button" className="wp-pw-toggle" onClick={toggle}>
                      {show ? <EyeOff size={14} color="#9CA3AF" /> : <Eye size={14} color="#9CA3AF" />}
                    </button>
                  </div>
                  {fieldErr && <p className="wp-field-error">{fieldErr}</p>}
                </div>
              ))}
            </div>

            {/* Password requirements */}
            <div className="wp-pw-reqs">
              <p className="wp-pw-reqs-title">Requirements</p>
              <div className="wp-pw-reqs-grid">
                {['At least 8 characters', 'One uppercase letter', 'One number', 'One special character'].map(r => (
                  <span key={r} className="wp-pw-req-item">
                    <span className="wp-pw-req-dot" />
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <button
              className={`wp-btn-update-pw ${isPasswordFormValid && !loading ? 'wp-btn-update-pw--active' : 'wp-btn-update-pw--disabled'}`}
              onClick={handlePasswordUpdate}
              disabled={!isPasswordFormValid || loading}
            >
              {loading
                ? <><RotateCw size={15} className="spin" /> Updating…</>
                : <><Lock size={15} /> Update Password</>}
            </button>
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
    --red: #EF4444;
    --red-bg: #FEF2F2;
    --shadow-card: 0 2px 12px rgba(15,17,32,0.06), 0 0 0 1px var(--border);
    --r-md: 14px;
    --r-lg: 18px;
    --r-xl: 22px;
  }



  .wp-page {
    min-height: calc(100vh - 64px);
    background: var(--bg);
    font-family: 'DM Sans', sans-serif;
    color: var(--text-1);
  }

  /* ── TOAST ── */
  .wp-toast {
    position: fixed; top: 22px; right: 22px; z-index: 100;
    display: flex; align-items: center; gap: 10px;
    padding: 12px 18px; border-radius: var(--r-md);
    font-family: 'Syne', sans-serif; font-size: 13.5px; font-weight: 700;
    box-shadow: 0 8px 32px rgba(0,0,0,0.14);
    border: 1.5px solid;
  }
  .wp-toast-success { background: var(--green-bg); color: #065F46; border-color: #A7F3D0; }
  .wp-toast-error   { background: var(--red-bg); color: #991B1B; border-color: #FECACA; }
  .wp-toast-enter   { animation: wp-slideIn 0.3s cubic-bezier(0.16,1,0.3,1); }

  /* ── HEADER ── */
  .wp-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
    padding: 72px 32px 110px;
    position: relative; overflow: hidden;
  }
  .wp-header-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg,rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .wp-header-orb {
    position: absolute; border-radius: 50%;
    filter: blur(72px); pointer-events: none;
  }
  .wp-orb-1 { width: 340px; height: 340px; background: #6366F1; opacity: 0.2; top: -100px; left: -70px; }
  .wp-orb-2 { width: 220px; height: 220px; background: #818CF8; opacity: 0.13; top: 20px; right: 60px; }

  .wp-curve {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 52px; background: var(--bg);
    clip-path: ellipse(58% 100% at 50% 100%); z-index: 4;
  }
  .wp-header-inner { position: relative; z-index: 5; max-width: 860px; margin: 0 auto; }
  .wp-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(2rem, 4.5vw, 3rem);
    font-weight: 800; color: #fff;
    letter-spacing: -0.025em; line-height: 1.1; margin-bottom: 8px;
  }
  .wp-subtitle { font-size: 14px; color: rgba(255,255,255,0.5); }

  /* ── CONTAINER ── */
  .wp-container {
    max-width: 860px; margin: -36px auto 0;
    padding: 0 28px 72px;
    display: flex; flex-direction: column; gap: 20px;
    position: relative; z-index: 10;
  }
  @media (max-width: 640px) {
    .wp-header    { padding: 52px 20px 80px; }
    .wp-container { padding: 0 16px 56px; margin-top: -24px; }
  }

  /* ── CARD ── */
  .wp-card {
    background: var(--surface);
    border-radius: var(--r-xl);
    box-shadow: var(--shadow-card);
    overflow: hidden;
  }

  .wp-card-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1.5px solid var(--border);
    flex-wrap: wrap; gap: 12px;
  }
  .wp-card-header--nb { border-bottom: none; padding-bottom: 0; }

  .wp-section-title-row { display: flex; align-items: center; gap: 13px; }
  .wp-section-icon {
    width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .wp-section-title {
    font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800;
    color: var(--text-1); margin-bottom: 2px;
  }
  .wp-section-sub { font-size: 12.5px; color: var(--text-3); }

  /* Edit actions */
  .wp-edit-actions { display: flex; align-items: center; gap: 8px; }
  .wp-btn-edit {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px;
    background: var(--indigo-light); color: var(--indigo-mid);
    border: 1.5px solid #c7d2fe; border-radius: var(--r-md);
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: background 0.15s, border-color 0.15s;
  }
  .wp-btn-edit:hover { background: #e0e7ff; border-color: #a5b4fc; }
  .wp-btn-edit:disabled { opacity: 0.5; cursor: not-allowed; }

  .wp-btn-save {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 8px 16px;
    background: linear-gradient(135deg,#10B981,#059669);
    color: #fff; border: none; border-radius: var(--r-md);
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; transition: filter 0.15s;
  }
  .wp-btn-save:hover { filter: brightness(1.08); }
  .wp-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

  .wp-btn-cancel-edit {
    padding: 8px 10px;
    background: var(--bg); color: var(--text-2);
    border: 1.5px solid var(--border-mid); border-radius: var(--r-md);
    cursor: pointer; line-height: 1;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.12s;
  }
  .wp-btn-cancel-edit:hover { background: #e5e7eb; }

  /* ── AVATAR BLOCK ── */
  .wp-avatar-block {
    display: flex; align-items: center; gap: 20px;
    padding: 20px 24px;
    border-bottom: 1.5px solid var(--border);
  }
  .wp-avatar-wrap { position: relative; flex-shrink: 0; }
  .wp-avatar {
    width: 80px; height: 80px; border-radius: 22px;
    background: linear-gradient(135deg,#6366F1,#4338CA);
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(99,102,241,0.25);
  }
  .wp-avatar-img { width: 100%; height: 100%; object-fit: cover; }
  .wp-avatar-overlay {
    position: absolute; inset: 0; border-radius: 22px;
    background: rgba(0,0,0,0.48);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; opacity: 0; transition: opacity 0.18s;
  }
  .wp-avatar-wrap:hover .wp-avatar-overlay { opacity: 1; }
  .wp-hidden { display: none; }

  .wp-display-name  { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: var(--text-1); margin-bottom: 3px; }
  .wp-display-email { font-size: 13px; color: var(--text-3); margin-bottom: 8px; }

  .wp-verify-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    padding: 3px 10px; border-radius: 100px; border: 1.5px solid;
  }
  .wp-verify-ok { background: var(--green-bg); color: #065F46; border-color: #A7F3D0; }
  .wp-verify-no { background: #FFF7ED; color: #C2410C; border-color: #FED7AA; }

  /* ── FIELDS GRID ── */
  .wp-fields-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 14px 20px;
    padding: 20px 24px;
  }
  @media (max-width: 560px) { .wp-fields-grid { grid-template-columns: 1fr; } }

  .wp-col-span-2 { grid-column: span 2; }
  @media (max-width: 560px) { .wp-col-span-2 { grid-column: span 1; } }

  .wp-field-group { display: flex; flex-direction: column; gap: 5px; }
  .wp-field-label {
    font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
    color: var(--text-3); text-transform: uppercase; letter-spacing: 0.05em;
    display: flex; align-items: center; gap: 7px;
  }
  .wp-readonly-tag {
    font-size: 10px; font-weight: 600; text-transform: none; letter-spacing: 0;
    background: var(--bg); color: var(--text-3);
    border: 1px solid var(--border); padding: 1px 7px; border-radius: 5px;
  }

  .wp-field-wrap {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 13px;
    background: var(--bg); border: 1.5px solid var(--border);
    border-radius: var(--r-md);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .wp-field-wrap--active {
    background: var(--surface); border-color: var(--border-mid);
  }
  .wp-field-wrap--active:focus-within {
    border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .wp-field-wrap--error { border-color: var(--red) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.1) !important; }

  .wp-field-icon { flex-shrink: 0; }
  .wp-field-value { font-size: 13.5px; color: var(--text-1); font-weight: 500; }
  .wp-field-input {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13.5px; color: var(--text-1); font-family: 'DM Sans', sans-serif;
    font-weight: 500;
  }
  .wp-field-input::placeholder { color: var(--text-3); }
  .wp-field-error { font-size: 12px; color: var(--red); font-weight: 500; }

  .wp-verify-inline {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 13px; font-weight: 600;
  }
  .wp-verify-inline--ok { color: var(--green); }
  .wp-verify-inline--no { color: #C2410C; }

  /* ── PASSWORD SECTION ── */
  .wp-pw-grid {
    display: flex; flex-direction: column; gap: 14px;
    padding: 20px 24px 0;
  }
  .wp-pw-toggle {
    background: none; border: none; cursor: pointer; padding: 2px;
    display: flex; align-items: center; flex-shrink: 0;
  }

  .wp-pw-reqs {
    margin: 16px 24px;
    background: var(--indigo-light);
    border: 1.5px solid #c7d2fe;
    border-radius: var(--r-md);
    padding: 14px 16px;
  }
  .wp-pw-reqs-title {
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
    color: var(--indigo-mid); margin-bottom: 10px;
  }
  .wp-pw-reqs-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  }
  @media (max-width: 480px) { .wp-pw-reqs-grid { grid-template-columns: 1fr; } }
  .wp-pw-req-item {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; color: #3730A3;
  }
  .wp-pw-req-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--indigo); flex-shrink: 0;
  }

  .wp-btn-update-pw {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: calc(100% - 48px); margin: 0 24px 24px;
    padding: 12px;
    border: none; border-radius: var(--r-md);
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800;
    cursor: pointer; transition: filter 0.15s, transform 0.1s;
  }
  .wp-btn-update-pw--active {
    background: linear-gradient(135deg,#6366F1,#4338CA);
    color: #fff;
  }
  .wp-btn-update-pw--active:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .wp-btn-update-pw--disabled {
    background: var(--bg); color: var(--text-3);
    border: 1.5px solid var(--border); cursor: not-allowed;
  }

  /* ── LOADING / ERROR SCREENS ── */
  .wp-loading {
    min-height: calc(100vh - 64px); display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 16px; background: var(--bg);
  }
  .wp-spinner-wrap { position: relative; width: 46px; height: 46px; }
  .wp-track { position: absolute; inset: 0; border-radius: 50%; border: 3px solid #E0E7FF; }
  .wp-head  { position: absolute; inset: 0; border-radius: 50%; border: 3px solid transparent; border-top-color: var(--indigo); animation: wp-spin 0.8s linear infinite; }
  .wp-loading-text { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: var(--text-3); }

  .wp-error-screen {
    min-height: calc(100vh - 64px); display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    background: var(--bg); padding: 24px; text-align: center;
  }
  .wp-error-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: var(--red-bg); border: 1.5px solid #FECACA;
    display: flex; align-items: center; justify-content: center;
  }
  .wp-error-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; color: var(--text-1); }
  .wp-error-sub   { font-size: 14px; color: var(--text-3); max-width: 320px; line-height: 1.5; }
  .wp-btn-primary {
    padding: 10px 22px;
    background: linear-gradient(135deg,#6366F1,#4338CA);
    color: #fff; border: none; border-radius: var(--r-md);
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; margin-top: 8px;
    transition: filter 0.15s;
  }
  .wp-btn-primary:hover { filter: brightness(1.1); }

  /* ── ANIMATIONS ── */
  @keyframes wp-spin { to { transform: rotate(360deg); } }
  @keyframes wp-fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: none; }
  }
  @keyframes wp-slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: none; }
  }

  .wp-invisible { opacity: 0; }
  .wp-fade-up   { animation: wp-fadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
  .spin         { animation: wp-spin 0.75s linear infinite; }
`;

export default WorkshopProfile;