import { Car } from 'lucide-react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MotoReach</span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                to="/contact"
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors duration-200"
              >
                Contact Us
              </Link>
              <p className="text-sm text-gray-400">
                © 2024 MotoReach. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
  )
}

export default Footer
