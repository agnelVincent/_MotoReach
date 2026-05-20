import { useState, useRef, useEffect } from 'react';
import { Bell, Menu, X, Wrench, User, LogOut, Settings, MessageSquare, ArrowRight } from 'lucide-react';
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

  useEffect(() => {
    const handler = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target))
        setIsProfileMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const outsideDesktop = notificationRef.current && !notificationRef.current.contains(e.target);
      const outsideMobile  = mobileNotificationRef.current && !mobileNotificationRef.current.contains(e.target);
      if (outsideDesktop && outsideMobile) setIsNotificationOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // ── Notification Dropdown ────────────────────────────────────────────────
  const NotificationDropdown = () => (
    <div className="absolute right-0 mt-3 bg-white rounded-2xl shadow-xl border border-[#f1f5f9] z-50 w-[calc(100vw-32px)] max-w-xs sm:w-80 overflow-hidden" style={{ fontFamily: 'Geist, Inter, sans-serif' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#f1f5f9] flex items-center justify-between">
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }} className="text-gray-900 text-sm">Notifications</p>
        {notifications.length > 0 && (
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {notifications.length} new
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[0.65rem] font-semibold text-indigo-400 uppercase tracking-widest" style={{ fontFamily: 'Syne, sans-serif' }}>Messages</p>
      </div>
      <div className="max-h-64 overflow-y-auto pb-2">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <button
              key={n.service_request_id}
              onClick={() => { navigate(`/user/service-flow/${n.service_request_id}`); setIsNotificationOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 active:bg-indigo-100 transition-colors flex items-start gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-indigo-200 transition-colors">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                  {n.unread_count} new message{n.unread_count > 1 ? 's' : ''} from {n.counterpart_name || 'workshop'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Request #{n.service_request_id}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1 group-hover:text-indigo-400 transition-colors" />
            </button>
          ))
        ) : (
          <div className="px-4 py-6 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No new messages</p>
          </div>
        )}
      </div>
    </div>
  );

  // ── Profile Dropdown ─────────────────────────────────────────────────────
  const ProfileMenu = () => (
    <div className="relative" ref={profileMenuRef}>
      <button
        onClick={toggleProfileMenu}
        className="relative w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center hover:shadow-lg hover:shadow-indigo-200 transition-all duration-200"
        aria-expanded={isProfileMenuOpen}
        aria-label="User Profile Menu"
      >
        <User className="w-4 h-4 text-white" />
      </button>

      {isProfileMenuOpen && (
        <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-[#f1f5f9] overflow-hidden z-50" style={{ animation: 'fadeInDown 0.18s ease forwards' }}>
          <div className="py-1">
            <button
              onClick={() => { navigate('/user/profile'); setIsProfileMenuOpen(false); }}
              className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors gap-3"
            >
              <Settings className="w-4 h-4 flex-shrink-0" />
              Profile Page
            </button>
            <div className="mx-3 my-1 h-px bg-[#f1f5f9]" />
            <button
              onClick={logout}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors gap-3"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Auth Buttons ─────────────────────────────────────────────────────────
  const AuthButtons = () => (
    <>
      <button
        onClick={() => navigate('/login')}
        className="px-4 py-2 text-sm font-semibold text-gray-600 border border-[#e2e8f0] rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 whitespace-nowrap"
        style={{ fontFamily: 'Syne, sans-serif' }}
      >
        Sign In
      </button>
      <button
        onClick={() => navigate('/register')}
        className="px-4 py-2 text-sm font-semibold text-white rounded-xl whitespace-nowrap transition-all duration-200 hover:opacity-90 hover:-translate-y-px hover:shadow-lg active:scale-[0.98]"
        style={{ fontFamily: 'Syne, sans-serif', background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}
      >
        Register
      </button>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');

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

      <nav className="bg-white/95 backdrop-blur-md border-b border-[#f1f5f9] sticky top-0 z-50" style={{ boxShadow: '0 1px 12px rgba(30,27,75,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <button onClick={() => handleNavClick('/')} className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-200" style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}>
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200" style={{ fontFamily: 'Syne, sans-serif' }}>
                MotoReach
              </span>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap ${
                    isActive(link.path)
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {link.name}
                  {isActive(link.path) && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-indigo-600" />
                  )}
                </button>
              ))}
            </div>

            {/* Desktop Right: Bell + Profile/Auth */}
            <div className="hidden md:flex items-center gap-2">
              {isAuthenticated && (
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen((v) => !v)}
                    className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 flex">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white" />
                      </span>
                    )}
                  </button>
                  {isNotificationOpen && <NotificationDropdown />}
                </div>
              )}
              {isAuthenticated ? <ProfileMenu /> : <AuthButtons />}
            </div>

            {/* Mobile Right: Bell + Hamburger */}
            <div className="md:hidden flex items-center gap-1">
              {isAuthenticated && (
                <div className="relative" ref={mobileNotificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen((v) => !v)}
                    className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4.5 h-4.5" style={{ width: '1.1rem', height: '1.1rem' }} />
                    {hasUnread && (
                      <span className="absolute -top-0.5 -right-0.5 flex">
                        <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white" />
                      </span>
                    )}
                  </button>
                  {isNotificationOpen && <NotificationDropdown />}
                </div>
              )}
              <button
                onClick={toggleMobileMenu}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                aria-label="Toggle Mobile Menu"
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#f1f5f9] mobile-menu-enter" style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)' }}>
            <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-64px)] overflow-y-auto">
              {navLinks.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`w-full text-left px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  {link.name}
                </button>
              ))}

              <div className="pt-3 mt-2 border-t border-[#f1f5f9] space-y-2">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => handleNavClick('/user/profile')}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 border border-[#f1f5f9] rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      <User className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                      Profile Page
                    </button>
                    <button
                      onClick={logout}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold text-white rounded-2xl transition-all"
                      style={{ fontFamily: 'Syne, sans-serif', background: 'linear-gradient(135deg,#ef4444 0%,#dc2626 100%)' }}
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleNavClick('/login')}
                      className="w-full py-3 text-sm font-semibold text-gray-700 border border-[#e2e8f0] rounded-2xl hover:bg-gray-50 transition-all"
                      style={{ fontFamily: 'Syne, sans-serif' }}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleNavClick('/register')}
                      className="w-full py-3 text-sm font-semibold text-white rounded-2xl transition-all"
                      style={{ fontFamily: 'Syne, sans-serif', background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}
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