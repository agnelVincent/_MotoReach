import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, MapPin, Phone, Star, Clock, X, AlertCircle } from 'lucide-react';
import { cancelJoinRequest } from '../../redux/slices/workshopMechanicSlice';
import { toast } from 'react-hot-toast';

const MechanicPendingRequest = ({ workshop }) => {
    const dispatch = useDispatch();
    const [showConfirm, setShowConfirm] = useState(false);
    const { actionLoading } = useSelector(state => state.workshopMechanic);

    const handleCancel = () => {
        dispatch(cancelJoinRequest());
        setShowConfirm(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Pending Status Banner */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-amber-100 rounded-full">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-amber-900">Approval Pending</h2>
                            <p className="text-amber-700 text-sm">Your join request is awaiting workshop approval</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="px-4 py-2 bg-amber-100 text-amber-800 text-sm font-bold rounded-full uppercase border border-amber-200">
                            Pending Approval
                        </span>
                    </div>
                </div>

                {/* Workshop Details Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-24 relative">
                        <div className="absolute -bottom-8 left-8">
                            <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                                <Building2 className="w-10 h-10 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 px-8 pb-8">
                        <div className="space-y-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{workshop.workshop_name}</h1>
                                <div className="mt-3 space-y-2 text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        <span>{workshop.address_line}, {workshop.locality}, {workshop.city}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{workshop.contact_number}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                        <span className="font-medium">{workshop.rating_avg} Rating</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => setShowConfirm(true)}
                                    disabled={actionLoading}
                                    className="w-full md:w-auto px-6 py-3 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <X className="w-4 h-4" />
                                    Cancel Join Request
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900">What happens next?</h3>
                        <p className="text-blue-700 mt-1">
                            The workshop admin will review your request. Once approved, you'll be able to see full workshop details and start working with them.
                            You can cancel this request anytime if you change your mind.
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Cancel Join Request?</h3>
                            <p className="text-gray-500">
                                Are you sure you want to cancel your join request to <strong>{workshop.workshop_name}</strong>?
                                You can send a new request later if needed.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Keep Request
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Cancelling...
                                    </>
                                ) : (
                                    'Cancel Request'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MechanicPendingRequest;
