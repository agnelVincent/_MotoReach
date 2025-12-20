import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';
import InputField from '../../../components/InputField';
import { registerUser, clearError } from '../../../redux/slices/authSlice';

const UserRegister = () => {
    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [clientErrors, setClientErrors] = useState({});

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
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
        };
        dispatch(registerUser(dataToSend));
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

export default UserRegister;
