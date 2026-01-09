import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapPin, Star, ArrowRight, Shield, Search, SlidersHorizontal, CheckCircle, AlertCircle, X, CreditCard, AlertTriangle, Clock, Wallet, Zap, Award, TrendingUp } from 'lucide-react';
import { fetchNearbyWorkshops, userCancelConnection, userConnectToWorkshop } from '../../redux/slices/serviceRequestSlice';

import { initiatePlatformFeePayment, payPlatformFeeWithWallet } from '../../redux/slices/paymentSlice';
import { fetchWallet } from '../../redux/slices/walletSlice';
import { toast } from 'react-hot-toast';

const UserWorkshopNearby = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { requestId } = useParams();

  const { nearbyWorkshops, currentRequest, loading } = useSelector((state) => state.serviceRequest);
  const { loading: paymentLoading } = useSelector((state) => state.payment);
  const { balance } = useSelector((state) => state.wallet);

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
  const [paymentMethod, setPaymentMethod] = useState('stripe');

  useEffect(() => {
    if (!currentRequest || currentRequest.id !== parseInt(requestId)) {
      dispatch(fetchNearbyWorkshops(requestId));
    }
    dispatch(fetchWallet());
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent absolute top-0 left-0"></div>
          </div>
          <p className="text-slate-600 font-semibold text-lg">Finding nearby experts...</p>
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
      if (paymentMethod === 'wallet') {
        const resultAction = await dispatch(payPlatformFeeWithWallet({
          serviceRequestId: currentRequest.id
        }));

        if (payPlatformFeeWithWallet.fulfilled.match(resultAction)) {
          const data = resultAction.payload;
          toast.success("Payment successful!");
          await dispatch(fetchNearbyWorkshops(requestId));
          await dispatch(fetchWallet());
          setShowPaymentModal(false);
          if (selectedWorkshop) {
            await connectToWorkshop(selectedWorkshop.id);
          }
          setIsProcessing(false);
        } else {
          toast.error(resultAction.payload || "Wallet payment failed.");
          setIsProcessing(false);
        }

      } else {
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
      }
    } catch (error) {
      console.error("Error processing payment:", error);
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
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <Star className="w-4 h-4 text-slate-300 absolute" />
            <div className="overflow-hidden w-2 absolute">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <Star key={i} className="w-4 h-4 text-slate-300" />
        );
      }
    }
    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mx-auto mb-6 shadow-lg shadow-blue-200">
              <CreditCard className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-3xl font-bold text-slate-900 text-center mb-3">
              Platform Fee Required
            </h3>

            <p className="text-slate-600 text-center mb-8 leading-relaxed">
              To connect with <span className="font-bold text-slate-900">{selectedWorkshop?.name}</span>, you need to pay a one-time platform fee. This allows you to connect with any workshop.
            </p>

            <div className="space-y-3 mb-8">
              <div
                onClick={() => setPaymentMethod('stripe')}
                className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'stripe' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-slate-50 border-2 border-slate-200 hover:border-blue-300 hover:shadow'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${paymentMethod === 'stripe' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                    <CreditCard className={`w-5 h-5 ${paymentMethod === 'stripe' ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-lg mb-1 ${paymentMethod === 'stripe' ? 'text-blue-900' : 'text-slate-700'}`}>
                      Pay with Card
                    </p>
                    <p className="text-slate-600 text-sm">Secure payment via Stripe Checkout</p>
                  </div>
                  {paymentMethod === 'stripe' && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod('wallet')}
                className={`relative rounded-2xl p-5 cursor-pointer transition-all duration-200 ${
                  paymentMethod === 'wallet' 
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-500 shadow-md' 
                    : 'bg-slate-50 border-2 border-slate-200 hover:border-blue-300 hover:shadow'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${paymentMethod === 'wallet' ? 'bg-blue-500' : 'bg-slate-300'}`}>
                    <Wallet className={`w-5 h-5 ${paymentMethod === 'wallet' ? 'text-white' : 'text-slate-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`font-bold text-lg ${paymentMethod === 'wallet' ? 'text-blue-900' : 'text-slate-700'}`}>
                        Pay with Wallet
                      </p>
                      <span className="font-bold text-slate-900 text-lg">${balance}</span>
                    </div>
                    <p className="text-slate-600 text-sm">Use your available wallet balance</p>
                    {balance < 5.00 && (
                      <p className="text-red-600 text-xs mt-2 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Insufficient balance. Please top up.
                      </p>
                    )}
                  </div>
                  {paymentMethod === 'wallet' && (
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentConfirm}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 transform transition-all animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mx-auto mb-6 shadow-lg shadow-red-200">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>

            <h3 className="text-3xl font-bold text-slate-900 text-center mb-3">
              Confirm Disconnection
            </h3>

            <p className="text-slate-600 text-center mb-6 leading-relaxed">
              Are you sure you want to disconnect from this workshop? You will need to request a new connection if you change your mind.
            </p>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-8">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-bold mb-1">Important</p>
                  <p>This action cannot be undone. Any ongoing communication will be terminated.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectModal(false)}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Keep Connected
              </button>
              <button
                onClick={handleDisconnectConfirm}
                disabled={isProcessing}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
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

      {/* Expired Overlay */}
      {currentRequest?.status === 'EXPIRED' && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 text-center border-2 border-slate-200">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-200">
              <Clock className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Request Expired</h2>
            <p className="text-slate-600 text-lg mb-8 leading-relaxed">
              This service request has expired and is no longer active.
              {currentRequest.platform_fee_paid
                ? " The platform fee has been refunded to your wallet."
                : " Please create a new request to continue."}
            </p>
            <button
              onClick={() => navigate('/user/services')}
              className="px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold rounded-xl hover:from-slate-900 hover:to-black shadow-lg transition-all"
            >
              Back to Services
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <Zap className="w-4 h-4" />
            <span>Fast Response</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">
            Nearby Workshops
          </h1>
          <p className="text-slate-600 text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Showing workshops near {currentRequest?.vehicle_model || "your location"}
          </p>
        </div>

        {showSuccessMessage && (
          <div className="mb-8 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 text-emerald-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-emerald-500 rounded-xl">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">Payment Successful!</p>
                <p className="text-sm text-emerald-700">Platform fee paid. You can now connect with workshops.</p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-emerald-700 hover:text-emerald-900 p-2 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {showCancelMessage && (
          <div className="mb-8 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 text-red-800 px-6 py-4 rounded-2xl flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-500 rounded-xl">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg">Payment Cancelled</p>
                <p className="text-sm text-red-700">You need to pay the platform fee to connect with workshops.</p>
              </div>
            </div>
            <button
              onClick={() => setShowCancelMessage(false)}
              className="text-red-700 hover:text-red-900 p-2 hover:bg-red-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Found Nearby</p>
            <p className="text-4xl font-bold text-slate-900">{nearbyWorkshops.length}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <Zap className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Closest Workshop</p>
            <p className="text-4xl font-bold text-emerald-600">
              {nearbyWorkshops.length > 0 ? `${nearbyWorkshops[0].distance}km` : 'N/A'}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-slate-100 hover:shadow-xl transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6 text-white" />
              </div>
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Top Rated</p>
            <p className="text-4xl font-bold text-amber-600">
              {nearbyWorkshops.length > 0
                ? Math.max(...nearbyWorkshops.map(w => w.rating_avg)).toFixed(1)
                : '0.0'}
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search workshops by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 font-medium"
              />
            </div>

            <div className="relative group">
              <SlidersHorizontal className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-12 pr-10 py-4 border-2 border-slate-200 rounded-xl bg-white cursor-pointer outline-none appearance-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all text-slate-900 font-medium min-w-[200px]"
              >
                <option value="distance">Sort by Distance</option>
                <option value="rating">Sort by Rating</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Workshop Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedWorkshops.map((workshop) => {
            const connection = currentRequest?.active_connection;
            const isConnectedToThis = connection?.workshop_id === workshop.id;
            const isConnectedToAny = !!connection;

            return (
              <div
                key={workshop.id}
                className="group bg-white rounded-3xl shadow-lg border-2 border-slate-100 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
              >
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 pb-20">
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">
                    <Shield className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white">Verified</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="text-xs text-blue-100 font-semibold uppercase tracking-wide">Distance</span>
                      <p className="text-white font-bold text-2xl">{workshop.distance} km</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 -mt-12">
                  <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border-2 border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {workshop.workshop_name}
                    </h3>

                    <div className="flex items-start gap-2 text-slate-600 mb-4">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-1 text-blue-500" />
                      <p className="text-sm leading-relaxed line-clamp-2">{workshop.address_line}, {workshop.city}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t-2 border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">{renderStars(workshop.rating_avg)}</div>
                        <span className="text-sm font-bold text-slate-900">{Number(workshop.rating_avg).toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Award className="w-4 h-4" />
                        <span className="text-xs font-semibold">Top Rated</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-auto">
                    {(() => {
                      if (isConnectedToThis) {
                        if (connection.status === 'REQUESTED') {
                          return (
                            <div className="flex gap-2 w-full">
                              <button 
                                disabled 
                                className="flex-1 py-3.5 bg-slate-200 text-slate-500 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <Clock className="w-5 h-5" />
                                Request Sent
                              </button>
                              <button
                                onClick={() => handleDisconnectClick(currentRequest.id)}
                                className="px-4 py-3.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 active:scale-95 transition-all flex items-center justify-center group"
                                title="Cancel Request"
                              >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="flex gap-2 w-full">
                            <button 
                              disabled 
                              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Connected
                            </button>
                            <button
                              onClick={() => handleDisconnectClick(currentRequest.id)}
                              className="px-4 py-3.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 active:scale-95 transition-all flex items-center justify-center group"
                              title="Disconnect"
                            >
                              <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            </button>
                          </div>
                        );
                      }

                      if (isConnectedToAny) {
                        return (
                          <button 
                            disabled 
                            className="w-full py-3.5 bg-slate-200 text-slate-500 font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Shield className="w-5 h-5" />
                            Unavailable
                          </button>
                        );
                      }

                      return (
                        <button
                          onClick={() => handleConnect(workshop.id, workshop.workshop_name)}
                          className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 active:scale-95 transition-all flex items-center justify-center gap-2 group"
                        >
                          Connect Now
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sortedWorkshops.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl shadow-lg border-2 border-slate-100">
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Workshops Found</h3>
            <p className="text-slate-600 text-lg">
              {searchTerm 
                ? "Try adjusting your search filters"
                : "No workshops found within 20km radius"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWorkshopNearby;