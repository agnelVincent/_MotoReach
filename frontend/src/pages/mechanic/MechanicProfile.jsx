import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  User, 
  Mail, 
  Phone, 
  Camera,
  Lock,
  Edit2,
  Save,
  X,
  CheckCircle,
  Activity,
  AlertTriangle,
  RotateCw, // For loading state
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
  
  // Select state from Redux store
  const { 
    profile, 
    loading, 
    error, 
    success 
  } = useSelector((state) => state.profile);

  // --- Local Component State ---
  const [isEditMode, setIsEditMode] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // State for editable profile fields (initializes from profile state or mocks)
  const [editedMechanicData, setEditedMechanicData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    profilePicture: null, // Use null for file or URL string
    // Add other fields as necessary, e.g., 'availability'
  });
  
  // State for file input
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // --- Effects and Initial Load ---
  
  // 1. Initial Profile Fetch on component mount
  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);
  
  // 2. Initialize/Update local state when Redux profile state changes
  useEffect(() => {
    if (profile) {
      setEditedMechanicData({
        fullName: profile.full_name || '',
        email: profile.email || '', // Email is typically read-only
        phoneNumber: profile.phone_number || '',
        profilePicture: profile.profile_picture || null, // Assuming this is the URL
      });
    }
  }, [profile]);

  // 3. Handle Redux success/error messages
  useEffect(() => {
    if (success) {
      showNotification(success, 'success');
    }
    if (error) {
      // Assuming error is an object from the slice
      // For simplicity, we just display the main error string if it's not a password form error
      if (typeof error === 'string' && !error.includes('password')) { 
        showNotification(error, 'error');
      } else if (error && error.detail) {
        showNotification(error.detail, 'error');
      }
    }
    
    // Clear the status in Redux after displaying the message
    const timer = setTimeout(() => {
      dispatch(clearStatus());
    }, 50); // Small delay to ensure state is set before clearing
    
    return () => clearTimeout(timer);
  }, [success, error, dispatch]);
  
  // --- Handlers ---

  const handleEditToggle = () => {
    if (isEditMode) {
      // Revert changes on Cancel: re-initialize from the Redux profile data
      if (profile) {
        setEditedMechanicData({
          fullName: profile.full_name || '',
          email: profile.email || '',
          phoneNumber: profile.phone_number || '',
          profilePicture: profile.profile_picture || null,
        });
        setProfilePictureFile(null); // Clear any pending file
      }
    }
    setIsEditMode(!isEditMode);
  };

  const showNotification = (message, type) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage('');
    } else {
      setErrorMessage(message);
      setSuccessMessage('');
    }

    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 3000);
  };

  const handleProfileInputChange = (field, value) => {
    setEditedMechanicData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleProfilePictureFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      // Create a temporary URL for preview
      setEditedMechanicData(prev => ({
        ...prev,
        profilePicture: URL.createObjectURL(file) 
      }));
    }
  };

  const handleSaveProfile = () => {
    if (!profile) return;
    
    // Create FormData for multipart/form-data request
    const formData = new FormData();
    
    // Check if fields were actually changed before appending
    if (editedMechanicData.fullName !== profile.full_name) {
      formData.append('full_name', editedMechanicData.fullName);
    }
    if (editedMechanicData.phoneNumber !== profile.phone_number) {
      formData.append('phone_number', editedMechanicData.phoneNumber);
    }

    // Handle profile picture: if a new file is selected, append it
    if (profilePictureFile) {
        formData.append('profile_picture', profilePictureFile);
    } 
    // If the URL is blanked out and no file is present, assume deletion if supported by API
    // Note: The API must be set up to handle picture removal if a blank string is sent.
    // For this example, we assume we only send a new file or don't send anything.
    // else if (editedMechanicData.profilePicture === '' && profile.profile_picture) {
    //     formData.append('profile_picture', ''); // Send empty string to remove
    // }

    // Dispatch the updateProfile thunk
    dispatch(updateProfile(formData))
      .unwrap()
      .then(() => {
        // Only turn off edit mode if update was successful
        setIsEditMode(false);
        setProfilePictureFile(null); // Clear file input
      })
      .catch((err) => {
        // Error handling is managed by the useEffect listening to the `error` state
        console.error('Profile update failed:', err);
      });
  };

  const handleAvailabilityToggle = () => {
    if (!profile) return;
    const newStatus = !profile.availability;
    
    dispatch(updateAvailability(newStatus))
      .unwrap()
      .catch((err) => {
        // Error already handled by useEffect, but logging here is good practice
        console.error('Availability update failed:', err);
      });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordUpdate = () => {
    if (!isPasswordFormValid) return;
    
    const { currentPassword, newPassword } = passwordData;

    dispatch(changePassword({ 
      old_password: currentPassword, 
      new_password: newPassword 
    }))
      .unwrap()
      .then(() => {
        // Clear password fields on success
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      })
      .catch((err) => {
         // Check for specific error message structure from changePassword rejectWithValue
         // This is a common pattern for displaying form-specific errors.
         if (err && (err.old_password || err.new_password || err.non_field_errors)) {
            // Display specific error for password section, using global notification for simplicity
            const errorMsg = err.old_password?.[0] || err.new_password?.[0] || err.non_field_errors?.[0] || "Password update failed.";
            showNotification(errorMsg, 'error');
         }
      });
  };

  // --- Derived State and Validation ---

  const passwordMatchError = 
    passwordData.confirmPassword && 
    passwordData.newPassword !== passwordData.confirmPassword 
      ? 'Passwords do not match' 
      : '';

  const isPasswordFormValid = 
    passwordData.currentPassword && 
    passwordData.newPassword && 
    passwordData.confirmPassword &&
    !passwordMatchError;

  const currentAvailability = profile?.availability ?? false; // Use Redux state

  // Show a loading indicator if profile data is still being fetched
  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <RotateCw className="w-10 h-10 text-orange-600 animate-spin" />
        <span className="ml-3 text-lg font-medium text-gray-700">Loading Profile...</span>
      </div>
    );
  }
  
  // Show error if initial fetch failed
  if (!profile && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Error Loading Profile</h2>
        <p className="text-gray-600 mt-2 text-center">{error.detail || String(error)}</p>
        <button
          onClick={() => dispatch(getProfile())}
          className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  // --- Render Component (use profile and editedMechanicData) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      
      {/* Success/Error Message Notification */}
      {(successMessage || errorMessage) && (
        <div className="fixed top-20 right-4 z-50 animate-fadeIn">
          <div className={`px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 ${
            successMessage ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            {successMessage ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            <span className="font-medium">{successMessage || errorMessage}</span>
          </div>
        </div>
      )}

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Mechanic Profile
            </h1>
            <p className="text-gray-600">
              Manage your account settings and availability
            </p>
          </div>

          {/* Section 1: Mechanic Basic Info (Editable) */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-orange-600 to-red-600 opacity-10"></div>
            
            <div className="relative">
              {/* Section Header with Edit Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
                    <p className="text-sm text-gray-600">Your personal details</p>
                  </div>
                </div>

                {!isEditMode ? (
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-gray-400"
                    disabled={loading}
                  >
                    {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                    <span className="hidden sm:inline">{loading ? 'Loading...' : 'Edit'}</span>
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-gray-400"
                      disabled={loading}
                    >
                      {loading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="hidden sm:inline">{loading ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleEditToggle}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg"
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Picture */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-xl overflow-hidden">
                    {(editedMechanicData.profilePicture || profile?.profile_picture) ? (
                      <img 
                        src={editedMechanicData.profilePicture || profile?.profile_picture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                  </div>
                  
                  {isEditMode && (
                    <label htmlFor="profilePictureInput" className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                      <Camera className="w-8 h-8 text-white" />
                      <input 
                          id="profilePictureInput" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleProfilePictureFileChange}
                      />
                    </label>
                  )}
                </div>

                {/* Optional: Display file name in edit mode */}
                {isEditMode && profilePictureFile && (
                    <p className="text-sm text-gray-600 mt-2 self-center md:self-auto">File selected: **{profilePictureFile.name}**</p>
                )}
              </div>

              {/* Basic Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  isEditMode={false} // Always read-only
                  type="email"
                  onChange={() => {}}
                />

                <div className="md:col-span-2">
                  <ProfileInput
                    label="Phone Number"
                    value={isEditMode ? editedMechanicData.phoneNumber : profile?.phone_number || ''}
                    Icon={Phone}
                    isEditMode={isEditMode}
                    type="tel"
                    onChange={(e) => handleProfileInputChange('phoneNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Availability Status */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Availability Status</h2>
                <p className="text-sm text-gray-600">Set your current work availability</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  currentAvailability 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-red-500 to-rose-600'
                }`}>
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    {currentAvailability ? 'Available for Work' : 'Currently Busy'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {currentAvailability
                      ? 'You are visible to customers and can receive new requests' 
                      : 'Your profile is hidden from new service requests'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={handleAvailabilityToggle}
                disabled={loading}
                className={`relative inline-flex h-12 w-24 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentAvailability 
                    ? 'bg-green-500 focus:ring-green-500' 
                    : 'bg-red-500 focus:ring-red-500'
                }`}
              >
                <span className="sr-only">Toggle availability</span>
                {loading ? (
                    <RotateCw className="h-6 w-6 text-white absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-spin" />
                ) : (
                    <span
                      className={`inline-block h-10 w-10 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                        currentAvailability ? 'translate-x-12' : 'translate-x-1'
                      }`}
                    />
                )}
              </button>
            </div>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                currentAvailability 
                  ? 'bg-green-50 border-green-500' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${currentAvailability ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className={`font-semibold ${currentAvailability ? 'text-green-700' : 'text-gray-600'}`}>
                    Available
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Accepting new service requests
                </p>
              </div>

              <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                !currentAvailability 
                  ? 'bg-red-50 border-red-500' 
                  : 'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${!currentAvailability ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                  <span className={`font-semibold ${!currentAvailability ? 'text-red-700' : 'text-gray-600'}`}>
                    Busy
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1 ml-6">
                  Not accepting new requests
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Change Password */}
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
                className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform flex items-center justify-center gap-2 ${
                  isPasswordFormValid && !loading
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white hover:from-orange-700 hover:to-red-700 hover:shadow-lg hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : null}
                Update Password
              </button>

              {/* Password Requirements */}
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

export default MechanicProfile;