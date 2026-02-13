import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMechanicAssignedServices } from '../../redux/slices/serviceRequestSlice';
import {
  Wrench,
  Clock,
  Shield,
  MapPin,
  AlertCircle,
  FileText,
} from 'lucide-react';

const statusBadgeClasses = (status) => {
  switch (status) {
    case 'CONNECTED':
      return 'bg-purple-100 text-purple-700';
    case 'ESTIMATE_SHARED':
      return 'bg-indigo-100 text-indigo-700';
    case 'SERVICE_AMOUNT_PAID':
      return 'bg-blue-100 text-blue-700';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-700';
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'VERIFIED':
      return 'bg-emerald-100 text-emerald-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const MechanicRequests = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mechanicAssignedRequests, loading, error } = useSelector(
    (state) => state.serviceRequest
  );

  useEffect(() => {
    dispatch(fetchMechanicAssignedServices());
  }, [dispatch]);

  if (loading && !mechanicAssignedRequests.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          <p className="text-slate-500 font-medium">Loading assigned services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Assigned Services
          </h1>
          <p className="text-gray-600">
            View all service requests assigned to you by the workshop.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{typeof error === 'string' ? error : 'Failed to load requests'}</p>
          </div>
        )}

        {mechanicAssignedRequests && mechanicAssignedRequests.length > 0 ? (
          <div className="space-y-4">
            {mechanicAssignedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/mechanic/service-flow/${request.id}`)}
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-3">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-orange-600" />
                      {request.vehicle_type} - {request.vehicle_model}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        #{request.id}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleString()}
                      </span>
                    </p>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider w-fit ${statusBadgeClasses(
                      request.status
                    )}`}
                  >
                    {request.status.replace('_', ' ')}
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-3 bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-700 mb-1">
                    {request.issue_category}
                  </p>
                  <p className="line-clamp-2">{request.description}</p>
                </div>

                {request.active_connection && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-amber-200 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Workshop: {request.active_connection.workshop_name}
                      </p>
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-orange-500" />
                        {request.active_connection.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md p-10 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No assigned services yet
            </h2>
            <p className="text-gray-500 text-sm">
              Once your workshop admin assigns you to a service request, it will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicRequests;

