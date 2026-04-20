import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import toast from 'react-hot-toast';
import { AlertCircle, Ban, Mail, Phone, Clock, FileText, CheckCircle2 } from 'lucide-react';

const AdminComplaints = () => {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            const response = await axiosInstance.get('/admin-panel/complaints/');
            setComplaints(response.data);
        } catch (error) {
            toast.error('Failed to fetch complaints');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleBlock = async (userId) => {
        try {
            const response = await axiosInstance.patch(`/admin-panel/users/${userId}/toggle-block/`);
            const status = response.data.isBlocked ? 'Blocked' : 'Unblocked';
            toast.success(`User successfully ${status.toLowerCase()}`);

            setComplaints(prev => prev.map(complaint => {
                if (complaint.reported_user === userId) {
                    return { ...complaint, is_blocked: response.data.isBlocked };
                }
                return complaint;
            }));
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to update block status');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Complaints & Reports</h1>
                    <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                        Monitor and handle complaints raised by users and workshops. You can view service details and block offending accounts.
                    </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg hidden sm:block">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
            </div>

            {complaints.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Complaints</h3>
                    <p className="mt-2 text-gray-500">The platform is running smoothly with no active reports.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {complaints.map((complaint) => (
                        <div key={complaint.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="border-b border-gray-100 bg-gray-50/50 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-red-100 text-red-700 font-semibold ring-4 ring-white">
                                        {complaint.reporter_name.charAt(0).toUpperCase()}
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">
                                            Reported by {complaint.reporter_name} ({complaint.reporter_role})
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span>{complaint.reporter_email}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4" />
                                    {new Date(complaint.created_at).toLocaleString()}
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Reported User</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 relative">
                                        {complaint.is_blocked && (
                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full z-10">
                                                Blocked
                                            </span>
                                        )}
                                        <p className="font-medium text-gray-900">{complaint.reported_user_name}</p>
                                        <p className="text-sm text-gray-500 capitalize">{complaint.reported_user_role}</p>
                                        <p className="text-sm text-gray-500 mt-1">{complaint.reported_user_email}</p>

                                        <button
                                            onClick={() => handleToggleBlock(complaint.reported_user)}
                                            className={`mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${complaint.is_blocked
                                                    ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                    : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
                                                }`}
                                        >
                                            <Ban className="w-4 h-4" />
                                            {complaint.is_blocked ? 'Unblock User' : 'Block User'}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4 lg:col-span-2">
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Complaint Details</h4>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-900 font-medium flex items-center gap-2 mb-1.5">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                Description
                                            </p>
                                            <p className="text-sm text-gray-600 bg-white border border-gray-100 p-3 rounded-lg leading-relaxed">
                                                {complaint.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            Contact provided: <span className="font-medium">{complaint.phone_number}</span>
                                        </div>

                                        {complaint.image && (
                                            <div className="mt-3">
                                                <p className="text-sm text-gray-900 font-medium mb-2">Attached Evidence</p>
                                                <img
                                                    src={complaint.image}
                                                    alt="Complaint attached evidence"
                                                    className="w-full max-w-xs h-auto rounded-lg border border-gray-200 shadow-sm"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>

                            <div className="px-4 py-3 sm:px-6 bg-slate-50 border-t border-gray-100">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Related Service Request (ID: {complaint.service_request})</h4>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                    <div><span className="text-gray-500">Vehicle:</span> <span className="font-medium text-slate-800">{complaint.service_request_details.vehicle}</span></div>
                                    <div><span className="text-gray-500">Issue:</span> <span className="font-medium text-slate-800">{complaint.service_request_details.issue}</span></div>
                                    <div><span className="text-gray-500">Status:</span> <span className="font-medium text-slate-800">{complaint.service_request_details.status}</span></div>
                                    {complaint.service_request_details.estimate_amount > 0 && (
                                        <div><span className="text-gray-500">Estimate:</span> <span className="font-medium text-slate-800">₹{complaint.service_request_details.estimate_amount}</span></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminComplaints;
