import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Phone, Building2, MapPin, FileText, AlertCircle } from 'lucide-react';
import InputField from '../../../components/InputField';
import TextAreaField from '../../../components/TextAreaField';
import LocationPicker from '../../../components/LocationPicker';
import { registerWorkshop, clearError } from '../../../redux/slices/authSlice';
import { validateFullName, validateEmail, validatePassword, validatePasswordMatch, validatePhone, validatePincode } from '../../../utils/validationRules';
import { formatBackendError } from '../../../utils/errorHandler';

const WorkshopRegister = () => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [clientErrors, setClientErrors] = useState({});
    const [workshopType, setWorkshopType] = useState('individual');

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
        contactNumber: '',
        latitude: null,
        longitude: null
    });

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

        const nameError = validateFullName(formData.fullName);
        if (nameError) errors.fullName = nameError;

        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;

        const passwordError = validatePassword(formData.password);
        if (passwordError) errors.password = passwordError;

        const matchError = validatePasswordMatch(formData.password, formData.confirmPassword);
        if (matchError) errors.confirmPassword = matchError;

        const phoneError = validatePhone(formData.contactNumber);
        if (phoneError) errors.contactNumber = phoneError;

        const pincodeError = validatePincode(formData.pinCode);
        if (pincodeError) errors.pinCode = pincodeError;

        const workshopFields = {
            workshopName: "Workshop Name",
            workshopAddress: "Workshop Address",
            licenseNumber: "License Number",
            state: "State",
            city: "City",
            locality: "Locality",
        };

        if (!formData.latitude || !formData.longitude) {
            errors.location = "Please select the workshop location on the map.";
        }

        for (const field in workshopFields) {
            if (!formData[field]) {
                errors[field] = `${workshopFields[field]} is required.`;
            }
        }
        
        if (Object.keys(errors).length > 0) {
            setClientErrors(errors);
            return false;
        }
        return true;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(clearError());
        if (!validateForm()) return;

        const dataToSend = {
            full_name: formData.fullName,
            email: formData.email,
            password: formData.password,
            confirm_password: formData.confirmPassword,
            workshop_name: formData.workshopName,
            address_line: formData.workshopAddress,
            state: formData.state,
            city: formData.city,
            pincode: formData.pinCode,
            locality: formData.locality,
            license_number: formData.licenseNumber,
            contact_number: formData.contactNumber,
            workshop_type: workshopType,
            latitude: formData.latitude,
            longitude: formData.longitude,
        };
        dispatch(registerWorkshop(dataToSend));
    };

    // Only spread field-level validation errors (arrays), not top-level keys like code/message
    const fieldErrors = typeof error === 'object' && error
        ? Object.fromEntries(
            Object.entries(error).filter(([, v]) => Array.isArray(v))
          )
        : {};

    const allErrors = { ...clientErrors, ...(error?.details || {}), ...fieldErrors };

    const displayError = formatBackendError(error, 'Registration failed. Please try again.');

    const getError = (camelCaseKey, snakeCaseKey) => {
        if (allErrors[camelCaseKey]) return allErrors[camelCaseKey];
        if (Array.isArray(allErrors[snakeCaseKey]) && allErrors[snakeCaseKey].length > 0) {
            return allErrors[snakeCaseKey][0];
        }
        return undefined;
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            {displayError && (
                <div className="mb-6 p-4 rounded-2xl flex flex-col gap-2 bg-red-50 border border-red-100">
                    <div className="flex items-center gap-2 font-semibold text-red-700" style={{fontFamily:'Syne,sans-serif'}}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Registration Failed
                    </div>
                    <p className="text-sm text-red-600">{displayError}</p>
                </div>
            )}

            <InputField
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                icon={User}
                disabled={loading}
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
                error={getError('confirmPassword', 'confirm_password')}
            />

            <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Workshop Details</h3>

                <InputField
                    label="Workshop Name"
                    type="text"
                    name="workshopName"
                    value={formData.workshopName}
                    onChange={handleInputChange}
                    placeholder="Enter workshop name"
                    icon={Building2}
                    disabled={loading}
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
                    error={getError('workshopAddress', 'address_line')}
                />

                <div className="col-span-full mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Workshop Location <span className="text-red-500">*</span>
                    </label>
                    <LocationPicker
                        initialLat={formData.latitude}
                        initialLng={formData.longitude}
                        onLocationSelect={(lat, lng) => {
                            setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                            setClientErrors(prev => ({ ...prev, location: null }));
                        }}
                    />
                    {clientErrors.location && (
                        <p className="mt-1 text-sm text-red-600">{clientErrors.location}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                        label="State"
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        placeholder="Enter state"
                        disabled={loading}
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
                        error={getError('city', 'city')}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                    <InputField
                        label="Pin Code"
                        type="text"
                        name="pinCode"
                        value={formData.pinCode}
                        onChange={handleInputChange}
                        placeholder="Enter pin code"
                        disabled={loading}
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
                        error={getError('locality', 'locality')}
                    />
                </div>

                <div className="mt-5">
                    <InputField
                        label="License Number"
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        placeholder="Enter license number"
                        icon={FileText}
                        disabled={loading}
                        error={getError('licenseNumber', 'license_number')}
                    />
                </div>

                <div className="mt-5">
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

                <div className="mt-5">
                    <InputField
                        label="Contact Number"
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        placeholder="Enter contact number"
                        icon={Phone}
                        disabled={loading}
                        error={getError('contactNumber', 'contact_number')}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                style={loading ? {} : {
                    background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)',
                    boxShadow: '0 4px 16px rgba(79,70,229,0.35)'
                }}
                className={`w-full py-3.5 rounded-2xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                    loading ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'hover:opacity-90 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]'
                }`}
            >
                {loading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        <span>Registering…</span>
                    </>
                ) : 'Create Account'}
            </button>
        </form>
    );
};

export default WorkshopRegister;
