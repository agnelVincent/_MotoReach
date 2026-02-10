import InputField from "../../components/InputField";
import { useState, useEffect } from 'react';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux'; 
import { loginUser, clearError, googleLogin } from '../../redux/slices/authSlice'; 
import { getRolePath } from "../../routes/AuthRedirect";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";


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
      
      return () => {
             dispatch(clearError());

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

            {displayError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">
                  {typeof displayError === 'object' && 'detail' in displayError ? displayError.detail : 
                   typeof displayError === 'object' && 'error' in displayError ? displayError.error : 
                   displayError}
                </p>
              </div>
            )}

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

              <div className="flex justify-end">
                <button 
                  type="button" 
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit" 
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <GoogleLogin
                onSuccess={(credentialResponse) => {
                    dispatch(googleLogin(credentialResponse.credential));
                }}
                onError={() => {
                    console.log("Google Login Failed");
                }}
            />

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => navigate('/register')}
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