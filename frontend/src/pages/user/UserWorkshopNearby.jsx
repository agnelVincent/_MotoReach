import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Shield, Search, SlidersHorizontal, CheckCircle, AlertCircle, X, CreditCard, AlertTriangle, Clock } from 'lucide-react';
import { fetchNearbyWorkshops, userCancelConnection, userConnectToWorkshop } from '../../redux/slices/serviceRequestSlice';
import { initiatePlatformFeePayment } from '../../redux/slices/paymentSlice';
import { toast } from 'react-hot-toast';

const UserWorkshopNearby = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { requestId } = useParams();

  const { nearbyWorkshops, currentRequest, loading } = useSelector((state) => state.serviceRequest);
  const { loading: paymentLoading } = useSelector((state) => state.payment);

  const queryParams = new URLSearchParams(location.search);
  const paymentSuccess = queryParams.get('payment_success');
  const paymentCanceled = queryParams.get('payment_canceled');
  const [showSuccessMessage, setShowSuccessMessage] = useState(!!paymentSuccess);
  const [showCancelMessage, setShowCancelMessage] = useState(!!paymentCanceled);
  const [urlParamsCleared, setUrlParamsCleared] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance');

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!currentRequest || currentRequest.id !== parseInt(requestId)) {
      dispatch(fetchNearbyWorkshops(requestId));
    }
  }, [dispatch, requestId, currentRequest]);

  useEffect(() => {
    if (paymentCanceled && !urlParamsCleared) {
      setTimeout(() => {
        navigate(`/user/workshops-nearby/${requestId}`, { replace: true });
        setUrlParamsCleared(true);
      }, 100);
    }
  }, [paymentCanceled, requestId, navigate, urlParamsCleared]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-slate-500 font-medium">Finding nearby experts...</p>
        </div>
      </div>
    );
  }

  const filteredWorkshops = nearbyWorkshops.filter(workshop =>
    workshop.workshop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workshop.address_line.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedWorkshops = [...filteredWorkshops].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating_avg - a.rating_avg;
    } else if (sortBy === 'distance') {
      return a.distance - b.distance;
    }
    return 0;
  });

  const handleConnect = async (workshopId, workshopName) => {
    if (!currentRequest?.platform_fee_paid) {
      setSelectedWorkshop({ id: workshopId, name: workshopName });
      setShowPaymentModal(true);
      return;
    }
    await connectToWorkshop(workshopId);
  };

  const handlePaymentConfirm = async () => {
    setIsProcessing(true);
    try {
      const resultAction = await dispatch(initiatePlatformFeePayment({
        serviceRequestId: currentRequest.id
      }));

      if (initiatePlatformFeePayment.fulfilled.match(resultAction)) {
        const data = resultAction.payload;

        if (data.message === 'Platform fee already paid') {
          await dispatch(fetchNearbyWorkshops(requestId));
          setShowPaymentModal(false);
          await connectToWorkshop(selectedWorkshop.id);
          setIsProcessing(false);
          return;
        }

        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.error(resultAction.payload || "Failed to initiate payment. Please try again.");
        setIsProcessing(false);
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("An unexpected error occurred.");
      setIsProcessing(false);
      setShowPaymentModal(false);
    }
  };

  const connectToWorkshop = async (workshopId) => {
    try {
      await dispatch(userConnectToWorkshop({ requestId, workshopId })).unwrap();
      toast.success("Connection request sent successfully!");
      dispatch(fetchNearbyWorkshops(requestId));
    } catch (error) {
      console.error("Error connecting to workshop:", error);
      const errorMessage = error.error || error.message || (typeof error === 'string' ? error : "Failed to connect. Please try again.");
      toast.error(errorMessage);
    }
  };

  const handleDisconnectClick = (serviceRequestId) => {
    setSelectedRequestId(serviceRequestId);
    setShowDisconnectModal(true);
  };

  const handleDisconnectConfirm = async () => {
    setIsProcessing(true);
    try {
      await dispatch(userCancelConnection(selectedRequestId)).unwrap();
      toast.success("Disconnected successfully");
      dispatch(fetchNearbyWorkshops(requestId));
      setShowDisconnectModal(false);
    } catch (error) {
      toast.error("Failed to disconnect");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
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
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Platform Fee Required
            </h3>

            <p className="text-gray-600 text-center mb-6">
              To connect with <span className="font-semibold text-gray-800">{selectedWorkshop?.name}</span>, you need to pay a one-time platform fee. This allows you to connect with any workshop.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Secure Payment</p>
                  <p>Your payment is processed securely through Stripe. Connect with confidence.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>

            <h3 className="text-2xl font-bold text-gray-800 text-center mb-2">
              Confirm Disconnection
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to disconnect from this workshop? You will need to request a new connection if you change your mind.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Important</p>
                  <p>This action cannot be undone. Any ongoing communication will be terminated.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Connected
              </button>
              <button
                onClick={handleDisconnectConfirm}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Disconnecting...
                  </>
                ) : (
                  'Yes, Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expired Overlay/Message */}
      {
        currentRequest?.status === 'EXPIRED' && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 text-center border border-gray-200">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Request Expired</h2>
              <p className="text-gray-600 text-lg mb-8">
                This service request has expired and is no longer active.
                {currentRequest.platform_fee_paid
                  ? " The platform fee has been refunded to your wallet."
                  : " Please create a new request to continue."}
              </p>
              <button
                onClick={() => navigate('/user/services')}
                className="px-8 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors"
              >
                Back to Services
              </button>
            </div>
          </div>
        )
      }

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

        {showSuccessMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Payment Successful!</p>
                <p className="text-sm">Platform fee paid. You can now connect with workshops.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-700 hover:text-green-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {showCancelMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Payment Cancelled</p>
                <p className="text-sm">You need to pay the platform fee to connect with workshops.</p>
              </div>
            </div>
            <button
              onClick={() => setShowCancelMessage(false)}
              className="text-red-700 hover:text-red-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

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

                <div className="mt-auto">
                  {(() => {
                    const connection = currentRequest?.active_connection;
                    const isConnectedToThis = connection?.workshop_id === workshop.id;
                    const isConnectedToAny = !!connection;

                    if (isConnectedToThis) {
                      if (connection.status === 'REQUESTED') {
                        return (
                          <div className="flex gap-2 w-full">
                            <button disabled className="flex-1 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                              Request Sent
                            </button>
                            <button
                              onClick={() => handleDisconnectClick(currentRequest.id)}
                              className="px-4 py-3 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                              title="Cancel Request"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        );
                      }
                      return (
                        <div className="flex gap-2 w-full">
                          <button disabled className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                            Connected <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDisconnectClick(currentRequest.id)}
                            className="px-4 py-3 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                            title="Disconnect"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      );
                    }

                    if (isConnectedToAny) {
                      return (
                        <button disabled className="w-full py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                          Unavailable
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={() => handleConnect(workshop.id, workshop.workshop_name)}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                      >
                        Connect Now
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedWorkshops.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl font-semibold text-gray-800">No workshops found within 20km</p>
          </div>
        )}
      </div>
    </div >
  );
};

export default UserWorkshopNearby;