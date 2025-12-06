import InputField from "../../components/InputField";
import TextAreaField from "../../components/TextAreaField";
import { useState, useEffect } from 'react';
import { User, Building2, Wrench, Mail, Lock, Phone, MapPin, FileText, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser, clearError } from '../../redux/slices/authSlice'; 

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error, isRegistered, pendingEmail } = useSelector((state) => state.auth);

  const [selectedRole, setSelectedRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [workshopType, setWorkshopType] = useState('individual');
  const [clientErrors, setClientErrors] = useState({});

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


  useEffect(() => {
    if (isRegistered && pendingEmail) {
      navigate('/verify-otp');
    }

    dispatch(clearError());
  }, [isRegistered, pendingEmail, navigate, dispatch, selectedRole]);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    setFormError('');
    dispatch(clearError());
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

    setClientErrors({});
    let errors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+\-=[\]{}|;:'",.<>/?\\~`]{8,}$/;
    const phoneRegex = /^\d{10,15}$/; 


    if (!formData.fullName) errors.fullName = "Full Name is required.";
    if (!formData.email) errors.email = "Email Address is required.";
    if (!formData.password) errors.password = "Password is required.";
    if (!formData.confirmPassword) errors.confirmPassword = "Confirm Password is required.";

    if (formData.email && !emailRegex.test(formData.email)) {
        errors.email = "Invalid email address format.";
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
    }

    if (formData.password && !passwordStrengthRegex.test(formData.password)) {
        errors.password = "Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, and a number.";
    }

    if (selectedRole === 'workshop') {
        const workshopFields = {
            workshopName: "Workshop Name",
            workshopAddress: "Workshop Address",
            licenseNumber: "License Number",
            state: "State",
            city: "City",
            pinCode: "Pin Code",
            locality: "Locality",
            contactNumber: "Contact Number",
        };
        
        for (const field in workshopFields) {
            if (!formData[field]) {
                errors[field] = `${workshopFields[field]} is required for Workshop Admin registration.`;
            }
        }

        if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
             errors.pinCode = "Pin Code must be 6 digits.";
        }

    }

    if (selectedRole === 'mechanic' || selectedRole === 'workshop') {
        if (!formData.contactNumber) {
            errors.contactNumber = "Contact Number is required for this role.";
        } 

        else if (!phoneRegex.test(formData.contactNumber)) {
            errors.contactNumber = "Contact number must be between 10 to 15 digits.";
        }
    }

    if (Object.keys(errors).length > 0) {
            
        setClientErrors(errors);
        
        return false;
    }
    setClientErrors({});
    return true;
};

  const handleSubmit = (e) => {
    e.preventDefault(); 

    dispatch(clearError());
    if (!validateForm()) {
      return;
    }

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

  const allErrors = { 
    ...clientErrors, 
    ...(typeof error === 'object' && error !== null ? error : {}) 
};

const getError = (camelCaseKey, snakeCaseKey) => {
    if (allErrors[camelCaseKey]) {
        return allErrors[camelCaseKey];
    }
    if (Array.isArray(allErrors[snakeCaseKey]) && allErrors[snakeCaseKey].length > 0) {
        return allErrors[snakeCaseKey][0];
    }
    return undefined;
};

return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12 mt-16">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">
                Join MotoReach and get started today
              </p>
            </div>

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
                    disabled={loading} 
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{role.name}</span>
                  </button>
                );
              })}
            </div>
            
            {/* General Server Error Box (Only for Redux error. We handle client errors per-field now) */}
            {/* This handles general errors or non-field-specific server errors */}
            {error && (
              <div className="mb-6 p-4 rounded-lg flex flex-col gap-2 bg-red-50 text-red-800 border border-red-200">
                <div className="flex items-center gap-2 font-semibold">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    Registration Failed
                </div>
                {/* Display a single general error message if it exists */}
                {typeof error === 'string' && <p className="text-sm">{error}</p>}
                {/* Display the top-level 'error' field if the server sent it, or a generic message */}
                {typeof error === 'object' && !Object.keys(error).filter(key => key !== 'error').length && (
                    <p className="text-sm">{error?.error || 'An unknown server error occurred.'}</p>
                )}
              </div>
            )}


            <form className="space-y-5" onSubmit={(e) => handleSubmit(e)}>
              <InputField
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                icon={User}
                disabled={loading}
                // --- ERROR PROP ADDED/MAPPED ---
                error={getError('fullName', 'full_name')}
              />

              <InputField
                label="Email Address"
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                icon={Mail}
                disabled={loading}
                // --- ERROR PROP ADDED/MAPPED ---
                error={getError('email', 'email')}
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
                // --- ERROR PROP ADDED/MAPPED ---
                error={getError('password', 'password')}
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
                // --- ERROR PROP ADDED/MAPPED ---
                // Note: The backend error key for confirmPassword is often 'password' or 'confirm_password'.
                // Assuming client-side validation is sufficient here as it's not sent to the server.
                error={getError('confirmPassword', 'confirm_password')}
              />

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
                    // --- ERROR PROP ADDED/MAPPED ---
                    error={getError('workshopName', 'workshop_name')}
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
                    // --- ERROR PROP ADDED/MAPPED ---
                    error={getError('workshopAddress', 'address_line')}
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
                      // --- ERROR PROP ADDED/MAPPED ---
                      error={getError('state', 'state')}
                    />

                    <InputField
                      label="City"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      disabled={loading}
                      // --- ERROR PROP ADDED/MAPPED ---
                      error={getError('city', 'city')}
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
                      // --- ERROR PROP ADDED/MAPPED ---
                      error={getError('pinCode', 'pincode')}
                    />

                    <InputField
                      label="Locality"
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleInputChange}
                      placeholder="Enter locality"
                      disabled={loading}
                      // --- ERROR PROP ADDED/MAPPED ---
                      error={getError('locality', 'locality')}
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
                    // --- ERROR PROP ADDED/MAPPED ---
                    error={getError('licenseNumber', 'license_number')}
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
                    // --- ERROR PROP ADDED/MAPPED ---
                    error={getError('contactNumber', 'contact_number')}
                  />
                </>
              )}

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
                  // --- ERROR PROP ADDED/MAPPED ---
                  error={getError('contactNumber', 'contact_number')}
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