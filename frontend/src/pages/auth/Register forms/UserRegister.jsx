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

    // Only spread field-level validation errors (arrays), not top-level keys like code/message
    const fieldErrors = typeof error === 'object' && error
        ? Object.fromEntries(
            Object.entries(error).filter(([, v]) => Array.isArray(v))
          )
        : {};

    const allErrors = { ...clientErrors, ...(error?.details || {}), ...fieldErrors };

    const displayError = (() => {
        if (!error) return null;
        if (typeof error === 'string') return error;
        if (error.detail) return typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
        if (error.message) return error.message;
        if (error.error) return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
        if (error.non_field_errors) return Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : error.non_field_errors;
        return 'Registration failed. Please try again.';
    })();

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

export default UserRegister;
