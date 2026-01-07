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
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const UserWallet = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { balance, recentTransactions, allTransactions, totalTransactions, currentPage, hasMore, loading, transactionsLoading } = useSelector((state) => state.wallet);

    const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [viewAllTransactions, setViewAllTransactions] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const queryParams = new URLSearchParams(location.search);
    const addMoneySuccess = queryParams.get('add_money_success');
    const addMoneyCanceled = queryParams.get('add_money_canceled');

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
            toast.success('Money added successfully!');
            dispatch(fetchWallet());
            navigate('/user/wallet', { replace: true });
        }
        if (addMoneyCanceled) {
            toast.error('Payment was cancelled');
            navigate('/user/wallet', { replace: true });
        }
    }, [addMoneySuccess, addMoneyCanceled, dispatch, navigate]);

    const handleAddMoney = async () => {
        const numAmount = parseFloat(amount);

        if (!amount || isNaN(numAmount)) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (numAmount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }

        if (numAmount > 10000) {
            toast.error('Amount cannot exceed $10,000');
            return;
        }

        setIsProcessing(true);
        try {
            const resultAction = await dispatch(initiateAddMoney(numAmount));

            if (initiateAddMoney.fulfilled.match(resultAction)) {
                const data = resultAction.payload;
                if (data.url) {
                    window.location.href = data.url;
                }
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
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5 text-green-600" />
            </div>
        ) : (
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-600" />
            </div>
        );
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const displayTransactions = viewAllTransactions ? allTransactions : recentTransactions;

    if (loading && !balance) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
                    <p className="text-slate-500 font-medium">Loading wallet...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
            {/* Add Money Modal */}
            {showAddMoneyModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                                    <Plus className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Add Money</h3>
                            </div>
                            <button
                                onClick={() => setShowAddMoneyModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Enter Amount
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    step="0.01"
                                    min="0"
                                    max="10000"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Maximum: $10,000</p>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Quick Select</p>
                            <div className="grid grid-cols-3 gap-2">
                                {quickAmounts.map((quickAmount) => (
                                    <button
                                        key={quickAmount}
                                        onClick={() => setAmount(quickAmount.toString())}
                                        className="px-4 py-3 bg-gray-100 hover:bg-blue-100 hover:text-blue-700 text-gray-700 font-semibold rounded-lg transition-all border-2 border-transparent hover:border-blue-300"
                                    >
                                        ${quickAmount}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-start gap-3">
                                <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-800">
                                    <p className="font-semibold mb-1">Secure Payment</p>
                                    <p>Your payment is processed securely through Stripe. Funds will be added instantly.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleAddMoney}
                            disabled={isProcessing || !amount}
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5" />
                                    Add Money
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">My Wallet</h1>
                    <p className="text-gray-600">Manage your balance and view transaction history</p>
                </div>

                {/* Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                    <WalletIcon className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Available Balance</p>
                                    <h2 className="text-5xl font-bold text-white">${parseFloat(balance || 0).toFixed(2)}</h2>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowAddMoneyModal(true)}
                                className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Money
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-300" />
                                    <p className="text-blue-100 text-sm">Total Credits</p>
                                </div>
                                <p className="text-2xl font-bold text-white">
                                    ${recentTransactions
                                        .filter(t => t.transaction_type === 'CREDIT')
                                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                        .toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-5 h-5 text-red-300" />
                                    <p className="text-blue-100 text-sm">Total Debits</p>
                                </div>
                                <p className="text-2xl font-bold text-white">
                                    ${recentTransactions
                                        .filter(t => t.transaction_type === 'DEBIT')
                                        .reduce((sum, t) => sum + parseFloat(t.amount), 0)
                                        .toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transactions Section */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">
                            {viewAllTransactions ? 'All Transactions' : 'Recent Transactions'}
                        </h3>
                        {!viewAllTransactions && recentTransactions.length > 0 && (
                            <button
                                onClick={() => setViewAllTransactions(true)}
                                className="text-blue-600 hover:text-blue-700 font-semibold text-sm flex items-center gap-1"
                            >
                                View All
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                        )}
                        {viewAllTransactions && (
                            <button
                                onClick={() => setViewAllTransactions(false)}
                                className="text-gray-600 hover:text-gray-700 font-semibold text-sm"
                            >
                                Show Less
                            </button>
                        )}
                    </div>

                    {transactionsLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
                        </div>
                    ) : displayTransactions.length > 0 ? (
                        <div className="space-y-3">
                            {displayTransactions.map((transaction) => (
                                <div
                                    key={transaction.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
                                >
                                    <div className="flex items-center gap-4">
                                        {getTransactionIcon(transaction.transaction_type)}
                                        <div>
                                            <p className="font-semibold text-gray-800">{transaction.description}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Calendar className="w-3 h-3 text-gray-400" />
                                                <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${transaction.transaction_type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {transaction.transaction_type === 'CREDIT' ? '+' : '-'}${parseFloat(transaction.amount).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-10 h-10 text-gray-400" />
                            </div>
                            <p className="text-gray-500 text-lg font-semibold mb-2">No transactions yet</p>
                            <p className="text-gray-400 mb-6">Your transaction history will appear here</p>
                            <button
                                onClick={() => setShowAddMoneyModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all inline-flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Add Money to Get Started
                            </button>
                        </div>
                    )}

                    {viewAllTransactions && hasMore && (
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => dispatch(fetchWalletTransactions({ page: currentPage + 1, pageSize: 20 }))}
                                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserWallet;
