import React, { useState } from 'react';
import { Bell, Menu, X, Car } from 'lucide-react';

const UserNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Subscription', path: '/subscription' },
    { name: 'Services', path: '/services' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const handleNavClick = (path) => {
    setActiveLink(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => activeLink === path;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
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

          {/* Desktop Navigation Links */}
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Notification Bell */}
            <button className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Login Button */}
            <button
              onClick={() => handleNavClick('/login')}
              className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              Login
            </button>

            {/* Register Button */}
            <button
              onClick={() => handleNavClick('/register')}
              className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300"
            >
              Register
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3">
            {/* Mobile Notification Bell */}
            <button className="relative p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
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
          <div className="px-4 py-4 space-y-3">
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

            <div className="pt-3 border-t border-gray-200 space-y-3">
              <button
                onClick={() => handleNavClick('/login')}
                className="w-full px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
              >
                Login
              </button>

              <button
                onClick={() => handleNavClick('/register')}
                className="w-full px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-300"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
};

export default UserNavbar;