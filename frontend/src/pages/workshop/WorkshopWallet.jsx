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
    ArrowUpRight as ArrowUpRightIcon
} from 'lucide-react';

const WorkshopWallet = () => {
    const dispatch = useDispatch();

    const { balance, recentTransactions, allTransactions, totalTransactions, currentPage, hasMore, loading, transactionsLoading } = useSelector((state) => state.wallet);

    const [viewAllTransactions, setViewAllTransactions] = useState(false);

    useEffect(() => {
        dispatch(fetchWallet());
    }, [dispatch]);

    useEffect(() => {
        if (viewAllTransactions) {
            dispatch(fetchWalletTransactions({ page: currentPage, pageSize: 20 }));
        }
    }, [dispatch, viewAllTransactions, currentPage]);

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

    // Calculate totals from all transactions (not just recent)
    const totalCredits = allTransactions.length > 0 
        ? allTransactions.filter(t => t.transaction_type === 'CREDIT').reduce((sum, t) => sum + parseFloat(t.amount), 0)
        : recentTransactions.filter(t => t.transaction_type === 'CREDIT').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalDebits = allTransactions.length > 0
        ? allTransactions.filter(t => t.transaction_type === 'DEBIT').reduce((sum, t) => sum + parseFloat(t.amount), 0)
        : recentTransactions.filter(t => t.transaction_type === 'DEBIT').reduce((sum, t) => sum + parseFloat(t.amount), 0);

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
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Workshop Wallet</h1>
                    <p className="text-gray-600">View your earnings and transaction history</p>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-300" />
                                    <p className="text-blue-100 text-sm">Total Credits</p>
                                </div>
                                <p className="text-2xl font-bold text-white">
                                    ${totalCredits.toFixed(2)}
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingDown className="w-5 h-5 text-red-300" />
                                    <p className="text-blue-100 text-sm">Total Debits</p>
                                </div>
                                <p className="text-2xl font-bold text-white">
                                    ${totalDebits.toFixed(2)}
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
                                <ArrowUpRightIcon className="w-4 h-4" />
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
                            <p className="text-gray-400">Your earnings from completed services will appear here</p>
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

export default WorkshopWallet;
