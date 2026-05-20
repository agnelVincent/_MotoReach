import React, { useState, useRef, useEffect } from 'react';
import { Wrench, Bell, User, Menu, X, LayoutDashboard, FileText, Wallet, Users, CreditCard, LogOut, ChevronDown, MessageSquare, ArrowRight, UserCheck } from 'lucide-react';
import { useLogout } from '../../hooks/useLogout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useSelector } from 'react-redux';

const WorkshopNavbar = () => {
  const user = useSelector((state) => state.auth.user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const mobileNotificationRef = useRef(null);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/workshop',          icon: LayoutDashboard },
    { name: 'Requests',  path: '/workshop/requests', icon: FileText        },
    { name: 'Wallet',    path: '/workshop/wallet',   icon: Wallet          },
    { name: 'Mechanics', path: '/workshop/team',     icon: Users           },
    { name: 'Payment',   path: '/workshop/payment',  icon: CreditCard      },
  ];

  const profileMenuItems = [
    { name: 'Profile', icon: User,    action: 'profile' },
    { name: 'Logout',  icon: LogOut,  action: 'logout'  },
  ];

  const { logout } = useLogout();

  const serviceFlowMatch = location.pathname.match(/^\/workshop\/service-flow\/(\d+)/);
  const currentServiceRequestId = serviceFlowMatch ? serviceFlowMatch[1] : null;

  const { notifications, hasUnread, connectionRequestCount, dismissNotification } = useNotifications(currentServiceRequestId);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  const totalBadgeCount = connectionRequestCount + notifications.length;

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const outDesktop = notificationRef.current && !notificationRef.current.contains(e.target);
      const outMobile  = mobileNotificationRef.current && !mobileNotificationRef.current.contains(e.target);
      if (outDesktop && outMobile) setIsNotificationOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavClick = (path) => { navigate(path); setIsMobileMenuOpen(false); };

  const handleProfileMenuClick = (action) => {
    setIsProfileOpen(false);
    if (action === 'profile') navigate('/workshop/profile');
    if (action === 'logout') logout();
  };

  const isActive = (path) => location.pathname === path;

  // ── Notification Dropdown ────────────────────────────────────────────────
  const NotificationDropdown = () => (
    <div className="absolute right-0 mt-3 bg-white rounded-2xl shadow-xl border border-[#f1f5f9] z-50 w-[calc(100vw-32px)] max-w-xs sm:w-80 overflow-hidden" style={{ fontFamily: 'Geist, Inter, sans-serif' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#f1f5f9] flex items-center justify-between">
        <p style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700 }} className="text-gray-900 text-sm">Notifications</p>
        {totalBadgeCount > 0 && (
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {totalBadgeCount} new
          </span>
        )}
      </div>

      {/* Section 1 — Connection Requests */}
      {connectionRequestCount > 0 && (
        <>
          <div className="px-4 pt-3 pb-1">
            <p className="text-[0.65rem] font-semibold text-violet-400 uppercase tracking-widest" style={{ fontFamily: 'Syne, sans-serif' }}>Connection Requests</p>
          </div>
          <button
            onClick={() => { navigate('/workshop/requests'); setIsNotificationOpen(false); }}
            className="w-full text-left px-4 py-3 hover:bg-violet-50 transition-colors flex items-start gap-3 group"
          >
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-violet-200 transition-colors">
              <UserCheck className="w-4 h-4 text-violet-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-violet-700 leading-snug">
                {connectionRequestCount} new connection request{connectionRequestCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Tap to review</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-violet-300 flex-shrink-0 mt-1 group-hover:text-violet-500 transition-colors" />
          </button>
          <div className="mx-4 h-px bg-[#f1f5f9]" />
        </>
      )}

      {/* Section 2 — Messages */}
      <div className="px-4 pt-3 pb-1">
        <p className="text-[0.65rem] font-semibold text-indigo-400 uppercase tracking-widest" style={{ fontFamily: 'Syne, sans-serif' }}>Messages</p>
      </div>
      <div className="max-h-56 overflow-y-auto pb-2">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <button
              key={`msg-${n.service_request_id}`}
              onClick={() => { dismissNotification(n.service_request_id); navigate(`/workshop/service-flow/${n.service_request_id}`); setIsNotificationOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors flex items-start gap-3 group"
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-indigo-200 transition-colors">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
                  {n.unread_count} new message{n.unread_count > 1 ? 's' : ''} from {n.counterpart_name || 'user'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Request #{n.service_request_id}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1 group-hover:text-indigo-400 transition-colors" />
            </button>
          ))
        ) : (
          <div className="px-4 py-5 text-center">
            <Bell className="w-7 h-7 text-gray-200 mx-auto mb-1.5" />
            <p className="text-sm text-gray-400">No new messages</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .mob-menu-enter { animation: slideDown 0.22s ease forwards; }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      <nav className="bg-white/95 backdrop-blur-md border-b border-[#f1f5f9] fixed top-0 left-0 right-0 z-50" style={{ boxShadow: '0 1px 12px rgba(30,27,75,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <button onClick={() => handleNavClick('/workshop')} className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-200" style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}>
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>MotoReach</span>
                <span className="text-[0.6rem] text-indigo-400 font-semibold tracking-widest uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>Workshop</span>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map(({ name, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => handleNavClick(path)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    isActive(path) ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {name}
                </button>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              {/* Bell */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setIsNotificationOpen((v) => !v)}
                  className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                >
                  <Bell style={{ width: '1.1rem', height: '1.1rem' }} />
                  {/* Count badge when connection requests > 0 */}
                  {connectionRequestCount > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white leading-none">{connectionRequestCount > 9 ? '9+' : connectionRequestCount}</span>
                    </span>
                  ) : hasUnread ? (
                    <span className="absolute -top-0.5 -right-0.5 flex">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white" />
                    </span>
                  ) : null}
                </button>
                {isNotificationOpen && <NotificationDropdown />}
              </div>

              {/* Profile */}
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)' }}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-[#f1f5f9] overflow-hidden z-50" style={{ animation: 'fadeInDown 0.18s ease forwards' }}>
                    <div className="px-4 py-3 border-b border-[#f1f5f9]">
                      <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.workshop_name || user?.full_name || 'Workshop'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    {profileMenuItems.map(({ name, icon: Icon, action }) => (
                      <button
                        key={action}
                        onClick={() => handleProfileMenuClick(action)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                          action === 'logout' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                        style={{ fontFamily: 'Syne, sans-serif' }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile: Bell + Hamburger */}
            <div className="md:hidden flex items-center gap-1">
              <div className="relative" ref={mobileNotificationRef}>
                <button
                  onClick={() => setIsNotificationOpen((v) => !v)}
                  className="relative w-9 h-9 flex items-center justify-center text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                >
                  <Bell style={{ width: '1.1rem', height: '1.1rem' }} />
                  {connectionRequestCount > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-indigo-600 border-2 border-white flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white leading-none">{connectionRequestCount > 9 ? '9+' : connectionRequestCount}</span>
                    </span>
                  ) : hasUnread ? (
                    <span className="absolute -top-0.5 -right-0.5 flex">
                      <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white" />
                    </span>
                  ) : null}
                </button>
                {isNotificationOpen && <NotificationDropdown />}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#f1f5f9] mob-menu-enter" style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)' }}>
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ name, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => handleNavClick(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                    isActive(path) ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-indigo-600'
                  }`}
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </button>
              ))}
              <div className="pt-3 border-t border-[#f1f5f9] space-y-2">
                <div className="px-4 py-2">
                  <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.workshop_name || user?.full_name || 'Workshop'}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                {profileMenuItems.map(({ name, icon: Icon, action }) => (
                  <button
                    key={action}
                    onClick={() => handleProfileMenuClick(action)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all ${
                      action === 'logout' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                    style={{ fontFamily: 'Syne, sans-serif' }}
                  >
                    <Icon className="w-4 h-4" />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default WorkshopNavbar;