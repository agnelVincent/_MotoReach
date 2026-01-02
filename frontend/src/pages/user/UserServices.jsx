import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchUserServiceRequests, userCancelConnection } from '../../redux/slices/serviceRequestSlice';
import { CheckCircle, AlertCircle, Clock, MapPin, Wrench, XCircle, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserServices = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { userRequests, loading, error } = useSelector((state) => state.serviceRequest);

    // Parse query params for success/cancel
    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    const canceled = queryParams.get('canceled');

    useEffect(() => {
        dispatch(fetchUserServiceRequests());
    }, [dispatch, success, canceled]);

    const handleCancelConnection = async (serviceRequestId) => {
        if (window.confirm("Are you sure you want to cancel the connection request?")) {
            try {
                await dispatch(userCancelConnection(serviceRequestId)).unwrap();
                toast.success("Connection cancelled successfully");
                // The reducer updates the state, or we can refetch
                // dispatch(fetchUserServiceRequests());
            } catch (error) {
                toast.error("Failed to cancel connection");
            }
        }
    };

    if (loading && !userRequests.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Service History</h1>

                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <CheckCircle className="w-5 h-5" />
                        <div>
                            <p className="font-medium">Payment Successful!</p>
                            <p className="text-sm">You can now proceed with your request.</p>
                        </div>
                    </div>
                )}

                {canceled && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-medium">Payment Cancelled.</p>
                    </div>
                )}

                <div className="space-y-4">
                    {userRequests && userRequests.length > 0 ? (
                        userRequests.map((request) => (
                            <div key={request.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">{request.vehicle_type} - {request.vehicle_model}</h3>
                                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(request.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider w-fit
                                         ${request.status === 'CREATED' ? 'bg-blue-100 text-blue-700' :
                                            request.status === 'FEE_PAID' ? 'bg-indigo-100 text-indigo-700' :
                                                request.status === 'CONNECTING' ? 'bg-purple-100 text-purple-700' :
                                                    request.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-gray-100 text-gray-700'}`}>
                                        {request.status.replace('_', ' ')}
                                    </div>
                                </div>
                                <div className="text-gray-600 text-sm mb-4">
                                    <p className="font-medium mb-1 flex items-center gap-2"><Wrench className="w-4 h-4 text-gray-400" /> {request.issue_category}</p>
                                    <p className="line-clamp-2">{request.description}</p>
                                </div>

                                {request.active_connection && (
                                    <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <Shield className="w-3 h-3" /> Connected Workshop
                                        </h4>
                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg">{request.active_connection.workshop_name}</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                                    <MapPin className="w-3 h-3" /> {request.active_connection.address}
                                                </p>
                                            </div>
                                            <div className="bg-white px-4 py-2 rounded-lg border border-blue-100 shadow-sm">
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Contact Details</p>
                                                <p className="font-mono text-gray-800 font-bold">
                                                    {request.status === 'CONNECTING' ? 'Pending Acceptance' : request.active_connection.workshop_phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {(request.status === 'CREATED' || request.status === 'FEE_PAID') && (
                                        <button
                                            onClick={() => navigate(`/user/workshops-nearby/${request.id}`)}
                                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                        >
                                            Find & Connect
                                        </button>
                                    )}

                                    {(request.status === 'CONNECTING' || request.status === 'IN_PROGRESS') && (
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <button
                                                disabled
                                                className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed border border-gray-200"
                                            >
                                                {request.status === 'IN_PROGRESS' ? 'Connected to Workshop' : 'Awaiting Response'}
                                            </button>

                                            {/* Allow cancellation if connecting or connected (before work starts strictly, but here checking status) */}
                                            <button
                                                onClick={() => handleCancelConnection(request.id)}
                                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition border border-red-200 flex items-center gap-2"
                                                title="Cancel Connection"
                                            >
                                                <XCircle className="w-4 h-4" /> Cancel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No service requests found.</p>
                            <button onClick={() => navigate('/user/request')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-medium">Create New Request</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserServices;
