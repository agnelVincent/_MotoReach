import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, Phone, Building2, MapPin, FileText, AlertCircle } from 'lucide-react';
import InputField from '../../../components/InputField';
import TextAreaField from '../../../components/TextAreaField';
import LocationPicker from '../../../components/LocationPicker';
import { registerWorkshop, clearError } from '../../../redux/slices/authSlice';

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*()_+\-=[\]{}|;:'",.<>/?\\~`]{8,}$/;
        const phoneRegex = /^\d{10}$/;

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

        // Workshop specific validation
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

        if (!formData.latitude || !formData.longitude) {
            errors.location = "Please select the workshop location on the map.";
        }

        for (const field in workshopFields) {
            if (!formData[field]) {
                errors[field] = `${workshopFields[field]} is required.`;
            }
        }

        if (formData.pinCode && !/^\d{6}$/.test(formData.pinCode)) {
            errors.pinCode = "Pin Code must be 6 digits.";
        }

        if (formData.contactNumber && !phoneRegex.test(formData.contactNumber)) {
            errors.contactNumber = "Contact number must be exactly 10 digits.";
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

    const allErrors = {
        ...clientErrors,
        ...(typeof error === 'object' && error !== null ? error : {})
    };

    const getError = (camelCaseKey, snakeCaseKey) => {
        if (allErrors[camelCaseKey]) return allErrors[camelCaseKey];
        if (Array.isArray(allErrors[snakeCaseKey]) && allErrors[snakeCaseKey].length > 0) {
            return allErrors[snakeCaseKey][0];
        }
        return undefined;
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            {typeof error === 'string' && (
                <div className="mb-6 p-4 rounded-lg flex flex-col gap-2 bg-red-50 text-red-800 border border-red-200">
                    <div className="flex items-center gap-2 font-semibold">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        Registration Failed
                    </div>
                    <p className="text-sm">{error}</p>
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
                className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform ${loading
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
    );
};

export default WorkshopRegister;
