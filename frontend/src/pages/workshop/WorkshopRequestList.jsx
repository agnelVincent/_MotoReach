import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchWorkshopRequests,
  acceptRequest,
  rejectRequest,
  cancelRequestWorkshop
} from '../../redux/slices/serviceRequestSlice';
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
import { toast } from 'react-hot-toast';

const ExpirationTimer = ({ requestedAt }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const created = new Date(requestedAt);
      const expires = new Date(created.getTime() + 60 * 60 * 1000); // 1 hour expiration
      const now = new Date();
      const difference = expires - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);
      setTimeLeft(`${minutes}m ${seconds}s`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [requestedAt]);

  if (isExpired) return <span className="text-red-500 font-bold text-xs">Expired</span>;

  return (
    <div className="flex items-center gap-1 text-orange-600 font-mono text-sm bg-orange-50 px-2 py-1 rounded">
      <Clock className="w-3 h-3" />
      <span>{timeLeft}</span>
    </div>
  );
};

const WorkshopRequestList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { workshopRequests, loading } = useSelector((state) => state.serviceRequest);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    dispatch(fetchWorkshopRequests());
  }, [dispatch]);

  const handleApprove = async (requestId) => {
    try {
      await dispatch(acceptRequest(requestId)).unwrap();
      toast.success('Request accepted successfully');
      if (selectedRequest?.id === requestId) {
        setSelectedRequest({ ...selectedRequest, status: 'ACCEPTED' });
      }
    } catch (error) {
      toast.error('Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await dispatch(rejectRequest(requestId)).unwrap();
      toast.success('Request rejected');
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to reject request');
    }
  };

  const handleCancelConnection = async (requestId) => {
    try {
      await dispatch(cancelRequestWorkshop(requestId)).unwrap();
      toast.success('Connection cancelled');
      setSelectedRequest(null);
    } catch (error) {
      toast.error('Failed to cancel connection');
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      REQUESTED: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      ACCEPTED: 'bg-green-100 text-green-700 border-green-300',
      REJECTED: 'bg-red-100 text-red-700 border-red-300',
      AUTO_REJECTED: 'bg-red-100 text-red-700 border-red-300',
      CANCELLED: 'bg-gray-100 text-gray-700 border-gray-300',
      EXPIRED: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getStatusIcon = (status) => {
    const icons = {
      REQUESTED: <Clock className="w-4 h-4" />,
      ACCEPTED: <CheckCircle className="w-4 h-4" />,
      REJECTED: <XCircle className="w-4 h-4" />,
      AUTO_REJECTED: <XCircle className="w-4 h-4" />,
      CANCELLED: <Ban className="w-4 h-4" />,
      EXPIRED: <Ban className="w-4 h-4" />
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const filteredRequests = workshopRequests.filter(req =>
    filterStatus === 'All' || req.status === filterStatus
  );

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.requested_at) - new Date(a.requested_at);
    } else if (sortBy === 'oldest') {
      return new Date(a.requested_at) - new Date(b.requested_at);
    } else if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const stats = {
    total: workshopRequests.length,
    pending: workshopRequests.filter(r => r.status === 'REQUESTED').length,
    approved: workshopRequests.filter(r => r.status === 'ACCEPTED').length,
    rejected: workshopRequests.filter(r => ['REJECTED', 'AUTO_REJECTED'].includes(r.status)).length
  };

  if (loading && workshopRequests.length === 0) {
    return <div className="p-10 text-center">Loading requests...</div>;
  }

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
                  <option value="REQUESTED">Pending</option>
                  <option value="ACCEPTED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="AUTO_REJECTED">Auto Rejected</option>
                  <option value="CANCELLED">Cancelled</option>
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
                          <h3 className="text-lg font-bold text-gray-800">{request.user_name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {new Date(request.requested_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {request.status === 'REQUESTED' && (
                              <ExpirationTimer requestedAt={request.requested_at} />
                            )}
                          </p>
                        </div>
                      </div>

                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusStyle(request.status)}`}>
                        {getStatusIcon(request.status)}
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-15">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Car className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{request.service_request.vehicle_type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <Wrench className="w-5 h-5 text-gray-400" />
                        <span className="font-medium">{request.service_request.issue_category}</span>
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

        {sortedRequests.length === 0 && !loading && (
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
                        <p className="font-semibold text-gray-800">{selectedRequest.user_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Request Date</p>
                        <p className="font-semibold text-gray-800">
                          {new Date(selectedRequest.requested_at).toLocaleDateString()}
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
                        <p className="font-semibold text-gray-800">{selectedRequest.service_request.vehicle_model}</p>
                      </div>
                    </div>
                    {/* Add more unique details if available */}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Issue Category</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-gray-800">{selectedRequest.service_request.issue_category}</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedRequest.service_request.description}</p>
                  </div>
                </div>

                {selectedRequest.service_request.image_urls && selectedRequest.service_request.image_urls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Image className="w-5 h-5 text-purple-600" />
                      Uploaded Photos
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedRequest.service_request.image_urls.map((photo, index) => {
                        if (typeof photo !== 'string') return null;
                        return (
                          <div
                            key={index}
                            className="relative aspect-square rounded-lg overflow-hidden shadow-md cursor-pointer group bg-gray-100"
                            onClick={() => setEnlargedImage(photo)}
                          >
                            <img
                              src={photo}
                              alt={`Issue Photo ${index + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  {selectedRequest.status === 'REQUESTED' && (
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

                  {selectedRequest.status === 'ACCEPTED' && (
                    <>
                      <button
                        onClick={() => navigate(`/workshop/service-flow/${selectedRequest.service_request.id}`)}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <Wrench className="w-5 h-5" />
                        Track Service
                      </button>
                      <button
                        onClick={() => handleCancelConnection(selectedRequest.id)}
                        className="flex-1 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg"
                      >
                        <Ban className="w-5 h-5" />
                        Cancel Connection
                      </button>
                    </>
                  )}

                  {['REJECTED', 'CANCELLED', 'AUTO_REJECTED', 'EXPIRED'].includes(selectedRequest.status) && (
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