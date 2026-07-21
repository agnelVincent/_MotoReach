import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ProfileInput from '../../components/ProfileInput';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Edit2,
    Camera,
    Lock,
    Save,
    X,
    CheckCircle,
    Loader2,
    AlertTriangle,
    ShieldCheck,
    KeyRound,
    BadgeCheck
} from 'lucide-react';
import { getProfile, updateProfile, changePassword, clearStatus } from '../../redux/slices/ProfileSlice';
import { validateFullName, getPasswordRules } from '../../../utils/validationRules';

const UserProfile = () => {
    const dispatch = useDispatch();
    const { profile, loading, error, success } = useSelector(state => state.profile);

    const [isEditMode, setIsEditMode] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profileError, setProfileError] = useState(null);

    const objectUrlRef = useRef(null);

    const [editedData, setEditedData] = useState({
        fullName: '',
        email: '',
        profilePicture: null,
        profilePictureFile: null,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        dispatch(getProfile());
        return () => { if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current); };
    }, [dispatch]);

    useEffect(() => {
        if (profile) {
            setEditedData({
                fullName: profile.full_name || '',
                email: profile.email || '',
                profilePicture: profile.profile_picture || null,
                profilePictureFile: null,
            });
        }
    }, [profile]);

    useEffect(() => {
        if (success) dispatch(clearStatus());
        let timer;
        if (error) timer = setTimeout(() => dispatch(clearStatus()), 5000);
        return () => clearTimeout(timer);
    }, [success, error, dispatch]);

    const handleEditToggle = () => {
        if (isEditMode) {
            if (objectUrlRef.current) { URL.revokeObjectURL(objectUrlRef.current); objectUrlRef.current = null; }
            setEditedData({ fullName: profile?.full_name || '', email: profile?.email || '', profilePicture: profile?.profile_picture || null, profilePictureFile: null });
            setProfileError(null);
        }
        setIsEditMode(!isEditMode);
    };

    const validateProfileData = () => {
        const nameError = validateFullName(editedData.fullName);
        if (nameError) {
            setProfileError(nameError);
            return false;
        }
        setProfileError(null);
        return true;
    };

    const handleSaveProfile = () => {
        if (!validateProfileData()) return;
        const formData = new FormData();
        formData.append('full_name', editedData.fullName);
        if (editedData.profilePictureFile) formData.append('profile_picture', editedData.profilePictureFile);
        dispatch(updateProfile(formData)).unwrap()
            .then(() => { setIsEditMode(false); objectUrlRef.current = null; })
            .catch(backendError => {
                if (typeof backendError === 'object' && backendError !== null) {
                    const errorKeys = Object.keys(backendError);
                    setProfileError(errorKeys.length > 0 ? `Update failed: ${backendError[errorKeys[0]][0]}` : 'Profile update failed. Please try again.');
                } else setProfileError(backendError);
            });
    };

    const handleInputChange = (field, value) => setEditedData(prev => ({ ...prev, [field]: value }));

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
            const newUrl = URL.createObjectURL(file);
            objectUrlRef.current = newUrl;
            setEditedData(prev => ({ ...prev, profilePictureFile: file, profilePicture: newUrl }));
        }
    };

    const handlePasswordChange = (field, value) => setPasswordData(prev => ({ ...prev, [field]: value }));

    const passwordRules = getPasswordRules(passwordData.newPassword);

    const isPasswordValidNow = Object.values(passwordRules).every(Boolean);
    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;
    const isPasswordFormValid = passwordData.currentPassword.length > 0 && isPasswordValidNow && passwordData.confirmPassword.length > 0 && passwordsMatch;

    const handlePasswordUpdate = () => {
        if (!isPasswordFormValid) return;
        const data = { old_password: passwordData.currentPassword, new_password: passwordData.newPassword, confirm_new_password: passwordData.confirmPassword };
        dispatch(changePassword(data)).unwrap()
            .then(() => {
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowCurrentPassword(false); setShowNewPassword(false); setShowConfirmPassword(false);
            })
            .catch(err => console.error('Password Update Failed:', err));
    };

    if (loading && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center animate-pulse">
                    <User className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="ml-3 font-body text-gray-400 text-sm">Loading profile…</span>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <span className="ml-3 font-body text-gray-500 text-sm">Failed to load profile.</span>
            </div>
        );
    }

    const memberSinceFormatted = new Date(profile.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    const initials = profile.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

    return (
        <div className="min-h-screen bg-[#f8f9fc] font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
                .font-display { font-family: 'Syne', sans-serif; }
                .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

                .profile-hero {
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
                .section-label {
                    font-family: 'Syne', sans-serif;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-size: 0.7rem;
                }
                .card {
                    background: white;
                    border-radius: 1.5rem;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 2px 16px rgba(0,0,0,0.04);
                }
                .field-row {
                    border: 1.5px solid #f1f5f9;
                    border-radius: 1rem;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }
                .field-row:focus-within {
                    border-color: #a5b4fc;
                    box-shadow: 0 0 0 3px rgba(165,180,252,0.15);
                }
                .avatar-ring {
                    background: linear-gradient(135deg, #6366f1, #a78bfa, #818cf8);
                    padding: 3px;
                    border-radius: 9999px;
                }
                .avatar-inner {
                    background: linear-gradient(135deg, #4338ca, #6366f1);
                    border-radius: 9999px;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .save-btn {
                    background: white;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
                }
                .save-btn:hover {
                    background: #f0fdf4;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.16);
                    transform: translateY(-1px);
                }
                .cancel-btn {
                    background: rgba(255,255,255,0.1);
                    transition: all 0.2s ease;
                    border: 1px solid rgba(255,255,255,0.15);
                }
                .cancel-btn:hover {
                    background: rgba(255,255,255,0.18);
                }
                .edit-btn {
                    background: white;
                    transition: all 0.2s ease;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
                }
                .edit-btn:hover {
                    background: #f5f3ff;
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
                }
                .update-pw-btn {
                    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .update-pw-btn:not(:disabled):hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 28px rgba(99,102,241,0.35);
                }
                .rule-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.8rem;
                    transition: color 0.2s ease;
                }
                .toast-enter {
                    animation: toastIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards;
                }
                @keyframes toastIn {
                    from { opacity: 0; transform: translateY(-12px) scale(0.95); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .grid-lines {
                    background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
            `}</style>

            {/* ── TOASTS ── */}
            {success && (
                <div className="fixed top-5 right-4 z-50 toast-enter">
                    <div className="flex items-center gap-3 bg-white border border-emerald-100 text-emerald-700 px-5 py-3.5 rounded-2xl shadow-xl">
                        <div className="w-7 h-7 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-display font-semibold text-sm">{success}</span>
                    </div>
                </div>
            )}
            {error && (
                <div className="fixed top-5 right-4 z-50 toast-enter">
                    <div className="flex items-center gap-3 bg-white border border-rose-100 text-rose-600 px-5 py-3.5 rounded-2xl shadow-xl">
                        <div className="w-7 h-7 bg-rose-50 rounded-xl flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                        </div>
                        <span className="font-display font-semibold text-sm">{error?.detail || (typeof error === 'object' ? JSON.stringify(error) : error)}</span>
                    </div>
                </div>
            )}

            {/* ── HERO ── */}
            <section className="profile-hero hero-noise relative overflow-hidden">
                <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
                <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-10 right-10" />

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pt-16 md:pb-32">
                    <div className="inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/80 mb-7">
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span className="section-label text-white/70">My Account</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                        {/* Name + since */}
                        <div>
                            <h1 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                                {profile.full_name.split(' ')[0]}{' '}
                                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                                    {profile.full_name.split(' ').slice(1).join(' ')}
                                </span>
                            </h1>
                            <p className="font-body text-white/40 text-sm mt-2 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                Member since {memberSinceFormatted}
                            </p>
                        </div>

                        {/* Edit / Save / Cancel */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            {isEditMode ? (
                                <>
                                    <button onClick={handleSaveProfile} disabled={loading} className="save-btn font-display font-bold text-emerald-700 text-sm px-5 py-2.5 rounded-xl flex items-center gap-2">
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        <span>{loading ? 'Saving…' : 'Save'}</span>
                                    </button>
                                    <button onClick={handleEditToggle} className="cancel-btn font-display font-semibold text-white/80 text-sm px-5 py-2.5 rounded-xl flex items-center gap-2">
                                        <X className="w-4 h-4" />
                                        <span>Cancel</span>
                                    </button>
                                </>
                            ) : (
                                <button onClick={handleEditToggle} className="edit-btn font-display font-bold text-indigo-700 text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 group">
                                    <Edit2 className="w-4 h-4 group-hover:rotate-6 transition-transform" />
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Curve */}
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── CONTENT ── */}
            <div className="grid-lines max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-16 space-y-4">

                {/* Profile card */}
                <div className="card p-6 md:p-8">
                    <span className="section-label text-indigo-500 block mb-5">Profile Information</span>

                    {/* Avatar + meta row */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                        {/* Avatar */}
                        <div className="relative group flex-shrink-0">
                            <div className="avatar-ring w-24 h-24 sm:w-28 sm:h-28">
                                <div className="avatar-inner">
                                    {editedData.profilePicture ? (
                                        <img src={editedData.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                    ) : (
                                        <span className="font-display font-bold text-white text-2xl">{initials}</span>
                                    )}
                                </div>
                            </div>
                            {isEditMode && (
                                <>
                                    <input type="file" accept="image/*" id="profile-picture-upload" className="hidden" onChange={handleProfilePictureChange} />
                                    <label htmlFor="profile-picture-upload" className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer gap-1">
                                        <Camera className="w-6 h-6 text-white" />
                                        <span className="text-white text-[10px] font-display font-bold">Change</span>
                                    </label>
                                </>
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-center sm:text-left">
                            <h2 className="font-display font-bold text-gray-900 text-xl sm:text-2xl">{profile.full_name}</h2>
                            <p className="font-body text-gray-400 text-sm mt-0.5">{profile.email}</p>
                            <div className="mt-3 flex items-center justify-center sm:justify-start gap-2">
                                <span className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-display font-bold px-3 py-1 rounded-full">
                                    <ShieldCheck className="w-3 h-3" />
                                    Verified Account
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ProfileInput
                            label="Full Name"
                            value={editedData.fullName}
                            Icon={User}
                            isEditMode={isEditMode}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            errorMessage={profileError}
                        />
                        <ProfileInput
                            label="Email Address"
                            value={profile.email}
                            Icon={Mail}
                            isEditMode={false}
                            type="email"
                        />
                    </div>
                </div>

                {/* Password card */}
                <div className="card p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 profile-hero rounded-2xl flex items-center justify-center flex-shrink-0">
                            <KeyRound className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="section-label text-indigo-500 block">Security</span>
                            <h2 className="font-display font-bold text-gray-900 text-lg leading-tight">Change Password</h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <ProfileInput
                            label="Current Password"
                            value={passwordData.currentPassword}
                            Icon={Lock}
                            isEditMode={true}
                            isPassword={true}
                            showPassword={showCurrentPassword}
                            onTogglePassword={() => setShowCurrentPassword(!showCurrentPassword)}
                            onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                            errorMessage={error && error.detail === 'Old password is incorrect.' ? 'Old password is incorrect.' : null}
                        />
                        <ProfileInput
                            label="New Password"
                            value={passwordData.newPassword}
                            Icon={Lock}
                            isEditMode={true}
                            isPassword={true}
                            showPassword={showNewPassword}
                            onTogglePassword={() => setShowNewPassword(!showNewPassword)}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            errorMessage={passwordData.newPassword && !isPasswordValidNow ? 'New password does not meet all requirements.' : null}
                        />
                        <ProfileInput
                            label="Confirm New Password"
                            value={passwordData.confirmPassword}
                            Icon={Lock}
                            isEditMode={true}
                            isPassword={true}
                            showPassword={showConfirmPassword}
                            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                            passwordMatchError={(passwordData.confirmPassword.length > 0 || passwordData.newPassword.length > 0) && !passwordsMatch ? 'New passwords do not match' : null}
                        />

                        {/* Password rules */}
                        <div className="bg-[#f8f9ff] border border-indigo-50 rounded-2xl p-4">
                            <p className="section-label text-indigo-400 mb-3 block">Requirements</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {[
                                    { rule: passwordRules.length, label: 'At least 8 characters' },
                                    { rule: passwordRules.uppercase, label: 'One uppercase letter' },
                                    { rule: passwordRules.number, label: 'One number' },
                                    { rule: passwordRules.special, label: 'One special character' },
                                ].map(({ rule, label }) => {
                                    const active = passwordData.newPassword.length > 0;
                                    return (
                                        <div key={label} className="rule-item">
                                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? (rule ? 'bg-emerald-100' : 'bg-rose-100') : 'bg-gray-100'}`}>
                                                {active && rule
                                                    ? <CheckCircle className="w-3 h-3 text-emerald-600" />
                                                    : active
                                                        ? <X className="w-3 h-3 text-rose-500" />
                                                        : <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                                }
                                            </div>
                                            <span className={`font-body text-xs ${active ? (rule ? 'text-emerald-700' : 'text-rose-500') : 'text-gray-400'}`}>{label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={handlePasswordUpdate}
                            disabled={!isPasswordFormValid || loading}
                            className={`update-pw-btn w-full py-4 font-display font-bold text-base rounded-2xl shadow-md flex items-center justify-center gap-2 ${
                                isPasswordFormValid && !loading
                                    ? 'profile-hero text-white hover:opacity-95'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                        >
                            {loading
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Updating…</>
                                : <><ShieldCheck className="w-5 h-5" /> Update Password</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;