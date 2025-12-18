import React, { useState } from 'react';
import { useSelector } from 'react-redux'; // Added
import { useNavigate } from 'react-router-dom'; // Added
import { MapPin, Star, ArrowRight, Shield, Search, SlidersHorizontal } from 'lucide-react';

const UserWorkshopNearby = () => {
  const navigate = useNavigate();
  
  
  const { nearbyWorkshops, currentRequest } = useSelector((state) => state.serviceRequest);
  console.log(nearbyWorkshops)
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  const filteredWorkshops = nearbyWorkshops.filter(workshop =>
    workshop.workshop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.address_line.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Sort workshops (Dynamic)
  const sortedWorkshops = [...filteredWorkshops].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating_avg - a.rating_avg;
    } else if (sortBy === 'distance') {
      return a.distance - b.distance;
    }
    return 0;
  });

  const handleConnect = (workshopId, workshopName) => {
    // Navigate to the payment/connection page with the chosen workshop ID
    navigate(`/user/checkout/${currentRequest.id}/${workshopId}`);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < fullStars ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
        />
      );
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Nearby Workshops
          </h1>
          <p className="text-gray-600 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Showing workshops near {currentRequest?.vehicle_model || "your location"}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Found Nearby</p>
                <p className="text-3xl font-bold text-gray-800">{nearbyWorkshops.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Closest Workshop</p>
                <p className="text-3xl font-bold text-green-600">
                  {nearbyWorkshops.length > 0 ? `${nearbyWorkshops[0].distance} km` : 'N/A'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Top Rated</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {nearbyWorkshops.length > 0 
                    ? Math.max(...nearbyWorkshops.map(w => w.rating_avg)).toFixed(1) 
                    : '0.0'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workshops by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-11 pr-8 py-3 border border-gray-300 rounded-lg bg-white cursor-pointer outline-none appearance-none"
              >
                <option value="distance">Sort by Distance</option>
                <option value="rating">Sort by Rating</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workshop Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedWorkshops.map((workshop) => (
            <div
              key={workshop.id}
              className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
            >
              <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-blue-100 font-medium">Distance</span>
                      <p className="text-white font-bold">{workshop.distance} km</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-green-500 px-3 py-1 rounded-full text-white">
                    <Shield className="w-3 h-3" />
                    <span className="text-xs font-semibold">Verified</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                  {workshop.workshop_name}
                </h3>

                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-600">{workshop.address_line}, {workshop.city}</p>
                </div>

                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">{renderStars(workshop.rating_avg)}</div>
                    <span className="text-sm font-bold text-gray-800">{Number(workshop.rating_avg).toFixed(1)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleConnect(workshop.id, workshop.workshop_name)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  Connect Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results UI */}
        {sortedWorkshops.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800">No workshops found within 20km</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWorkshopNearby;