import React, { useState, useRef, useEffect } from 'react';
import { Wrench, User, Menu, X, LayoutDashboard, AlertCircle, Building2, Users, Wallet, LogOut, ChevronDown } from 'lucide-react';
import { useLogout } from '../../hooks/useLogout';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminNavbar = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const navLinks = [
    { name: 'Dashboard',           path: '/admin',             icon: LayoutDashboard },
    { name: 'Users',               path: '/admin/users',       icon: Users           },
    { name: 'Workshops',           path: '/admin/workshops',   icon: Building2       },
    { name: 'Mechanics',           path: '/admin/mechanics',   icon: Users           },
    { name: 'Platform Revenue',    path: '/admin/wallet',      icon: Wallet          },
    { name: 'Reports / Complaints',path: '/admin/complaints',  icon: AlertCircle     },
  ];

  const profileMenuItems = [
    { name: 'Logout', icon: LogOut, action: 'logout' },
  ];

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNavClick = (path) => { navigate(path); setIsMobileMenuOpen(false); };

  const { logout } = useLogout();

  const handleProfileMenuClick = (action) => {
    setIsProfileOpen(false);
    if (action === 'logout') logout();
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        @keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        .mob-menu-admin { animation: slideDown 0.22s ease forwards; }
        @keyframes fadeInDown { from { opacity:0; transform:translateY(-6px) scale(0.98); } to { opacity:1; transform:translateY(0) scale(1); } }
      `}</style>

      <nav className="bg-white/95 backdrop-blur-md border-b border-[#f1f5f9] fixed top-0 left-0 right-0 z-50" style={{ boxShadow: '0 1px 12px rgba(30,27,75,0.06)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            {/* Logo */}
            <button onClick={() => handleNavClick('/admin')} className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-slate-200 transition-all duration-200" style={{ background: 'linear-gradient(135deg,#334155 0%,#0f172a 100%)' }}>
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-lg font-bold text-gray-900 group-hover:text-slate-700 transition-colors" style={{ fontFamily: 'Syne, sans-serif' }}>MotoReach</span>
                <span className="text-[0.6rem] text-slate-400 font-semibold tracking-widest uppercase" style={{ fontFamily: 'Syne, sans-serif' }}>Admin</span>
              </div>
            </button>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map(({ name, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => handleNavClick(path)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all duration-200 whitespace-nowrap ${
                    isActive(path) ? 'text-slate-700 bg-slate-100' : 'text-gray-600 hover:text-slate-700 hover:bg-gray-50'
                  }`}
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {name}
                </button>
              ))}
            </div>

            {/* Desktop Profile */}
            <div className="hidden md:flex items-center gap-2">
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-gray-50 transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#334155 0%,#0f172a 100%)' }}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-[#f1f5f9] overflow-hidden z-50" style={{ animation: 'fadeInDown 0.18s ease forwards' }}>
                    <div className="px-4 py-3 border-b border-[#f1f5f9]">
                      <p className="text-sm font-bold text-gray-900 truncate" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.full_name || user?.name || 'Admin'}</p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    {profileMenuItems.map(({ name, icon: Icon, action }) => (
                      <button
                        key={action}
                        onClick={() => handleProfileMenuClick(action)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
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

            {/* Mobile Hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-9 h-9 flex items-center justify-center text-gray-600 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-[#f1f5f9] mob-menu-admin" style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)' }}>
            <div className="px-4 py-4 space-y-1">
              {navLinks.map(({ name, path, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => handleNavClick(path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 ${
                    isActive(path) ? 'bg-slate-100 text-slate-700' : 'text-gray-600 hover:bg-gray-50 hover:text-slate-700'
                  }`}
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  <Icon className="w-4 h-4" />
                  {name}
                </button>
              ))}
              <div className="pt-3 border-t border-[#f1f5f9] space-y-2">
                <div className="px-4 py-2">
                  <p className="text-sm font-bold text-gray-900" style={{ fontFamily: 'Syne, sans-serif' }}>{user?.full_name || user?.name || 'Admin'}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                {profileMenuItems.map(({ name, icon: Icon, action }) => (
                  <button
                    key={action}
                    onClick={() => handleProfileMenuClick(action)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-2xl transition-all"
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

export default AdminNavbar;