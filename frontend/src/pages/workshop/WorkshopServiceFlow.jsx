import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  CheckCircle, Phone, Send, User, Mail, UserMinus, UserPlus, DollarSign,
  Shield, AlertCircle, FileCheck, CreditCard, Wrench, Link2, Key, Eye, EyeOff, X, Ban
} from 'lucide-react';
import {
  fetchServiceRequestDetails,
  fetchWorkshopMechanics,
  assignMechanic,
  removeMechanic,
  generateServiceOTP,
  cancelRequestWorkshop,
  fetchEstimates,
  startService,
  endService,
  clearCurrentRequest
} from '../../redux/slices/serviceRequestSlice';
import { toast } from 'react-hot-toast';
import Chat from '../../components/Chat';
import EstimateManager from '../../components/EstimateManager';
import { useServiceFlowSocket } from '../../hooks/useServiceFlowSocket';
import ReportComplaintModal from '../../components/ReportComplaintModal';
import ServiceActionButton from '../../components/ServiceActionButton';

const WorkshopServiceFlow = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();

  const { currentRequest, mechanics: workshopMechanics, loading } = useSelector((state) => state.serviceRequest);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!requestId) return;
    dispatch(fetchServiceRequestDetails(requestId));
    return () => {
      dispatch(clearCurrentRequest());
    };
  }, [dispatch, requestId]);

  useServiceFlowSocket(requestId, () => {
    if (requestId) {
      dispatch(fetchServiceRequestDetails(requestId));
      const connectionId = currentRequest?.active_connection?.id;
      if (connectionId) {
        setTimeout(() => {
          dispatch(fetchEstimates(connectionId));
        }, 300);
      }
    }
  }, 'workshop');

  const currentStatus = currentRequest?.status || 'CREATED';
  const activeConnection = currentRequest?.active_connection;

  const statusFlow = [
    { key: 'CREATED', label: 'Request Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Platform Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate Shared', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Service Amount Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'Service In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Service Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified & Closed', icon: Shield }
  ];

  const getCurrentStatusIndex = () => statusFlow.findIndex(s => s.key === currentStatus);
  const isStatusCompleted = (index) => index < getCurrentStatusIndex();
  const isStatusCurrent = (index) => index === getCurrentStatusIndex();

  const handleGenerateOtp = async () => {
    const executionId = currentRequest?.execution?.id;
    if (!executionId) { toast.error('No execution found'); return; }
    try {
      await dispatch(generateServiceOTP(executionId)).unwrap();
      toast.success('OTP generated and sent to the customer via email.');
    } catch (e) {
      toast.error(e?.error || e?.message || 'Failed to generate OTP');
    }
  };

  const handleAssignMechanic = async (mechanicId) => {
    try {
      await dispatch(assignMechanic({ serviceRequestId: requestId, mechanicId })).unwrap();
      toast.success('Mechanic assigned successfully');
      setShowAssignModal(false);
    } catch (error) {
      toast.error(error.message || 'Failed to assign');
    }
  };

  const handleRemoveMechanic = async (mechanicId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="font-medium text-gray-900">Are you sure you want to remove this mechanic?</div>
        <div className="flex gap-2">
          <button onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              await dispatch(removeMechanic({ serviceRequestId: requestId, mechanicId })).unwrap();
              toast.success('Mechanic removed successfully');
            } catch (error) {
              toast.error(error.message || 'Failed to remove');
            }
          }} className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">
            Remove
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  if (loading && !currentRequest) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="font-body text-gray-500 text-sm">Loading service details…</p>
        </div>
      </div>
    );
  }

  const execution = currentRequest?.execution;
  const leadTechnician = execution?.lead_technician;
  const assignedMechanics = execution?.mechanics || [];
  const availableMechanics = workshopMechanics.filter(m =>
    m.availability === 'AVAILABLE' && !assignedMechanics.some(am => am.id === m.id)
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');

        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

        .ws-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
        }
        .ws-hero-noise::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4;
          pointer-events: none;
        }
        .glow-dot {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .badge-pill {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .section-label {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.7rem;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }

        .ws-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
          transition: box-shadow 0.2s ease;
        }
        .ws-card:hover { box-shadow: 0 8px 30px rgba(99,102,241,0.07); }

        /* Status track */
        .status-track-bg {
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 32px 32px;
        }

        .step-done  { background: #10b981; }
        .step-active {
          background: linear-gradient(135deg, #6366f1, #7c3aed);
          box-shadow: 0 0 0 4px rgba(99,102,241,0.2), 0 4px 12px rgba(99,102,241,0.4);
        }
        .step-idle  { background: #e2e8f0; }

        .action-btn {
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .action-btn:hover { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        .personnel-card {
          border: 1px solid #f1f5f9;
          border-radius: 0.875rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .personnel-card:hover {
          border-color: #e0e7ff;
          box-shadow: 0 4px 16px rgba(99,102,241,0.08);
        }

        /* Modal */
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.93); }
          to   { opacity: 1; transform: scale(1); }
        }
        .modal-enter { animation: zoomIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── HERO HEADER ── */}
      <div className="ws-hero ws-hero-noise relative overflow-hidden">
        <div className="glow-dot w-80 h-80 bg-indigo-500 opacity-20 -top-20 -left-10" />
        <div className="glow-dot w-56 h-56 bg-violet-400 opacity-15 top-10 right-16" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="section-label text-white/80">Workshop Dashboard</span>
          </div>

          <h1 className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-2 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Service Management
          </h1>
          <p className={`font-body text-white/50 text-sm md:text-base opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            Request&nbsp;
            <span className="text-white/80 font-semibold">#{requestId}</span>
            &nbsp;·&nbsp;Customer:&nbsp;
            <span className="text-white/80 font-semibold">{currentRequest?.user_name || 'Customer'}</span>
          </p>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── STATUS FLOW ── */}
        <div className="ws-card status-track-bg p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="section-label text-indigo-500">Progress</span>
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900 mb-6">Service Status</h2>

          {/* Scrollable on mobile */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[720px] md:min-w-0 relative">
              {/* Track line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0" />
              {/* Filled progress line */}
              <div
                className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-indigo-500 z-0 transition-all duration-700"
                style={{ width: `${(getCurrentStatusIndex() / (statusFlow.length - 1)) * 100}%` }}
              />

              <div className="relative z-10 flex items-start justify-between">
                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const completed = isStatusCompleted(index);
                  const current = isStatusCurrent(index);
                  return (
                    <div key={status.key} className="flex flex-col items-center flex-1 gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 ${completed ? 'step-done' : current ? 'step-active' : 'step-idle'}`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className={`text-[10px] text-center font-display font-semibold leading-tight px-0.5 ${completed || current ? 'text-gray-800' : 'text-gray-400'}`}>
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── SERVICE ACTION BUTTON ── */}
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
                <div className="font-medium text-gray-900">Are you sure the service is completely finished?</div>
                <div className="flex gap-2">
                  <button onClick={() => toast.dismiss(t.id)}
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
                    Cancel
                  </button>
                  <button onClick={async () => {
                    toast.dismiss(t.id);
                    try {
                      await dispatch(endService(requestId)).unwrap();
                      dispatch(fetchServiceRequestDetails(requestId));
                      toast.success('Service marked as completed!');
                    } catch (e) {
                      toast.error(e || 'Failed to finish service');
                    }
                  }} className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Confirm
                  </button>
                </div>
              </div>
            ), { position: 'top-center' });
          }}
          loading={loading}
          disabled={loading}
        />

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Chat */}
          <div className="lg:col-span-2">
            <div className="ws-card overflow-hidden h-full">
              <Chat
                key={requestId}
                serviceRequestId={requestId}
                canChat={!!activeConnection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)}
                headerTitle={currentRequest?.user_name ? `Chat with ${currentRequest.user_name}` : 'In-App Chat'}
                headerSubtitle="Communication Channel"
                headerIcon={User}
                gradientFrom="from-indigo-600"
                gradientTo="to-violet-600"
                disabledMessage="Chat will be available when this service has an accepted, active connection."
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">

            {/* ── Personnel Card ── */}
            <div className="ws-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="section-label text-indigo-500 block mb-0.5">Team</span>
                  <h3 className="font-display font-bold text-gray-900 text-lg">Service Personnel</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(true);
                    if (!workshopMechanics.length) dispatch(fetchWorkshopMechanics());
                  }}
                  className="action-btn w-9 h-9 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100"
                  title="Add Mechanic"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Lead Technician */}
                {leadTechnician && (
                  <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0">
                        {leadTechnician.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display font-bold text-gray-900 text-sm truncate">{leadTechnician.name}</p>
                        <p className="section-label text-indigo-500 text-[9px]">Workshop Admin · Lead</p>
                        <p className="font-body text-gray-400 text-xs truncate">{leadTechnician.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Mechanics */}
                {assignedMechanics.map((mechanic) => (
                  <div key={mechanic.id} className="personnel-card bg-white p-4 relative group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-display font-bold text-sm flex-shrink-0">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display font-bold text-gray-900 text-sm truncate">{mechanic.name}</p>
                        <p className="section-label text-blue-500 text-[9px]">Mechanic</p>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{mechanic.contact_number || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMechanic(mechanic.id)}
                      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {assignedMechanics.length === 0 && !leadTechnician && (
                  <div className="text-center py-6 text-gray-400">
                    <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-body text-sm">No personnel assigned yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Estimate Manager ── */}
            {activeConnection && activeConnection.status === 'ACCEPTED' && (
              <div className="ws-card overflow-hidden max-w-full">
                <EstimateManager
                  connectionId={activeConnection.id}
                  requestId={requestId}
                />
              </div>
            )}

            {/* ── OTP Section ── */}
            {execution?.escrow_paid && currentStatus === 'COMPLETED' && (
              <div className="ws-card p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="section-label text-indigo-500">Completion</span>
                </div>
                <h3 className="font-display font-bold text-gray-900 text-lg mb-1 flex items-center gap-2">
                  <Key className="w-4 h-4 text-violet-500" />
                  OTP Verification
                </h3>
                <p className="font-body text-gray-500 text-xs mb-4 leading-relaxed">
                  Generate and send the completion OTP. The customer enters it in their app to confirm the service and release payment.
                </p>
                <button
                  onClick={handleGenerateOtp}
                  className="action-btn w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md"
                >
                  <Send className="w-4 h-4" />
                  Send OTP to Customer
                </button>
              </div>
            )}

            {/* ── Cancel Connection ── */}
            {activeConnection && !['SERVICE_AMOUNT_PAID', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'].includes(currentStatus) && (
              <button
                onClick={async () => {
                  if (!window.confirm('Cancel this connection? The customer will need to connect to another workshop.')) return;
                  try {
                    await dispatch(cancelRequestWorkshop(activeConnection.id)).unwrap();
                    toast.success('Connection cancelled');
                    if (requestId) dispatch(fetchServiceRequestDetails(requestId));
                  } catch (e) {
                    toast.error(e?.error || 'Failed to cancel connection');
                  }
                }}
                className="action-btn w-full py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center justify-center gap-2 font-display font-semibold text-sm hover:bg-red-100 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Cancel Connection
              </button>
            )}

            {/* ── Report a Problem ── */}
            <button
              onClick={() => setShowComplaintModal(true)}
              className="action-btn w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl flex items-center justify-center gap-2 font-display font-semibold text-sm shadow-md"
            >
              <AlertCircle className="w-4 h-4" />
              Report a Problem
            </button>
          </div>
        </div>
      </div>

      {/* ── ASSIGN MECHANIC MODAL ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-enter overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="section-label text-white/70 text-[9px]">Workshop</p>
                <h3 className="font-display font-bold text-white text-lg">Assign Mechanic</h3>
              </div>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {availableMechanics.length > 0 ? (
                availableMechanics.map(mechanic => (
                  <div key={mechanic.id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-display font-bold text-sm">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-display font-bold text-gray-900 text-sm">{mechanic.name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Available
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignMechanic(mechanic.id)}
                      className="action-btn w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-violet-600"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <UserMinus className="w-6 h-6 text-gray-300" />
                  </div>
                  <p className="font-body text-gray-500 text-sm">No available mechanics found.</p>
                  <p className="font-body text-gray-400 text-xs mt-1">They might be busy or already assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ReportComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        serviceRequestId={requestId}
      />
    </div>
  );
};

export default WorkshopServiceFlow;