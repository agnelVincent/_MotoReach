import React, { useState } from 'react';
import { Building2, MapPin, Phone, Star, Shield, LogOut, AlertTriangle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { leaveWorkshop } from '../../redux/slices/workshopMechanicSlice';

const MechanicWorkshopDetails = ({ workshop }) => {
    const dispatch = useDispatch();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleLeave = () => {
        dispatch(leaveWorkshop());
        setShowConfirm(false);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 h-32 relative">
                        <div className="absolute -bottom-10 left-8">
                            <div className="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center p-2">
                                <Building2 className="w-12 h-12 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 px-8 pb-8">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    {workshop.workshop_name}
                                    <Shield className="w-5 h-5 text-green-500 fill-green-500" />
                                </h1>
                                <div className="mt-2 space-y-2 text-gray-600">
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

                            <button
                                onClick={() => setShowConfirm(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-100"
                            >
                                <LogOut className="w-4 h-4" />
                                Leave Workshop
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-blue-900">Current Status: Active</h3>
                        <p className="text-blue-700 mt-1">
                            You are currently a registered mechanic for this workshop.
                            Leaving the workshop will remove you from their team and you will need to apply again to rejoin.
                        </p>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-bold text-gray-900">Leave Workshop?</h3>
                            <p className="text-gray-500">
                                Are you sure you want to leave <strong>{workshop.workshop_name}</strong>?
                                This action cannot be undone immediately.
                            </p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleLeave}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                Confirm Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MechanicWorkshopDetails;
