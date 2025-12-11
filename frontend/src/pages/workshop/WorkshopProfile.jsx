import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  User, 
  Mail, 
  Phone, 
  Camera,
  Building2,
  FileText,
  MapPin,
  Lock,
  Edit2,
  Save,
  X,
  CheckCircle,
  Shield,
  AlertTriangle,
  RotateCw, 
} from 'lucide-react';

// Import Redux actions and clearStatus action creator
import { 
  getProfile, 
  updateProfile, 
  changePassword, 
  clearStatus 
} from '../../redux/slices/ProfileSlice'; 

import ProfileInput from '../../components/ProfileInput'; 

const WorkshopProfile = () => {
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
  
  // State for editable profile fields (initializes from profile state)
  const [editedOwnerData, setEditedOwnerData] = useState({
    fullName: '',
    contactNumber: '',
    profilePicture: null, 
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
      setEditedOwnerData({
        fullName: profile.full_name || '',
        contactNumber: profile.phone_number || '',
        profilePicture: profile.profile_picture || null, // URL from backend
      });
    }
  }, [profile]);

  // 3. Handle Redux success/error messages
  useEffect(() => {
    if (success) {
      showNotification(success, 'success');
    }
    if (error) {
      // Check if error is an object (common for validation errors) or a string
      const errorMsg = typeof error === 'string' ? error : error.detail || 'An unknown error occurred.';
      showNotification(errorMsg, 'error');
    }
    
    // Clear the status in Redux after displaying the message
    const timer = setTimeout(() => {
      dispatch(clearStatus());
    }, 50); 
    
    return () => clearTimeout(timer);
  }, [success, error, dispatch]);
  
  // --- Handlers ---

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

  const handleEditToggle = () => {
    if (isEditMode) {
      // Revert changes on Cancel: re-initialize from the Redux profile data
      if (profile) {
        setEditedOwnerData({
          fullName: profile.full_name || '',
          contactNumber: profile.phone_number || '',
          profilePicture: profile.profile_picture || null,
        });
        setProfilePictureFile(null); // Clear any pending file
      }
    }
    setIsEditMode(!isEditMode);
  };

  const handleOwnerInputChange = (field, value) => {
    setEditedOwnerData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleProfilePictureFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      // Create a temporary URL for preview
      setEditedOwnerData(prev => ({
        ...prev,
        profilePicture: URL.createObjectURL(file) 
      }));
    }
  };

  const handleSaveProfile = () => {
    if (loading || !profile) return;
    
    const formData = new FormData();
    
    // Append fields only if they have changed or are required
    if (editedOwnerData.fullName !== profile.full_name) {
      formData.append('full_name', editedOwnerData.fullName);
    }
    if (editedOwnerData.contactNumber !== profile.phone_number) {
      formData.append('phone_number', editedOwnerData.contactNumber);
    }

    // Handle profile picture file upload
    if (profilePictureFile) {
        formData.append('profile_picture', profilePictureFile);
    } 
    // If you also want to update the workshop's editable fields:
    // This requires knowing the exact names of the fields in your backend profile model.
    // Example (assuming workshop fields are nested or flattened on the profile model):
    // if (editedWorkshopData.workshopName !== profile.workshop_name) {
    //     formData.append('workshop_name', editedWorkshopData.workshopName);
    // }
  
    dispatch(updateProfile(formData))
      .unwrap()
      .then(() => {
        // Only turn off edit mode if update was successful
        setIsEditMode(false);
        setProfilePictureFile(null); // Clear file input
      })
      .catch((err) => {
        console.error('Profile update failed:', err);
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
        // Custom password error handling
        const errorMsg = err.old_password?.[0] || err.new_password?.[0] || err.non_field_errors?.[0] || "Password update failed.";
        if (errorMsg) {
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


  // --- Component structure relies heavily on data from 'profile' ---
  // Map backend profile fields to UI display (assuming structure is flat)
  const displayData = {
    fullName: profile?.full_name || 'N/A',
    email: profile?.email || 'N/A',
    contactNumber: profile?.phone_number || 'N/A',
    profilePicture: profile?.profile_picture || null,
    
    // Workshop Details (Assuming these keys exist directly on the 'profile' object)
    // NOTE: Replace the fallback string 'N/A' with your desired default value.
    workshopName: profile?.workshop_name || 'N/A',
    licenseNumber: profile?.license_number || 'N/A',
    addressLine: profile?.address_line || 'N/A',
    locality: profile?.locality || 'N/A',
    city: profile?.city || 'N/A',
    state: profile?.state || 'N/A',
    pincode: profile?.pincode || 'N/A',
    workshopType: profile?.workshop_type || 'N/A',
    verificationStatus: profile?.verification_status || 'Unverified',
  };
  
  // Show a loading indicator if profile data is still being fetched
  if (loading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <RotateCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <span className="ml-3 text-lg font-medium text-gray-700">Loading Workshop Profile...</span>
      </div>
    );
  }

  // Show error if initial fetch failed
  if (!profile && error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-800">Error Loading Profile</h2>
        <p className="text-gray-600 mt-2 text-center">{typeof error === 'string' ? error : error.detail || 'Failed to load profile data.'}</p>
        <button
          onClick={() => dispatch(getProfile())}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      
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
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Workshop Profile
            </h1>
            <p className="text-gray-600">
              Manage your owner account settings and view workshop details
            </p>
          </div>

          {/* Section 1: Owner Details (Editable) */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10"></div>

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Owner Details</h2>
                    <p className="text-sm text-gray-600">Manage your personal information</p>
                  </div>
                </div>

                {!isEditMode ? (
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:bg-gray-400"
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

              {/* Profile Picture Section */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl overflow-hidden">
                    {(editedOwnerData.profilePicture || displayData.profilePicture) ? (
                      <img 
                        src={editedOwnerData.profilePicture || displayData.profilePicture} 
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

                {isEditMode && profilePictureFile && (
                  <p className="text-sm text-gray-600 mt-2 self-center md:self-auto">File selected: **{profilePictureFile.name}**</p>
                )}
              </div>

              {/* Owner Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileInput
                  label="Full Name"
                  value={isEditMode ? editedOwnerData.fullName : displayData.fullName}
                  Icon={User}
                  isEditMode={isEditMode}
                  type="text"
                  onChange={(e) => handleOwnerInputChange('fullName', e.target.value)}
                />

                <ProfileInput
                  label="Contact Number"
                  value={isEditMode ? editedOwnerData.contactNumber : displayData.contactNumber}
                  Icon={Phone}
                  isEditMode={isEditMode}
                  type="tel"
                  onChange={(e) => handleOwnerInputChange('contactNumber', e.target.value)}
                />

                <div className="md:col-span-2">
                  <ProfileInput
                    label="Email (Read-only)"
                    value={displayData.email}
                    Icon={Mail}
                    isEditMode={false}
                    type="email"
                    onChange={() => {}}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Workshop Details (Read-only) */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Workshop Details</h2>
                <p className="text-sm text-gray-600">Your registered workshop information</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProfileInput
                label="Workshop Name"
                value={displayData.workshopName}
                Icon={Building2}
                isEditMode={false}
              />

              <ProfileInput
                label="License Number"
                value={displayData.licenseNumber}
                Icon={FileText}
                isEditMode={false}
              />

              <div className="md:col-span-2">
                <ProfileInput
                  label="Address Line"
                  value={displayData.addressLine}
                  Icon={MapPin}
                  isEditMode={false}
                />
              </div>

              <ProfileInput
                label="Locality"
                value={displayData.locality}
                Icon={MapPin}
                isEditMode={false}
              />

              <ProfileInput
                label="City"
                value={displayData.city}
                Icon={MapPin}
                isEditMode={false}
              />

              <ProfileInput
                label="State"
                value={displayData.state}
                Icon={MapPin}
                isEditMode={false}
              />

              <ProfileInput
                label="Pincode"
                value={displayData.pincode}
                Icon={MapPin}
                isEditMode={false}
              />

              <ProfileInput
                label="Workshop Type"
                value={displayData.workshopType}
                Icon={Building2}
                isEditMode={false}
              />

              <ProfileInput
                label="Verification Status"
                value={displayData.verificationStatus}
                Icon={Shield}
                isEditMode={false}
              />
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
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? <RotateCw className="w-5 h-5 animate-spin" /> : null}
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

export default WorkshopProfile;