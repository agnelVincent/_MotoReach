import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Star, Shield, LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { leaveWorkshop } from '../../redux/slices/workshopMechanicSlice';
import { toast } from 'react-hot-toast';

const MechanicWorkshopDetails = ({ workshop }) => {
    const dispatch = useDispatch();
    const { actionLoading } = useSelector(state => state.workshopMechanic);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const handleLeave = () => {
        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[240px]">
                <div>
                    <p className="font-semibold text-gray-900">Leave Workshop?</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Are you sure you want to leave <strong>{workshop.workshop_name}</strong>?
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { dispatch(leaveWorkshop()); toast.dismiss(t.id); }}
                        className="flex-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                    >
                        Leave
                    </button>
                </div>
            </div>
        ), { duration: 10000, position: 'top-center' });
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
            `}</style>

            {/* ── HERO ── */}
            <section className="hero-gradient relative overflow-hidden">
                <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
                <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-16 right-10" />

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
                    <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-6 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="section-label text-white/80">Your Workshop</span>
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
                        {/* Workshop icon + name */}
                        <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-8 h-8 text-white/80" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h1 className="font-display font-bold text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
                                        {workshop.workshop_name}
                                    </h1>
                                    <Shield className="w-5 h-5 text-emerald-400 fill-emerald-400 flex-shrink-0" />
                                </div>
                                <p className="font-body text-white/50 text-sm flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {workshop.locality}, {workshop.city}
                                </p>
                            </div>
                        </div>

                        {/* Leave button */}
                        <button
                            onClick={handleLeave}
                            disabled={actionLoading}
                            className="action-btn flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-red-500/15 border border-red-400/30 text-red-300 font-display font-semibold text-sm rounded-2xl hover:bg-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
                        >
                            {actionLoading ? (
                                <>
                                    <div className="w-4 h-4 rounded-full border-2 border-red-300/40 border-t-red-300 animate-spin" />
                                    Leaving…
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

                <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── BODY ── */}
            <div className="grid-lines max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">

                {/* Workshop detail card */}
                <div className="detail-card bg-white rounded-3xl p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <span className="section-label text-indigo-500 block mb-0.5">Details</span>
                            <h2 className="font-display font-bold text-gray-900 text-xl">Workshop Information</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Address */}
                        <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-4 h-4 text-indigo-400" />
                                <span className="section-label text-gray-400">Address</span>
                            </div>
                            <p className="font-body text-gray-700 text-sm leading-relaxed">
                                {workshop.address_line}, {workshop.locality}, {workshop.city}
                            </p>
                        </div>

                        {/* Phone */}
                        <div className="bg-[#f8f9fc] border border-gray-100 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Phone className="w-4 h-4 text-violet-400" />
                                <span className="section-label text-gray-400">Contact</span>
                            </div>
                            <p className="font-body text-gray-700 text-sm font-medium">
                                {workshop.contact_number}
                            </p>
                        </div>

                        {/* Rating */}
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
                </div>

                {/* Status notice */}
                <div className="detail-card bg-white rounded-3xl p-6 md:p-8">
                    <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="section-label text-emerald-500">Membership</span>
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="font-display font-semibold text-emerald-700 text-xs">Active</span>
                                </span>
                            </div>
                            <h3 className="font-display font-bold text-gray-900 text-lg mb-1">
                                You're part of this workshop
                            </h3>
                            <p className="font-body text-gray-500 text-sm leading-relaxed">
                                You are currently a registered mechanic for this workshop. Leaving will remove you from their team — you'll need to apply again to rejoin.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default MechanicWorkshopDetails;