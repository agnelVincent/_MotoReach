import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  CheckCircle, Phone, Send, User, Mail, UserMinus, UserPlus, DollarSign,
  Shield, AlertCircle, FileCheck, CreditCard, Wrench, Link2, Key, Eye, EyeOff, X
} from 'lucide-react';
import {
  fetchNearbyWorkshops,
  fetchWorkshopMechanics,
  assignMechanic,
  removeMechanic
} from '../../redux/slices/serviceRequestSlice';
import { toast } from 'react-hot-toast';
import Chat from '../../components/Chat';

const WorkshopServiceFlow = () => {
  const { requestId } = useParams();
  const dispatch = useDispatch();

  const { currentRequest, mechanics: workshopMechanics, loading } = useSelector((state) => state.serviceRequest);
  const [estimateAmount, setEstimateAmount] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (requestId) {
      dispatch(fetchNearbyWorkshops(requestId));
      dispatch(fetchWorkshopMechanics());
    }
  }, [dispatch, requestId]);

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

  const getCurrentStatusIndex = () => {
    return statusFlow.findIndex(s => s.key === currentStatus);
  };

  const isStatusCompleted = (index) => {
    return index < getCurrentStatusIndex();
  };

  const isStatusCurrent = (index) => {
    return index === getCurrentStatusIndex();
  };

  const handleGenerateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setShowOtp(true);
  };

  const handleAssignMechanic = async (mechanicId) => {
    try {
      await dispatch(assignMechanic({ serviceRequestId: requestId, mechanicId })).unwrap();
      toast.success("Mechanic assigned successfully");
      setShowAssignModal(false);
    } catch (error) {
      toast.error(error.message || "Failed to assign");
    }
  };

  const handleRemoveMechanic = async (mechanicId) => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="font-medium text-gray-900">
          Are you sure you want to remove this mechanic?
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
            }}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                await dispatch(removeMechanic({ serviceRequestId: requestId, mechanicId })).unwrap();
                toast.success("Mechanic removed successfully");
              } catch (error) {
                toast.error(error.message || "Failed to remove");
              }
            }}
            className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: 'top-center',
    });
  };

  if (loading && !currentRequest) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const execution = currentRequest?.execution;
  const leadTechnician = execution?.lead_technician;
  const assignedMechanics = execution?.mechanics || [];

  // Filter mechanics available for assignment (exclude already assigned)
  const availableMechanics = workshopMechanics.filter(m =>
    m.availability === 'AVAILABLE' &&
    !assignedMechanics.some(am => am.id === m.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Service Management Dashboard
          </h1>
          <p className="text-gray-600">Request ID: #{requestId} | User: {currentRequest?.user_name || 'Customer'}</p>
        </div>

        {/* Status Flow */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Service Progress</h2>
          <div className="min-w-[800px] md:min-w-0">
            <div className="flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-0" />

              {statusFlow.map((status, index) => {
                const Icon = status.icon;
                const completed = isStatusCompleted(index);
                const current = isStatusCurrent(index);

                return (
                  <div key={status.key} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-white ${completed ? 'bg-green-500' : current ? 'bg-purple-600 shadow-lg scale-110' : 'bg-gray-300'
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
          {/* Messages Section */}
          <div className="lg:col-span-2">
            <Chat
              serviceRequestId={requestId}
              canChat={!!activeConnection && !['EXPIRED', 'CANCELLED'].includes(currentStatus)}
              headerTitle={
                currentRequest?.user_name
                  ? `Chat with ${currentRequest.user_name}`
                  : 'In-App Chat'
              }
              headerSubtitle="Communication Channel"
              headerIcon={User}
              gradientFrom="from-purple-600"
              gradientTo="to-pink-600"
              disabledMessage="Chat will be available when this service has an accepted, active connection."
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Personnel */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Service Personnel</h3>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  title="Add Mechanic"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Lead Technician */}
                {leadTechnician && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {leadTechnician.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{leadTechnician.name}</p>
                        <p className="text-xs text-purple-600 font-bold uppercase">Workshop Admin (Lead)</p>
                        <p className="text-xs text-gray-500">{leadTechnician.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Assigned Mechanics */}
                {assignedMechanics.map((mechanic) => (
                  <div key={mechanic.id} className="bg-white border rounded-xl p-4 relative group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                        {mechanic.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{mechanic.name}</p>
                        <p className="text-xs text-blue-600 font-bold uppercase">Mechanic</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Phone className="w-3 h-3" /> {mechanic.contact_number || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMechanic(mechanic.id)}
                      className="absolute top-2 right-2 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {assignedMechanics.length === 0 && !leadTechnician && (
                  <p className="text-center text-gray-500 text-sm">No personnel assigned.</p>
                )}
              </div>
            </div>

            {/* Estimate - Placeholder Logic */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Service Estimate
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimate Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={estimateAmount}
                    onChange={(e) => setEstimateAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <button className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold shadow-md">
                  Share Estimate
                </button>
              </div>
            </div>

            {/* OTP Section */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                Completion OTP
              </h3>
              {!generatedOtp ? (
                <button
                  onClick={handleGenerateOtp}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold shadow-md"
                >
                  Generate OTP
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200 flex justify-between items-center">
                    <p className="text-2xl font-bold text-purple-900 tracking-widest">
                      {showOtp ? generatedOtp : '••••••'}
                    </p>
                    <button onClick={() => setShowOtp(!showOtp)}>
                      {showOtp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Mechanic Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Assign Mechanic</h3>
              <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {availableMechanics.length > 0 ? (
                availableMechanics.map(mechanic => (
                  <div key={mechanic.id} className="flex items-center justify-between p-3 border rounded-xl hover:border-purple-300 transition-all">
                    <div>
                      <p className="font-bold text-gray-800">{mechanic.name}</p>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Available</span>
                    </div>
                    <button
                      onClick={() => handleAssignMechanic(mechanic.id)}
                      className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-600 hover:text-white transition-all"
                    >
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No available mechanics found.</p>
                  <p className="text-xs mt-1">They might be busy or already assigned.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopServiceFlow;