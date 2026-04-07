import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  endService,
  fetchEstimates,
  fetchServiceRequestDetails,
  generateServiceOTP,
  startService,
} from '../../redux/slices/serviceRequestSlice';
import {
  FileCheck,
  CreditCard,
  Link2,
  CheckCircle,
  DollarSign,
  Wrench,
  Shield,
  Users,
  Mail,
  Phone,
  Key,
  Clock,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useServiceFlowSocket } from '../../hooks/useServiceFlowSocket';
import Chat from '../../components/Chat'
import ServiceActionButton from '../../components/ServiceActionButton'

const MechanicServiceFlow = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();
  const { currentRequest, loading, estimates } = useSelector((state) => state.serviceRequest);

  const currentRequestRef = useRef(currentRequest);
  useEffect(() => { currentRequestRef.current = currentRequest; }, [currentRequest]);

  useEffect(() => {
    if (!requestId) return;
    dispatch(fetchServiceRequestDetails(requestId));
  }, [dispatch, requestId]);

  useServiceFlowSocket(requestId, () => {
    if (requestId) dispatch(fetchServiceRequestDetails(requestId));
    const connectionId = currentRequestRef.current?.active_connection?.id;
    if (connectionId) {
        dispatch(fetchEstimates(connectionId));
      }
  });

  useEffect(() => {
    if (currentRequest?.active_connection?.id) {
      dispatch(fetchEstimates(currentRequest.active_connection.id));
    }
  }, [dispatch, currentRequest?.active_connection?.id, currentRequest?.status]);

  const currentStatus = currentRequest?.status || 'CREATED';
  const execution = currentRequest?.execution;

  const statusFlow = [
    { key: 'CREATED', label: 'Request Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Platform Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate Shared', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Service Amount Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'Service In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Service Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified & Closed', icon: Shield },
  ];

  const getCurrentStatusIndex = () =>
    statusFlow.findIndex((s) => s.key === currentStatus);

  const isStatusCompleted = (index) => index < getCurrentStatusIndex();
  const isStatusCurrent = (index) => index === getCurrentStatusIndex();

  const handleGenerateOtp = async () => {
    const executionId = execution?.id;
    if (!executionId) {
      toast.error('No execution found for this request');
      return;
    }
    try {
      await dispatch(generateServiceOTP(executionId)).unwrap();
      toast.success('OTP generated and sent to the customer via email.');
    } catch (e) {
      toast.error(typeof e === 'string' ? e : e?.error || 'Failed to generate OTP');
    }
  };

  if (loading && !currentRequest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          <p className="text-slate-500 font-medium">Loading service details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Service Flow
          </h1>
          <p className="text-gray-600">
            Request ID: #{requestId} | Customer:{' '}
            {currentRequest?.user_name || 'Customer'}
          </p>
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
                  <div
                    key={status.key}
                    className="relative z-10 flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white ${
                        completed
                          ? 'bg-green-500'
                          : current
                          ? 'bg-orange-600 shadow-lg scale-110'
                          : 'bg-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                    </div>
                    <p
                      className={`text-[10px] md:text-xs text-center mt-2 font-bold px-1 ${
                        completed || current ? 'text-gray-900' : 'text-gray-400'
                      }`}
                    >
                      {status.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <ServiceActionButton
          currentStatus={currentStatus}
          onStart={async () => {
            try {
              await dispatch(startService(requestId)).unwrap();
              toast.success('Service started successfully!');
            } catch (e) {
              toast.error(e || 'Failed to start service');
            }
          }}
          onEnd={async () => {
            toast((t) => (
              <div className="flex flex-col gap-3">
                <div className="font-medium text-gray-900">
                  Are you sure the service is completely finished?
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      toast.dismiss(t.id);
                      try {
                        await dispatch(endService(requestId)).unwrap();
                        dispatch(fetchServiceRequestDetails(requestId)); // sync
                        toast.success('Service marked as completed!');
                      } catch (e) {
                        toast.error(e || 'Failed to finish service');
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            ), { position: 'top-center' });
          }}
          loading={loading}
          disabled={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left: Chat Section */}
          <div className="lg:col-span-2">
            <Chat
              serviceRequestId={requestId} 
              canChat={!!currentRequest?.active_connection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)} 
              headerTitle="Service Chat Area" 
              headerSubtitle="Connected with Workshop and Client"
            />
          </div>

          {/* Right: Side Panel */}
          <div className="space-y-6">
            {/* Request Details */}
            {currentRequest && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  Request Details
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold text-gray-800">
                    {currentRequest.vehicle_type} - {currentRequest.vehicle_model}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-semibold text-gray-800">
                    Issue:&nbsp;
                  </span>
                  {currentRequest.issue_category}
                </p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                  {currentRequest.description}
                </div>
              </div>
            )}

            {/* Estimate Breakdown (Detailed Read-Only) */}
            {estimates && estimates.length > 0 && (
              (() => {
                const activeEstimate = estimates.find(e => e.status === 'SENT' || e.status === 'APPROVED') || estimates[0];
                
                return (
                  <div className="bg-white rounded-2xl shadow-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      Estimate Breakdown
                    </h3>
                    
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                          activeEstimate.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {activeEstimate.status === 'APPROVED' && <CheckCircle className="w-3 h-3" />}
                          {activeEstimate.status}
                        </span>
                      </div>

                      {/* Line Items Map */}
                      {activeEstimate.line_items && activeEstimate.line_items.length > 0 && (
                        <div className="bg-white/60 rounded-xl p-3 space-y-2">
                          {activeEstimate.line_items.map((item, index) => (
                            <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                              <div className="flex-1">
                                <p className="font-medium text-gray-800 text-sm">{item.description}</p>
                                <p className="text-xs text-gray-500">
                                  {item.item_type} • {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                                </p>
                              </div>
                              <p className="font-semibold text-gray-800 text-sm">₹{parseFloat(item.total).toFixed(2)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Totals */}
                      <div className="bg-white/80 rounded-xl p-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-800">₹{parseFloat(activeEstimate.subtotal).toFixed(2)}</span>
                        </div>
                        {parseFloat(activeEstimate.tax_amount) > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tax</span>
                            <span className="font-medium text-gray-800">₹{parseFloat(activeEstimate.tax_amount).toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-green-200 mt-2">
                          <span className="font-bold text-gray-800">Total Amount</span>
                          <span className="font-bold text-lg text-green-700">₹{parseFloat(activeEstimate.total_amount).toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-xs pt-2">
                        <span className="text-gray-600">Escrow Status</span>
                        <span className={`font-semibold ${execution?.escrow_paid ? 'text-green-700' : 'text-amber-700'}`}>
                          {execution?.escrow_paid ? 'Paid (in escrow)' : 'Not yet paid'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Service Personnel */}
            {execution && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Service Personnel
                </h3>
                <div className="space-y-3">
                  {execution.lead_technician && (
                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                          {execution.lead_technician.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">
                            {execution.lead_technician.name}
                          </p>
                          <p className="text-xs text-orange-600 font-semibold uppercase">
                            Workshop Admin (Lead)
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <Mail className="w-3 h-3" />
                            {execution.lead_technician.email}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {execution.mechanics &&
                    execution.mechanics.length > 0 &&
                    execution.mechanics.map((mechanic) => (
                      <div
                        key={mechanic.id}
                        className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-bold">
                            {mechanic.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{mechanic.name}</p>
                            <p className="text-xs text-gray-600 font-semibold uppercase">
                              Mechanic
                            </p>
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

                  {!execution.lead_technician &&
                    (!execution.mechanics || execution.mechanics.length === 0) && (
                      <div className="text-center py-6 text-gray-500">
                        <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No personnel assigned yet</p>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Completion OTP */}
            {execution?.escrow_paid && currentStatus === 'COMPLETED' && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <Key className="w-5 h-5 text-orange-600" />
                  Completion OTP
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  After you have finished the service, generate an OTP. The customer
                  will receive it by email and must enter it in their app to confirm
                  completion and release payment.
                </p>
                <button
                  onClick={handleGenerateOtp}
                  disabled={!execution?.escrow_paid}
                  className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 transition-all font-semibold shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  {execution?.escrow_paid
                    ? 'Send OTP to Customer'
                    : 'Waiting for escrow payment'}
                </button>
                {!execution?.escrow_paid && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    OTP can be generated only after the user has paid the service
                    amount (escrow).
                  </p>
                )}
              </div>
            )}

            {/* Service Timing */}
            {execution && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Service Timing
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Started At</span>
                    <span>
                      {execution.started_at
                        ? new Date(execution.started_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed At</span>
                    <span>
                      {execution.completed_at
                        ? new Date(execution.completed_at).toLocaleString()
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicServiceFlow;

