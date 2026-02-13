import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CheckCircle, Phone, Send, Star, MapPin, Mail, AlertCircle, Ban,
  DollarSign, FileCheck, Wrench, CreditCard, Shield, Clock, Link2, User, Users
} from 'lucide-react';
import { fetchNearbyWorkshops, userCancelConnection, fetchServiceRequestDetails, fetchEstimates, approveEstimate, rejectEstimate, verifyServiceOTP } from '../../redux/slices/serviceRequestSlice';
import { createEscrowCheckout, resetPaymentState } from '../../redux/slices/paymentSlice';
import Chat from '../../components/Chat';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const UserServiceFlow = () => {
  const { requestId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentRequest, loading, estimates } = useSelector((state) => state.serviceRequest);
  const { checkoutUrl: escrowCheckoutUrl, loading: escrowLoading } = useSelector((state) => state.payment);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    if (requestId) {
      // Initial fetch
      dispatch(fetchServiceRequestDetails(requestId));

      // Poll for updates every 5 seconds
      const intervalId = setInterval(() => {
        dispatch(fetchServiceRequestDetails(requestId));
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, [dispatch, requestId]);

  // Fetch estimates when there's an active connection
  useEffect(() => {
    if (currentRequest?.active_connection?.id) {
      dispatch(fetchEstimates(currentRequest.active_connection.id));
    }
  }, [dispatch, currentRequest?.active_connection?.id]);

  // Handle escrow success/cancel from Stripe redirect
  useEffect(() => {
    const escrowSuccess = searchParams.get('escrow_success');
    const escrowCanceled = searchParams.get('escrow_canceled');
    if (escrowSuccess === 'true') {
      toast.success('Payment successful. Amount is held in escrow until service completion.');
      setSearchParams({}, { replace: true });
      if (requestId) dispatch(fetchServiceRequestDetails(requestId));
    }
    if (escrowCanceled === 'true') {
      toast.error('Payment was canceled.');
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, dispatch, requestId]);

  // Redirect to Stripe when escrow checkout URL is set
  useEffect(() => {
    if (escrowCheckoutUrl) {
      window.location.href = escrowCheckoutUrl;
      dispatch(resetPaymentState());
    }
  }, [escrowCheckoutUrl, dispatch]);

  const handleCancelConnection = async () => {
    if (!requestId) return;

    // Optimistic check: if already cancelled, just notify
    if (currentRequest?.status === 'PLATFORM_FEE_PAID' && !currentRequest?.active_connection) {
      toast.success("Connection already cancelled");
      return;
    }

    try {
      const result = await dispatch(userCancelConnection(requestId)).unwrap();
      if (result) {
        toast.success("Connection cancelled successfully");
        dispatch(fetchNearbyWorkshops(requestId));
      }
    } catch (error) {
      // If backend returns 200 "Connection already cancelled", unwrap handles it as success if payload is right.
      // But if it was an error, we catch it.
      console.error(error);
      toast.error(typeof error === 'string' ? error : "Failed to cancel connection");
    }
  };

  const currentStatus = currentRequest?.status || 'CREATED';
  const connection = currentRequest?.active_connection;

  // Status Flow
  const statusFlow = [
    { key: 'CREATED', label: 'Request Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Platform Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Workshop Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate Shared', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Service Amount Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'Service In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Service Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified & Closed', icon: Shield }
  ];

  const getCurrentStatusIndex = () => {
    return statusFlow.findIndex(s => s.key === currentStatus);
  };

  const isStatusCompleted = (index) => {
    return index < getCurrentStatusIndex();
  };

  const isStatusCurrent = (index) => {
    return index === getCurrentStatusIndex();
  };

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otpValues];
      newOtp[index] = value;
      setOtpValues(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-input-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pastedData)) {
      const newOtp = pastedData.split('').concat(Array(6 - pastedData.length).fill(''));
      setOtpValues(newOtp.slice(0, 6));
      // Focus the last filled input or the first empty one
      const nextIndex = Math.min(pastedData.length, 5);
      const nextInput = document.getElementById(`otp-input-${nextIndex}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleApproveEstimate = async (estimateId) => {
    try {
      await dispatch(approveEstimate({ estimateId })).unwrap();
      toast.success('Estimate approved. Please pay to proceed.');
      if (requestId) dispatch(fetchServiceRequestDetails(requestId));
      if (currentRequest?.active_connection?.id) dispatch(fetchEstimates(currentRequest.active_connection.id));
    } catch (e) {
      toast.error(e?.error || 'Failed to approve estimate');
    }
  };

  const handleRejectEstimate = async (estimateId) => {
    try {
      await dispatch(rejectEstimate({ estimateId })).unwrap();
      toast.success('Estimate rejected. Workshop can send a new one.');
      if (requestId) dispatch(fetchServiceRequestDetails(requestId));
      if (currentRequest?.active_connection?.id) dispatch(fetchEstimates(currentRequest.active_connection.id));
    } catch (e) {
      toast.error(e?.error || 'Failed to reject estimate');
    }
  };

  const handlePayEscrow = async (estimateId) => {
    try {
      await dispatch(createEscrowCheckout({ estimateId })).unwrap();
    } catch (e) {
      toast.error(typeof e === 'string' ? e : e?.error || 'Failed to start payment');
    }
  };

  const handleVerifyOtp = async () => {
    const otp = otpValues.join('');
    if (otp.length !== 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    const executionId = currentRequest?.execution?.id;
    if (!executionId) {
      toast.error('No service execution found');
      return;
    }
    setVerifyingOtp(true);
    try {
      await dispatch(verifyServiceOTP({ executionId, otp, requestId })).unwrap();
      toast.success('Service verified. Payment has been released to the workshop.');
      setOtpValues(['', '', '', '', '', '']);
      if (requestId) dispatch(fetchServiceRequestDetails(requestId));
    } catch (e) {
      toast.error(e?.error || 'Invalid OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading && !currentRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const showCancelButton = !['SERVICE_AMOUNT_PAID', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'].includes(currentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-blue-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                Service Tracking
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">Request ID:</span>
                <span className="text-sm font-mono bg-blue-50 text-blue-700 px-3 py-1 rounded-lg font-semibold">
                  #{requestId}
                </span>
              </div>
            </div>
            {currentRequest?.created_at && (
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Created on</p>
                <p className="text-sm font-semibold text-gray-700">
                  {new Date(currentRequest.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Status Flow */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Service Progress</h2>
            <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full">
              Step {getCurrentStatusIndex() + 1} of {statusFlow.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[800px] md:min-w-0">
              <div className="flex items-center justify-between relative pb-2">
                {/* Progress Bar Background */}
                <div className="absolute top-5 md:top-7 left-0 w-full h-2 bg-gray-200 rounded-full -z-0" />

                {/* Progress Bar Fill */}
                <div
                  className="absolute top-5 md:top-7 left-0 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 -z-0"
                  style={{ width: `${(getCurrentStatusIndex() / (statusFlow.length - 1)) * 100}%` }}
                />

                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const completed = isStatusCompleted(index);
                  const current = isStatusCurrent(index);

                  return (
                    <div key={status.key} className="relative z-10 flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white shadow-md ${completed
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : current
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg scale-110 ring-4 ring-blue-200'
                          : 'bg-gray-300'
                        }`}>
                        <Icon className={`w-5 h-5 md:w-7 md:h-7 text-white ${current ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className={`text-[10px] md:text-xs text-center mt-3 font-bold px-1 max-w-[80px] md:max-w-none ${completed || current ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Chat
              serviceRequestId={requestId}
              canChat={!!connection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)}
              headerTitle={connection ? connection.workshop_name : 'Finding Workshop...'}
              headerSubtitle={connection ? 'Connected' : 'Pending'}
              headerIcon={Wrench}
              gradientFrom="from-blue-600"
              gradientTo="to-indigo-600"
              disabledMessage="Chat will be available once a workshop accepts your request and the connection is active."
            />
          </div>

          <div className="space-y-6">
            {connection && (
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-xl p-6 border border-blue-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Workshop Details</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-blue-100">
                    <p className="text-2xl font-bold text-gray-800 mb-2">{connection.workshop_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold shadow-md">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Address</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{connection.address}</p>
                      </div>
                    </div>
                    {connection.workshop_phone && (
                      <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-gray-500 mb-1">Contact</p>
                          <p className="text-sm font-semibold text-gray-700">{connection.workshop_phone}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Service Personnel Section */}
            {currentRequest?.execution && (
              <div className="bg-gradient-to-br from-white to-purple-50 rounded-2xl shadow-xl p-6 border border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">Service Personnel</h3>
                </div>

                <div className="space-y-3">
                  {/* Lead Technician */}
                  {currentRequest.execution.lead_technician && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                          {currentRequest.execution.lead_technician.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800 text-lg">{currentRequest.execution.lead_technician.name}</p>
                          <p className="text-xs text-blue-700 font-bold uppercase tracking-wide mb-2">Lead Technician</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600 bg-white rounded-lg px-3 py-1.5 inline-flex">
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            {currentRequest.execution.lead_technician.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Assigned Mechanics */}
                  {currentRequest.execution.mechanics && currentRequest.execution.mechanics.length > 0 && (
                    <>
                      {currentRequest.execution.mechanics.map((mechanic) => (
                        <div key={mechanic.id} className="bg-white rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md">
                              {mechanic.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{mechanic.name}</p>
                              <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide mb-2">Mechanic</p>
                              {mechanic.contact_number && (
                                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-1.5 inline-flex">
                                  <Phone className="w-3.5 h-3.5 text-gray-600" />
                                  {mechanic.contact_number}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* No Personnel Assigned */}
                  {!currentRequest.execution.lead_technician && (!currentRequest.execution.mechanics || currentRequest.execution.mechanics.length === 0) && (
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-gray-200">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No personnel assigned yet</p>
                      <p className="text-xs text-gray-400 mt-1">The workshop will assign technicians soon</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-xl p-6 border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Service Estimate</h3>
              </div>

              {estimates && estimates.length > 0 ? (
                (() => {
                  // Find the most recent SENT or APPROVED estimate
                  const activeEstimate = estimates.find(e => e.status === 'SENT' || e.status === 'APPROVED') || estimates[0];

                  return (
                    <div className="space-y-4">
                      {/* Estimate Status */}
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${activeEstimate.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          activeEstimate.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                            activeEstimate.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                          }`}>
                          {activeEstimate.status === 'APPROVED' && <CheckCircle className="w-4 h-4" />}
                          {activeEstimate.status}
                        </span>
                        {activeEstimate.expires_at && (
                          <span className="text-xs text-gray-500">
                            Expires: {new Date(activeEstimate.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Line Items */}
                      {activeEstimate.line_items && activeEstimate.line_items.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                          <h4 className="font-semibold text-gray-700 text-sm">Cost Breakdown</h4>
                          {activeEstimate.line_items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-2 last:border-0">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{item.description}</p>
                                <p className="text-xs text-gray-500">
                                  {item.item_type} • {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-800">₹{parseFloat(item.total).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Financial Summary */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-800">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
                        </div>
                        {parseFloat(activeEstimate.tax_amount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tax ({activeEstimate.tax_rate}%)</span>
                            <span className="font-medium text-gray-800">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                          </div>
                        )}
                        {parseFloat(activeEstimate.discount_amount) > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Discount</span>
                            <span className="font-medium text-green-600">-₹{parseFloat(activeEstimate.discount_amount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                          <span className="font-bold text-gray-800">Total Amount</span>
                          <span className="font-bold text-xl text-blue-600">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {activeEstimate.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                          <p className="text-xs font-semibold text-yellow-800 mb-1">Workshop Notes</p>
                          <p className="text-sm text-gray-700">{activeEstimate.notes}</p>
                        </div>
                      )}

                      {/* Action Buttons for SENT estimates */}
                      {activeEstimate.status === 'SENT' && (
                        <div className="space-y-2 pt-2">
                          {activeEstimate.expires_at && new Date(activeEstimate.expires_at) < new Date() && (
                            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              This estimate has expired. You can still reject it or ask the workshop for a new one.
                            </p>
                          )}
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApproveEstimate(activeEstimate.id)}
                              disabled={!!(activeEstimate.expires_at && new Date(activeEstimate.expires_at) < new Date())}
                              className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Approve Estimate
                            </button>
                            <button
                              onClick={() => handleRejectEstimate(activeEstimate.id)}
                              className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 font-semibold"
                            >
                              Reject Estimate
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Pay escrow: approved but not yet paid */}
                      {activeEstimate.status === 'APPROVED' && currentRequest?.execution && !currentRequest.execution.escrow_paid && (
                        <div className="pt-2">
                          <button
                            onClick={() => handlePayEscrow(activeEstimate.id)}
                            disabled={escrowLoading}
                            className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-5 h-5" />
                            {escrowLoading ? 'Redirecting to payment...' : `Pay ₹${parseFloat(activeEstimate.total_amount).toFixed(2)} (Escrow)`}
                          </button>
                          <p className="text-xs text-gray-500 mt-2 text-center">Amount is held securely until you verify service completion.</p>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 border-dashed min-h-[120px] flex items-center justify-center">
                  <div className="text-center">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Waiting for workshop to share estimate
                    </p>
                    <p className="text-xs text-gray-500 mt-1">You'll be notified once the estimate is ready</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {showCancelButton && (
                <button
                  onClick={handleCancelConnection}
                  className="w-full py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl">
                  <Ban className="w-5 h-5" />
                  Cancel Connection
                </button>
              )}

              <button className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all duration-300 flex items-center justify-center gap-2 font-bold shadow-lg hover:shadow-xl">
                <AlertCircle className="w-5 h-5" />
                Report a Problem
              </button>
            </div>
          </div>
        </div>

        {/* Service Completion Verification */}
        {currentRequest?.execution?.escrow_paid && currentRequest?.status !== 'VERIFIED' && (
          <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-2xl p-8 md:p-10 border border-blue-100">
            <div className="max-w-xl mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                  Service Completion Verification
                </h3>
                <p className="text-gray-600 text-sm md:text-base leading-relaxed max-w-md mx-auto">
                  Once the service is completed, the workshop will provide you with a 6-digit OTP. Enter it below to verify and release payment.
                </p>
              </div>

              {/* OTP Input Section */}
              <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-gray-100">
                <label className="block text-sm font-bold text-gray-700 mb-6 text-center uppercase tracking-wide">
                  Enter 6-Digit OTP
                </label>

                {/* OTP Input Boxes */}
                <div className="flex gap-2 md:gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                  {otpValues.map((value, index) => (
                    <input
                      key={index}
                      id={`otp-input-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={value}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      disabled={verifyingOtp || currentRequest?.status === 'VERIFIED'}
                      className="w-12 h-12 md:w-16 md:h-16 text-center text-xl md:text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-400"
                      autoComplete="off"
                    />
                  ))}
                </div>

                {/* Verify Button */}
                <button
                  onClick={handleVerifyOtp}
                  disabled={verifyingOtp || currentRequest?.status === 'VERIFIED' || otpValues.join('').length !== 6}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-bold text-base md:text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify & Complete Service
                    </>
                  )}
                </button>

                {/* Helper Text */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    💡 Tip: You can paste the OTP directly into the first box
                  </p>
                </div>
              </div>

              {/* Security Note */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">Secure Payment Release</p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Your payment is held securely in escrow. It will only be released to the workshop after you verify the service completion with the OTP.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Verified Message */}
        {currentRequest?.status === 'VERIFIED' && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-xl p-8 border border-green-200">
            <div className="text-center max-w-xl mx-auto">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-3">
                Service Verified Successfully!
              </h3>
              <p className="text-gray-600 text-sm md:text-base mb-6">
                Payment has been released to the workshop. Thank you for using our service!
              </p>
              <div className="bg-white rounded-xl p-4 inline-block">
                <p className="text-sm text-gray-600 mb-2">Rate your experience</p>
                <div className="flex gap-2 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-8 h-8 text-yellow-400 fill-yellow-400 cursor-pointer hover:scale-110 transition-transform" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserServiceFlow;