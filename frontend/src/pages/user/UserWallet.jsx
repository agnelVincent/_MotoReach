import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchWallet, fetchWalletTransactions, initiateAddMoney } from '../../redux/slices/walletSlice';
import {
    Wallet as WalletIcon,
    TrendingUp,
    TrendingDown,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Calendar,
    IndianRupee,
    Clock,
    CreditCard,
    X,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserWallet = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { balance, recentTransactions, allTransactions, totalTransactions, currentPage, hasMore, loading, transactionsLoading } = useSelector((state) => state.wallet);

    const [mounted, setMounted] = useState(false);
    const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [viewAllTransactions, setViewAllTransactions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const addMoneySuccess = queryParams.get('add_money_success');
    const addMoneyCanceled = queryParams.get('add_money_canceled');

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        dispatch(fetchWallet());
    }, [dispatch]);

    useEffect(() => {
        if (viewAllTransactions) {
            dispatch(fetchWalletTransactions({ page: currentPage, pageSize: 20 }));
        }
    }, [dispatch, viewAllTransactions, currentPage]);

    useEffect(() => {
        if (addMoneySuccess) {
            toast.success('Money added successfully!', { id: 'add-money-success' });
            dispatch(fetchWallet());
            navigate('/user/wallet', { replace: true });
        }
        if (addMoneyCanceled) {
            toast.error('Payment was cancelled', { id: 'add-money-canceled' });
            navigate('/user/wallet', { replace: true });
        }
    }, [addMoneySuccess, addMoneyCanceled, dispatch, navigate]);

    const handleAddMoney = async () => {
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount)) { toast.error('Please enter a valid amount'); return; }
        if (numAmount <= 0) { toast.error('Amount must be greater than 0'); return; }
        if (numAmount > 100000) { toast.error('Amount cannot exceed ₹1,00,000'); return; }

        setIsProcessing(true);
        try {
            const resultAction = await dispatch(initiateAddMoney(numAmount));
            if (initiateAddMoney.fulfilled.match(resultAction)) {
                const data = resultAction.payload;
                if (data.url) window.location.href = data.url;
            } else {
                toast.error(resultAction.payload?.error || 'Failed to initiate payment');
                setIsProcessing(false);
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
            setIsProcessing(false);
        }
    };

    const quickAmounts = [10, 25, 50, 100, 250, 500];

    const getTransactionIcon = (type) => {
        return type === 'CREDIT' ? (
            <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            </div>
        ) : (
            <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
            </div>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const displayTransactions = viewAllTransactions ? allTransactions : recentTransactions;

    if (loading && !balance) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600" />
                    </div>
                    <p className="font-body text-gray-400 text-sm">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8f9fc] font-sans">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');

                .font-display { font-family: 'Syne', sans-serif; }
                .font-body { font-family: 'Geist', 'Inter', sans-serif; }

                .wallet-hero {
                    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
                }
                .wallet-hero-noise::before {
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

                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .delay-100 { animation-delay: 100ms; }
                .delay-200 { animation-delay: 200ms; }
                .delay-300 { animation-delay: 300ms; }

                .stat-glass {
                    background: rgba(255,255,255,0.08);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.12);
                }

                .txn-row {
                    transition: all 0.2s ease;
                    border: 1px solid #f1f5f9;
                }
                .txn-row:hover {
                    border-color: #e0e7ff;
                    box-shadow: 0 4px 16px rgba(99,102,241,0.06);
                    transform: translateY(-1px);
                }

                .add-btn {
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    background: white;
                    color: #1e1b4b;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1);
                }
                .add-btn:hover {
                    background: #f5f3ff;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.2);
                    transform: translateY(-2px) scale(1.02);
                }
                .add-btn:active { transform: scale(0.98); }

                .quick-amt {
                    transition: all 0.18s ease;
                    border: 1px solid #f1f5f9;
                }
                .quick-amt:hover {
                    border-color: #c7d2fe;
                    background: #eef2ff;
                    color: #4338ca;
                    transform: translateY(-1px);
                }
                .quick-amt.selected {
                    border-color: #6366f1;
                    background: #eef2ff;
                    color: #4338ca;
                }

                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 50;
                    padding: 1rem;
                }

                .modal-card {
                    background: white;
                    border-radius: 1.5rem;
                    width: 100%;
                    max-width: 440px;
                    padding: 2rem;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.25);
                    animation: fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .modal-input {
                    width: 100%;
                    padding: 1rem 1rem 1rem 3rem;
                    font-size: 1.75rem;
                    font-weight: 700;
                    font-family: 'Syne', sans-serif;
                    border: 2px solid #e2e8f0;
                    border-radius: 1rem;
                    outline: none;
                    transition: border-color 0.2s;
                    color: #0f172a;
                    background: #f8f9fc;
                }
                .modal-input:focus { border-color: #6366f1; background: white; }

                .primary-btn {
                    width: 100%;
                    padding: 1rem;
                    background: linear-gradient(135deg, #4f46e5, #7c3aed);
                    color: white;
                    font-family: 'Syne', sans-serif;
                    font-weight: 700;
                    font-size: 1rem;
                    border-radius: 1rem;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 8px 24px rgba(99,102,241,0.3);
                }
                .primary-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 40px rgba(99,102,241,0.4);
                }
                .primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

                .grid-lines {
                    background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
                    background-size: 40px 40px;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>

            {/* ── ADD MONEY MODAL ── */}
            {showAddMoneyModal && (
                <div className="modal-overlay">
                    <div className="modal-card">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="section-label text-indigo-500">Wallet</p>
                                    <h3 className="font-display font-bold text-gray-900 text-xl leading-tight">Add Money</h3>
                                </div>
                            </div>
                            <button
                                onClick={() => { setShowAddMoneyModal(false); setAmount(''); }}
                                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            >
                                <X className="w-4 h-4 text-gray-500" />
                            </button>
                        </div>

                        {/* Amount Input */}
                        <div className="mb-5">
                            <label className="section-label text-gray-400 block mb-2">Enter Amount</label>
                            <div className="relative">
                                <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="modal-input"
                                    step="0.01"
                                    min="0"
                                    max="100000"
                                />
                            </div>
                            <p className="font-body text-xs text-gray-400 mt-2">Maximum: ₹1,00,000 per transaction</p>
                        </div>

                        {/* Quick Amounts */}
                        <div className="mb-5">
                            <p className="section-label text-gray-400 block mb-3">Quick Select</p>
                            <div className="grid grid-cols-3 gap-2">
                                {quickAmounts.map((qa) => (
                                    <button
                                        key={qa}
                                        onClick={() => setAmount(qa.toString())}
                                        className={`quick-amt font-display font-bold text-sm py-3 rounded-xl bg-white text-gray-700 ${amount === qa.toString() ? 'selected' : ''}`}
                                    >
                                        ₹{qa}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Secure Note */}
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 bg-white border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <CreditCard className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="font-display font-bold text-indigo-900 text-sm">Secure Payment via Stripe</p>
                                    <p className="font-body text-indigo-600 text-xs mt-0.5 leading-relaxed">Funds are encrypted and added to your wallet instantly after payment.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAddMoney}
                            disabled={isProcessing || !amount}
                            className="primary-btn"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Add ₹{amount || '0'} to Wallet
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* ── HERO ── */}
            <section className="wallet-hero wallet-hero-noise relative overflow-hidden">
                <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
                <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-20 right-10" />
                <div className="glow-dot w-80 h-80 bg-blue-400 opacity-10 bottom-0 left-1/3" />

                {/* Floating decorative circle */}
                <div className="absolute right-10 top-12 w-40 h-40 md:w-56 md:h-56 rounded-full border border-white/5 hidden md:block" style={{ animation: 'float 6s ease-in-out infinite' }}>
                    <div className="absolute inset-4 rounded-full border border-white/5" />
                    <div className="absolute inset-8 rounded-full border border-white/5" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <WalletIcon className="w-10 h-10 text-white/20" />
                    </div>
                </div>

                <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
                    {/* Badge */}
                    <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-6 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="section-label text-white/80">My Wallet</span>
                    </div>

                    {/* Balance + CTA row */}
                    <div className={`flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
                        <div>
                            <p className="font-body text-white/50 text-sm mb-1">Available Balance</p>
                            <h1 className="font-display font-bold text-white text-5xl sm:text-6xl md:text-7xl leading-none">
                                ₹{parseFloat(balance || 0).toFixed(2)}
                            </h1>
                        </div>
                        <button
                            onClick={() => setShowAddMoneyModal(true)}
                            className="add-btn font-display font-bold text-base px-7 py-4 rounded-2xl flex items-center gap-3 group self-start sm:self-auto flex-shrink-0"
                        >
                            <Plus className="w-5 h-5 text-indigo-600 group-hover:rotate-90 transition-transform duration-300" />
                            Add Money
                        </button>
                    </div>

                    {/* Stats row */}
                    <div className={`grid grid-cols-2 gap-3 sm:gap-4 opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
                        <div className="stat-glass rounded-2xl px-5 py-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-emerald-300" />
                                <p className="font-body text-white/50 text-xs">Total Credits</p>
                            </div>
                            <p className="font-display font-bold text-white text-2xl sm:text-3xl">
                                ₹{recentTransactions
                                    .filter(t => t.transaction_type === 'CREDIT')
                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                        <div className="stat-glass rounded-2xl px-5 py-4">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="w-4 h-4 text-rose-300" />
                                <p className="font-body text-white/50 text-xs">Total Debits</p>
                            </div>
                            <p className="font-display font-bold text-white text-2xl sm:text-3xl">
                                ₹{recentTransactions
                                    .filter(t => t.transaction_type === 'DEBIT')
                                    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                    .toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom curve */}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
            </section>

            {/* ── TRANSACTIONS ── */}
            <section className="grid-lines max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">

                {/* Section header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <span className="section-label text-indigo-500 block mb-1">
                            {viewAllTransactions ? 'Full History' : 'Recent Activity'}
                        </span>
                        <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900">
                            Transactions
                        </h2>
                    </div>

                    {recentTransactions.length > 0 && (
                        <button
                            onClick={() => setViewAllTransactions(v => !v)}
                            className="inline-flex items-center gap-1.5 font-display font-bold text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors self-start sm:self-auto"
                        >
                            {viewAllTransactions ? (
                                <><ChevronUp className="w-4 h-4" /> Show Less</>
                            ) : (
                                <><ChevronDown className="w-4 h-4" /> View All</>
                            )}
                        </button>
                    )}
                </div>

                {/* Transactions list */}
                <div className="bg-white rounded-2xl border border-[#f1f5f9] overflow-hidden">
                    {transactionsLoading ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-indigo-600" />
                            <p className="font-body text-gray-400 text-sm">Loading transactions...</p>
                        </div>
                    ) : displayTransactions.length > 0 ? (
                        <div className="divide-y divide-[#f8f9fc]">
                            {displayTransactions.map((transaction, i) => (
                                <div
                                    key={transaction.id}
                                    className="txn-row flex items-center justify-between px-5 py-4 bg-white hover:bg-[#fafbff] transition-all"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        {getTransactionIcon(transaction.transaction_type)}
                                        <div className="min-w-0">
                                            <p className="font-display font-bold text-gray-900 text-sm truncate">{transaction.description}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Calendar className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                                <p className="font-body text-xs text-gray-400">{formatDate(transaction.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 pl-4">
                                        <p className={`font-display font-bold text-lg ${transaction.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {transaction.transaction_type === 'CREDIT' ? '+' : '-'}₹{parseFloat(transaction.amount).toFixed(2)}
                                        </p>
                                        <span className={`inline-block text-xs font-body px-2 py-0.5 rounded-full mt-0.5 ${
                                            transaction.transaction_type === 'CREDIT'
                                                ? 'bg-emerald-50 text-emerald-600'
                                                : 'bg-rose-50 text-rose-500'
                                        }`}>
                                            {transaction.transaction_type === 'CREDIT' ? 'Credit' : 'Debit'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Empty state */
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                                <Clock className="w-7 h-7 text-indigo-400" />
                            </div>
                            <p className="font-display font-bold text-gray-900 text-lg mb-1">No transactions yet</p>
                            <p className="font-body text-gray-400 text-sm text-center max-w-xs mb-7">
                                Add money to your wallet to get started. Your full transaction history will appear here.
                            </p>
                            <button
                                onClick={() => setShowAddMoneyModal(true)}
                                className="font-display font-bold text-white text-sm px-7 py-3.5 rounded-2xl flex items-center gap-2 group"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 8px 24px rgba(99,102,241,0.3)' }}
                            >
                                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                                Add Money to Get Started
                            </button>
                        </div>
                    )}

                    {/* Load more */}
                    {viewAllTransactions && hasMore && (
                        <div className="px-5 py-4 border-t border-[#f1f5f9] text-center">
                            <button
                                onClick={() => dispatch(fetchWalletTransactions({ page: currentPage + 1, pageSize: 20 }))}
                                className="font-display font-bold text-sm text-indigo-600 bg-indigo-50 border border-indigo-100 px-6 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors"
                            >
                                Load More Transactions
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default UserWallet;