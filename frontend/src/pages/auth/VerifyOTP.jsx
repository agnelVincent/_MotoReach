import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mail, CheckCircle, AlertCircle, Clock,  } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux'; 
import { verifyOtp, resendOtp, clearError } from '../../redux/slices/authSlice'; 
import { useNavigate } from 'react-router-dom'; 

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
  
  const [localMessage, setLocalMessage] = useState({ type: '', text: '' });
  
  const inputRefs = useRef([]);
  const MAX_RESEND_ATTEMPTS = 3;
  const OTP_EXPIRY_MS = 60 * 1000; // 1 minute in milliseconds

  // Calculate remaining time based on OTP creation timestamp
  const calculateRemainingTime = useCallback(() => {
    if (!otpCreatedAt) return 60;
    
    const now = Date.now();
    const elapsed = now - otpCreatedAt;
    const remaining = Math.max(0, Math.floor((OTP_EXPIRY_MS - elapsed) / 1000));
    
    return remaining;
  }, [otpCreatedAt]);

  const clearLocalMessage = useCallback(() => {
    setLocalMessage({ type: '', text: '' });
    dispatch(clearError());
  }, [dispatch]);
  
  useEffect(() => {
    if (otpVerified) {
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

  // Timer countdown effect - handles both initial load and resend
  useEffect(() => {
    if (!pendingEmail) return;
    
    // If no otpCreatedAt but pendingEmail exists, OTP might be expired
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
    
    // Update immediately to set correct initial value
    updateTimer();
    
    // Update every second
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
      dispatch(verifyOtp({ 
        email: pendingEmail, 
        otp: otpValue, 
        role: pendingRole 
      }));
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
    
    // Timer will be updated automatically when otpCreatedAt changes in Redux 

    dispatch(resendOtp({ 
        email: pendingEmail, 
        role: pendingRole 
    }));
    
    inputRefs.current[0]?.focus();
  };

  const isOTPComplete = otp.every(digit => digit !== '');
  
  if (!pendingEmail) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                <p className="text-gray-600">No pending registration found. Please start the registration process first.</p>
                <button 
                  onClick={() => navigate('/register')} 
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Go to Register
                </button>
            </div>
        </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12 mt-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            
            <div className="flex justify-center mb-6">
              <div className="bg-blue-50 p-4 rounded-full">
                <Mail className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Verify OTP
              </h1>
              <p className="text-gray-600">
                Enter the 6-digit code sent to your email
              </p>
              <p className="text-sm text-blue-600 font-medium mt-2">
                {pendingEmail} 
              </p>
            </div>

            <div className="mb-6">
              <div className="flex gap-2 md:gap-3 justify-center mb-4">
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
                    className="w-12 h-12 md:w-14 md:h-14 text-center text-xl md:text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300"
                    disabled={isVerifying || isResending}
                  />
                ))}
              </div>


              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {canResend ? (
                    'OTP expired'
                  ) : (
                    `Resend in ${timer}s`
                  )}
                </span>
                <span className="ml-4 text-gray-500">
                    | Attempts left: **{MAX_RESEND_ATTEMPTS - otpResendAttempts}**
                </span>
              </div>
            </div>

            {localMessage.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                localMessage.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {localMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{localMessage.text}</p>
              </div>
            )}
            
            {error && !localMessage.text && (
                <div className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-red-50 text-red-800 border border-red-200">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Server Error: {error.message || error.error || 'Check network connection'}</p>
                </div>
            )}


            <button
              onClick={handleVerifyOTP}
              disabled={!isOTPComplete || isVerifying || isResending}
              className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform ${
                isOTPComplete && !isVerifying && !isResending
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isVerifying ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>


            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Didn't receive the code?{' '}
                {canResend && otpResendAttempts < MAX_RESEND_ATTEMPTS ? (
                  <button 
                    onClick={handleResendOTP}
                    disabled={isResending || isVerifying}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 hover:underline disabled:text-gray-400 disabled:no-underline"
                  >
                    {isResending ? 'Sending...' : 'Resend OTP'}
                  </button>
                ) : (
                  <span className={`font-medium ${otpResendAttempts >= MAX_RESEND_ATTEMPTS ? 'text-red-500' : 'text-gray-400'}`}>
                      {otpResendAttempts >= MAX_RESEND_ATTEMPTS ? 'Resend limit reached' : 'Resend OTP'}
                  </span>
                )}
              </p>
            </div>

            <div className="mt-4 text-center">
              <button 
                onClick={() => navigate('/login')}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-300"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;