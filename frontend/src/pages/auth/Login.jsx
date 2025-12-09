import InputField from "../../components/InputField";
import { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle, User } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux'; 
import { loginUser, clearError } from '../../redux/slices/authSlice'; 
import { getRolePath } from "../../routes/AuthRedirect";
import { useNavigate } from "react-router-dom";


const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const { loading: authLoading, error: authError, isAuthenticated, user } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const [localError, setLocalError] = useState(''); 
  const displayError = authError || localError;
  const isLoading = authLoading; 

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      const path = getRolePath(user.role)
      navigate(path, {replace : true})
    }
  }, [isAuthenticated. user, navigate, getRolePath]);

  useEffect(() => {
      if (authError) {
          dispatch(clearError());
      }
      return () => {
          if (authError) {
             dispatch(clearError());
          }
      };
  }, [dispatch]); 

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (localError) setLocalError(''); 
    if (authError) dispatch(clearError()); 
  };

  const handleSubmit = (e) => {
    e.preventDefault(); 

    setLocalError(''); 

    if (!formData.email) {
      setLocalError('Email is required.');
      return;
    }
    if (!formData.password) {
      setLocalError('Password is required.');
      return;
    }

    dispatch(loginUser(formData));
  };

  const handleGoogleLogin = () => {
    console.log('Google login initiated');
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">
                Sign in to continue to MotoReach
              </p>
            </div>

            {/* Error Message: Displays Redux Error or Local Validation Error */}
            {displayError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  {/* Check if error is an object (from RTK rejectWithValue) or string */}
                  {typeof displayError === 'object' && 'detail' in displayError ? displayError.detail : 
                   typeof displayError === 'object' && 'error' in displayError ? displayError.error : 
                   displayError}
                </p>
              </div>
            )}

            {/* Login Form (Wrapped in form tag for better submission handling) */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                icon={Mail}
              />

              <InputField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                icon={Lock}
                isPassword={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button 
                  type="button" // Use type="button" to prevent form submission
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit" // Set type="submit" to trigger form submission
                disabled={!isFormValid || isLoading}
                className={`w-full py-3.5 font-semibold rounded-lg shadow-md transition-all duration-300 transform ${
                  isFormValid && !isLoading
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:scale-[1.02]'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Signing in...
                  </span>
                ) : (
                  'Login'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              className="w-full py-3.5 px-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                {/* SVG path for Google icon remains unchanged */}
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Login with Google
            </button>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 hover:underline"
                >
                  Register
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;