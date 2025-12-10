import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  forgotPasswordSendOtp, 
  forgotPasswordVerifyOtp, 
  forgotPasswordReset, 
  clearForgot 
} from '../../redux/slices/forgotPasswordSlice'; 
import { useNavigate } from 'react-router-dom';

import InputField from '../../components/InputField'; 
import { 
  Mail, 
  Lock, 
  CheckCircle, 
  ArrowLeft, 
  Clock, 
  RefreshCw, 
  Shield,
  AlertCircle
} from 'lucide-react';


const getErrorMessage = (errorPayload) => {
  if (errorPayload && errorPayload.error) {
    if (typeof errorPayload.error === 'string') {
      return errorPayload.error;
    }
    if (Array.isArray(errorPayload.error.non_field_errors)) {
      return errorPayload.error.non_field_errors.join(', ');
    }
    if (typeof errorPayload.error === 'object') {
        const firstKey = Object.keys(errorPayload.error)[0];
        if (firstKey) {
            return `${firstKey}: ${Array.isArray(errorPayload.error[firstKey]) ? errorPayload.error[firstKey].join(', ') : errorPayload.error[firstKey]}`;
        }
    }
  }
  
  return errorPayload?.message || 'An unknown error occurred.';
};


export const ForgotPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  
  const isLoading = useSelector((state) => state.forgotPassword.loading);
  const reduxError = useSelector((state) => state.forgotPassword.error);
  const otpSent = useSelector((state) => state.forgotPassword.otpSent);
  
  const [localError, setLocalError] = useState('');

  const isValidEmail = email.includes('@') && email.includes('.');
  const currentError = localError || (reduxError ? getErrorMessage(reduxError) : null);
  
  useEffect(() => {
    dispatch(clearForgot());
  }, [dispatch]);


  const handleSubmit = useCallback(async () => {
    if (!isValidEmail) {
      setLocalError('Please enter a valid email address');
      return;
    }

    setLocalError('');
    dispatch(forgotPasswordSendOtp(email));
    
  }, [dispatch, email, isValidEmail]);

  useEffect(() => {
    if (otpSent) {
      // Logic for moving to the next step is now handled by the parent component
      // based on the Redux state change.
    }
  }, [otpSent]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <a 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Login
        </a>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mb-4">
              <Mail className="text-blue-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Forgot Password
            </h1>
            <p className="text-gray-600">
              Enter your registered email to receive a verification code.
            </p>
          </div>

          <div className="px-8 pb-10">
            <div className="relative mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md transition-all duration-300 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50">
                <InputField
                  type="email"
                  label="Email Address"
                  placeholder="Enter your registered email"
                  icon={Mail}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLocalError('');
                  }}
                  error={currentError}
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!isValidEmail || isLoading}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                !isValidEmail || isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending OTP...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Remembered your password?{' '}
                <a href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
                  Log In
                </a>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Need help?{' '}
          <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
};


