import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, Star, Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { searchWorkshops, sendJoinRequest, clearMessages, clearSearchResults } from '../../redux/slices/workshopMechanicSlice';
import { toast } from 'react-hot-toast';

const MechanicFindWorkshop = ({ currentWorkshop }) => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const { searchResults, searchLoading, error, successMessage } = useSelector(state => state.workshopMechanic);
    const { user } = useSelector(state => state.auth);

    useEffect(() => {
        if (searchTerm.trim().length > 2) {
            const delayDebounceFn = setTimeout(() => {
                dispatch(searchWorkshops(searchTerm));
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        } else {
            dispatch(clearSearchResults());
        }
    }, [searchTerm, dispatch]);



    const handleConnect = (workshopId) => {
        if (currentWorkshop?.joining_status === 'PENDING') {
            toast.error(`You already have a pending request with ${currentWorkshop.workshop_name}`);
            return;
        }
        dispatch(sendJoinRequest(workshopId));
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Pending Request Banner */}
                {currentWorkshop?.joining_status === 'PENDING' && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-amber-600" />
                            <div>
                                <h3 className="font-semibold text-amber-900">Request Pending</h3>
                                <p className="text-sm text-amber-700">
                                    You have requested to join <span className="font-bold">{currentWorkshop.workshop_name}</span>.
                                    Please wait for their approval.
                                </p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full uppercase">
                            Pending
                        </span>
                    </div>
                )}

                {/* Header */}
                <div className="text-center space-y-3">
                    <h1 className="text-3xl font-bold text-gray-900">Find a Workshop</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Search for workshops by name or location to send a joining request.
                        Once approved, you will be part of their team.
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative max-w-xl mx-auto">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
                        placeholder="Search by workshop name, city, or locality..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Results */}
                <div className="space-y-4">
                    {searchLoading && (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                    )}

                    {!searchLoading && searchResults.length === 0 && searchTerm.length > 2 && (
                        <div className="text-center p-8 text-gray-500 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <Search className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            No workshops found matching your search.
                        </div>
                    )}

                    {searchResults.map((workshop) => (
                        <div key={workshop.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-bold text-gray-900">{workshop.workshop_name}</h3>
                                        <div className="flex items-center gap-1 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-100">
                                            <Shield className="w-3 h-3 text-green-600" />
                                            <span className="text-xs font-medium text-green-700">Verified</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            {workshop.locality}, {workshop.city}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                            <span className="font-medium text-gray-700">{workshop.rating_avg}</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 w-full md:w-3/4">{workshop.address_line}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleConnect(workshop.id)}
                                        className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        Connect
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MechanicFindWorkshop;
