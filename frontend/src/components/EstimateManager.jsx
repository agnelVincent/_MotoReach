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
    { key: 'CREATED', label: 'Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Closed', icon: Shield }
  ];

  const getCurrentStatusIndex = () => statusFlow.findIndex(s => s.key === currentStatus);
  const isStatusCompleted = (index) => index < getCurrentStatusIndex();
  const isStatusCurrent = (index) => index === getCurrentStatusIndex();

  const handleGenerateOtp = async () => {
    const executionId = currentRequest?.execution?.id;
    if (!executionId) { toast.error('No execution found'); return; }
    try {
      await dispatch(generateServiceOTP(executionId)).unwrap();
      toast.success('OTP sent to customer.');
    } catch (e) {
      toast.error(e?.error || e?.message || 'Failed to generate OTP');
    }
  };

  const handleAssignMechanic = async (mechanicId) => {
    try {
      await dispatch(assignMechanic({ serviceRequestId: requestId, mechanicId })).unwrap();
      toast.success('Mechanic assigned');
      setShowAssignModal(false);
    } catch (error) {
      toast.error(error.message || 'Failed to assign');
    }
  };

  const handleRemoveMechanic = async (mechanicId) => {
    toast((t) => (
      <div className="flex flex-col gap-2 p-1 text-xs">
        <div className="font-medium text-gray-900">Remove mechanic?</div>
        <div className="flex gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              await dispatch(removeMechanic({ serviceRequestId: requestId, mechanicId })).unwrap();
              toast.success('Removed successfully');
            } catch (error) {
              toast.error(error.message || 'Failed to remove');
            }
          }} className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700">
            Remove
          </button>
        </div>
      </div>
    ), { duration: 4000, position: 'top-center' });
  };

  if (loading && !currentRequest) {
    return (
      <div className="w-full p-8 flex items-center justify-center bg-[#f8f9fc]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="text-xs text-gray-500 font-body">Loading service details…</p>
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
    <div className="w-full bg-[#f8f9fc] font-sans overflow-hidden rounded-xl border border-gray-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700&family=Geist:wght@400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', sans-serif; }
        .ws-hero { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); }
        .ws-card { background: white; border-radius: 0.75rem; border: 1px solid #e2e8f0; }
        .step-done  { background: #10b981; }
        .step-active { background: linear-gradient(135deg, #6366f1, #7c3aed); box-shadow: 0 0 0 3px rgba(99,102,241,0.2); }
        .step-idle  { background: #cbd5e1; }
      `}</style>

      {/* ── HIGHLY COMPACT HERO HEADER ── */}
      <div className="ws-hero relative p-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-block text-[9px] uppercase font-display tracking-wider bg-white/10 px-2 py-0.5 rounded text-indigo-200 mb-1">
              Workshop View
            </span>
            <h1 className="font-display text-lg font-bold leading-tight truncate">
              Service Management
            </h1>
            <p className="font-body text-white/60 text-xs truncate mt-0.5">
              #{requestId} · <span className="text-white/90 font-medium">{currentRequest?.user_name || 'Customer'}</span>
            </p>
          </div>
          
          {/* Active Status Badge directly in header to save downstream vertical footprint */}
          <div className="bg-indigo-500/20 border border-indigo-400/30 px-2 py-1 rounded-md text-xs font-medium text-indigo-200 shrink-0">
            Status: {currentStatus}
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT BODY ── */}
      <div className="p-3 space-y-3 font-body text-sm text-gray-700">

        {/* ── ADAPTIVE SCROLLABLE STATUS TRACK ── */}
        <div className="ws-card p-3">
          <div className="overflow-x-auto pb-1.5 scrollbar-thin">
            <div className="flex items-center space-x-4 min-w-max px-1">
              {statusFlow.map((status, index) => {
                const Icon = status.icon;
                const completed = isStatusCompleted(index);
                const current = isStatusCurrent(index);
                return (
                  <div key={status.key} className="flex items-center space-x-2 shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-all ${completed ? 'step-done' : current ? 'step-active' : 'step-idle'}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-medium ${current ? 'text-indigo-600 font-semibold' : completed ? 'text-gray-800' : 'text-gray-400'}`}>
                      {status.label}
                    </span>
                    {index < statusFlow.length - 1 && (
                      <span className="text-gray-300 font-light pl-1">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── ACTION INTERFACE ZONE ── */}
        <div className="w-full">
          <ServiceActionButton
            currentStatus={currentStatus}
            onStart={async () => {
              try {
                await dispatch(startService(requestId)).unwrap();
                toast.success('Service started');
              } catch (e) {
                toast.error(e || 'Failed to start');
              }
            }}
            onEnd={async () => {
              toast((t) => (
                <div className="flex flex-col gap-2 p-1 text-xs">
                  <div className="font-medium text-gray-900">Mark service as complete?</div>
                  <div className="flex gap-2">
                    <button onClick={() => toast.dismiss(t.id)} className="px-2 py-1 border rounded text-gray-500">No</button>
                    <button onClick={async () => {
                      toast.dismiss(t.id);
                      try {
                        await dispatch(endService(requestId)).unwrap();
                        dispatch(fetchServiceRequestDetails(requestId));
                        toast.success('Service completed!');
                      } catch (e) {
                        toast.error(e || 'Failed to finish');
                      }
                    }} className="px-2 py-1 bg-green-600 text-white rounded">Yes</button>
                  </div>
                </div>
              ), { position: 'top-center' });
            }}
            loading={loading}
            disabled={loading}
          />
        </div>

        {/* ── FLEX GRID: AUTO COMPRESS FOR SMALL SUBPANE EMBEDDING ── */}
        <div className="grid grid-cols-1 gap-3">
          
          {/* Chat Module Section Wrapper */}
          <div className="ws-card overflow-hidden min-h-[260px] max-h-[340px] flex flex-col">
            <Chat
              key={requestId}
              serviceRequestId={requestId}
              canChat={!!activeConnection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)}
              headerTitle={currentRequest?.user_name ? `Chat: ${currentRequest.user_name}` : 'Chat'}
              headerSubtitle="Live Support Link"
              headerIcon={User}
              gradientFrom="from-indigo-700"
              gradientTo="to-indigo-900"
              disabledMessage="Chat offline until accepted connection is established."
            />
          </div>

          {/* Side Panels - Stacked Context Cards */}
          <div className="space-y-3">

            {/* Personnel/Team Allocation Card */}
            <div className="ws-card p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <h3 className="font-display font-bold text-gray-900 text-sm">Personnel Assignment</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(true);
                    if (!workshopMechanics.length) dispatch(fetchWorkshopMechanics());
                  }}
                  className="w-7 h-7 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-100 transition-all"
                  title="Assign Mechanic"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2">
                {/* Lead Technician Detail Card */}
                {leadTechnician && (
                  <div className="bg-indigo-50/50 rounded-xl p-2.5 border border-indigo-100/60 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {leadTechnician.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="font-semibold text-gray-900 text-xs truncate">{leadTechnician.name}</p>
                      <p className="text-[10px] text-indigo-600 font-medium mt-0.5">Lead Technician</p>
                    </div>
                  </div>
                )}

                {/* Assigned Mechanics Map */}
                {assignedMechanics.map((mechanic) => (
                  <div key={mechanic.id} className="p-2.5 bg-gray-50 border border-gray-200/60 rounded-xl flex items-center justify-between gap-2 group relative">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-xs shrink-0">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="font-medium text-gray-900 text-xs truncate">{mechanic.name}</p>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{mechanic.contact_number || 'No Phone'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMechanic(mechanic.id)}
                      className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                      title="Remove"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {assignedMechanics.length === 0 && !leadTechnician && (
                  <div className="text-center py-4 border border-dashed border-gray-200 rounded-lg text-gray-400 text-xs">
                    No mechanics active on this track.
                  </div>
                )}
              </div>
            </div>

            {/* Estimate Management Module Injection */}
            {activeConnection && activeConnection.status === 'ACCEPTED' && (
              <div className="ws-card overflow-hidden max-w-full">
                <EstimateManager
                  connectionId={activeConnection.id}
                  requestId={requestId}
                />
              </div>
            )}

            {/* Conditional Action Panels (OTP & Management Hooks) */}
            {execution?.escrow_paid && currentStatus === 'COMPLETED' && (
              <div className="ws-card p-3 text-center">
                <h4 className="text-xs font-bold text-gray-900 mb-1 flex items-center justify-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-violet-600" /> Secure Verification
                </h4>
                <button
                  onClick={handleGenerateOtp}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-medium rounded-lg text-xs hover:opacity-95 shadow-sm"
                >
                  Dispatch Release OTP
                </button>
              </div>
            )}

            {/* Context Actions Container */}
            <div className="flex gap-2">
              {activeConnection && !['SERVICE_AMOUNT_PAID', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'].includes(currentStatus) && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Cancel this connection?')) return;
                    try {
                      await dispatch(cancelRequestWorkshop(activeConnection.id)).unwrap();
                      toast.success('Cancelled');
                      if (requestId) dispatch(fetchServiceRequestDetails(requestId));
                    } catch (e) {
                      toast.error(e?.error || 'Failed cancellation');
                    }
                  }}
                  className="flex-1 py-2 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium text-xs hover:bg-red-100/70 transition-colors flex items-center justify-center gap-1"
                >
                  <Ban className="w-3 h-3" /> Cancel
                </button>
              )}

              <button
                onClick={() => setShowComplaintModal(true)}
                className="flex-1 py-2 bg-amber-500 text-white rounded-lg font-medium text-xs hover:bg-amber-600 transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                <AlertCircle className="w-3 h-3" /> Report Problem
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── COMPACT ASSIGN MECHANIC MODAL ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100">
            <div className="bg-indigo-900 px-4 py-3 flex items-center justify-between text-white">
              <h3 className="font-display font-bold text-sm">Select Mechanic</h3>
              <button onClick={() => setShowAssignModal(false)} className="w-6 h-6 rounded bg-white/10 flex items-center justify-center hover:bg-white/20">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 space-y-1.5 max-h-[40vh] overflow-y-auto scrollbar-thin">
              {availableMechanics.length > 0 ? (
                availableMechanics.map(mechanic => (
                  <div key={mechanic.id} className="flex items-center justify-between p-2 border border-gray-100 rounded-lg hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <p className="font-medium text-gray-900 text-xs truncate">{mechanic.name}</p>
                        <span className="text-[9px] text-emerald-600 font-semibold">Available</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAssignMechanic(mechanic.id)}
                      className="w-7 h-7 bg-indigo-600 text-white rounded flex items-center justify-center hover:bg-indigo-700 transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No mechanics currently available.
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