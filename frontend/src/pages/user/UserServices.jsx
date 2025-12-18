import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import {
  FileText,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Ban,
  X,
  Calendar,
  Image,
  Building2,
  Wrench,
  Car,
  ZoomIn
} from 'lucide-react';

const UserService = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchRequests();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get('service-request/my-requests/');
      const mappedRequests = response.data.map(r => ({
        id: r.id,
        issueCategory: r.issue_category,
        description: r.description,
        createdDate: r.created_at,
        status: mapBackendStatus(r.status),
        workshopName: r.workshop_name,
        completionDate: r.completed_at || r.ended_at,
        photos: r.image_urls || [],
        vehicleDetails: { model: r.vehicle_model, registration: r.vehicle_type },
        expiresAt: r.expires_at,
        isExpired: r.is_expired
      }));
      setRequests(mappedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const mapBackendStatus = (status) => {
    switch (status) {
      case 'CREATED': return 'Not Connected';
      case 'REQUESTED': return 'Pending Approval';
      case 'ACCEPTED':
      case 'IN_PROGRESS': return 'Ongoing';
      case 'COMPLETED': return 'Completed';
      case 'REJECTED': return 'Rejected';
      case 'CANCELLED': return 'Cancelled';
      case 'EXPIRED': return 'Expired';
      default: return status;
    }
  };

  const calculateTimeLeft = (expiresAt) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt) - currentTime;
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleActionClick = (request) => {
    if (request.status === 'Not Connected') {
      navigate(`/user/workshops-nearby/${request.id}`);
    } else {
      setSelectedRequest(request);
    }
  };

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  const getStatusStyle = (status) => {
    const styles = {
      Ongoing: 'bg-blue-100 text-blue-700 border-blue-300',
      Completed: 'bg-green-100 text-green-700 border-green-300',
      'Not Connected': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'Pending Approval': 'bg-indigo-100 text-indigo-700 border-indigo-300',
      Rejected: 'bg-red-100 text-red-700 border-red-300',
      Cancelled: 'bg-gray-100 text-gray-700 border-gray-300',
      Expired: 'bg-orange-100 text-orange-700 border-orange-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      Ongoing: <Clock className="w-4 h-4" />,
      Completed: <CheckCircle className="w-4 h-4" />,
      'Not Connected': <AlertCircle className="w-4 h-4" />,
      'Pending Approval': <Clock className="w-4 h-4" />,
      Rejected: <XCircle className="w-4 h-4" />,
      Cancelled: <Ban className="w-4 h-4" />,
      Expired: <AlertCircle className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const filteredRequests = activeFilter === 'All'
    ? requests
    : activeFilter === 'Others'
      ? requests.filter(r => ['Not Connected', 'Pending Approval', 'Rejected', 'Cancelled', 'Expired'].includes(r.status))
      : requests.filter(r => r.status === activeFilter);

  const stats = {
    all: requests.length,
    ongoing: requests.filter(r => r.status === 'Ongoing').length,
    completed: requests.filter(r => r.status === 'Completed').length,
    notConnected: requests.filter(r => r.status === 'Not Connected').length,
    pending: requests.filter(r => r.status === 'Pending Approval').length,
    rejected: requests.filter(r => r.status === 'Rejected').length,
    cancelled: requests.filter(r => r.status === 'Cancelled').length,
    expired: requests.filter(r => r.status === 'Expired').length
  };

  const filters = [
    { label: 'All Requests', value: 'All', count: stats.all },
    { label: 'Ongoing', value: 'Ongoing', count: stats.ongoing },
    { label: 'Completed', value: 'Completed', count: stats.completed },
    { label: 'Others', value: 'Others', count: stats.notConnected + stats.pending + stats.rejected + stats.cancelled + stats.expired }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Request History
          </h1>
          <p className="text-gray-600">
            Track all your service requests and their current status
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                <p className="text-3xl font-bold text-gray-800">{stats.all}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ongoing</p>
                <p className="text-3xl font-bold text-blue-600">{stats.ongoing}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Not Connected</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.notConnected}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`flex-1 min-w-[150px] px-6 py-3 rounded-lg font-medium transition-all duration-300 ${activeFilter === filter.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filter.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeFilter === filter.value
                  ? 'bg-white text-blue-600'
                  : 'bg-gray-200 text-gray-700'
                  }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Wrench className="w-6 h-6 text-blue-600" />
                          <h3 className="text-xl font-bold text-gray-800">{request.issueCategory}</h3>
                        </div>
                        <p className="text-gray-600 mb-3">{request.description}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>Created: {new Date(request.createdDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 whitespace-nowrap ${getStatusStyle(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status}
                      </span>
                    </div>

                    {request.status === 'Completed' && (
                      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <Building2 className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm text-green-700 font-medium">Completed by</p>
                          <p className="font-semibold text-green-800">{request.workshopName}</p>
                          {request.completionDate && (
                            <p className="text-xs text-green-600">
                              {new Date(request.completionDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {request.status === 'Ongoing' && (
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-blue-700 font-medium">Connected to</p>
                          <p className="font-semibold text-blue-800">{request.workshopName}</p>
                        </div>
                      </div>
                    )}

                    {request.status === 'Not Connected' && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <p className="text-sm text-yellow-700 font-medium">
                            Not connected to any workshop yet
                          </p>
                        </div>
                        {request.expiresAt && (
                          <div className="flex items-center gap-2 text-sm text-red-600 font-medium px-2">
                            <Clock className="w-4 h-4" />
                            <span>Expires in: {calculateTimeLeft(request.expiresAt)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {request.status === 'Expired' && (
                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                        <p className="text-sm text-orange-700 font-medium">
                          Request Expired
                        </p>
                      </div>
                    )}

                    {request.status === 'Pending Approval' && (
                      <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <div>
                          <p className="text-sm text-indigo-700 font-medium">Request Sent to</p>
                          <p className="font-semibold text-indigo-800">{request.workshopName}</p>
                          <p className="text-xs text-indigo-600 mt-1">Waiting for approval...</p>
                        </div>
                      </div>
                    )}

                    {request.status === 'Rejected' && (
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <XCircle className="w-5 h-5 text-red-600" />
                        <p className="text-sm text-red-700 font-medium">
                          Request was rejected by workshops
                        </p>
                      </div>
                    )}

                    {request.status === 'Cancelled' && request.cancelReason && (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <Ban className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="text-sm text-gray-700 font-medium">Cancelled</p>
                          <p className="text-xs text-gray-600">{request.cancelReason}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <button
                      onClick={() => handleActionClick(request)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg whitespace-nowrap"
                    >
                      {request.status === 'Not Connected' ? <Building2 className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      {request.status === 'Not Connected' ? 'Find Workshops' : 'View Details'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800 mb-2">No requests found</p>
            <p className="text-gray-600">Try selecting a different filter</p>
          </div>
        )}

        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Request Details</h2>
                  <p className="text-blue-100">Request ID: #{selectedRequest.id}</p>
                </div>
                <button
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all duration-300"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedRequest.issueCategory}</h3>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusStyle(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    {selectedRequest.status}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Issue Description</h4>
                  <p className="text-gray-800 leading-relaxed">{selectedRequest.description}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Vehicle Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Car className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Model</p>
                        <p className="font-semibold text-gray-800">{selectedRequest.vehicleDetails.model}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-600">Registration</p>
                        <p className="font-semibold text-gray-800">{selectedRequest.vehicleDetails.registration}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {(selectedRequest.workshopName) && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-sm text-blue-700 font-medium">
                          {selectedRequest.status === 'Completed' ? 'Completed by' : 'Connected to'}
                        </p>
                        <p className="text-lg font-bold text-blue-800">{selectedRequest.workshopName}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.photos.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Image className="w-5 h-5 text-blue-600" />
                      Uploaded Photos
                    </h4>
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

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Created: {new Date(selectedRequest.createdDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  {selectedRequest.completionDate && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed: {new Date(selectedRequest.completionDate).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
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
                className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-200 transition-all duration-300 z-10"
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

export default UserService;