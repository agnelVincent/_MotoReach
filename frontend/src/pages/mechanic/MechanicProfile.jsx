import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  User, Mail, Phone, Camera, Lock,
  Edit2, Save, X, CheckCircle, Activity,
  AlertTriangle, RotateCw
} from 'lucide-react';

import {
  getProfile,
  updateProfile,
  changePassword,
  updateAvailability,
  clearStatus
} from '../../redux/slices/ProfileSlice';

import ProfileInput from '../../components/ProfileInput';

const MechanicProfile = () => {
  const dispatch = useDispatch();
  const { profile, loading, error, success } = useSelector((state) => state.profile);

  const [mounted, setMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [editedMechanicData, setEditedMechanicData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    profilePicture: null,
  });
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    setMounted(true);
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setEditedMechanicData({
        fullName: profile.full_name || '',
        email: profile.email || '',
        phoneNumber: profile.role_details?.contact_number || '',
        profilePicture: profile.profile_picture || null,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (success) showNotification(success, 'success');
    if (error) {
      if (typeof error === 'string' && !error.includes('password')) {
        showNotification(error, 'error');
      } else if (error && error.detail) {
        showNotification(error.detail, 'error');
      }
    }
    const timer = setTimeout(() => dispatch(clearStatus()), 50);
    return () => clearTimeout(timer);
  }, [success, error, dispatch]);

  const showNotification = (message, type) => {
    if (type === 'success') { setSuccessMessage(message); setErrorMessage(''); }
    else { setErrorMessage(message); setSuccessMessage(''); }
    setTimeout(() => { setSuccessMessage(''); setErrorMessage(''); }, 3000);
  };

  const handleEditToggle = () => {
    if (isEditMode && profile) {
      setEditedMechanicData({
        fullName: profile.full_name || '',
        email: profile.email || '',
        phoneNumber: profile.role_details?.contact_number || '',
        profilePicture: profile.profile_picture || null,
      });
      setProfilePictureFile(null);
    }
    setIsEditMode(!isEditMode);
  };

  const handleProfileInputChange = (field, value) => {
    setEditedMechanicData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      setEditedMechanicData(prev => ({ ...prev, profilePicture: URL.createObjectURL(file) }));
    }
  };

  const handleSaveProfile = () => {
    if (!profile) return;
    const formData = new FormData();
    if (editedMechanicData.fullName !== profile.full_name) formData.append('full_name', editedMechanicData.fullName);
    if (editedMechanicData.phoneNumber !== profile.role_details?.contact_number) formData.append('contact_number', editedMechanicData.phoneNumber);
    if (profilePictureFile) formData.append('profile_picture', profilePictureFile);
    dispatch(updateProfile(formData)).unwrap()
      .then(() => { dispatch(getProfile()); setIsEditMode(false); setProfilePictureFile(null); })
      .catch((err) => console.error('Profile update failed:', err));
  };

  const handleAvailabilityToggle = () => {
    if (!profile || !profile.role_details) return;
    const currentStatus = profile.role_details.availability;
    const newStatus = currentStatus?.toUpperCase() === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    dispatch(updateAvailability(newStatus)).unwrap()
      .then(() => dispatch(getProfile()))
      .catch((err) => console.error('Availability update failed:', err));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const passwordMatchError =
    passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
      ? 'Passwords do not match' : '';

  const isPasswordFormValid =
    passwordData.currentPassword && passwordData.newPassword &&
    passwordData.confirmPassword && !passwordMatchError;

  const handlePasswordUpdate = () => {
    if (!isPasswordFormValid) {
      showNotification(passwordMatchError || 'Please fill in all password fields correctly.', 'error');
      return;
    }
    dispatch(changePassword({
      old_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_new_password: passwordData.confirmPassword
    })).unwrap()
      .then(() => {
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        showNotification('Password updated successfully!', 'success');
      })
      .catch(() => {});
  };

  const currentAvailability = profile?.role_details?.availability?.toUpperCase() === 'AVAILABLE';

  // ── Loading ──
  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <RotateCw className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="ml-3 font-body text-gray-500 font-medium">Loading profile…</span>
      </div>
    );
  }

  // ── Error ──
  if (!profile && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f9fc] p-4">
        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="font-display font-bold text-gray-900 text-xl mb-2">Error Loading Profile</h2>
        <p className="font-body text-gray-500 text-sm text-center mb-6">{error.detail || String(error)}</p>
        <button
          onClick={() => dispatch(getProfile())}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-bold text-sm rounded-2xl"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

        .section-label {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }
        .hero-gradient {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
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
        .grid-lines {
          background-image:
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }

        .profile-card {
          border: 1px solid #f1f5f9;
          transition: box-shadow 0.2s ease;
        }
        .profile-card:hover { box-shadow: 0 8px 30px rgba(99,102,241,0.07); }

        .action-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .action-btn:hover  { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .toast-anim { animation: slideIn 0.3s ease forwards; }
      `}</style>

      {/* ── TOAST ── */}
      {(successMessage || errorMessage) && (
        <div className="fixed top-6 right-4 z-50 toast-anim">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 font-display font-semibold text-sm text-white ${successMessage ? 'bg-emerald-500' : 'bg-red-500'}`}>
            {successMessage ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {successMessage || errorMessage}
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-16 right-10" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 md:pt-28 md:pb-20">
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-6 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">Account</span>
          </div>

          <div className={`flex flex-col sm:flex-row sm:items-center gap-6 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            {/* Avatar */}
            <div className="relative group flex-shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-white/10 border-2 border-white/20 overflow-hidden flex items-center justify-center">
                {(editedMechanicData.profilePicture || profile?.profile_picture) ? (
                  <img src={editedMechanicData.profilePicture || profile?.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-white/60" />
                )}
              </div>
              {isEditMode && (
                <label htmlFor="profilePictureInput" className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input id="profilePictureInput" type="file" accept="image/*" className="hidden" onChange={handleProfilePictureFileChange} />
                </label>
              )}
            </div>

            <div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-1">
                {profile?.full_name?.split(' ')[0] || 'Mechanic'}{' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                  Profile
                </span>
              </h1>
              <p className="font-body text-white/50 text-sm">Manage your account settings and availability.</p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── BODY ── */}
      <div className="grid-lines max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">

        {/* ── BASIC INFO ── */}
        <div className="profile-card bg-white rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <span className="section-label text-indigo-500 block mb-0.5">Personal</span>
                <h2 className="font-display font-bold text-gray-900 text-xl">Basic Information</h2>
              </div>
            </div>

            {!isEditMode ? (
              <button
                onClick={handleEditToggle}
                disabled={loading}
                className="action-btn flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 font-display font-semibold text-sm rounded-2xl hover:bg-indigo-100 disabled:opacity-50"
              >
                {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{loading ? 'Loading…' : 'Edit'}</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="action-btn flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-semibold text-sm rounded-2xl shadow-md disabled:opacity-50"
                >
                  {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="hidden sm:inline">{loading ? 'Saving…' : 'Save'}</span>
                </button>
                <button
                  onClick={handleEditToggle}
                  disabled={loading}
                  className="action-btn flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-600 font-display font-semibold text-sm rounded-2xl hover:bg-gray-200 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ProfileInput
              label="Full Name"
              value={isEditMode ? editedMechanicData.fullName : profile?.full_name || ''}
              Icon={User}
              isEditMode={isEditMode}
              type="text"
              onChange={(e) => handleProfileInputChange('fullName', e.target.value)}
            />
            <ProfileInput
              label="Email (Read-only)"
              value={profile?.email || ''}
              Icon={Mail}
              isEditMode={false}
              type="email"
              onChange={() => {}}
            />
            <div className="md:col-span-2">
              <ProfileInput
                label="Phone Number"
                value={isEditMode ? editedMechanicData.phoneNumber : profile?.role_details?.contact_number || ''}
                Icon={Phone}
                isEditMode={isEditMode}
                type="tel"
                onChange={(e) => handleProfileInputChange('phoneNumber', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── AVAILABILITY ── */}
        <div className="profile-card bg-white rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <span className="section-label text-emerald-500 block mb-0.5">Status</span>
              <h2 className="font-display font-bold text-gray-900 text-xl">Availability</h2>
            </div>
          </div>

          {/* Toggle row */}
          <div className="flex items-center justify-between bg-[#f8f9fc] border border-gray-100 rounded-2xl p-5 mb-5">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentAvailability ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                <Activity className={`w-5 h-5 ${currentAvailability ? 'text-emerald-600' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="font-display font-bold text-gray-900 text-base">
                  {currentAvailability ? 'Available for Work' : 'Currently Busy'}
                </p>
                <p className="font-body text-gray-400 text-xs mt-0.5">
                  {currentAvailability
                    ? 'Visible to customers — can receive new requests'
                    : 'Profile hidden from new service requests'}
                </p>
              </div>
            </div>

            <button
              onClick={handleAvailabilityToggle}
              disabled={loading}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${currentAvailability ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
              <span className="sr-only">Toggle availability</span>
              {loading ? (
                <RotateCw className="h-4 w-4 text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
              ) : (
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${currentAvailability ? 'translate-x-8' : 'translate-x-1'}`} />
              )}
            </button>
          </div>

          {/* Status indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${currentAvailability ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${currentAvailability ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span className={`font-display font-semibold text-sm ${currentAvailability ? 'text-emerald-700' : 'text-gray-400'}`}>Available</span>
              </div>
              <p className="font-body text-xs text-gray-400 ml-4">Accepting new service requests</p>
            </div>
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${!currentAvailability ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${!currentAvailability ? 'bg-red-500' : 'bg-gray-300'}`} />
                <span className={`font-display font-semibold text-sm ${!currentAvailability ? 'text-red-700' : 'text-gray-400'}`}>Busy</span>
              </div>
              <p className="font-body text-xs text-gray-400 ml-4">Not accepting new requests</p>
            </div>
          </div>
        </div>

        {/* ── CHANGE PASSWORD ── */}
        <div className="profile-card bg-white rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-3 mb-7">
            <div className="w-11 h-11 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <span className="section-label text-violet-500 block mb-0.5">Security</span>
              <h2 className="font-display font-bold text-gray-900 text-xl">Change Password</h2>
            </div>
          </div>

          <div className="space-y-4">
            <ProfileInput
              label="Current Password"
              value={passwordData.currentPassword}
              Icon={Lock}
              isEditMode={false}
              isPassword={true}
              showPassword={showCurrentPassword}
              onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
            />
            <ProfileInput
              label="New Password"
              value={passwordData.newPassword}
              Icon={Lock}
              isEditMode={false}
              isPassword={true}
              showPassword={showNewPassword}
              onTogglePassword={() => setShowNewPassword(!showNewPassword)}
              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
            />
            <ProfileInput
              label="Confirm New Password"
              value={passwordData.confirmPassword}
              Icon={Lock}
              isEditMode={false}
              isPassword={true}
              showPassword={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
              passwordMatchError={passwordMatchError}
            />

            <button
              onClick={handlePasswordUpdate}
              disabled={!isPasswordFormValid || loading}
              className={`action-btn w-full py-3.5 font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all ${
                isPasswordFormValid && !loading
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md hover:shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading && <RotateCw className="w-4 h-4 animate-spin" />}
              Update Password
            </button>

            {/* Requirements */}
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <p className="font-display font-semibold text-indigo-700 text-xs mb-2">Password requirements</p>
              <ul className="font-body text-indigo-600 text-xs space-y-1">
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />At least 8 characters long</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />Contains at least one uppercase letter</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />Contains at least one number</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />Contains at least one special character</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MechanicProfile;