export const OTPVerificationPage = ({ onBack }) => {
  const dispatch = useDispatch();
  
  const email = useSelector((state) => state.forgotPassword.email);
  const isLoading = useSelector((state) => state.forgotPassword.loading);
  const reduxError = useSelector((state) => state.forgotPassword.error);
  const otpVerified = useSelector((state) => state.forgotPassword.otpVerified);
  
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');
  
  const [timer, setTimer] = useState(60); 
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [resendLoading, setResendLoading] = useState(false);
  
  const currentError = localError || (reduxError ? getErrorMessage(reduxError) : null);
  
  useEffect(() => {
    let interval = null;
    if (isTimerActive && timer > 0 && !otpVerified) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer, otpVerified]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) {
      setLocalError('Please enter a valid 6-digit OTP');
      return;
    }

    if (timer === 0) {
      setLocalError('OTP has expired. Please request a new one.');
      return;
    }

    setLocalError('');
    dispatch(forgotPasswordVerifyOtp({ email, otp }));

  }, [dispatch, email, otp, timer]);
  
  useEffect(() => {
      if (reduxError && reduxError.error && reduxError.error.toLowerCase().includes('invalid otp')) {
          setOtp('');
      }
  }, [reduxError]);

  const handleResend = useCallback(async () => {
    if (isTimerActive) return;
    setResendLoading(true);
    setLocalError('');
    
    const resultAction = await dispatch(forgotPasswordSendOtp(email));

    setResendLoading(false);
    
    if (forgotPasswordSendOtp.fulfilled.match(resultAction)) {

      setTimer(60);
      setIsTimerActive(true);
    } else {
       // Error is already in Redux state, which will be shown via currentError
    }
  }, [dispatch, isTimerActive, email]);


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack}
          disabled={isLoading}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 mb-6 transition-colors disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
          <div className="px-8 pt-10 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl mb-4">
              <Shield className="text-purple-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Verify OTP
            </h1>
            <p className="text-gray-600 mb-2">
              Enter the 6-digit code sent to your email.
            </p>
            <p className="text-sm text-blue-600 font-medium">
              {email}
            </p>
          </div>

          <div className="px-8 pb-10">
            <div className="relative mb-4">
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-md transition-all duration-300 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-purple-500 focus-within:ring-opacity-50">
                <InputField
                  type="text"
                  label="OTP"
                  placeholder="Enter 6-digit code"
                  icon={Lock}
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setOtp(value);
                    setLocalError('');
                  }}
                  error={currentError}
                />
              </div>
            </div>

            <div className={`flex items-center justify-center gap-2 mb-6 ${
              timer <= 10 && timer > 0 ? 'text-red-600' : timer === 0 ? 'text-red-700 font-bold' : 'text-gray-600'
            }`}>
              <Clock size={18} />
              <span className="text-sm font-semibold">
                {timer === 0 ? 'OTP Expired' : `Code expires in ${formatTime(timer)}`}
              </span>
            </div>

            <button
              onClick={handleVerify}
              disabled={otp.length !== 6 || isLoading || timer === 0}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 mb-4 ${
                otp.length !== 6 || isLoading || timer === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              <button
                onClick={handleResend}
                disabled={isTimerActive || resendLoading}
                className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${
                  isTimerActive || resendLoading
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                <RefreshCw size={16} />
                {resendLoading ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Note:</span> Please check your inbox and spam folder.
          </p>
        </div>
      </div>
    </div>
  );
};


export const CreateNewPasswordPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const email = useSelector((state) => state.forgotPassword.email);
  const isLoading = useSelector((state) => state.forgotPassword.loading);
  const reduxError = useSelector((state) => state.forgotPassword.error);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const currentError = reduxError ? getErrorMessage(reduxError) : null;


  const checks = useMemo(() => ({
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    match: newPassword && confirmPassword && newPassword === confirmPassword
  }), [newPassword, confirmPassword]);

  const isValidPassword = Object.values(checks).every(Boolean);

  const handleSubmit = useCallback(async () => {
    if (!isValidPassword) return; 
    
    const resultAction = dispatch(forgotPasswordReset({
      email,
      new_password: newPassword,
    }));
    
    if (forgotPasswordReset.fulfilled.match(resultAction)) {
        setIsSuccess(true)
        navigate('/login')
    }
    

  }, [dispatch, email, newPassword, isValidPassword]);

  useEffect(() => {
    if (isSuccess) {
        setTimeout(() => {
            dispatch(clearForgot());
            navigate('/login');
        }, 3000); 
    }
  }, [isSuccess, dispatch, navigate]);


  const CheckItem = ({ label, checked }) => (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle size={16} className="text-green-600" />
      ) : (
        <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
      )}
      <span className={`text-sm ${checked ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500"></div>
          
          {!isSuccess ? (
            <>
              <div className="px-8 pt-10 pb-6 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl mb-4">
                  <Lock className="text-green-600" size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Create New Password
                </h1>
                <p className="text-gray-600">
                  Choose a strong password for your account.
                </p>
              </div>

              <div className="px-8 pb-10">
                {currentError && (
                    <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-600 flex items-start gap-2">
                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                            {currentError}
                        </p>
                    </div>
                )}
                <div className="relative mb-5">
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-6 shadow-md transition-all duration-300 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-green-500 focus-within:ring-opacity-50">
                    <InputField
                      type="password"
                      label="New Password"
                      icon={Lock}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      isPassword={true}
                      showPassword={showNewPassword}
                      onTogglePassword={() => setShowNewPassword(prev => !prev)}
                    />
                  </div>
                </div>

                <div className="relative mb-5">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md transition-all duration-300 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50">
                    <InputField
                      type="password"
                      label="Confirm Password"
                      icon={Lock}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      isPassword={true}
                      showPassword={showConfirmPassword}
                      onTogglePassword={() => setShowConfirmPassword(prev => !prev)}
                      error={confirmPassword && !checks.match ? "Passwords don't match" : ""}
                    />
                  </div>
                </div>

                {newPassword && (
                  <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-3">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                      <CheckItem label="At least 8 characters" checked={checks.length} />
                      <CheckItem label="One uppercase letter" checked={checks.uppercase} />
                      <CheckItem label="One number" checked={checks.number} />
                      <CheckItem label="Passwords match" checked={checks.match} />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!isValidPassword || isLoading}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                    !isValidPassword || isLoading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                  }`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Resetting Password...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="px-8 py-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-pulse">
                <CheckCircle className="text-green-600" size={48} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Password Updated Successfully!
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Your password has been reset successfully. Redirecting to login...
              </p>
              <a 
                href="/login"
                className="inline-block px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Log In Now
              </a>
            </div>
          )}
        </div>

        {!isSuccess && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Having trouble?{' '}
            <a href="/contact" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact Support
            </a>
          </p>
        )}
      </div>
    </div>
  );
};


const PasswordResetFlow = () => {
  const email = useSelector((state) => state.forgotPassword.email);
  const otpSent = useSelector((state) => state.forgotPassword.otpSent);
  const otpVerified = useSelector((state) => state.forgotPassword.otpVerified);
  const dispatch = useDispatch();

  let step = 1;
  if (otpVerified) {
    step = 3;
  } else if (otpSent && email) {
    step = 2;
  } 
  
  const handleStep2Back = () => {
     dispatch(clearForgot());
  };


  return (
    <>
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-full shadow-lg px-6 py-2 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-green-600' : 'bg-gray-300'}`}></div>
        </div>
      </div>

      {step === 1 && <ForgotPasswordPage />}
      {step === 2 && (
        <OTPVerificationPage 
          onBack={handleStep2Back}
        />
      )}
      {step === 3 && (
        <CreateNewPasswordPage />
      )}
    </>
  );
};

export default PasswordResetFlow;