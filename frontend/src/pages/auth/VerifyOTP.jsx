import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mail, CheckCircle, AlertCircle, Clock, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { verifyOtp, resendOtp, clearError } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const VerifyOTP = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    loading,
    isVerifying,
    isResending,
    error,
    otpVerified,
    otpResendAttempts,
    otpResendSuccess,
    pendingEmail,
    pendingRole,
    otpCreatedAt
  } = useSelector((state) => state.auth);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [localMessage, setLocalMessage] = useState({ type: '', text: '' });

  const inputRefs = useRef([]);
  const MAX_RESEND_ATTEMPTS = 3;
  const OTP_EXPIRY_MS = 60 * 1000;

  useEffect(() => { setMounted(true); }, []);

  const calculateRemainingTime = useCallback(() => {
    if (!otpCreatedAt) return 60;
    const now = Date.now();
    const elapsed = now - otpCreatedAt;
    return Math.max(0, Math.floor((OTP_EXPIRY_MS - elapsed) / 1000));
  }, [otpCreatedAt]);

  const clearLocalMessage = useCallback(() => {
    setLocalMessage({ type: '', text: '' });
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (otpVerified) {
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
    }
  }, [otpVerified, navigate]);

  useEffect(() => {
    if (error) {
      const errorMessage = error.error || error.message || 'An unexpected error occurred.';
      setLocalMessage({ type: 'error', text: errorMessage });
    } else if (otpResendSuccess) {
      setLocalMessage({ type: 'success', text: otpResendSuccess });
    }
    const timer = setTimeout(clearLocalMessage, 5000);
    return () => clearTimeout(timer);
  }, [error, otpResendSuccess, clearLocalMessage]);

  useEffect(() => {
    if (!pendingEmail) return;
    if (!otpCreatedAt) {
      setTimer(0);
      setCanResend(true);
      return;
    }
    let interval;
    const updateTimer = () => {
      const remaining = calculateRemainingTime();
      setTimer(remaining);
      if (remaining <= 0) {
        setCanResend(true);
      } else {
        setCanResend(false);
      }
    };
    updateTimer();
    interval = setInterval(updateTimer, 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpCreatedAt, pendingEmail, calculateRemainingTime]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      pastedData.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    if (!pendingEmail || !pendingRole) {
      setLocalMessage({ type: 'error', text: 'Registration session expired. Please register again.' });
      return;
    }
    const otpValue = otp.join('');
    clearLocalMessage();
    if (otpValue.length === 6) {
      dispatch(verifyOtp({ email: pendingEmail, otp: otpValue, role: pendingRole }));
    } else {
      setLocalMessage({ type: 'error', text: 'Please enter a complete 6-digit OTP.' });
    }
  };

  const handleResendOTP = () => {
    if (!pendingEmail || !pendingRole) {
      setLocalMessage({ type: 'error', text: 'Registration session expired. Please register again.' });
      return;
    }
    if (otpResendAttempts >= MAX_RESEND_ATTEMPTS) {
      setLocalMessage({
        type: 'error',
        text: `Maximum resend limit (${MAX_RESEND_ATTEMPTS}) reached. Please wait or contact support.`
      });
      return;
    }
    setOtp(['', '', '', '', '', '']);
    clearLocalMessage();
    dispatch(resendOtp({ email: pendingEmail, role: pendingRole }));
    inputRefs.current[0]?.focus();
  };

  const isOTPComplete = otp.every(digit => digit !== '');

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
    .font-display { font-family: 'Syne', sans-serif; }
    .font-body    { font-family: 'Geist', 'Inter', sans-serif; }

    .form-card {
      background: white;
      border-radius: 1.75rem;
      box-shadow: 0 8px 48px rgba(30,27,75,0.10), 0 1px 0 rgba(255,255,255,0.8);
      border: 1px solid #f1f5f9;
    }

    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }
    
    .otp-input {
      background: #f8f9fc;
      border: 1px solid #e2e8f0;
      transition: all 0.2s ease;
    }
    .otp-input:focus {
      background: #ffffff;
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99,102,241,0.1);
      transform: translateY(-2px);
    }
    
    .primary-btn {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(79,70,229,0.30);
      transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
    }
    .primary-btn:hover:not(:disabled) {
      transform: scale(1.02);
      box-shadow: 0 6px 16px rgba(79,70,229,0.40);
    }
    .primary-btn:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }
    
    .section-label {
      font-family: 'Syne', sans-serif;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      font-size: 0.7rem;
    }
  `;

  if (!pendingEmail) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] font-sans flex items-center justify-center p-6">
        <style>{styles}</style>
        <div className={`w-full max-w-md opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
          <div className="form-card px-8 py-10 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Access Denied</h2>
            <p className="font-body text-gray-500 mb-8">No pending registration found. Please start the registration process first.</p>
            <button
              onClick={() => navigate('/register')}
              className="primary-btn w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide"
            >
              Go to Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans flex flex-col items-center justify-center p-6">
      <style>{styles}</style>
      
      <div className={`w-full max-w-lg opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          <span className="font-display font-bold text-2xl text-gray-900">MotoReach</span>
        </div>

        <div className="form-card px-8 py-10 md:px-12 md:py-12">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="section-label text-indigo-500 mb-2">Security Verification</p>
            <h1 className="font-display font-bold text-3xl text-gray-900 mb-3">Verify your email</h1>
            <p className="font-body text-gray-500 text-sm">
              We've sent a 6-digit verification code to
              <br />
              <span className="font-semibold text-gray-900 mt-1 block">{pendingEmail}</span>
            </p>
          </div>

          <div className={`mb-8 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            <div className="flex gap-2 sm:gap-3 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="otp-input w-12 h-14 sm:w-14 sm:h-16 text-center font-display text-2xl font-bold rounded-xl text-gray-900 outline-none"
                  disabled={isVerifying || isResending}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2 font-body text-sm text-gray-500 bg-[#f8f9fc] py-2 px-4 rounded-lg w-max mx-auto border border-gray-100">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>
                {canResend ? (
                  <span className="text-red-400 font-medium">OTP expired</span>
                ) : (
                  <span>Resend in <span className="font-semibold text-gray-900">{timer}s</span></span>
                )}
              </span>
              <span className="text-gray-300 mx-1">|</span>
              <span>Attempts left: <span className="font-semibold text-gray-900">{MAX_RESEND_ATTEMPTS - otpResendAttempts}</span></span>
            </div>
          </div>

          {localMessage.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-body animate-fade-up ${localMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                : 'bg-red-50 text-red-800 border border-red-100'
              }`}>
              {localMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              )}
              <p>{localMessage.text}</p>
            </div>
          )}

          {error && !localMessage.text && (
            <div className="mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-body bg-red-50 text-red-800 border border-red-100 animate-fade-up">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <p>Server Error: {error.message || error.error || 'Check network connection'}</p>
            </div>
          )}

          <div className={`opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            <button
              onClick={handleVerifyOTP}
              disabled={!isOTPComplete || isVerifying || isResending}
              className="primary-btn w-full py-3.5 rounded-xl font-display font-bold text-sm tracking-wide mb-6 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div className="text-center font-body text-sm">
              <span className="text-gray-500">Didn't receive the code? </span>
              {canResend && otpResendAttempts < MAX_RESEND_ATTEMPTS ? (
                <button
                  onClick={handleResendOTP}
                  disabled={isResending || isVerifying}
                  className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors hover:underline disabled:text-gray-400 disabled:no-underline disabled:hover:text-gray-400"
                >
                  {isResending ? 'Sending...' : 'Resend OTP'}
                </button>
              ) : (
                <span className={`font-semibold ${otpResendAttempts >= MAX_RESEND_ATTEMPTS ? 'text-red-500' : 'text-gray-400'}`}>
                  {otpResendAttempts >= MAX_RESEND_ATTEMPTS ? 'Limit reached' : 'Resend OTP'}
                </span>
              )}
            </div>
          </div>

        </div>

        <div className={`mt-8 text-center opacity-0 ${mounted ? 'animate-fade-up delay-300' : ''}`}>
          <button
            onClick={() => navigate('/login')}
            className="inline-flex items-center gap-2 font-body text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>

      </div>
    </div>
  );
};

export default VerifyOTP;