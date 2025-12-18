import React, { useState } from 'react';
import { 
  FileText, 
  User, 
  Car, 
  Wrench, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Ban,
  X,
  Calendar,
  Image,
  Filter,
  ArrowUpDown,
  AlertCircle,
  ZoomIn
} from 'lucide-react';

const WorkshopRequestList = () => {
  // Mock request data with hardcoded image URLs
  const [requests, setRequests] = useState([
    {
      id: 1,
      userName: 'Rajesh Kumar',
      vehicleType: 'Honda City',
      issueCategory: 'Engine Oil Change',
      status: 'Pending',
      date: '2024-01-15T10:30:00',
      description: 'Need complete engine oil change. The vehicle has completed 10,000 km and requires synthetic oil.',
      // Replace with real uploaded images later
      photos: [
        'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
        'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?w=400',
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400'
      ],
      vehicleDetails: { model: 'Honda City 2020', registration: 'KA-01-AB-1234' }
    },
    {
      id: 2,
      userName: 'Priya Sharma',
      vehicleType: 'Maruti Swift',
      issueCategory: 'Brake System Repair',
      status: 'Approved',
      date: '2024-01-14T14:20:00',
      description: 'Brake pads making squeaking noise. Need immediate inspection and replacement.',
      // Replace with real uploaded images later
      photos: [
        'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400',
        'https://images.unsplash.com/photo-1580274455191-1c62238fa333?w=400'
      ],
      vehicleDetails: { model: 'Maruti Swift 2019', registration: 'KA-02-CD-5678' }
    },
    {
      id: 3,
      userName: 'Amit Patel',
      vehicleType: 'Hyundai Creta',
      issueCategory: 'AC Not Working',
      status: 'Rejected',
      date: '2024-01-13T09:15:00',
      description: 'Air conditioning stopped working suddenly. No cooling at all.',
      // Replace with real uploaded images later
      photos: [],
      vehicleDetails: { model: 'Hyundai Creta 2021', registration: 'KA-03-EF-9012' }
    },
    {
      id: 4,
      userName: 'Sneha Reddy',
      vehicleType: 'Toyota Innova',
      issueCategory: 'General Service',
      status: 'Pending',
      date: '2024-01-16T11:00:00',
      description: 'Complete general servicing required. Last service was 6 months ago.',
      // Replace with real uploaded images later
      photos: [
        'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400',
        'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=400',
        'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400',
        'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=400'
      ],
      vehicleDetails: { model: 'Toyota Innova Crysta 2018', registration: 'KA-04-GH-3456' }
    },
    {
      id: 5,
      userName: 'Vikram Singh',
      vehicleType: 'Ford EcoSport',
      issueCategory: 'Battery Replacement',
      status: 'Cancelled',
      date: '2024-01-12T16:45:00',
      description: 'Battery dead, needs replacement urgently.',
      // Replace with real uploaded images later
      photos: [
        'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400'
      ],
      vehicleDetails: { model: 'Ford EcoSport 2017', registration: 'KA-05-IJ-7890' }
    },
    {
      id: 6,
      userName: 'Anjali Verma',
      vehicleType: 'Tata Nexon',
      issueCategory: 'Tire Replacement',
      status: 'Approved',
      date: '2024-01-17T13:30:00',
      description: 'Front two tires need replacement. Uneven wear observed.',

      photos: [
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=400',
        'https://images.unsplash.com/photo-1449130015084-2bf505b6be5a?w=400'
      ],
      vehicleDetails: { model: 'Tata Nexon EV 2022', registration: 'KA-06-KL-2345' }
    }
  ]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('All');

  const handleApprove = (requestId) => {
    setRequests(requests.map(req =>
      req.id === requestId && req.status === 'Pending' 
        ? { ...req, status: 'Approved' } 
        : req
    ));
    if (selectedRequest?.id === requestId) {
      setSelectedRequest({ ...selectedRequest, status: 'Approved' });
    }
  };

  const handleReject = (requestId) => {
    setRequests(requests.map(req =>
      req.id === requestId && req.status === 'Pending' 
        ? { ...req, status: 'Rejected' } 
        : req
    ));
    setSelectedRequest(null);
  };

  const handleCancelConnection = (requestId) => {
    setRequests(requests.map(req =>
      req.id === requestId && req.status === 'Approved' 
        ? { ...req, status: 'Cancelled' } 
        : req
    ));
    setSelectedRequest(null);
  };

  const getStatusStyle = (status) => {
    const styles = {
      Pending: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      Approved: 'bg-green-100 text-green-700 border-green-300',
      Rejected: 'bg-red-100 text-red-700 border-red-300',
      Cancelled: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: <Clock className="w-4 h-4" />,
      Approved: <CheckCircle className="w-4 h-4" />,
      Rejected: <XCircle className="w-4 h-4" />,
      Cancelled: <Ban className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const filteredRequests = requests.filter(req =>
    filterStatus === 'All' || req.status === filterStatus
  );

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.date) - new Date(a.date);
    } else if (sortBy === 'oldest') {
      return new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'Pending').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    rejected: requests.filter(r => r.status === 'Rejected').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Service Requests
          </h1>
          <p className="text-gray-600">
            Manage incoming service requests from customers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
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
                <p className="text-sm text-gray-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-4">
              <div className="relative flex-1">
                <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white cursor-pointer"
                >
                  <option value="newest">Sort by Newest</option>
                  <option value="oldest">Sort by Oldest</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>

              <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 appearance-none bg-white cursor-pointer"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {sortedRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{request.userName}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(request.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusStyle(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-15">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Car className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{request.vehicleType}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Wrench className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{request.issueCategory}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <Eye className="w-5 h-5" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedRequests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-2">No requests found</p>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        )}

        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Request Details</h2>
                  <p className="text-purple-100">Request ID: #{selectedRequest.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Customer Name</p>
                        <p className="font-semibold text-gray-800">{selectedRequest.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Request Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(selectedRequest.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Vehicle Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Vehicle Model</p>
                        <p className="font-semibold text-gray-800">{selectedRequest.vehicleDetails.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Registration</p>
                        <p className="font-semibold text-gray-800">{selectedRequest.vehicleDetails.registration}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Issue Category</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-800">{selectedRequest.issueCategory}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedRequest.description}</p>
                  </div>
                </div>

                {selectedRequest.photos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Image className="w-5 h-5 text-purple-600" />
                      Uploaded Photos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedRequest.photos.map((photo, index) => (
                        <div 
                          key={index} 
                          className="relative aspect-square rounded-lg overflow-hidden shadow-md cursor-pointer group"
                          onClick={() => setEnlargedImage(photo)}
                        >
                          <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  {selectedRequest.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve Request
                      </button>
                      <button
                        onClick={() => handleReject(selectedRequest.id)}
                        className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Request
                      </button>
                    </>
                  )}

                  {selectedRequest.status === 'Approved' && (
                    <button
                      onClick={() => handleCancelConnection(selectedRequest.id)}
                      className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                    >
                      <Ban className="w-5 h-5" />
                      Cancel Connection
                    </button>
                  )}

                  {(selectedRequest.status === 'Rejected' || selectedRequest.status === 'Cancelled') && (
                    <div className="flex-1 text-center py-4 bg-gray-100 rounded-lg border-2 border-gray-300">
                      <p className="text-gray-600 font-semibold">No actions available</p>
                      <p className="text-sm text-gray-500 mt-1">This request has been {selectedRequest.status.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {enlargedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setEnlargedImage(null)}>
            <div className="relative max-w-5xl max-h-[90vh]">
              <button
                onClick={() => setEnlargedImage(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200 transition-all duration-300"
              >
                <X className="w-6 h-6 text-gray-800" />
              </button>
              <img src={enlargedImage} alt="Enlarged" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkshopRequestList;