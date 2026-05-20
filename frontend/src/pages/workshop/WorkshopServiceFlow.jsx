import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  CheckCircle, Phone, Send, User, Mail, UserMinus, UserPlus, DollarSign,
  Shield, AlertCircle, FileCheck, CreditCard, Wrench, Link2, Key, X, Ban
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

const WorkshopServiceFlow = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();

  const { currentRequest, mechanics: workshopMechanics, loading } = useSelector((state) => state.serviceRequest);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('team');

  useEffect(() => {
    setMounted(true);
    if (!requestId) return;
    dispatch(fetchServiceRequestDetails(requestId));
    return () => { dispatch(clearCurrentRequest()); };
  }, [dispatch, requestId]);

  useServiceFlowSocket(requestId, () => {
    if (requestId) {
      dispatch(fetchServiceRequestDetails(requestId));
      const connectionId = currentRequest?.active_connection?.id;
      if (connectionId) {
        setTimeout(() => { dispatch(fetchEstimates(connectionId)); }, 300);
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
    { key: 'VERIFIED', label: 'Verified', icon: Shield }
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
        <div className="font-medium text-gray-900">Remove this mechanic?</div>
        <div className="flex gap-2">
          <button onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={async () => {
            toast.dismiss(t.id);
            try {
              await dispatch(removeMechanic({ serviceRequestId: requestId, mechanicId })).unwrap();
              toast.success('Mechanic removed');
            } catch (error) {
              toast.error(error.message || 'Failed to remove');
            }
          }} className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">
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

  const showServiceActions = ['SERVICE_AMOUNT_PAID', 'IN_PROGRESS'].includes(currentStatus);
  const showOtp = execution?.escrow_paid && currentStatus === 'COMPLETED';
  const showCancelBtn = activeConnection && !['SERVICE_AMOUNT_PAID', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'].includes(currentStatus);

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

        .ws-hero { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%); }
        .ws-hero-noise::before {
          content: ''; position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          opacity: 0.4; pointer-events: none;
        }
        .glow-dot { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .badge-pill { background: rgba(255,255,255,0.12); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
        .section-label { font-family: 'Syne', sans-serif; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.68rem; }

        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-up { animation: fadeSlideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 80ms; }
        .delay-200 { animation-delay: 160ms; }

        /* Status strip nodes */
        .step-done   { background: #10b981; }
        .step-active { background: linear-gradient(135deg,#a78bfa,#818cf8); box-shadow: 0 0 0 3px rgba(167,139,250,0.35); }
        .step-idle   { background: rgba(255,255,255,0.18); }

        .ws-card { background: white; border-radius: 1rem; border: 1px solid #f1f5f9; transition: box-shadow 0.25s ease; }
        .ws-card:hover { box-shadow: 0 6px 24px rgba(99,102,241,0.07); }

        .action-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1); }
        .action-btn:hover { transform: translateY(-2px) scale(1.02); }
        .action-btn:active { transform: scale(0.98); }

        .tab-btn { transition: all 0.18s ease; }

        .flow-grid { display: grid; grid-template-columns: 1fr 360px; gap: 1.25rem; align-items: start; }
        @media (max-width: 1024px) { .flow-grid { grid-template-columns: 1fr; } }

        .sidebar-scroll { max-height: calc(100vh - 200px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: #e2e8f0 transparent; }
        .chat-height { height: calc(100vh - 200px); min-height: 480px; }

        .personnel-card { border: 1px solid #f1f5f9; border-radius: 0.75rem; transition: border-color 0.2s, box-shadow 0.2s; }
        .personnel-card:hover { border-color: #e0e7ff; box-shadow: 0 4px 12px rgba(99,102,241,0.07); }

        @keyframes zoomIn { from { opacity: 0; transform: scale(0.93); } to { opacity: 1; transform: scale(1); } }
        .modal-enter { animation: zoomIn 0.22s cubic-bezier(0.16,1,0.3,1) forwards; }
      `}</style>

      {/* ── COMPACT HERO + STATUS STRIP ── */}
      <div className="ws-hero ws-hero-noise relative overflow-hidden">
        <div className="glow-dot w-80 h-80 bg-indigo-500 opacity-20 -top-20 -left-10" />
        <div className="glow-dot w-56 h-56 bg-violet-400 opacity-15 top-10 right-16" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-0">
          {/* Top row */}
          <div className={`flex flex-wrap items-center justify-between gap-3 mb-4 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 badge-pill px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="section-label text-white/80 text-[0.62rem]">Workshop Dashboard</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                Service Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono bg-white/10 border border-white/20 text-white/90 px-3 py-1 rounded-lg text-xs font-semibold">
                #{requestId}
              </span>
              {currentRequest?.user_name && (
                <span className="section-label text-white/50 text-[0.62rem]">
                  Customer: <span className="text-white/80 normal-case font-body font-medium tracking-normal">{currentRequest.user_name}</span>
                </span>
              )}
            </div>
          </div>

          {/* Status strip */}
          <div className={`opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            <div className="overflow-x-auto pb-0">
              <div className="min-w-[580px] md:min-w-0 relative flex items-start justify-between py-3">
                <div className="absolute top-[22px] left-0 w-full h-0.5 bg-white/10 rounded-full" />
                <div
                  className="absolute top-[22px] left-0 h-0.5 rounded-full transition-all duration-700"
                  style={{ width: `${(getCurrentStatusIndex() / (statusFlow.length - 1)) * 100}%`, background: 'linear-gradient(90deg,#a78bfa,#818cf8)' }}
                />
                {statusFlow.map((status, index) => {
                  const Icon = status.icon;
                  const completed = isStatusCompleted(index);
                  const current = isStatusCurrent(index);
                  return (
                    <div key={status.key} className="relative z-10 flex flex-col items-center flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 border-white/20 transition-all duration-300 ${completed ? 'step-done' : current ? 'step-active scale-110' : 'step-idle'}`}>
                        <Icon className={`w-3.5 h-3.5 text-white ${current ? 'animate-pulse' : ''}`} />
                      </div>
                      <p className={`text-[9px] text-center mt-1.5 font-display font-bold px-0.5 max-w-[60px] leading-tight ${completed ? 'text-white/70' : current ? 'text-white' : 'text-white/30'}`}>
                        {status.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2 flex justify-end">
          <span className="section-label text-white/40 text-[0.6rem]">Step {getCurrentStatusIndex() + 1} of {statusFlow.length}</span>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN LAYOUT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flow-grid">

          {/* ── LEFT: Chat ── */}
          <div className="chat-height">
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

          {/* ── RIGHT: Sidebar ── */}
          <div className="flex flex-col gap-3">

            {/* Tab switcher */}
            <div className="ws-card p-1.5">
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                {['team', 'estimate'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSidebarTab(t)}
                    className={`tab-btn flex-1 py-1.5 text-xs font-display font-bold rounded-lg capitalize ${sidebarTab === t ? 'bg-white shadow text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {t === 'team' ? 'Team' : 'Estimate'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="sidebar-scroll space-y-3">

              {/* ── TEAM TAB ── */}
              {sidebarTab === 'team' && (
                <div className="ws-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="section-label text-indigo-500 block text-[0.62rem]">Assigned Team</span>
                      <h3 className="font-display font-bold text-gray-900 text-sm">Service Personnel</h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowAssignModal(true);
                        if (!workshopMechanics.length) dispatch(fetchWorkshopMechanics());
                      }}
                      className="action-btn w-8 h-8 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-100"
                      title="Add Mechanic"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Lead Technician */}
                    {leadTechnician && (
                      <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-3 border border-indigo-100">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {leadTechnician.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-gray-900 text-xs truncate">{leadTechnician.name}</p>
                          <p className="section-label text-indigo-500 text-[0.58rem]">Workshop Admin · Lead</p>
                          <p className="font-body text-gray-400 text-[10px] truncate">{leadTechnician.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Assigned Mechanics */}
                    {assignedMechanics.map(mechanic => (
                      <div key={mechanic.id} className="personnel-card bg-white p-3 relative group flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0">
                          {mechanic.name.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-bold text-gray-900 text-xs truncate">{mechanic.name}</p>
                          <p className="section-label text-blue-500 text-[0.58rem]">Mechanic</p>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{mechanic.contact_number || 'N/A'}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMechanic(mechanic.id)}
                          className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {assignedMechanics.length === 0 && !leadTechnician && (
                      <div className="text-center py-5 border-2 border-dashed border-slate-200 rounded-xl">
                        <UserPlus className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="font-body text-xs text-gray-400">No personnel assigned yet</p>
                        <p className="font-body text-[10px] text-gray-300 mt-0.5">Click + to assign a mechanic</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── ESTIMATE TAB ── */}
              {sidebarTab === 'estimate' && (
                <div className="ws-card overflow-hidden">
                  {activeConnection && activeConnection.status === 'ACCEPTED' ? (
                    <EstimateManager
                      connectionId={activeConnection.id}
                      requestId={requestId}
                    />
                  ) : (
                    <div className="p-4 text-center py-10">
                      <DollarSign className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="font-body text-xs text-gray-400">Estimate management available once connected</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ── ACTIONS SECTION ── */}
            <div className="ws-card p-4 space-y-2.5">
              <span className="section-label text-gray-400 text-[0.62rem] block">Actions</span>

              {/* Start / End Service */}
              {showServiceActions && (
                <>
                  {currentStatus === 'SERVICE_AMOUNT_PAID' && (
                    <button
                      onClick={async () => {
                        try {
                          await dispatch(startService(requestId)).unwrap();
                          toast.success('Service started successfully!');
                        } catch (e) { toast.error(e || 'Failed to start service'); }
                      }}
                      disabled={loading}
                      className="action-btn w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Start Service
                    </button>
                  )}
                  {currentStatus === 'IN_PROGRESS' && (
                    <button
                      onClick={() => {
                        toast((t) => (
                          <div className="flex flex-col gap-3">
                            <div className="font-medium text-gray-900">Service completely finished?</div>
                            <div className="flex gap-2">
                              <button onClick={() => toast.dismiss(t.id)} className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                              <button onClick={async () => {
                                toast.dismiss(t.id);
                                try {
                                  await dispatch(endService(requestId)).unwrap();
                                  dispatch(fetchServiceRequestDetails(requestId));
                                  toast.success('Service marked as completed!');
                                } catch (e) { toast.error(e || 'Failed to finish service'); }
                              }} className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">Confirm</button>
                            </div>
                          </div>
                        ), { position: 'top-center' });
                      }}
                      disabled={loading}
                      className="action-btn w-full py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Mark as Completed
                    </button>
                  )}
                </>
              )}

              {/* Send OTP */}
              {showOtp && (
                <button
                  onClick={handleGenerateOtp}
                  className="action-btn w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-display font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Send OTP to Customer
                </button>
              )}

              {/* Cancel Connection */}
              {showCancelBtn && (
                <button
                  onClick={async () => {
                    if (!window.confirm('Cancel this connection?')) return;
                    try {
                      await dispatch(cancelRequestWorkshop(activeConnection.id)).unwrap();
                      toast.success('Connection cancelled');
                      if (requestId) dispatch(fetchServiceRequestDetails(requestId));
                    } catch (e) { toast.error(e?.error || 'Failed to cancel'); }
                  }}
                  className="action-btn w-full py-2.5 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center justify-center gap-2 font-display font-bold text-xs hover:bg-red-100"
                >
                  <Ban className="w-3.5 h-3.5" /> Cancel Connection
                </button>
              )}

              {/* Report */}
              <button
                onClick={() => setShowComplaintModal(true)}
                className="action-btn w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl flex items-center justify-center gap-2 font-display font-bold text-xs shadow-sm"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Report a Problem
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* ── ASSIGN MECHANIC MODAL ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md modal-enter overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 flex items-center justify-between">
              <div>
                <p className="section-label text-white/70 text-[0.6rem]">Workshop</p>
                <h3 className="font-display font-bold text-white text-lg">Assign Mechanic</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
              {availableMechanics.length > 0 ? (
                availableMechanics.map(mechanic => (
                  <div key={mechanic.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-display font-bold text-gray-900 text-sm">{mechanic.name}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Available
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