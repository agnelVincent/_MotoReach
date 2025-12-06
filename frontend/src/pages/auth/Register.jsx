import InputField from "../../components/InputField";
import TextAreaField from "../../components/TextAreaField";
import { useState, useEffect } from 'react';
import { User, Building2, Wrench, Mail, Lock, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { data, useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../../redux/slices/authSlice'; // Adjust the path as necessary

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Redux State ---
  const { loading, error, isRegistered, pendingEmail } = useSelector((state) => state.auth);

  const [selectedRole, setSelectedRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [workshopType, setWorkshopType] = useState('individual');
  const [formError, setFormError] = useState(''); // For client-side validation errors

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    workshopName: '',
    workshopAddress: '',
    state: '',
    city: '',
    pinCode: '',
    locality: '',
    licenseNumber: '',
    contactNumber: ''
  });

  const roles = [
    { id: 'user', name: 'User', icon: User },
    { id: 'workshop', name: 'Workshop', icon: Building2 },
    { id: 'mechanic', name: 'Mechanic', icon: Wrench }
  ];

  // Effect to handle navigation after successful registration
  useEffect(() => {
    if (isRegistered && pendingEmail) {
      // Navigate to the verification page
      navigate('/verify-otp');
    }
    
    // Clear the Redux error when the component mounts or role/form changes
    dispatch(clearError());
    setFormError('');
  }, [isRegistered, pendingEmail, navigate, dispatch, selectedRole]);

  // Handle role change (clear form data for irrelevant fields)
  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setFormError('');
    dispatch(clearError());
    // Optionally clear specific workshop/mechanic fields if switching away
    // E.g., if switching to 'user', clear all workshop fields
    if (roleId === 'user') {
      setFormData(prev => ({
        ...prev,
        workshopName: '',
        workshopAddress: '',
        state: '',
        city: '',
        pinCode: '',
        locality: '',
        licenseNumber: '',
        contactNumber: ''
      }));
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    // 1. Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setFormError("Passwords do not match.");
      return false;
    }
    
    // 2. Simple check for required fields (can be expanded)
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        setFormError("Please fill in all common required fields.");
        return false;
    }

    // 3. Workshop specific validation
    if (selectedRole === 'workshop') {
        if (!formData.workshopName || !formData.workshopAddress || !formData.contactNumber) {
            setFormError("Please fill in all required workshop details.");
            return false;
        }
    }
    
    setFormError('');
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission if wrapped in <form>

    dispatch(clearError()); // Clear previous server errors
    if (!validateForm()) {
      return;
    }
    
    // Prepare the data to send to the API
    const dataToSend = {
      full_name: formData.fullName,
      email: formData.email,
      password: formData.password,
      confirm_password : formData.confirmPassword,
      role: selectedRole == 'workshop' ? 'workshop_admin' : selectedRole, 
      workshop_name: formData.workshopName,
      address_line: formData.workshopAddress,
      state: formData.state,
      city: formData.city,
      pincode: formData.pinCode,
      locality: formData.locality,
      license_number: formData.licenseNumber,
      contact_number: formData.contactNumber,
      workshop_type: workshopType, 
      };
      if(selectedRole !== 'workshop'){
        delete dataToSend.address_line
        delete dataToSend.city
        delete dataToSend.license_number
        delete dataToSend.pincode
        delete dataToSend.state
        delete dataToSend.workshop_type
        delete dataToSend.workshop_name
        delete dataToSend.locality
      }
    dispatch(registerUser(dataToSend));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12 mt-16">
        <div className="w-full max-w-2xl">
          {/* Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">
                Join MotoReach and get started today
              </p>
            </div>

            {/* Role Selection */}
            <div className="flex gap-3 mb-8 p-2 bg-gray-100 rounded-xl">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      selectedRole === role.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                    disabled={loading} // Disable role change during loading
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{role.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Error Message Display */}
            {(formError || error) && (
              <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-red-50 text-red-800 border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {formError || (error?.message || error?.error || 'An unknown error occurred.')}
                </p>
              </div>
            )}


            {/* Registration Form (Using a form tag is generally better for accessibility) */}
            <form className="space-y-5" onSubmit={(e) => handleSubmit(e)}>
              {/* Common Fields for All Roles */}
              <InputField
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                icon={User}
                disabled={loading}
              />

              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                icon={Mail}
                disabled={loading}
              />

              <InputField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                icon={Lock}
                isPassword={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
                disabled={loading}
              />

              <InputField
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                icon={Lock}
                isPassword={true}
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              />

              {/* Workshop Specific Fields */}
              {selectedRole === 'workshop' && (
                <>
                  <InputField
                    label="Workshop Name"
                    type="text"
                    name="workshopName"
                    value={formData.workshopName}
                    onChange={handleInputChange}
                    placeholder="Enter workshop name"
                    icon={Building2}
                    disabled={loading}
                  />

                  <TextAreaField
                    label="Workshop Address"
                    name="workshopAddress"
                    value={formData.workshopAddress}
                    onChange={handleInputChange}
                    placeholder="Enter complete address"
                    icon={MapPin}
                    rows={3}
                    disabled={loading}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="State"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                      disabled={loading}
                    />

                    <InputField
                      label="City"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      disabled={loading}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Pin Code"
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      placeholder="Enter pin code"
                      disabled={loading}
                    />

                    <InputField
                      label="Locality"
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleInputChange}
                      placeholder="Enter locality"
                      disabled={loading}
                    />
                  </div>

                  <InputField
                    label="License Number"
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="Enter license number"
                    icon={FileText}
                    disabled={loading}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Workshop Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="workshopType"
                          value="individual"
                          checked={workshopType === 'individual'}
                          onChange={(e) => setWorkshopType(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-gray-700">Individual</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="workshopType"
                          value="team"
                          checked={workshopType === 'team'}
                          onChange={(e) => setWorkshopType(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                          disabled={loading}
                        />
                        <span className="text-gray-700">Team</span>
                      </label>
                    </div>
                  </div>

                  <InputField
                    label="Contact Number"
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="Enter contact number"
                    icon={Phone}
                    disabled={loading}
                  />
                </>
              )}

              {/* Mechanic Specific Fields */}
              {selectedRole === 'mechanic' && (
                <InputField
                  label="Contact Number"
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="Enter contact number"
                  icon={Phone}
                  disabled={loading}
                />
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform ${
                    loading 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02]'
                }`}
              >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Registering...
                    </span>
                ) : (
                    'Create Account'
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button 
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;