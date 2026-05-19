import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchUserServiceRequests, userCancelConnection, deleteServiceRequest } from '../../redux/slices/serviceRequestSlice';
import {
    CheckCircle, AlertCircle, Clock, MapPin, Wrench,
    XCircle, Shield, Trash2, Plus, AlertTriangle, FileX
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ExpirationTimer from '../../components/ExpirationTimer';

const UserServices = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { userRequests, loading, error } = useSelector((state) => state.serviceRequest);

    const queryParams = new URLSearchParams(location.search);
    const success = queryParams.get('success');
    const canceled = queryParams.get('canceled');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedRequestId, setSelectedRequestId] = useState(null);
    const [selectedRequestDetails, setSelectedRequestDetails] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        dispatch(fetchUserServiceRequests());
        setMounted(true);
    }, [dispatch, success, canceled]);

    const handleDeleteClick = (request) => {
        setSelectedRequestId(request.id);
        setSelectedRequestDetails(request);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        setIsProcessing(true);
        try {
            await dispatch(deleteServiceRequest(selectedRequestId)).unwrap();
            toast.success("Service request deleted successfully");
            setShowDeleteModal(false);
        } catch (error) {
            toast.error(error.error || "Failed to delete request");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelClick = (request) => {
        setSelectedRequestId(request.id);
        setSelectedRequestDetails(request);
        setShowCancelModal(true);
    };

    const handleCancelConfirm = async () => {
        setIsProcessing(true);
        try {
            await dispatch(userCancelConnection(selectedRequestId)).unwrap();
            toast.success("Connection cancelled successfully");
            setShowCancelModal(false);
        } catch (error) {
            toast.error("Failed to cancel connection");
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusConfig = (status) => {
        const map = {
            CREATED:              { label: 'Created',           bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400' },
            PLATFORM_FEE_PAID:    { label: 'Fee Paid',          bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-400' },
            CONNECTING:           { label: 'Connecting',        bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-400' },
            IN_PROGRESS:          { label: 'In Progress',       bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400' },
            EXPIRED:              { label: 'Expired',           bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400' },
            CONNECTED:            { label: 'Connected',         bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-400' },
            ESTIMATE_SHARED:      { label: 'Estimate Shared',   bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-400' },
            SERVICE_AMOUNT_PAID:  { label: 'Amount Paid',       bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400' },
            CANCELLED:            { label: 'Cancelled',         bg: 'bg-gray-100',   text: 'text-gray-600',   dot: 'bg-gray-400' },
        };
        return map[status] || { label: status.replace('_', ' '), bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
    };

    if (loading && !userRequests.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                    <p className="font-body text-gray-500 font-medium">Loading your services…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
                .font-display { font-family: 'Syne', sans-serif; }
                .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

                .section-label {
                    font-family: 'Syne', sans-serif;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-size: 0.7rem;
                }
                .grid-lines {
                    background-image:
                        linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                .hero-gradient {
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
                }
                .glow-dot {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    pointer-events: none;
                }
                .badge-pill {
                    background: rgba(255,255,255,0.12);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }

                .request-card {
                    transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease;
                    border: 1px solid #f1f5f9;
                }
                .request-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.07);
                    border-color: #e0e7ff;
                }
                .stat-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    border: 1px solid #f1f5f9;
                }
                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(99,102,241,0.08);
                    border-color: #e0e7ff;
                }
                .action-btn {
                    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .action-btn:hover  { transform: translateY(-2px) scale(1.02); }
                .action-btn:active { transform: scale(0.98); }

                .modal-overlay {
                    backdrop-filter: blur(6px);
                    background: rgba(15,23,42,0.5);
                }
            `}</style>

            {/* ── DELETE MODAL ── */}
            {showDeleteModal && (
                <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-center w-16 h-16 bg-red-50 rounded-2xl mx-auto mb-5 border border-red-100">
                            <Trash2 className="w-7 h-7 text-red-500" />
                        </div>
                        <h3 className="font-display font-bold text-2xl text-gray-900 text-center mb-2">Delete Request</h3>
                        <p className="font-body text-gray-500 text-center text-sm mb-5">
                            Delete the service request for{' '}
                            <span className="font-semibold text-gray-800">{selectedRequestDetails?.vehicle_model}</span>?
                        </p>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="font-body text-sm text-red-700">This action cannot be undone. All related data will be permanently deleted.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isProcessing}
                                className="flex-1 px-5 py-3 font-display font-semibold text-sm rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Keep Request
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isProcessing}
                                className="flex-1 px-5 py-3 font-display font-semibold text-sm rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Deleting…</>
                                ) : (
                                    <><Trash2 className="w-4 h-4" />Yes, Delete</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CANCEL MODAL ── */}
            {showCancelModal && (
                <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="flex items-center justify-center w-16 h-16 bg-orange-50 rounded-2xl mx-auto mb-5 border border-orange-100">
                            <XCircle className="w-7 h-7 text-orange-500" />
                        </div>
                        <h3 className="font-display font-bold text-2xl text-gray-900 text-center mb-2">Cancel Connection</h3>
                        <p className="font-body text-gray-500 text-center text-sm mb-5">
                            Cancel the connection with{' '}
                            <span className="font-semibold text-gray-800">{selectedRequestDetails?.active_connection?.workshop_name}</span>?
                        </p>
                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="font-body text-sm text-amber-700">You'll need to request a new connection. Any ongoing communication will be terminated.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                disabled={isProcessing}
                                className="flex-1 px-5 py-3 font-display font-semibold text-sm rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Keep Connection
                            </button>
                            <button
                                onClick={handleCancelConfirm}
                                disabled={isProcessing}
                                className="flex-1 px-5 py-3 font-display font-semibold text-sm rounded-2xl bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <><div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Cancelling…</>
                                ) : (
                                    <><XCircle className="w-4 h-4" />Yes, Cancel</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── PAGE HERO STRIP ── */}
            <section className="hero-gradient relative overflow-hidden">
                <div className="glow-dot w-80 h-80 bg-indigo-500 opacity-20 top-[-60px] left-[-40px]" />
                <div className="glow-dot w-60 h-60 bg-violet-400 opacity-15 top-10 right-8" />

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="section-label text-white/80">Service History</span>
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
                        <div>
                            <h1 className="font-display font-bold text-3xl sm:text-4xl md:text-5xl text-white leading-tight mb-2">
                                Your Service{' '}
                                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                                    Requests
                                </span>
                            </h1>
                            <p className="font-body text-white/50 text-base">Manage and track every request from one place.</p>
                        </div>

                        <button
                            onClick={() => navigate('/user/request')}
                            className="action-btn flex-shrink-0 bg-white font-display font-bold text-indigo-700 text-sm px-6 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-xl hover:bg-indigo-50 group w-fit"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
                            New Service Request
                        </button>
                    </div>
                </div>

                {/* Bottom curve */}
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── BODY ── */}
            <div className="grid-lines max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* Payment alerts */}
                {success && (
                    <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
                        <CheckCircle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-display font-semibold text-sm">Payment Successful!</p>
                            <p className="font-body text-xs text-emerald-600 mt-0.5">You can now proceed with your request.</p>
                        </div>
                    </div>
                )}
                {canceled && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-700 px-5 py-4 rounded-2xl flex items-center gap-3 shadow-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="font-display font-semibold text-sm">Payment Cancelled.</p>
                    </div>
                )}

                {/* ── STATS ── */}
                {userRequests && userRequests.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        {[
                            {
                                label: 'Total Requests',
                                value: userRequests.length,
                                icon: Wrench,
                                iconBg: 'bg-indigo-50 border-indigo-100',
                                iconColor: 'text-indigo-600',
                                valueColor: 'text-gray-900',
                            },
                            {
                                label: 'Active Connections',
                                value: userRequests.filter(r => r.status === 'IN_PROGRESS' || r.status === 'CONNECTING').length,
                                icon: Shield,
                                iconBg: 'bg-emerald-50 border-emerald-100',
                                iconColor: 'text-emerald-600',
                                valueColor: 'text-emerald-600',
                            },
                            {
                                label: 'Pending Action',
                                value: userRequests.filter(r => r.status === 'CREATED' || r.status === 'PLATFORM_FEE_PAID').length,
                                icon: Clock,
                                iconBg: 'bg-orange-50 border-orange-100',
                                iconColor: 'text-orange-600',
                                valueColor: 'text-orange-600',
                            },
                        ].map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={i} className="stat-card bg-white rounded-2xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="section-label text-gray-400 mb-2">{s.label}</p>
                                            <p className={`font-display font-bold text-4xl ${s.valueColor}`}>{s.value}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl ${s.iconBg} border flex items-center justify-center`}>
                                            <Icon className={`w-5 h-5 ${s.iconColor}`} />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── REQUEST CARDS ── */}
                <div className="space-y-4">
                    {userRequests && userRequests.length > 0 ? (
                        userRequests.map((request) => {
                            const statusCfg = getStatusConfig(request.status);
                            return (
                                <div key={request.id} className="request-card bg-white rounded-2xl p-6">

                                    {/* Card header */}
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
                                        <div>
                                            <h3 className="font-display font-bold text-gray-900 text-lg leading-tight mb-1">
                                                {request.vehicle_type} — {request.vehicle_model}
                                            </h3>
                                            <p className="font-body text-gray-400 text-xs flex items-center gap-1.5">
                                                <Clock className="w-3 h-3" />
                                                {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>

                                        {/* Status badge */}
                                        <div className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-display font-semibold w-fit ${statusCfg.bg} ${statusCfg.text}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                                            {statusCfg.label}
                                        </div>
                                    </div>

                                    {/* Issue details */}
                                    <div className="bg-[#f8f9fc] rounded-2xl p-4 mb-4 border border-gray-100">
                                        <p className="font-display font-semibold text-gray-700 text-sm flex items-center gap-2 mb-1.5">
                                            <Wrench className="w-4 h-4 text-indigo-500" />
                                            {request.issue_category}
                                        </p>
                                        <p className="font-body text-gray-500 text-sm leading-relaxed">{request.description}</p>
                                    </div>

                                    {/* Expiry notices */}
                                    {request.status === 'EXPIRED' && request.platform_fee_paid && (
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4 flex items-start gap-3">
                                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-display font-semibold text-red-800 text-sm mb-0.5">Request Expired</p>
                                                <p className="font-body text-red-600 text-xs leading-relaxed">
                                                    {request.active_connection?.status === 'ACCEPTED'
                                                        ? 'A workshop accepted your request, so the platform fee is not refundable.'
                                                        : 'No workshop was connected within 7 days. The platform fee has been refunded to your wallet.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {request.status === 'EXPIRED' && !request.platform_fee_paid && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4 flex items-start gap-3">
                                            <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-display font-semibold text-gray-700 text-sm mb-0.5">Request Expired</p>
                                                <p className="font-body text-gray-500 text-xs">The fee was not paid within 30 minutes.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Active connection */}
                                    {request.active_connection ? (
                                        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-5 mb-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="section-label text-indigo-500 flex items-center gap-1.5">
                                                    <Shield className="w-3.5 h-3.5" /> Connected Workshop
                                                </span>
                                                {request.status === 'CONNECTING' && request.active_connection.requested_at && (
                                                    <ExpirationTimer requestedAt={request.active_connection.requested_at} />
                                                )}
                                            </div>
                                            <p className="font-display font-bold text-gray-900 text-base mb-1">{request.active_connection.workshop_name}</p>
                                            <p className="font-body text-gray-500 text-sm flex items-center gap-1.5">
                                                <MapPin className="w-4 h-4 text-indigo-400" />
                                                {request.active_connection.address}
                                            </p>
                                        </div>
                                    ) : request.latest_connection && ['AUTO_REJECTED', 'REJECTED'].includes(request.latest_connection.status) ? (
                                        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-4">
                                            <span className="section-label text-red-500 flex items-center gap-1.5 mb-3">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                {request.latest_connection.status === 'AUTO_REJECTED' ? 'Auto Rejected' : 'Request Rejected'}
                                            </span>
                                            <p className="font-body text-gray-600 text-sm mb-0.5">
                                                Request to <span className="font-semibold">{request.latest_connection.workshop_name}</span> was
                                                {request.latest_connection.status === 'AUTO_REJECTED' ? ' auto-rejected due to no response.' : ' rejected by the workshop.'}
                                            </p>
                                            <p className="font-body text-gray-400 text-xs">Please try connecting to another workshop.</p>
                                        </div>
                                    ) : null}

                                    {/* Action buttons */}
                                    <div className="flex flex-wrap gap-2.5 mt-1">
                                        {(request.status === 'CREATED' || request.status === 'PLATFORM_FEE_PAID') && (
                                            <button
                                                onClick={() => navigate(`/user/workshops-nearby/${request.id}`)}
                                                className="action-btn px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-semibold text-sm rounded-2xl flex items-center gap-2 shadow-md hover:shadow-lg"
                                            >
                                                <Shield className="w-4 h-4" />
                                                Find &amp; Connect
                                            </button>
                                        )}

                                        {!request.platform_fee_paid && ['CREATED', 'CANCELLED', 'EXPIRED'].includes(request.status) && (
                                            <button
                                                onClick={() => handleDeleteClick(request)}
                                                className="action-btn px-5 py-2.5 bg-red-50 text-red-600 font-display font-semibold text-sm rounded-2xl flex items-center gap-2 border border-red-100 hover:bg-red-100"
                                            >
                                                <Trash2 className="w-4 h-4" /> Delete
                                            </button>
                                        )}

                                        {['CONNECTING', 'CONNECTED', 'ESTIMATE_SHARED', 'SERVICE_AMOUNT_PAID', 'IN_PROGRESS'].includes(request.status) && (
                                            <div className="flex gap-2.5 flex-wrap w-full sm:w-auto">
                                                {request.status === 'CONNECTING' ? (
                                                    <button
                                                        disabled
                                                        className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-100 text-gray-400 font-display font-semibold text-sm rounded-2xl cursor-not-allowed border border-gray-200"
                                                    >
                                                        ⏳ Awaiting Response
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => navigate(`/user/service-flow/${request.id}`)}
                                                        className="action-btn flex-1 sm:flex-none px-5 py-2.5 bg-emerald-50 text-emerald-700 font-display font-semibold text-sm rounded-2xl flex items-center gap-2 border border-emerald-100 hover:bg-emerald-100"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Track Service
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleCancelClick(request)}
                                                    className="action-btn px-5 py-2.5 bg-orange-50 text-orange-600 font-display font-semibold text-sm rounded-2xl flex items-center gap-2 border border-orange-100 hover:bg-orange-100"
                                                >
                                                    <XCircle className="w-4 h-4" /> Cancel Connection
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        /* Empty state */
                        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
                            <div className="w-20 h-20 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
                                <FileX className="w-9 h-9 text-indigo-300" />
                            </div>
                            <h3 className="font-display font-bold text-gray-900 text-xl mb-1">No service requests yet</h3>
                            <p className="font-body text-gray-400 text-sm mb-7">Get started by creating your first service request.</p>
                            <button
                                onClick={() => navigate('/user/request')}
                                className="action-btn inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-bold text-sm rounded-2xl shadow-lg"
                            >
                                <Plus className="w-4 h-4" />
                                Create New Request
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserServices;