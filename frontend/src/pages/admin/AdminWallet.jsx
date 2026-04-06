import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Wallet, ArrowDownLeft, ArrowUpRight, Loader2, AlertCircle, Calendar, LineChart } from 'lucide-react';

const AdminWallet = () => {
  const [data, setData] = useState({ transactions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await axiosInstance.get('/payments/wallet/transactions/');
        setData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch platform revenue');
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
      </div>
    );
  }

  // Calculate Net Revenue
  const calculateNetRevenue = () => {
    if (!data.transactions || data.transactions.length === 0) return 0;
    return data.transactions.reduce((acc, curr) => {
      if (curr.transaction_type === 'CREDIT') return acc + parseFloat(curr.amount);
      if (curr.transaction_type === 'DEBIT') return acc - parseFloat(curr.amount);
      return acc;
    }, 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LineChart className="w-8 h-8 text-slate-800" />
            Platform Revenue
          </h1>
          <p className="text-gray-500 mt-2">Comprehensive tracking of all platform fee credits and automated refunds.</p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-700 min-w-[240px]">
          <p className="text-slate-400 text-sm font-medium mb-1 flex items-center gap-2">
             <Wallet className="w-4 h-4" />
             Net Ecosystem Revenue
          </p>
          <div className="text-3xl font-bold text-white">
            ${calculateNetRevenue().toFixed(2)}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {data.transactions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No transaction block</h3>
          <p className="text-gray-500">When platform fees are collected or refunded, they will appear securely logged here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-slate-600 font-semibold text-sm">
                  <th className="p-4 whitespace-nowrap">ID</th>
                  <th className="p-4 whitespace-nowrap">Date</th>
                  <th className="p-4 whitespace-nowrap">Transaction Type</th>
                  <th className="p-4 whitespace-nowrap">Description</th>
                  <th className="p-4 whitespace-nowrap text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs text-gray-500">#{txn.id}</span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm whitespace-nowrap flex items-center gap-2">
                       <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(txn.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                        txn.transaction_type === 'CREDIT' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-red-50 text-red-700'
                      }`}>
                        {txn.transaction_type === 'CREDIT' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {txn.transaction_type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-800 text-sm font-medium">
                      {txn.description}
                    </td>
                    <td className="p-4 text-right">
                      <span className={`font-bold ${txn.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {txn.transaction_type === 'CREDIT' ? '+' : '-'}${parseFloat(txn.amount).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWallet;
