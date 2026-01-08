import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, UserPlus, Search, Phone, Mail, Calendar, CheckCircle, XCircle, MoreVertical, Briefcase } from 'lucide-react';
import { fetchMechanicRequests, fetchMyMechanics, respondToRequest, clearMessages, removeMechanic } from '../../redux/slices/workshopMechanicSlice';
import { toast } from 'react-hot-toast';

const WorkshopMechanicManager = () => {
    const dispatch = useDispatch();
    const { mechanicRequests, myMechanics, requestsLoading, fetchLoading, error, successMessage } = useSelector(state => state.workshopMechanic);
    const [activeTab, setActiveTab] = useState('active'); // 'active' or 'requests'

    useEffect(() => {
        dispatch(fetchMechanicRequests());
        dispatch(fetchMyMechanics());
    }, [dispatch]);

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage);
            dispatch(clearMessages());
            // Refresh logic
            dispatch(fetchMechanicRequests());
            dispatch(fetchMyMechanics());
        }
        if (error) {
            toast.error(error);
            dispatch(clearMessages());
        }
    }, [successMessage, error, dispatch]);

    const handleAction = (mechanicId, action) => {
        dispatch(respondToRequest({ mechanicId, action }));
    };

    const handleRemove = (mechanicId) => {
        if (window.confirm('Are you sure you want to remove this mechanic?')) {
            dispatch(removeMechanic(mechanicId));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                        <p className="text-gray-500 mt-1">Manage your mechanics and incoming joining requests.</p>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Mechanics</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{myMechanics.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">{mechanicRequests.length}</h3>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                            <UserPlus className="w-6 h-6 text-amber-600" />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                    <div className="border-b border-gray-200 px-6 pt-4 flex gap-8">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === 'active'
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Active Mechanics
                            {activeTab === 'active' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === 'requests'
                                ? 'text-blue-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Joining Requests
                            {mechanicRequests.length > 0 && (
                                <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">
                                    {mechanicRequests.length}
                                </span>
                            )}
                            {activeTab === 'requests' && (
                                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />
                            )}
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Loading State */}
                        {((activeTab === 'active' && fetchLoading) || (activeTab === 'requests' && requestsLoading)) && (
                            <div className="flex justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            </div>
                        )}

                        {/* Active Mechanics Tab */}
                        {activeTab === 'active' && !fetchLoading && (
                            <div className="space-y-4">
                                {myMechanics.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No active mechanics in your team yet.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {myMechanics.map((mechanic) => (
                                            <div key={mechanic.mechanic_id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all group">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-lg font-bold text-gray-600">
                                                        {mechanic.mechanic_name.charAt(0)}
                                                    </div>
                                                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                                                        Active
                                                    </span>
                                                </div>

                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{mechanic.mechanic_name}</h3>
                                                <div className="space-y-2.5 mt-4">
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        {mechanic.email}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <Phone className="w-4 h-4 text-gray-400" />
                                                        {mechanic.contact_number}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        Joined {formatDate(mechanic.created_at)}
                                                    </div>

                                                    <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end">
                                                        <button
                                                            onClick={() => handleRemove(mechanic.mechanic_id)}
                                                            className="text-sm text-red-600 hover:text-red-700 font-medium hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        >
                                                            Remove Mechanic
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Requests Tab */}
                        {activeTab === 'requests' && !requestsLoading && (
                            <div className="space-y-4">
                                {mechanicRequests.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500">
                                        <UserPlus className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No new joining requests.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden bg-white border border-gray-200 rounded-xl">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mechanic</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {mechanicRequests.map((req) => (
                                                    <tr key={req.mechanic_id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                                    {req.mechanic_name.charAt(0)}
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-medium text-gray-900">{req.mechanic_name}</div>
                                                                    <div className="text-sm text-gray-500">{req.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900">{req.contact_number}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-500">{formatDate(req.created_at)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleAction(req.mechanic_id, 'REJECT')}
                                                                    className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                                                                >
                                                                    Reject
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAction(req.mechanic_id, 'APPROVE')}
                                                                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1 mx-auto md:mx-0 shadow-sm"
                                                                >
                                                                    Accept <CheckCircle className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkshopMechanicManager;
