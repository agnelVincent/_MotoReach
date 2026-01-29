import React from 'react';
import { Building2, MapPin, Phone, Star, Shield, LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { leaveWorkshop } from '../../redux/slices/workshopMechanicSlice';
import { toast } from 'react-hot-toast';

const MechanicWorkshopDetails = ({ workshop }) => {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector(state => state.workshopMechanic);

    const handleLeave = () => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <div>
                    <p className="font-semibold text-gray-900">Leave Workshop?</p>
                    <p className="text-sm text-gray-600 mt-1">
                        Are you sure you want to leave <strong>{workshop.workshop_name}</strong>?
                    </p>
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
                        onClick={() => {
                            dispatch(leaveWorkshop());
                            toast.dismiss(t.id);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                    >
                        Leave
                    </button>
                </div>
            </div>
        ), {
            duration: 10000,
            position: 'top-center',
        });
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
                                onClick={handleLeave}
                                disabled={actionLoading}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                        Leaving...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="w-4 h-4" />
                                        Leave Workshop
                                    </>
                                )}
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
        </div>
    );
};

export default MechanicWorkshopDetails;
