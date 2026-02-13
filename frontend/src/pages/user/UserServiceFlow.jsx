import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  CheckCircle, Phone, Send, Star, MapPin, Mail, AlertCircle, Ban,
  DollarSign, FileCheck, Wrench, CreditCard, Shield, Clock, Link2, User, Users
} from 'lucide-react';
import { fetchNearbyWorkshops, userCancelConnection, fetchServiceRequestDetails, fetchEstimates } from '../../redux/slices/serviceRequestSlice';
import Chat from '../../components/Chat';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const UserServiceFlow = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { currentRequest, loading, estimates } = useSelector((state) => state.serviceRequest);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);

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
    }
  };

  if (loading && !currentRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  const showCancelButton = !['IN_PROGRESS', 'COMPLETED', 'VERIFIED'].includes(currentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Service Tracking
          </h1>
          <p className="text-gray-600">Request ID: #{requestId}</p>
        </div>

        {/* Status Flow */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Service Progress</h2>
          <div className="min-w-[800px] md:min-w-0">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0" />

              {statusFlow.map((status, index) => {
                const Icon = status.icon;
                const completed = isStatusCompleted(index);
                const current = isStatusCurrent(index);

                return (
                  <div key={status.key} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white ${completed ? 'bg-green-500' : current ? 'bg-blue-600 shadow-lg scale-110' : 'bg-gray-300'
                      }`}>
                      <Icon className={`w-5 h-5 md:w-7 md:h-7 text-white`} />
                    </div>
                    <p className={`text-[10px] md:text-xs text-center mt-2 font-bold px-1 ${completed || current ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                      {status.label}
                    </p>
                  </div>
                );
              })}
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
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Workshop Details</h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-2xl font-bold text-gray-800">{connection.workshop_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Connected
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">{connection.address}</p>
                    </div>
                    {connection.workshop_phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <p className="text-sm text-gray-600">{connection.workshop_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Service Personnel Section */}
            {currentRequest?.execution && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Service Personnel
                </h3>

                <div className="space-y-3">
                  {/* Lead Technician */}
                  {currentRequest.execution.lead_technician && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {currentRequest.execution.lead_technician.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{currentRequest.execution.lead_technician.name}</p>
                          <p className="text-xs text-blue-600 font-semibold uppercase">Lead Technician</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Mail className="w-3 h-3" />
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
                        <div key={mechanic.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold flex-shrink-0">
                              {mechanic.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-gray-800">{mechanic.name}</p>
                              <p className="text-xs text-gray-600 font-semibold uppercase">Mechanic</p>
                              {mechanic.contact_number && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <Phone className="w-3 h-3" />
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
                    <div className="text-center py-6 text-gray-500">
                      <User className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No personnel assigned yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Service Estimate
              </h3>

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
                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => {
                              // TODO: Implement approve estimate
                              toast.success('Estimate approval feature coming soon!');
                            }}
                            className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-semibold"
                          >
                            Approve Estimate
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Implement reject estimate
                              toast.error('Estimate rejection feature coming soon!');
                            }}
                            className="flex-1 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 font-semibold"
                          >
                            Reject Estimate
                          </button>
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
                  className="w-full py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 flex items-center justify-center gap-2 font-semibold">
                  <Ban className="w-5 h-5" />
                  Cancel Connection
                </button>
              )}

              <button className="w-full py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all duration-300 flex items-center justify-center gap-2 font-semibold">
                <AlertCircle className="w-5 h-5" />
                Report a Problem
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Service Completion Verification</h3>
              <p className="text-gray-600">
                Service provider will share an OTP after service completion. Enter OTP to confirm completion.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                Enter 6-Digit OTP
              </label>
              <div className="flex gap-3 justify-center mb-6">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />
                ))}
              </div>

              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl">
                Verify & Complete Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserServiceFlow;