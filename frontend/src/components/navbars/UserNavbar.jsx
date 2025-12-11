import  { useState, useRef, useEffect } from 'react';
import { Bell, Menu, X, Car, User, LogOut, Settings } from 'lucide-react';
import { useAuthStatus } from '../../hooks/useAuthStatus'; 
import { useNavigate } from 'react-router-dom';
import { useLogout } from '../../hooks/useLogout';

const UserNavbar = () => {
  const { isAuthenticated } = useAuthStatus(); // Use the authentication hook
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false); // New state for profile dropdown
  const [activeLink, setActiveLink] = useState('/');
  const profileMenuRef = useRef(null);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Subscription', path: '/subscription' },
    { name: 'Wallet', path: '/wallet' },
    { name: 'Services', path: '/services' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const navigate = useNavigate()

  const handleNavClick = (path) => {
    setActiveLink(path);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const isActive = (path) => activeLink === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setIsMobileMenuOpen(false); 
  };

  const {logout} = useLogout();



  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const ProfileMenu = ({ onNavClick }) => (
    <div className="relative" ref={profileMenuRef}>
      <button
        onClick={toggleProfileMenu}
        className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
        aria-expanded={isProfileMenuOpen}
        aria-label="User Profile Menu"
      >
        <User className="w-5 h-5" />
      </button>

      {isProfileMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 origin-top-right animate-fade-in-down">
          <div className="py-1">
            <button
              onClick={() => navigate('/user/profile')}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-200"
            >
              <Settings className="w-4 h-4 mr-3" />
              Profile Page
            </button>
            <button
              onClick={logout} 
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const AuthButtons = ({ onNavClick }) => (
    <>
      <button
        onClick={() => navigate('/login')}
        className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
      >
        Login
      </button>
      <button
        onClick={() => navigate('/register')}
        className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300"
      >
        Register
      </button>
    </>
  );

  const MobileAuthView = ({ onNavClick }) => (
    <div className="pt-3 border-t border-gray-200 space-y-3">
      {isAuthenticated ? (
        <>
          <button
            onClick={() => navigate('/user/profile')}
            className="w-full text-left flex items-center px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
          >
            <User className="w-4 h-4 mr-2" />
            Profile Page
          </button>
          <button
            onClick={logout}

            className="w-full text-left flex items-center px-5 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-md transition-all duration-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </>
      ) : (
        <AuthButtons onNavClick={onNavClick} />
      )}
    </div>
  );


  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => handleNavClick('/')}
            className="flex items-center space-x-2 group"
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-300">
              <Car className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
              MotoReach
            </span>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`text-sm font-medium transition-all duration-300 relative ${
                  isActive(link.path)
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full"></span>
                )}
              </button>
            ))}
          </div>

          {/* Desktop Auth/Profile & Notifications */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Conditional Rendering for Login/Register or Profile Menu */}
            {isAuthenticated ? (
              <ProfileMenu onNavClick={handleNavClick} />
            ) : (
              <AuthButtons onNavClick={handleNavClick} />
            )}
          </div>

          {/* Mobile Buttons (Bell & Menu) */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Notification Bell (Mobile) */}
            <button className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
              aria-label="Toggle Mobile Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg transition-all duration-300 ease-in-out">
          <div className="px-4 py-4 space-y-3">
            {/* Mobile Nav Links */}
            {navLinks.map((link) => (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={`w-full text-left px-4 py-2.5 text-base font-medium rounded-lg transition-all duration-300 ${
                  isActive(link.path)
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                {link.name}
              </button>
            ))}

            <MobileAuthView onNavClick={handleNavClick} />
          </div>
        </div>
      )}
    </nav>
  );
};

export default UserNavbar;