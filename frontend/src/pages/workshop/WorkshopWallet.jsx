import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWallet, fetchWalletTransactions } from '../../redux/slices/walletSlice';
import {
    Wallet as WalletIcon,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    Clock,
    ChevronRight,
    Activity,
    Banknote
} from 'lucide-react';

const WorkshopWallet = () => {
    const dispatch = useDispatch();

    const { balance, recentTransactions, allTransactions, currentPage, hasMore, loading, transactionsLoading } = useSelector((state) => state.wallet);

    const [viewAllTransactions, setViewAllTransactions] = useState(false);

    useEffect(() => {
        dispatch(fetchWallet());
    }, [dispatch]);

    useEffect(() => {
        if (viewAllTransactions) {
            dispatch(fetchWalletTransactions({ page: currentPage, pageSize: 20 }));
        }
    }, [dispatch, viewAllTransactions, currentPage]);

    const getTransactionIcon = (type) => type === 'CREDIT' ? (
        <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
        </div>
    ) : (
        <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-5 h-5 text-rose-500" />
        </div>
    );

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const displayTransactions = viewAllTransactions ? allTransactions : recentTransactions;

    const totalCredits = (allTransactions.length > 0 ? allTransactions : recentTransactions)
        .filter(t => t.transaction_type === 'CREDIT')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalDebits = (allTransactions.length > 0 ? allTransactions : recentTransactions)
        .filter(t => t.transaction_type === 'DEBIT')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    if (loading && !balance) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center animate-pulse">
                    <WalletIcon className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="ml-3 font-body text-gray-400 text-sm">Loading wallet…</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
                .font-display { font-family: 'Syne', sans-serif; }
                .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

                .wallet-hero {
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
                .stat-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 12px 32px rgba(0,0,0,0.08);
                }
                .card {
                    background: white;
                    border-radius: 1.5rem;
                    border: 1px solid #f1f5f9;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
                }
                .tx-row {
                    border: 1px solid #f1f5f9;
                    border-radius: 1rem;
                    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
                }
                .tx-row:hover {
                    background: #fafbff;
                    border-color: #e0e7ff;
                    transform: translateX(2px);
                }
                .grid-lines {
                    background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
            `}</style>

            {/* ── HERO ── */}
            <section className="wallet-hero hero-noise relative overflow-hidden">
                <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
                <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-10 right-10" />

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pt-16 md:pb-32">
                    <div className="inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/80 mb-6">
                        <Banknote className="w-3.5 h-3.5" />
                        <span className="section-label text-white/70">Earnings Wallet</span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                        <div>
                            <p className="font-body text-white/40 text-sm mb-1">Available Balance</p>
                            <h1 className="font-display font-bold text-5xl sm:text-6xl text-white leading-none">
                                ₹<span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                                    {parseFloat(balance || 0).toFixed(2)}
                                </span>
                            </h1>
                            <p className="font-body text-white/30 text-xs mt-2">Earnings from completed services</p>
                        </div>

                        <div className="badge-pill px-4 py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="font-display font-semibold text-white/70 text-sm">Auto-credited</span>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── STAT CARDS ── */}
            <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                            <WalletIcon className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="font-display font-bold text-2xl text-indigo-600">₹{parseFloat(balance || 0).toFixed(2)}</div>
                        <div className="font-body text-gray-700 font-medium text-sm mt-0.5">Balance</div>
                        <div className="font-body text-gray-400 text-xs">Current wallet</div>
                    </div>

                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="font-display font-bold text-2xl text-emerald-600">₹{totalCredits.toFixed(2)}</div>
                        <div className="font-body text-gray-700 font-medium text-sm mt-0.5">Total Credits</div>
                        <div className="font-body text-gray-400 text-xs">Money received</div>
                    </div>

                    <div className="stat-card bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center mb-3">
                            <TrendingDown className="w-4 h-4 text-rose-500" />
                        </div>
                        <div className="font-display font-bold text-2xl text-rose-500">₹{totalDebits.toFixed(2)}</div>
                        <div className="font-body text-gray-700 font-medium text-sm mt-0.5">Total Debits</div>
                        <div className="font-body text-gray-400 text-xs">Money deducted</div>
                    </div>
                </div>
            </section>

            {/* ── TRANSACTIONS ── */}
            <section className="grid-lines max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="card overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-50">
                        <div>
                            <span className="section-label text-indigo-500 block mb-0.5">
                                {viewAllTransactions ? 'All Records' : 'Recent Activity'}
                            </span>
                            <h2 className="font-display font-bold text-gray-900 text-xl">
                                {viewAllTransactions ? 'All Transactions' : 'Recent Transactions'}
                            </h2>
                        </div>
                        {!viewAllTransactions && recentTransactions.length > 0 && (
                            <button
                                onClick={() => setViewAllTransactions(true)}
                                className="font-display font-semibold text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                        {viewAllTransactions && (
                            <button
                                onClick={() => setViewAllTransactions(false)}
                                className="font-display font-semibold text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Show Less
                            </button>
                        )}
                    </div>

                    {/* Body */}
                    <div className="p-4 md:p-6">
                        {transactionsLoading ? (
                            <div className="flex items-center justify-center py-16 gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center animate-pulse">
                                    <Activity className="w-4 h-4 text-indigo-500" />
                                </div>
                                <span className="font-body text-gray-400 text-sm">Loading transactions…</span>
                            </div>
                        ) : displayTransactions.length > 0 ? (
                            <div className="space-y-2">
                                {displayTransactions.map((transaction) => (
                                    <div key={transaction.id} className="tx-row flex items-center justify-between p-3.5 bg-white">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {getTransactionIcon(transaction.transaction_type)}
                                            <div className="min-w-0">
                                                <p className="font-display font-semibold text-gray-800 text-sm truncate">{transaction.description}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Calendar className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                                    <p className="font-body text-xs text-gray-400">{formatDate(transaction.created_at)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-3">
                                            <p className={`font-display font-bold text-base ${transaction.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                {transaction.transaction_type === 'CREDIT' ? '+' : '−'}₹{parseFloat(transaction.amount).toFixed(2)}
                                            </p>
                                            <span className={`font-body text-[10px] px-2 py-0.5 rounded-full ${transaction.transaction_type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                {transaction.transaction_type}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="w-16 h-16 wallet-hero rounded-3xl flex items-center justify-center mx-auto mb-4 opacity-80">
                                    <Clock className="w-8 h-8 text-white" />
                                </div>
                                <p className="font-display font-bold text-gray-800 text-lg mb-1">No transactions yet</p>
                                <p className="font-body text-gray-400 text-sm">Your earnings from completed services will appear here</p>
                            </div>
                        )}

                        {viewAllTransactions && hasMore && (
                            <div className="mt-5 text-center">
                                <button
                                    onClick={() => dispatch(fetchWalletTransactions({ page: currentPage + 1, pageSize: 20 }))}
                                    className="font-display font-semibold px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors text-sm"
                                >
                                    Load More
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default WorkshopWallet;