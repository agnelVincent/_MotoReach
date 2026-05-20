import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, X, Car, User, LogOut, Settings } from 'lucide-react';
import { useAuthStatus } from '../../hooks/useAuthStatus';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogout } from '../../hooks/useLogout';
import { useNotifications } from '../../hooks/useNotifications';

const UserNavbar = () => {
  const { isAuthenticated } = useAuthStatus();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const mobileNotificationRef = useRef(null);

  const navLinks = [
    { name: 'Home',       path: '/user' },
    { name: 'Wallet',     path: '/user/wallet' },
    { name: 'Services',   path: '/user/services' },
    { name: 'Payments',   path: '/user/payments' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((v) => !v);
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen((v) => !v);
    setIsMobileMenuOpen(false);
  };

  const { logout } = useLogout();

  const serviceFlowMatch = location.pathname.match(/^\/user\/service-flow\/(\d+)/);
  const currentServiceRequestId = serviceFlowMatch ? serviceFlowMatch[1] : null;

  const { notifications, hasUnread } = useNotifications(currentServiceRequestId);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close notification panel on outside click
  useEffect(() => {
    const handler = (e) => {
      const outsideDesktop = notificationRef.current && !notificationRef.current.contains(e.target);
      const outsideMobile  = mobileNotificationRef.current && !mobileNotificationRef.current.contains(e.target);
      if (outsideDesktop && outsideMobile) setIsNotificationOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // ── Notification dropdown (shared between desktop & mobile) ──────────────
  const NotificationDropdown = () => (
    <div
      className="
        absolute right-0 mt-2 bg-white rounded-xl shadow-xl
        ring-1 ring-black ring-opacity-5 py-2 z-50
        w-[calc(100vw-32px)] max-w-xs
        sm:w-72 sm:max-w-none
      "
    >
      <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Messages
      </p>
      <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <button
              key={n.service_request_id}
              onClick={() => {
                navigate(`/user/service-flow/${n.service_request_id}`);
                setIsNotificationOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors flex flex-col gap-0.5"
            >
              <span className="text-sm font-medium text-gray-800 leading-snug">
                {n.unread_count} new message{n.unread_count > 1 ? 's' : ''} from{' '}
                {n.counterpart_name || 'workshop'}
              </span>
              <span className="text-xs text-gray-400">
                Request #{n.service_request_id}
              </span>
            </button>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">No new messages</p>
        )}
      </div>
    </div>
  );

  // ── Profile dropdown ──────────────────────────────────────────────────────
  const ProfileMenu = () => (
    <div className="relative" ref={profileMenuRef}>
      <button
        onClick={toggleProfileMenu}
        className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 min-w-[40px] min-h-[40px] flex items-center justify-center"
        aria-expanded={isProfileMenuOpen}
        aria-label="User Profile Menu"
      >
        <User className="w-5 h-5" />
      </button>

      {isProfileMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50 animate-fade-in-down">
          <div className="py-1">
            <button
              onClick={() => { navigate('/user/profile'); setIsProfileMenuOpen(false); }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 flex-shrink-0" />
              Profile Page
            </button>
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Auth buttons (desktop) ────────────────────────────────────────────────
  const AuthButtons = () => (
    <>
      <button
        onClick={() => navigate('/login')}
        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 whitespace-nowrap"
      >
        Login
      </button>
      <button
        onClick={() => navigate('/register')}
        className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300 whitespace-nowrap"
      >
        Register
      </button>
    </>
  );

  return (
    <>
      {/* ── Inject mobile-menu slide animation ─────────────────────────── */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mobile-menu-enter { animation: slideDown 0.22s ease forwards; }

        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in-down { animation: fadeInDown 0.18s ease forwards; }
      `}</style>

      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* ── Logo ── */}
            <button
              onClick={() => handleNavClick('/')}
              className="flex items-center space-x-2 group flex-shrink-0"
            >
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg group-hover:from-blue-700 group-hover:to-blue-800 transition-all duration-300">
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors duration-300">
                MotoReach
              </span>
            </button>

            {/* ── Desktop Nav Links ── */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`text-sm font-medium transition-all duration-300 relative whitespace-nowrap ${
                    isActive(link.path)
                      ? 'text-blue-600'
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* ── Desktop Right side: Bell + Profile/Auth ── */}
            <div className="hidden md:flex items-center space-x-3">
              {isAuthenticated && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen((v) => !v)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  {isNotificationOpen && <NotificationDropdown />}
                </div>
              )}

              {isAuthenticated ? <ProfileMenu /> : <AuthButtons />}
            </div>

            {/* ── Mobile Right side: Bell + Hamburger ── */}
            <div className="md:hidden flex items-center space-x-1">
              {isAuthenticated && (
                <div className="relative" ref={mobileNotificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen((v) => !v)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300 min-w-[40px] min-h-[40px] flex items-center justify-center"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>
                  {isNotificationOpen && <NotificationDropdown />}
                </div>
              )}

              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300 min-w-[40px] min-h-[40px] flex items-center justify-center"
                aria-label="Toggle Mobile Menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu Panel ── */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 shadow-lg mobile-menu-enter">
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-64px)] overflow-y-auto">

              {/* Nav Links */}
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`w-full text-left px-4 py-3 text-base font-medium rounded-xl transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600 active:bg-gray-100'
                  }`}
                >
                  {link.name}
                </button>
              ))}

              {/* Divider */}
              <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => handleNavClick('/user/profile')}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100 transition-all"
                    >
                      <User className="w-4 h-4 flex-shrink-0" />
                      Profile Page
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 active:bg-red-700 shadow-sm transition-all"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleNavClick('/login')}
                      className="w-full py-3 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => handleNavClick('/register')}
                      className="w-full py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 shadow-md transition-all"
                    >
                      Register
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default UserNavbar;