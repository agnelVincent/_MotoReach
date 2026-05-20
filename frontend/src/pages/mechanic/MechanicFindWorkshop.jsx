import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, MapPin, Star, Shield, ArrowRight, Wrench } from 'lucide-react';
import { searchWorkshops, sendJoinRequest, clearSearchResults } from '../../redux/slices/workshopMechanicSlice';

const MechanicFindWorkshop = () => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    const { searchResults, searchLoading } = useSelector(state => state.workshopMechanic);

    useEffect(() => { setMounted(true); }, []);

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
        dispatch(sendJoinRequest(workshopId));
    };

    const hasQuery = searchTerm.trim().length > 2;

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
                .delay-300 { animation-delay: 300ms; }

                .workshop-card {
                    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
                    border: 1px solid #f1f5f9;
                }
                .workshop-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.07);
                    border-color: #e0e7ff;
                }
                .action-btn {
                    transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
                }
                .action-btn:hover  { transform: translateY(-2px) scale(1.02); }
                .action-btn:active { transform: scale(0.98); }

                .search-input:focus {
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
                    border-color: #6366f1;
                }
            `}</style>

            {/* ── HERO ── */}
            <section className="hero-gradient relative overflow-hidden">
                <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
                <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-16 right-10" />
                <div className="glow-dot w-64 h-64 bg-blue-400 opacity-10 bottom-0 left-1/3" />

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20 text-center">
                    <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-6 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="section-label text-white/80">Workshop Search</span>
                    </div>

                    <h1 className={`font-display font-bold text-4xl sm:text-5xl md:text-6xl text-white leading-[1.05] mb-4 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
                        Find a{' '}
                        <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                            Workshop
                        </span>
                    </h1>

                    <p className={`font-body text-white/55 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-10 opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
                        Search by name or location to send a joining request. Once approved, you'll be part of their team.
                    </p>

                    {/* Search bar inside hero */}
                    <div className={`max-w-xl mx-auto opacity-0 ${mounted ? 'animate-fade-up delay-300' : ''}`}>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                            <input
                                type="text"
                                className="search-input w-full pl-12 pr-5 py-4 bg-white rounded-2xl font-body text-gray-800 text-sm placeholder-gray-400 border border-white/20 shadow-2xl transition-all"
                                placeholder="Search by workshop name, city, or locality…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchLoading && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom curve */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── RESULTS ── */}
            <div className="grid-lines max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* No results */}
                {!searchLoading && hasQuery && searchResults.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Search className="w-7 h-7 text-indigo-300" />
                        </div>
                        <p className="font-display font-bold text-gray-900 text-lg mb-1">No workshops found</p>
                        <p className="font-body text-gray-400 text-sm">Try a different name, city, or locality.</p>
                    </div>
                )}

                {/* Idle prompt */}
                {!hasQuery && (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Wrench className="w-7 h-7 text-indigo-300" />
                        </div>
                        <p className="font-display font-bold text-gray-900 text-lg mb-1">Start your search</p>
                        <p className="font-body text-gray-400 text-sm">Type at least 3 characters to find workshops.</p>
                    </div>
                )}

                {/* Results list */}
                {searchResults.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="section-label text-indigo-500">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found</span>
                        </div>

                        {searchResults.map((workshop) => (
                            <div key={workshop.id} className="workshop-card bg-white rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                                    <div className="flex-1 min-w-0">
                                        {/* Name + verified */}
                                        <div className="flex flex-wrap items-center gap-2.5 mb-2">
                                            <h3 className="font-display font-bold text-gray-900 text-lg">
                                                {workshop.workshop_name}
                                            </h3>
                                            <div className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                                                <Shield className="w-3 h-3 text-emerald-600" />
                                                <span className="font-display font-semibold text-emerald-700 text-xs">Verified</span>
                                            </div>
                                        </div>

                                        {/* Meta row */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2">
                                            <span className="font-body text-sm text-gray-500 flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                                                {workshop.locality}, {workshop.city}
                                            </span>
                                            <span className="font-body text-sm text-gray-500 flex items-center gap-1">
                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                <span className="font-semibold text-gray-700">{workshop.rating_avg}</span>
                                            </span>
                                        </div>

                                        <p className="font-body text-gray-400 text-sm leading-relaxed">
                                            {workshop.address_line}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleConnect(workshop.id)}
                                        className="action-btn flex-shrink-0 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-display font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                                    >
                                        Connect
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MechanicFindWorkshop;