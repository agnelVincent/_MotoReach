
import React, { useState } from 'react';
import ProfileInput from '../../components/ProfileInput'; 
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    Calendar,
    Edit2,
    Camera,
    Lock,
    Save,
    X,
    CheckCircle
} from 'lucide-react';


const UserProfile = () => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Mock user data
    const [userData, setUserData] = useState({
        fullName: 'Rajesh Kumar',
        email: 'rajesh.kumar@example.com',
        phone: '+91 98765 43210',
        location: 'Bangalore, Karnataka',
        memberSince: 'January 2023',
        profilePicture: null
    });

    const [editedData, setEditedData] = useState({ ...userData });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleEditToggle = () => {
        if (isEditMode) {
            setEditedData({ ...userData });
        }
        setIsEditMode(!isEditMode);
    };

    const handleSaveProfile = () => {
        setUserData({ ...editedData });
        setIsEditMode(false);
        showSuccessNotification('Profile updated successfully!');
    };

    const handleInputChange = (field, value) => {
        setEditedData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordUpdate = () => {
        console.log('Password update:', passwordData);
        
        setPasswordData({
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        showSuccessNotification('Password updated successfully!');
    };

    const showSuccessNotification = (message) => {
        setSuccessMessage(message);
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword;

    const isPasswordFormValid = 
        passwordData.currentPassword.length > 0 && 
        passwordData.newPassword.length >= 8 && 
        passwordData.confirmPassword.length > 0 &&
        passwordsMatch;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
            
            {successMessage && (
                <div className="fixed top-20 right-4 z-50 animate-fadeIn">
                    <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
                        <CheckCircle className="w-6 h-6" />
                        <span className="font-medium">{successMessage}</span>
                    </div>
                </div>
            )}

            <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                            My Profile
                        </h1>
                        <p className="text-gray-600">
                            Manage your account settings and preferences
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10"></div>

                        <div className="relative">
                            <div className="absolute top-0 right-0">
                                {!isEditMode ? (
                                    <button
                                        onClick={handleEditToggle}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        <span className="hidden sm:inline">Edit Profile</span>
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveProfile}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span className="hidden sm:inline">Save</span>
                                        </button>
                                        <button
                                            onClick={handleEditToggle}
                                            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
                                        >
                                            <X className="w-4 h-4" />
                                            <span className="hidden sm:inline">Cancel</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
                                        {userData.profilePicture ? (
                                            <img 
                                                src={userData.profilePicture} 
                                                alt="Profile" 
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-16 h-16 text-white" />
                                        )}
                                    </div>
                                    
                                    <button className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Camera className="w-8 h-8 text-white" />
                                    </button>
                                </div>

                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                                        {userData.fullName}
                                    </h2>
                                    <p className="text-gray-600 mb-4">{userData.email}</p>
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>Member since {userData.memberSince}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                <ProfileInput
                                    label="Full Name"
                                    value={isEditMode ? editedData.fullName : userData.fullName}
                                    Icon={User}
                                    isEditMode={isEditMode}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                />

                                <ProfileInput
                                    label="Email Address"
                                    value={isEditMode ? editedData.email : userData.email}
                                    Icon={Mail}
                                    isEditMode={isEditMode}
                                    type="email"
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                />

                                <ProfileInput
                                    label="Phone Number"
                                    value={isEditMode ? editedData.phone : userData.phone}
                                    Icon={Phone}
                                    isEditMode={isEditMode}
                                    type="tel"
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                />

                                <ProfileInput
                                    label="Location"
                                    value={isEditMode ? editedData.location : userData.location}
                                    Icon={MapPin}
                                    isEditMode={isEditMode}
                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                />

                            </div>
                        </div>
                    </div>

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
                                    passwordData.confirmPassword && !passwordsMatch
                                        ? 'Passwords do not match' 
                                        : null
                                }
                            />

                            <button
                                onClick={handlePasswordUpdate}
                                disabled={!isPasswordFormValid}
                                className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform ${
                                    isPasswordFormValid
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:scale-[1.02]'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                Update Password
                            </button>

                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-800 font-medium mb-2">Password requirements:</p>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• At least 8 characters long</li>
                                    <li>• Contains at least one uppercase letter</li>
                                    <li>• Contains at least one number</li>
                                    <li>• Contains at least one special character</li>
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