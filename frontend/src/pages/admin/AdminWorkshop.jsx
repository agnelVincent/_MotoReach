import React, { useState } from 'react';
import { Building2, Shield, ShieldOff, Search, Filter, CheckCircle, Clock, XCircle, Save } from 'lucide-react';

const AdminWorkshop = () => {
  const [workshops, setWorkshops] = useState([
    { id: 1, workshopName: 'AutoFix Workshop', ownerName: 'Ramesh Patel', email: 'ramesh@autofix.com', verificationStatus: 'Approved', isBlocked: false },
    { id: 2, workshopName: 'SpeedCare Services', ownerName: 'Suresh Kumar', email: 'suresh@speedcare.com', verificationStatus: 'Pending', isBlocked: false },
    { id: 3, workshopName: 'ProMech Auto', ownerName: 'Vijay Singh', email: 'vijay@promech.com', verificationStatus: 'Approved', isBlocked: false },
    { id: 4, workshopName: 'QuickFix Garage', ownerName: 'Anil Sharma', email: 'anil@quickfix.com', verificationStatus: 'Rejected', isBlocked: false },
    { id: 5, workshopName: 'Elite Motors', ownerName: 'Rajesh Gupta', email: 'rajesh@elitemotors.com', verificationStatus: 'Pending', isBlocked: false },
    { id: 6, workshopName: 'City Auto Care', ownerName: 'Manoj Reddy', email: 'manoj@cityauto.com', verificationStatus: 'Approved', isBlocked: true },
    { id: 7, workshopName: 'Best Mechanics', ownerName: 'Sanjay Patel', email: 'sanjay@bestmech.com', verificationStatus: 'Rejected', isBlocked: false },
    { id: 8, workshopName: 'Premium Auto', ownerName: 'Karan Malhotra', email: 'karan@premium.com', verificationStatus: 'Approved', isBlocked: false },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingStatus, setEditingStatus] = useState({});

  const handleStatusChange = (workshopId, newStatus) => {
    setEditingStatus({ ...editingStatus, [workshopId]: newStatus });
  };

  const handleUpdateStatus = (workshopId) => {
    if (editingStatus[workshopId]) {
      setWorkshops(workshops.map(workshop =>
        workshop.id === workshopId
          ? { ...workshop, verificationStatus: editingStatus[workshopId] }
          : workshop
      ));
      setEditingStatus({ ...editingStatus, [workshopId]: null });
    }
  };

  const handleToggleBlock = (workshopId) => {
    setWorkshops(workshops.map(workshop =>
      workshop.id === workshopId
        ? { ...workshop, isBlocked: !workshop.isBlocked }
        : workshop
    ));
  };

  const filteredWorkshops = workshops.filter(workshop => {
    const matchesSearch = 
      workshop.workshopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workshop.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workshop.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || workshop.verificationStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: workshops.length,
    approved: workshops.filter(w => w.verificationStatus === 'Approved').length,
    pending: workshops.filter(w => w.verificationStatus === 'Pending').length,
    rejected: workshops.filter(w => w.verificationStatus === 'Rejected').length
  };

  const getStatusBadge = (status) => {
    const styles = {
      Approved: 'bg-green-100 text-green-700',
      Pending: 'bg-yellow-100 text-yellow-700',
      Rejected: 'bg-red-100 text-red-700'
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Pending': return <Clock className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Workshop Management
          </h1>
          <p className="text-gray-600">
            Manage workshops, verification status, and access control
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Workshops</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
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
                placeholder="Search by workshop name, owner, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-11 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workshops Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Workshop Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Owner</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Verification Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredWorkshops.map((workshop) => (
                  <tr key={workshop.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{workshop.workshopName}</p>
                          {workshop.isBlocked && (
                            <span className="text-xs text-red-600 font-medium">Blocked</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{workshop.ownerName}</td>
                    <td className="px-6 py-4 text-gray-600">{workshop.email}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={editingStatus[workshop.id] || workshop.verificationStatus}
                          onChange={(e) => handleStatusChange(workshop.id, e.target.value)}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-300 cursor-pointer ${
                            editingStatus[workshop.id] && editingStatus[workshop.id] !== workshop.verificationStatus
                              ? 'border-purple-500 ring-2 ring-purple-200'
                              : 'border-transparent'
                          } ${getStatusBadge(editingStatus[workshop.id] || workshop.verificationStatus)}`}
                        >
                          <option value="Approved">Approved</option>
                          <option value="Pending">Pending</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                        
                        {editingStatus[workshop.id] && editingStatus[workshop.id] !== workshop.verificationStatus && (
                          <button
                            onClick={() => handleUpdateStatus(workshop.id)}
                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300"
                            title="Update Status"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggleBlock(workshop.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                            workshop.isBlocked
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                        >
                          {workshop.isBlocked ? (
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWorkshops.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No workshops found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-6 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {filteredWorkshops.length} of {workshops.length} workshops
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminWorkshop;