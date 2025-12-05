import React, { useState, useRef, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react';


const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const inputRefs = useRef([]);

  // Timer countdown
  useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  // Handle OTP input change
  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    
    // Handle paste
    if (value.length > 1) {
      const pastedData = value.slice(0, 6).split('');
      pastedData.forEach((char, i) => {
        if (index + i < 6) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);
      
      // Focus on the last filled input or the next empty one
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single character input
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input if value entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current box is empty, move to previous box
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current box
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

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    setIsVerifying(true);
    setMessage({ type: '', text: '' });

    // Simulate API call
    setTimeout(() => {
      const otpValue = otp.join('');
      
      // Demo validation (replace with actual API call)
      if (otpValue === '123456') {
        setMessage({ 
          type: 'success', 
          text: 'OTP verified successfully! Redirecting...' 
        });
        // Redirect logic here
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Invalid OTP. Please try again.' 
        });
      }
      setIsVerifying(false);
    }, 1500);
  };

  // Handle resend OTP
  const handleResendOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setTimer(60);
    setCanResend(false);
    setMessage({ type: 'success', text: 'OTP sent successfully!' });
    inputRefs.current[0]?.focus();
    
    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 3000);
  };

  // Check if all OTP fields are filled
  const isOTPComplete = otp.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      
      <div className="flex-grow flex items-center justify-center px-4 py-12 mt-16">
        <div className="w-full max-w-md">
          {/* OTP Verification Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-blue-50 p-4 rounded-full">
                <Mail className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Verify OTP
              </h1>
              <p className="text-gray-600">
                Enter the 6-digit code sent to your email
              </p>
              <p className="text-sm text-blue-600 font-medium mt-2">
                example@email.com
              </p>
            </div>

            {/* OTP Input Boxes */}
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
                    disabled={isVerifying}
                  />
                ))}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>
                  {canResend ? (
                    'OTP expired'
                  ) : (
                    `Resend OTP in ${timer}s`
                  )}
                </span>
              </div>
            </div>

            {/* Message Display */}
            {message.text && (
              <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            {/* Verify Button */}
            <button
              onClick={handleVerifyOTP}
              disabled={!isOTPComplete || isVerifying}
              className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform ${
                isOTPComplete && !isVerifying
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

            {/* Resend OTP */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Didn't receive the code?{' '}
                {canResend ? (
                  <button 
                    onClick={handleResendOTP}
                    className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 hover:underline"
                  >
                    Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-400 font-medium">Resend OTP</span>
                )}
              </p>
            </div>

            {/* Back to Login */}
            <div className="mt-4 text-center">
              <button className="text-sm text-gray-600 hover:text-gray-800 transition-colors duration-300">
                ← Back to Login
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-blue-800 text-center">
              <span className="font-semibold">Demo:</span> Use OTP <span className="font-mono font-bold">123456</span> to verify
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default VerifyOTP;