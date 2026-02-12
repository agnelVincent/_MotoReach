import React, { useState, useRef, useEffect } from 'react';
import { Car, Bell, User, Menu, X, LayoutDashboard, FileText, Wallet, Users, CreditCard, LogOut, ChevronDown } from 'lucide-react';
import { useLogout } from '../../hooks/useLogout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

const WorkshopNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/workshop', icon: LayoutDashboard },
    { name: 'Requests', path: '/workshop/requests', icon: FileText },
    { name: 'Wallet', path: '/workshop/wallet', icon: Wallet },
    { name: 'Mechanics', path: '/workshop/team', icon: Users },
    { name: 'Payment', path: '/workshop/payment', icon: CreditCard },
  ];

  const profileMenuItems = [
    { name: 'Profile', icon: User, action: 'profile' },
    { name: 'Logout', icon: LogOut, action: 'logout' },
  ];

  const { logout } = useLogout()

  const { notifications, hasUnread } = useNotifications();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const handleProfileMenuClick = (action) => {
    console.log('Profile action:', action);
    setIsProfileOpen(false);

    if (action === 'profile') {
      console.log("Navigate to profile here");
      navigate('/workshop/profile');
    }

    if (action === 'logout') {
      logout();
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center space-x-2 group"
          >
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-2 rounded-lg group-hover:from-indigo-700 group-hover:to-purple-800 transition-all duration-300">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors duration-300">
                MotoReach
              </span>
              <span className="text-xs text-gray-500 -mt-1">Workshop</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative ${isActive(link.path)
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </button>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notification Bell */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => notifications.length && setIsNotificationOpen((v) => !v)}
                className="relative p-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-300"
              >
                <Bell className="w-5 h-5" />
                {hasUnread && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              {isNotificationOpen && notifications.length > 0 && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Messages
                  </p>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.service_request_id}
                        onClick={() => {
                          navigate(`/workshop/service-flow/${n.service_request_id}`);
                          setIsNotificationOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex flex-col"
                      >
                        <span className="text-sm font-medium text-gray-800">
                          {n.unread_count} new message{n.unread_count > 1 ? 's' : ''}{' '}
                          from {n.counterpart_name || 'user'}
                        </span>
                        <span className="text-xs text-gray-500">
                          Request #{n.service_request_id}
                        </span>
                      </button>
                    ))}
                  </div>
                  {notifications.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-500">No new messages</p>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">Workshop Name</p>
                    <p className="text-xs text-gray-500">workshop@example.com</p>
                  </div>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.action}
                        onClick={() => handleProfileMenuClick(item.action)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200 ${item.action === 'logout'
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Notification Bell */}
            <button className="relative p-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-300"
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

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ${isActive(link.path)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </button>
              );
            })}

            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold text-gray-800">Workshop Name</p>
                <p className="text-xs text-gray-500">workshop@example.com</p>
              </div>
              {profileMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.action}
                    onClick={() => handleProfileMenuClick(item.action)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ${item.action === 'logout'
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default WorkshopNavbar;