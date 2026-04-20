import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Building2, Mail, Phone, MapPin, FileText, Calendar, CheckCircle, Clock, XCircle, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useWorkshopVerification } from '../../hooks/useWorkshopVerification';

const AdminWorkshopDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [workshop, setWorkshop] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingStatus, setEditingStatus] = useState(null);

    const { handleStatusUpdate: confirmVerification } = useWorkshopVerification();
    const { workshops } = useSelector((state) => state.userManagement);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await axiosInstance.get(`admin-panel/workshops/${id}/`);
                setWorkshop(response.data);
            } catch (error) {
                toast.error('Failed to fetch workshop details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    useEffect(() => {
        // Sync with redux state if updated via hook
        const updatedInRedux = workshops.find((w) => w.id === parseInt(id));
        if (updatedInRedux && workshop && updatedInRedux.verificationStatus !== workshop.verificationStatus) {
            setWorkshop((prev) => ({
                ...prev,
                verificationStatus: updatedInRedux.verificationStatus,
            }));
            setEditingStatus(null);
        }
    }, [workshops, id]);

    const handleUpdateStatus = (e) => {
        if (editingStatus && editingStatus !== 'Pending') {
            const action = editingStatus === 'Approved' ? 'approve' : 'reject';
            confirmVerification(e, workshop.id, action);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            Approved: 'bg-green-100 text-green-700 border-green-200',
            Pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            Rejected: 'bg-red-100 text-red-700 border-red-200'
        };
        const normalizedStatus = status === 'Requested Again' ? 'Pending' : status;
        return styles[normalizedStatus] || 'bg-gray-100 text-gray-700 border-gray-200';
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 mt-14">Loading workshop details...</div>;
    }

    if (!workshop) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 mt-14">Workshop not found</div>;
    }

    const {
        workshopName, ownerName, email, contactNumber,
        licenseNumber, type, addressLine, locality,
        city, state, pincode, verificationStatus,
        rejectionReason, createdAt, isBlocked
    } = workshop;

    const normalizedStatus = verificationStatus === 'Requested Again' ? 'Pending' : verificationStatus;
    const currentStatus = editingStatus || normalizedStatus;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-100 p-6 mt-14">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/admin/workshops')}
                    className="flex items-center text-purple-600 hover:text-purple-800 mb-6 transition-colors duration-200 font-medium"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Workshops
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white relative">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-4 border-white/30">
                                <Building2 className="w-12 h-12 text-white" />
                            </div>
                            <div className="text-center md:text-left flex-1">
                                <h1 className="text-3xl font-bold mb-2">{workshopName}</h1>
                                <p className="text-purple-100 text-lg">{type}</p>
                                {isBlocked && (
                                    <span className="inline-block mt-2 px-3 py-1 bg-red-500/20 text-red-100 rounded-full text-sm font-semibold backdrop-blur-sm border border-red-500/30">
                                        Blocked Account
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 md:mt-0 flex items-center gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-sm shadow-lg border border-white/30">
                                <select
                                    value={currentStatus}
                                    onChange={(e) => setEditingStatus(e.target.value)}
                                    className={`px-4 py-2 rounded-lg font-bold border-2 transition-all duration-300 cursor-pointer outline-none focus:ring-2 focus:ring-white/50 ${editingStatus && editingStatus !== normalizedStatus
                                            ? 'border-white text-purple-900 bg-white'
                                            : getStatusBadge(currentStatus)
                                        }`}
                                >
                                    <option className="text-gray-900 bg-white" value="Approved">Approved</option>
                                    <option className="text-gray-900 bg-white" value="Pending">Pending</option>
                                    <option className="text-gray-900 bg-white" value="Rejected">Rejected</option>
                                </select>

                                {editingStatus && editingStatus !== normalizedStatus && (
                                    <button
                                        onClick={handleUpdateStatus}
                                        className="p-2 bg-white text-purple-600 rounded-lg shadow-md hover:bg-gray-100 transition-all duration-300"
                                        title="Save Status"
                                    >
                                        <Save className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Owner Information */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <FileText className="w-5 h-5 mr-2 text-purple-600" />
                                Owner Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                                    <p className="font-medium text-gray-900">{ownerName}</p>
                                </div>
                                <div className="flex items-start">
                                    <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Email</p>
                                        <p className="font-medium text-gray-900">{email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start">
                                    <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Contact Number</p>
                                        <p className="font-medium text-gray-900">{contactNumber || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Workshop Information */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <Building2 className="w-5 h-5 mr-2 text-purple-600" />
                                Business Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">License Number</p>
                                    <p className="font-medium text-gray-900 break-all">{licenseNumber || 'Not Provided'}</p>
                                </div>
                                <div className="flex items-start">
                                    <Calendar className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Applied On</p>
                                        <p className="font-medium text-gray-900">
                                            {new Date(createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="md:col-span-2 bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
                                <MapPin className="w-5 h-5 mr-2 text-purple-600" />
                                Complete Address
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="sm:col-span-2 md:col-span-4">
                                    <p className="text-sm text-gray-500 mb-1">Address Line</p>
                                    <p className="font-medium text-gray-900">{addressLine}</p>
                                </div>
                                {locality && (
                                    <div className="sm:col-span-2 md:col-span-4">
                                        <p className="text-sm text-gray-500 mb-1">Locality</p>
                                        <p className="font-medium text-gray-900">{locality}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">City</p>
                                    <p className="font-medium text-gray-900">{city}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">State</p>
                                    <p className="font-medium text-gray-900">{state}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Pincode</p>
                                    <p className="font-medium text-gray-900">{pincode}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rejection Reason */}
                        {normalizedStatus === 'Rejected' && rejectionReason && (
                            <div className="md:col-span-2 bg-red-50 rounded-xl p-6 border border-red-200 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <XCircle className="w-24 h-24 text-red-600" />
                                </div>
                                <h3 className="text-xl font-bold text-red-800 mb-2 relative z-10">
                                    Rejection Reason
                                </h3>
                                <p className="text-red-700 relative z-10 font-medium">
                                    {rejectionReason}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminWorkshopDetail;
