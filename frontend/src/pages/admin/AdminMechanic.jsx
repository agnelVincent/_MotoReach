import React, { useState } from 'react';
import { User, Shield, ShieldOff, Search, Filter, Activity, Building2, CheckCircle, Clock } from 'lucide-react';

const AdminMechanic = () => {
  const [mechanics, setMechanics] = useState([
    { id: 1, fullName: 'Vikram Singh', email: 'vikram.singh@example.com', workshops: ['AutoFix Workshop'], availability: 'Available', isBlocked: false },
    { id: 2, fullName: 'Amit Sharma', email: 'amit.sharma@example.com', workshops: ['SpeedCare Services', 'ProMech Auto'], availability: 'Busy', isBlocked: false },
    { id: 3, fullName: 'Rajesh Kumar', email: 'rajesh.kumar@example.com', workshops: ['QuickFix Garage'], availability: 'Available', isBlocked: false },
    { id: 4, fullName: 'Suresh Patel', email: 'suresh.patel@example.com', workshops: ['Elite Motors'], availability: 'Available', isBlocked: false },
    { id: 5, fullName: 'Manoj Reddy', email: 'manoj.reddy@example.com', workshops: ['City Auto Care'], availability: 'Busy', isBlocked: true },
    { id: 6, fullName: 'Karan Verma', email: 'karan.verma@example.com', workshops: ['Best Mechanics', 'Premium Auto'], availability: 'Available', isBlocked: false },
    { id: 7, fullName: 'Sanjay Malhotra', email: 'sanjay.m@example.com', workshops: ['AutoFix Workshop'], availability: 'Busy', isBlocked: false },
    { id: 8, fullName: 'Anil Gupta', email: 'anil.gupta@example.com', workshops: ['SpeedCare Services'], availability: 'Available', isBlocked: false },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterAvailability, setFilterAvailability] = useState('All');

  const handleToggleBlock = (mechanicId) => {
    setMechanics(mechanics.map(mechanic =>
      mechanic.id === mechanicId
        ? { ...mechanic, isBlocked: !mechanic.isBlocked }
        : mechanic
    ));
  };

  const filteredMechanics = mechanics.filter(mechanic => {
    const matchesSearch = 
      mechanic.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mechanic.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mechanic.workshops.some(w => w.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterAvailability === 'All' || mechanic.availability === filterAvailability;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: mechanics.length,
    available: mechanics.filter(m => m.availability === 'Available' && !m.isBlocked).length,
    busy: mechanics.filter(m => m.availability === 'Busy').length,
    blocked: mechanics.filter(m => m.isBlocked).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Mechanic Management
          </h1>
          <p className="text-gray-600">
            Manage mechanics, their availability, and workshop associations
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Mechanics</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available</p>
                <p className="text-3xl font-bold text-green-600">{stats.available}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Busy</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.busy}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Blocked</p>
                <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <ShieldOff className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or workshop..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterAvailability}
                onChange={(e) => setFilterAvailability(e.target.value)}
                className="pl-11 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 appearance-none bg-white cursor-pointer"
              >
                <option value="All">All Availability</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mechanics Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-orange-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Full Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Workshops</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Availability</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMechanics.map((mechanic) => (
                  <tr key={mechanic.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {mechanic.fullName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{mechanic.fullName}</p>
                          {mechanic.isBlocked && (
                            <span className="text-xs text-red-600 font-medium">Blocked</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{mechanic.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {mechanic.workshops.map((workshop, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                          >
                            <Building2 className="w-3 h-3" />
                            {workshop}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                        mechanic.availability === 'Available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {mechanic.availability}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(mechanic.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                          mechanic.isBlocked
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                      >
                        {mechanic.isBlocked ? (
                          <>
                            <Shield className="w-4 h-4" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <ShieldOff className="w-4 h-4" />
                            Block
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMechanics.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No mechanics found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredMechanics.length} of {mechanics.length} mechanics
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminMechanic;