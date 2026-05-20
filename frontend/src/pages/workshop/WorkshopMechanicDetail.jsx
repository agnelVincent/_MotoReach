import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User, Phone, Mail, ArrowLeft, Wrench, IndianRupee, Gift, Calendar, CheckCircle,
    Award, Star, X, Sparkles, ChevronRight
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMechanicDetails, payMechanicBonus } from '../../redux/slices/workshopMechanicSlice';
import toast from 'react-hot-toast';

const WorkshopMechanicDetail = () => {
    const { mechanicId } = useParams();
    const navigate = useNavigate();
    const { mechanicDetail, detailLoading } = useSelector((state) => state.workshopMechanic);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchMechanicDetails(mechanicId));
    }, [dispatch, mechanicId]);

    const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [bonusAmount, setBonusAmount] = useState('');

    const openBonusModal = (service) => { setSelectedService(service); setIsBonusModalOpen(true); };
    const closeBonusModal = () => { setIsBonusModalOpen(false); setSelectedService(null); setBonusAmount(''); };

    const handlePayBonus = async () => {
        if (!bonusAmount || isNaN(bonusAmount) || bonusAmount <= 0) { toast.error('Please enter a valid amount'); return; }
        try {
            const result = await dispatch(payMechanicBonus({
                mechanicId: mechanicDetail.id,
                serviceId: selectedService?.id,
                amount: bonusAmount
            })).unwrap();
            toast.success(result?.message || `Successfully paid ₹${bonusAmount} bonus!`);
            closeBonusModal();
            dispatch(fetchMechanicDetails(mechanicId));
        } catch (error) {
            toast.error(error || 'Failed to pay bonus');
        }
    };

    if (detailLoading || !mechanicDetail || !mechanicDetail.services) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center animate-pulse">
                    <Wrench className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="ml-3 font-body text-gray-400 text-sm">Loading mechanic…</span>
            </div>
        );
    }

    const initials = mechanicDetail?.name?.charAt(0)?.toUpperCase() || 'M';

    return (
        <div className="min-h-screen bg-[#f8f9fc] font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
                .font-display { font-family: 'Syne', sans-serif; }
                .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

                .mech-hero {
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
                }
                .hero-noise::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
                    opacity: 0.4;
                    pointer-events: none;
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
                .section-label {
                    font-family: 'Syne', sans-serif;
                    font-weight: 600;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-size: 0.7rem;
                }
                .card {
                    background: white;
                    border-radius: 1.5rem;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                }
                .stat-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    border: 1px solid #f1f5f9;
                }
                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(0,0,0,0.08);
                }
                .service-row {
                    border: 1px solid #f1f5f9;
                    border-radius: 1.25rem;
                    background: white;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
                }
                .service-row:hover {
                    border-color: #e0e7ff;
                    box-shadow: 0 8px 28px rgba(99,102,241,0.08);
                    transform: translateY(-2px);
                }
                .bonus-btn {
                    background: linear-gradient(135deg, #7c3aed, #6366f1);
                    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
                    box-shadow: 0 4px 14px rgba(124,58,237,0.3);
                }
                .bonus-btn:hover {
                    background: linear-gradient(135deg, #6d28d9, #4f46e5);
                    transform: translateY(-2px) scale(1.02);
                    box-shadow: 0 8px 24px rgba(124,58,237,0.4);
                }
                .back-btn {
                    transition: all 0.2s ease;
                }
                .back-btn:hover {
                    transform: translateX(-3px);
                }
                .modal-backdrop {
                    animation: fadeIn 0.15s ease forwards;
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .modal-card {
                    animation: slideUp 0.22s cubic-bezier(0.16,1,0.3,1) forwards;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .grid-lines {
                    background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                .avatar-ring {
                    background: linear-gradient(135deg, #6366f1, #a78bfa, #818cf8);
                    padding: 3px;
                    border-radius: 1.25rem;
                }
                .avatar-inner {
                    background: linear-gradient(135deg, #4338ca, #6366f1);
                    border-radius: 1rem;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .quick-amt {
                    transition: all 0.15s cubic-bezier(0.34,1.56,0.64,1);
                    border: 1.5px solid #e5e7eb;
                }
                .quick-amt:hover {
                    background: #f5f3ff;
                    border-color: #a5b4fc;
                    color: #4338ca;
                    transform: scale(1.04);
                }
            `}</style>

            {/* ── BONUS MODAL ── */}
            {isBonusModalOpen && (
                <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="modal-card bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 mech-hero rounded-2xl flex items-center justify-center">
                                    <Gift className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-gray-900 text-lg leading-tight">Send Bonus</h3>
                                    <p className="font-body text-gray-400 text-xs">Req #{selectedService?.id}</p>
                                </div>
                            </div>
                            <button onClick={closeBonusModal} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        <p className="font-body text-gray-500 text-sm mb-5 leading-relaxed">
                            Reward <span className="font-semibold text-gray-800">{mechanicDetail.name}</span> for their excellent work on this service.
                        </p>

                        {/* Amount input */}
                        <div className="mb-4">
                            <label className="section-label text-gray-400 mb-2 block">Bonus Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display font-bold text-indigo-400 text-xl">₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    placeholder="0"
                                    value={bonusAmount}
                                    onChange={(e) => setBonusAmount(e.target.value)}
                                    className="w-full pl-10 pr-4 py-4 font-display font-bold text-3xl text-gray-900 border-2 border-gray-100 rounded-2xl focus:ring-0 focus:border-indigo-400 outline-none transition-colors bg-gray-50"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Quick amounts */}
                        <div className="mb-5">
                            <p className="section-label text-gray-400 mb-2 block">Quick Select</p>
                            <div className="grid grid-cols-4 gap-2">
                                {[100, 250, 500, 1000].map((amt) => (
                                    <button
                                        key={amt}
                                        onClick={() => setBonusAmount(amt.toString())}
                                        className={`quick-amt font-display font-bold text-sm py-2 rounded-xl text-gray-600 ${bonusAmount === amt.toString() ? 'bg-indigo-50 border-indigo-400 text-indigo-700' : ''}`}
                                    >
                                        ₹{amt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p className="font-body text-xs text-center text-violet-500 mb-5">
                            Deducted from your workshop wallet
                        </p>

                        <div className="flex gap-3">
                            <button onClick={closeBonusModal} className="flex-1 py-3.5 font-display font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-colors text-sm">
                                Cancel
                            </button>
                            <button onClick={handlePayBonus} className="flex-1 py-3.5 font-display font-bold text-white rounded-2xl bonus-btn text-sm flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Confirm ₹{bonusAmount || '0'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── HERO ── */}
            <section className="mech-hero hero-noise relative overflow-hidden">
                <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
                <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-10 right-10" />

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-28 md:pt-12 md:pb-32">
                    {/* Back button */}
                    <button
                        onClick={() => navigate('/workshop/team')}
                        className="back-btn flex items-center gap-2 badge-pill px-4 py-2 rounded-xl text-white/70 hover:text-white mb-8 text-sm font-display font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Team
                    </button>

                    {/* Profile row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                        {/* Avatar */}
                        <div className="avatar-ring w-20 h-20 flex-shrink-0">
                            <div className="avatar-inner">
                                <span className="font-display font-bold text-white text-3xl">{initials}</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">
                                    {mechanicDetail.name}
                                </h1>
                                <span className="inline-flex items-center gap-1 bg-emerald-400/20 border border-emerald-400/30 text-emerald-300 text-xs font-display font-bold px-3 py-1 rounded-full">
                                    <CheckCircle className="w-3 h-3" /> {mechanicDetail.status}
                                </span>
                                <span className="inline-flex items-center gap-1 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-display font-bold px-3 py-1 rounded-full">
                                    <Star className="w-3 h-3 fill-amber-300" />
                                    {mechanicDetail.rating_avg ? Number(mechanicDetail.rating_avg).toFixed(1) : 'No ratings'}
                                </span>
                            </div>
                            <p className="font-body text-white/40 text-sm">MECH-{mechanicDetail.id}</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── STAT CARDS ── */}
            <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        { icon: Phone, label: 'Phone', value: mechanicDetail.phone, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
                        { icon: Mail, label: 'Email', value: mechanicDetail.email, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
                        { icon: Calendar, label: 'Joined', value: mechanicDetail.joinedDate, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
                        { icon: Wrench, label: 'Total Services', value: mechanicDetail.totalServices, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
                    ].map(({ icon: Icon, label, value, color, bg, border }) => (
                        <div key={label} className={`stat-card bg-white rounded-2xl p-4 shadow-sm`}>
                            <div className={`w-8 h-8 rounded-xl ${bg} border ${border} flex items-center justify-center mb-2`}>
                                <Icon className={`w-4 h-4 ${color}`} />
                            </div>
                            <div className={`font-display font-bold text-sm ${color} truncate`}>{value}</div>
                            <div className="font-body text-gray-400 text-xs mt-0.5">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SERVICE HISTORY ── */}
            <section className="grid-lines max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <span className="section-label text-indigo-500 block mb-0.5">Performance</span>
                        <h2 className="font-display font-bold text-gray-900 text-xl flex items-center gap-2">
                            <Award className="w-5 h-5 text-amber-500" />
                            Service History & Payouts
                        </h2>
                    </div>
                    <span className="font-body text-gray-400 text-xs">{mechanicDetail.services.length} records</span>
                </div>

                <div className="space-y-3">
                    {mechanicDetail.services.map((service) => (
                        <div key={service.id} className="service-row p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            {/* Left */}
                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <Wrench className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                        <h3 className="font-display font-bold text-gray-900 text-base">{service.category}</h3>
                                        <span className="font-body text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-lg hidden sm:inline">REQ #{service.id}</span>
                                    </div>
                                    <p className="font-body text-gray-400 text-sm truncate">{service.vehicle}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <Calendar className="w-3 h-3 text-gray-300" />
                                        <span className="font-body text-xs text-gray-400">{service.date}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-4 w-full md:w-auto md:border-l md:border-gray-100 md:pl-6 self-end md:self-auto">
                                <div className="text-right flex-1 md:flex-none">
                                    <p className="section-label text-gray-400 block mb-0.5">Service Share</p>
                                    <div className="flex items-center gap-0.5 justify-end">
                                        <span className="font-display font-bold text-gray-900 text-xl">₹{service.mechanicShare}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openBonusModal(service)}
                                    className="bonus-btn font-display font-bold text-white text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 flex-shrink-0"
                                >
                                    <Gift className="w-4 h-4" />
                                    Bonus
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default WorkshopMechanicDetail;