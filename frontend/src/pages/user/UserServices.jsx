import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchUserServiceRequests, userCancelConnection, deleteServiceRequest } from '../../redux/slices/serviceRequestSlice';
import { CheckCircle, AlertCircle, Clock, MapPin, Wrench, XCircle, Shield, Trash2, Plus, AlertTriangle, FileX } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ExpirationTimer from '../../components/ExpirationTimer';

const UserServices = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { userRequests, loading, error } = useSelector((state) => state.serviceRequest);

    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    const canceled = queryParams.get('canceled');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        dispatch(fetchUserServiceRequests());
    }, [dispatch, success, canceled]);

    const handleDeleteClick = (request) => {
        setSelectedRequestId(request.id);
        setSelectedRequestDetails(request);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        setIsProcessing(true);
        try {
            await dispatch(deleteServiceRequest(selectedRequestId)).unwrap();
            toast.success("Service request deleted successfully");
            setShowDeleteModal(false);
        } catch (error) {
            toast.error(error.error || "Failed to delete request");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelClick = (request) => {
        setSelectedRequestId(request.id);
        setSelectedRequestDetails(request);
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        setIsProcessing(true);
        try {
            await dispatch(userCancelConnection(selectedRequestId)).unwrap();
            toast.success("Connection cancelled successfully");
            setShowCancelModal(false);
        } catch (error) {
            toast.error("Failed to cancel connection");
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading && !userRequests.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-slate-500 font-medium">Loading your services...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                            <Trash2 className="w-8 h-8 text-red-600" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                            Delete Service Request
                        </h3>

                        <p className="text-gray-600 text-center mb-4">
                            Are you sure you want to delete this service request for <span className="font-semibold text-gray-800">{selectedRequestDetails?.vehicle_model}</span>?
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-red-800">
                                    <p className="font-semibold mb-1">Warning</p>
                                    <p>This action cannot be undone. All related data will be permanently deleted.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Keep Request
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-5 h-5" />
                                        Yes, Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Connection Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                        <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-orange-600" />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
                            Cancel Connection
                        </h3>

                        <p className="text-gray-600 text-center mb-4">
                            Are you sure you want to cancel the connection with <span className="font-semibold text-gray-800">{selectedRequestDetails?.active_connection?.workshop_name}</span>?
                        </p>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <p className="font-semibold mb-1">Important</p>
                                    <p>You will need to request a new connection if you change your mind. Any ongoing communication will be terminated.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Keep Connection
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                        Cancelling...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-5 h-5" />
                                        Yes, Cancel
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header Section */}
                <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Your Service History</h1>
                        <p className="text-gray-600">Manage and track all your service requests</p>
                    </div>
                    <button
                        onClick={() => navigate('/user/request')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                        New Service Request
                    </button>
                </div>

                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-medium">Payment Successful!</p>
                            <p className="text-sm">You can now proceed with your request.</p>
                        </div>
                    </div>
                )}

                {canceled && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="font-medium">Payment Cancelled.</p>
                    </div>
                )}

                {/* Stats Cards */}
                {userRequests && userRequests.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                                    <p className="text-3xl font-bold text-gray-800">{userRequests.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Wrench className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Active Connections</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {userRequests.filter(r => r.status === 'IN_PROGRESS' || r.status === 'CONNECTING').length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Shield className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Pending Action</p>
                                    <p className="text-3xl font-bold text-orange-600">
                                        {userRequests.filter(r => r.status === 'CREATED' || r.status === 'PLATFORM_FEE_PAID').length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Service Requests List */}
                <div className="space-y-4">
                    {userRequests && userRequests.length > 0 ? (
                        userRequests.map((request) => (
                            <div key={request.id} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-all">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{request.vehicle_type} - {request.vehicle_model}</h3>
                                        <p className="text-gray-500 text-sm flex items-center gap-2 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-gray-300">•</span>
                                            {/* <span className="text-orange-600 font-medium">
                                                Expires: {new Date(new Date(request.created_at).getTime() + 5 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span> */}
                                        </p>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider w-fit
                                         ${request.status === 'CREATED' ? 'bg-blue-100 text-blue-700' :
                                            request.status === 'PLATFORM_FEE_PAID' ? 'bg-indigo-100 text-indigo-700' :
                                                request.status === 'CONNECTING' ? 'bg-purple-100 text-purple-700' :
                                                    request.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700' :
                                                        request.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'}`}>
                                        {request.status.replace('_', ' ')}
                                    </div>
                                </div>

                                <div className="text-gray-600 text-sm mb-4 bg-gray-50 rounded-lg p-4">
                                    <p className="font-semibold mb-2 flex items-center gap-2 text-gray-700">
                                        <Wrench className="w-4 h-4 text-blue-600" />
                                        {request.issue_category}
                                    </p>
                                    <p className="text-gray-600 leading-relaxed">{request.description}</p>
                                </div>
                                {request.status === 'EXPIRED' && request.platform_fee_paid && (
                                    <div className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-red-800">Request Expired</h4>
                                            {request.active_connection?.status === 'ACCEPTED' ? (
                                                <p className="text-sm text-red-700 mt-1">
                                                    This request has expired. Since a workshop accepted your request, the platform fee is not refundable.
                                                </p>
                                            ) : (
                                                <p className="text-sm text-red-700 mt-1">
                                                    This request has expired as no workshop was connected within 7 days.
                                                    The platform fee has been refunded to your wallet.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {request.status === 'EXPIRED' && !request.platform_fee_paid && (
                                    <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200 flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-gray-500 mt-0.5" />
                                        <div>
                                            <h4 className="font-bold text-gray-700">Request Expired</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                This request expired because the fee was not paid within 30 minutes.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {request.active_connection ? (
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl mb-4 border border-blue-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 flex items-center justify-between">
                                            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Connected Workshop</span>
                                            {request.status === 'CONNECTING' && request.active_connection.requested_at && (
                                                <ExpirationTimer requestedAt={request.active_connection.requested_at} />
                                            )}
                                        </h4>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-800 text-lg mb-1">{request.active_connection.workshop_name}</p>
                                                <p className="text-sm text-gray-600 flex items-center gap-1">
                                                    <MapPin className="w-4 h-4 text-blue-600" />
                                                    {request.active_connection.address}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : request.latest_connection && request.latest_connection.status === 'AUTO_REJECTED' ? (
                                    <div className="bg-red-50 p-5 rounded-xl mb-4 border border-red-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" /> Auto Rejected
                                        </h4>
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-gray-700 text-sm mb-1">
                                                    Request to <span className="font-bold">{request.latest_connection.workshop_name}</span> was auto-rejected due to no response.
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Please try connecting to another workshop.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="flex flex-wrap gap-3">
                                    {(request.status === 'CREATED' || request.status === 'PLATFORM_FEE_PAID') && (
                                        <button
                                            onClick={() => navigate(`/user/workshops-nearby/${request.id}`)}
                                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                        >
                                            <Shield className="w-4 h-4" />
                                            Find & Connect
                                        </button>
                                    )}

                                    {!request.platform_fee_paid && ['CREATED', 'CANCELLED', 'EXPIRED'].includes(request.status) && (
                                        <button
                                            onClick={() => handleDeleteClick(request)}
                                            className="px-6 py-2.5 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-all border-2 border-red-200 flex items-center gap-2 hover:shadow-md"
                                        >
                                            <Trash2 className="w-4 h-4" /> Delete Request
                                        </button>
                                    )}

                                    {['CONNECTING', 'CONNECTED', 'ESTIMATE_SHARED', 'SERVICE_AMOUNT_PAID', 'IN_PROGRESS'].includes(request.status) && (
                                        <div className="flex gap-3 flex-wrap w-full sm:w-auto">
                                            {request.status === 'CONNECTING' ? (
                                                <button
                                                    disabled
                                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-gray-100 text-gray-500 rounded-lg font-semibold cursor-not-allowed border-2 border-gray-200"
                                                >
                                                    ⏳ Awaiting Response
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => navigate(`/user/service-flow/${request.id}`)}
                                                    className="flex-1 sm:flex-none px-6 py-2.5 bg-green-50 text-green-700 rounded-lg font-semibold hover:bg-green-100 border-2 border-green-200 transition-all flex items-center gap-2"
                                                >
                                                    <CheckCircle className="w-4 h-4" /> Tracking Services
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleCancelClick(request)}
                                                className="px-6 py-2.5 bg-orange-50 text-orange-600 rounded-lg font-semibold hover:bg-orange-100 transition-all border-2 border-orange-200 flex items-center gap-2 hover:shadow-md"
                                                title="Cancel Connection"
                                            >
                                                <XCircle className="w-4 h-4" /> Cancel Connection
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl shadow-md">
                            <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4">
                                <FileX className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-xl font-semibold mb-2">No service requests found</p>
                            <p className="text-gray-400 mb-6">Get started by creating your first service request</p>
                            <button
                                onClick={() => navigate('/user/request')}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Create New Request
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserServices;