import React, { useState, useRef, useEffect } from 'react';
import { Car, Bell, User, Menu, X, LayoutDashboard, AlertCircle, Building2, Users, CreditCard, Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useLogout } from '../../hooks/useLogout';

const AdminNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/dashboard');
  const profileRef = useRef(null);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports / Complaints', path: '/reports', icon: AlertCircle },
    { name: 'Workshops', path: '/workshops', icon: Building2 },
    { name: 'Mechanics', path: '/mechanics', icon: Users },
    { name: 'Subscription', path: '/subscription', icon: CreditCard },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
  ];

  const profileMenuItems = [
    { name: 'Profile', icon: User, action: 'profile' },
    { name: 'Logout', icon: LogOut, action: 'logout' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (path) => {
    setActiveLink(path);
    setIsMobileMenuOpen(false);
  };
  const {logout} = useLogout()
  const handleProfileMenuClick = (action) => {
    console.log('Profile action:', action);
    setIsProfileOpen(false);

    if(action === 'logout'){
      logout()
    }
  };

  const isActive = (path) => activeLink === path;

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center space-x-2 group"
          >
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2 rounded-lg group-hover:from-slate-800 group-hover:to-black transition-all duration-300">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 group-hover:text-slate-700 transition-colors duration-300">
                MotoReach
              </span>
              <span className="text-xs text-gray-500 -mt-1">Admin</span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavClick(link.path)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 relative ${
                    isActive(link.path)
                      ? 'text-slate-700 bg-slate-100'
                      : 'text-gray-700 hover:text-slate-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{link.name}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 animate-fadeIn">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">Admin User</p>
                    <p className="text-xs text-gray-500">admin@motorreach.com</p>
                  </div>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.action}
                        onClick={() => handleProfileMenuClick(item.action)}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200 ${
                          item.action === 'logout'
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
            <button className="relative p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300"
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
                  className={`w-full flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ${
                    isActive(link.path)
                      ? 'bg-slate-100 text-slate-700'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.name}
                </button>
              );
            })}

            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div className="px-4 py-2">
                <p className="text-sm font-semibold text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">admin@motorreach.com</p>
              </div>
              {profileMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.action}
                    onClick={() => handleProfileMenuClick(item.action)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ${
                      item.action === 'logout'
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

export default AdminNavbar;