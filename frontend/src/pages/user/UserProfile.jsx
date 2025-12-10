import React, { useState, useEffect } from 'react';
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
    MapPin
} from 'lucide-react';
import { getProfile, updateProfile, changePassword, clearStatus } from '../../redux/slices/ProfileSlice';

const UserProfile = () => {
    const dispatch = useDispatch();
    const { profile, loading, error, success } = useSelector(state => state.profile);

    const [isEditMode, setIsEditMode] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [profileError, setProfileError] = useState(null); 


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
        if (success) {
            dispatch(clearStatus()); 
        }
        if (error) {
            setTimeout(() => {
                dispatch(clearStatus());
            }, 5000);
        }
    }, [success, error, dispatch]);


    const handleEditToggle = () => {
        if (isEditMode) {
            setEditedData({
                fullName: profile?.full_name || '',
                email: profile?.email || '',
                profilePicture: profile?.profile_picture || null,
                profilePictureFile: null,
            });
            setProfileError(null);
        }
        setIsEditMode(!isEditMode);
    };


    const validateProfileData = () => {
        if (editedData.fullName.trim().length < 3) {
            setProfileError('Full name must be at least 3 characters long.');
            return false;
        }

        setProfileError(null);
        return true;
    };

    const handleSaveProfile = () => {
        if (!validateProfileData()) return;

        const formData = new FormData();
        formData.append('full_name', editedData.fullName);
        
        if (editedData.profilePictureFile) {
            formData.append('profile_picture', editedData.profilePictureFile);
        }

        dispatch(updateProfile(formData))
            .unwrap()
            .then(() => {
                setIsEditMode(false);
            })
            .catch(backendError => {
                console.error("Profile Update Failed:", backendError);
                if (typeof backendError === 'object' && backendError !== null) {
                    const errorKeys = Object.keys(backendError);
                    if (errorKeys.length > 0) {
                        setProfileError(`Update failed: ${backendError[errorKeys[0]][0]}`);
                    } else {
                        setProfileError("Profile update failed. Please try again.");
                    }
                } else {
                    setProfileError(backendError);
                }
            });
    };

    const handleInputChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setEditedData(prev => ({
                ...prev,
                profilePictureFile: file,
                profilePicture: URL.createObjectURL(file) 
            }));
        }
    };



    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const isPasswordValid = (password) => {
        return password.length >= 8 
            && /[A-Z]/.test(password) 
            && /\d/.test(password) 
            && /[!@#$%^&*(),.?":{}|<>]/.test(password);
    };

    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;

    const isPasswordFormValid = 
        passwordData.currentPassword.length > 0 && 
        isPasswordValid(passwordData.newPassword) && 
        passwordData.confirmPassword.length > 0 &&
        passwordsMatch;

    const handlePasswordUpdate = () => {
        if (!isPasswordFormValid) return;

        const data = {
            old_password: passwordData.currentPassword,
            new_password: passwordData.newPassword,
            confirm_new_password: passwordData.confirmPassword,
        };
        
        dispatch(changePassword(data))
            .unwrap()
            .then(() => {
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowCurrentPassword(false);
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            })
            .catch(backendError => {
                 console.error("Password Update Failed:", backendError);
            });
    };
    
    if (loading && !profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                <span className="ml-3 text-lg text-gray-700">Loading Profile...</span>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <AlertTriangle className="w-10 h-10 text-red-600" />
                <span className="ml-3 text-lg text-gray-700">Failed to load profile.</span>
            </div>
        );
    }
    
const memberSinceFormatted = new Date(profile.memberSince).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            
            {success && (
                <div className="fixed top-20 right-4 z-50 animate-fadeIn">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-medium">{success}</span>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="fixed top-20 right-4 z-50 animate-fadeIn">
                    <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6" />
                        <span className="font-medium">Error: {error?.detail || (typeof error === 'object' ? JSON.stringify(error) : error)}</span>
                    </div>
                </div>
            )}

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            My Profile - {profile.full_name}
                        </h1>
                        <p className="text-gray-600">
                            Manage your account settings and preferences
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>

                        <div className="relative">
                            <div className="absolute top-0 right-0 z-10">
                                {isEditMode ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={loading}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-green-400"
                                        >
                                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save'}</span>
                                        </button>
                                        <button
                                            onClick={handleEditToggle}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                            <span className="hidden sm:inline">Cancel</span>
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleEditToggle}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Edit Profile</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                                {/* Profile Picture */}
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl overflow-hidden">
                                        {editedData.profilePicture ? (
                                            <img
                                                src={editedData.profilePicture}
                                                alt="Profile"
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-16 h-16 text-white" />
                                        )}
                                    </div>
                                    
                                    {isEditMode && (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="profile-picture-upload"
                                                className="hidden"
                                                onChange={handleProfilePictureChange}
                                            />
                                            <label 
                                                htmlFor="profile-picture-upload"
                                                className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                                            >
                                                <Camera className="w-8 h-8 text-white" />
                                            </label>
                                        </>
                                    )}
                                </div>

                                <div className="flex-1 text-center md:text-left pt-6">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                                        {profile.full_name}
                                    </h2>
                                    <p className="text-gray-600 mb-4">{profile.email}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>Member since {memberSinceFormatted}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Info Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <ProfileInput
                                    label="Full Name"
                                    value={editedData.fullName}
                                    Icon={User}
                                    isEditMode={isEditMode}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    errorMessage={profileError} // Displaying generic error for now
                                />

                                {/* Email is read-only (not included in ProfileUpdateSerializer) */}
                                <ProfileInput
                                    label="Email Address (Read-only)"
                                    value={profile.email}
                                    Icon={Mail}
                                    isEditMode={false} // Always read-only
                                    type="email"
                                />

                            </div>
                        </div>
                    </div>

                    {/* Change Password Section */}
                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                                <Lock className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Change Password</h2>
                                <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            
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
                                errorMessage={
                                    passwordData.newPassword && !isPasswordValid(passwordData.newPassword) 
                                        ? 'New password does not meet all requirements.' 
                                        : null
                                }
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
                                passwordMatchError={
                                    (passwordData.confirmPassword.length > 0 || passwordData.newPassword.length > 0) && !passwordsMatch
                                        ? 'New passwords do not match' 
                                        : null
                                }
                            />

                            <button
                                onClick={handlePasswordUpdate}
                                disabled={!isPasswordFormValid || loading}
                                className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform ${
                                    isPasswordFormValid && !loading
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-[1.02]'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {loading ? <Loader2 className="w-5 h-5 inline-block mr-2 animate-spin" /> : 'Update Password'}
                            </button>

                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800 font-medium mb-2">Password requirements:</p>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li className={isPasswordValid(passwordData.newPassword) || passwordData.newPassword.length === 0 ? '' : 'text-red-500'}>
                                        • At least 8 characters long
                                    </li>
                                    <li className={isPasswordValid(passwordData.newPassword) || passwordData.newPassword.length === 0 ? '' : 'text-red-500'}>
                                        • Contains at least one uppercase letter
                                    </li>
                                    <li className={isPasswordValid(passwordData.newPassword) || passwordData.newPassword.length === 0 ? '' : 'text-red-500'}>
                                        • Contains at least one number
                                    </li>
                                    <li className={isPasswordValid(passwordData.newPassword) || passwordData.newPassword.length === 0 ? '' : 'text-red-500'}>
                                        • Contains at least one special character
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default UserProfile;