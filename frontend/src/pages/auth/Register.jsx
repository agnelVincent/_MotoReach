import { useState, useEffect } from 'react';
import { User, Building2, Wrench } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearError } from '../../redux/slices/authSlice';
import UserRegister from './Register forms/UserRegister';
import MechanicRegister from './Register forms/MechanicRegister';
import WorkshopRegister from './Register forms/WorkshopRegister';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isRegistered, pendingEmail } = useSelector((state) => state.auth);

  const [selectedRole, setSelectedRole] = useState('user');

  const roles = [
    { id: 'user', name: 'User', icon: User },
    { id: 'workshop', name: 'Workshop', icon: Building2 },
    { id: 'mechanic', name: 'Mechanic', icon: Wrench }
  ];

  useEffect(() => {
    if (isRegistered && pendingEmail) {
      navigate('/verify-otp');
    }

    dispatch(clearError());
  }, [isRegistered, pendingEmail, navigate, dispatch, selectedRole]);

  const handleRoleChange = (roleId) => {
    setSelectedRole(roleId);
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12 ">
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">
                Join MotoReach and get started today
              </p>
            </div>

            <div className="flex gap-3 mb-8 p-2 bg-gray-100 rounded-xl">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleChange(role.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${selectedRole === role.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-transparent text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{role.name}</span>
                  </button>
                );
              })}
            </div>

            {selectedRole === 'user' && <UserRegister />}
            {selectedRole === 'mechanic' && <MechanicRegister />}
            {selectedRole === 'workshop' && <WorkshopRegister />}

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;