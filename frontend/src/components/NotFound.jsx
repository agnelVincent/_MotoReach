import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStatus } from '../hooks/useAuthStatus';
import { getRolePath } from '../routes/AuthRedirect';

const NotFound = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuthStatus();

  const handleGoHome = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate(getRolePath(role));
    } else {
      navigate('/login');
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-semibold text-indigo-600">404</p>
        
        {/* Main Content */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Page not found
        </h1>
        <p className="mt-6 text-base leading-7 text-gray-600">
          Sorry, we couldn’t find the page you’re looking for. Perhaps you’ve mistyped the URL?
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <button
            onClick={handleGoHome}
            className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200"
          >
            Go back home
          </button>
          <a 
            href="/support" 
            className="text-sm font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
          >
            Contact support <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
};

export default NotFound;