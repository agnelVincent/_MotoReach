import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, MapPin, Phone, Star, Clock, X, AlertCircle } from 'lucide-react';
import { cancelJoinRequest } from '../../redux/slices/workshopMechanicSlice';

const MechanicPendingRequest = ({ workshop }) => {
    const dispatch = useDispatch();
    const [showConfirm, setShowConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { actionLoading } = useSelector(state => state.workshopMechanic);

    useEffect(() => { setMounted(true); }, []);

    const handleCancel = () => {
        dispatch(cancelJoinRequest());
        setShowConfirm(false);
    };

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
                .grid-lines {
                    background-image:
                        linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }

                .detail-card {
                    border: 1px solid #f1f5f9;
                    transition: box-shadow 0.2s ease;
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
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                .modal-in { animation: modalIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards; }
            `}</style>

            {/* ── HERO ── */}
            <section className="hero-gradient relative overflow-hidden">
                <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
                <div className="glow-dot w-72 h-72 bg-amber-400 opacity-10 top-16 right-10" />

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
                    {/* Pending badge */}
                    <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-6 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="section-label text-white/80">Pending Approval</span>
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center gap-6 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
                        {/* Icon + name */}
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Clock className="w-8 h-8 text-amber-300" />
                            </div>
                            <div>
                                <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight mb-1">
                                    Awaiting{' '}
                                    <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-orange-200 bg-clip-text text-transparent">
                                        Approval
                                    </span>
                                </h1>
                                <p className="font-body text-white/50 text-sm">
                                    Your join request to <span className="text-white/80 font-medium">{workshop.workshop_name}</span> is under review.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── BODY ── */}
            <div className="grid-lines max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">

                {/* Workshop details */}
                <div className="detail-card bg-white rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <span className="section-label text-indigo-500 block mb-0.5">Applied To</span>
                            <h2 className="font-display font-bold text-gray-900 text-xl">{workshop.workshop_name}</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-indigo-400" />
                                <span className="section-label text-gray-400">Address</span>
                            </div>
                            <p className="font-body text-gray-700 text-sm leading-relaxed">
                                {workshop.address_line}, {workshop.locality}, {workshop.city}
                            </p>
                        </div>

                        <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Phone className="w-4 h-4 text-violet-400" />
                                <span className="section-label text-gray-400">Contact</span>
                            </div>
                            <p className="font-body text-gray-700 text-sm font-medium">{workshop.contact_number}</p>
                        </div>

                        <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                <span className="section-label text-gray-400">Rating</span>
                            </div>
                            <p className="font-display font-bold text-gray-900 text-2xl">
                                {workshop.rating_avg}
                                <span className="font-body font-normal text-gray-400 text-sm ml-1">/ 5</span>
                            </p>
                        </div>
                    </div>

                    {/* Cancel button */}
                    <div className="pt-5 border-t border-gray-100">
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={actionLoading}
                            className="action-btn flex items-center gap-2 px-5 py-2.5 bg-red-50 border border-red-100 text-red-600 font-display font-semibold text-sm rounded-2xl hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <X className="w-4 h-4" />
                            Cancel Join Request
                        </button>
                    </div>
                </div>

                {/* What happens next */}
                <div className="detail-card bg-white rounded-3xl p-6 md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <span className="section-label text-indigo-500 block mb-1">Next Steps</span>
                            <h3 className="font-display font-bold text-gray-900 text-lg mb-2">What happens next?</h3>
                            <p className="font-body text-gray-500 text-sm leading-relaxed">
                                The workshop admin will review your request. Once approved, you'll be able to see full workshop details and start working with them. You can cancel this request anytime if you change your mind.
                            </p>
                        </div>
                    </div>
                </div>

            </div>

            {/* ── CANCEL MODAL ── */}
            {showConfirm && (
                <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
                    <div className="modal-in bg-white rounded-3xl shadow-2xl max-w-md w-full p-8">
                        <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-display font-bold text-gray-900 text-2xl text-center mb-2">
                            Cancel Join Request?
                        </h3>
                        <p className="font-body text-gray-500 text-sm text-center leading-relaxed mb-6">
                            Are you sure you want to cancel your request to join{' '}
                            <span className="font-semibold text-gray-800">{workshop.workshop_name}</span>?
                            You can send a new request later.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={actionLoading}
                                className="flex-1 px-5 py-3 font-display font-semibold text-sm rounded-2xl border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Keep Request
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={actionLoading}
                                className="flex-1 px-5 py-3 font-display font-semibold text-sm rounded-2xl bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {actionLoading ? (
                                    <>
                                        <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                        Cancelling…
                                    </>
                                ) : 'Cancel Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MechanicPendingRequest;