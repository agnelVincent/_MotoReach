import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { CreditCard, Wallet, ArrowUpRight, ArrowDownRight, ArrowDownLeft, ShieldCheck, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

const WorkshopPayment = () => {
  const [activeTab, setActiveTab] = useState('escrow'); // 'escrow' or 'wallet'
  
  const [escrows, setEscrows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [escrowRes, walletRes] = await Promise.all([
          axiosInstance.get('/payments/workshop/escrows/'),
          axiosInstance.get('/payments/wallet/transactions/')
        ]);
        
        setEscrows(escrowRes.data);
        setTransactions(walletRes.data.transactions || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch financial records');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getEscrowColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'REFUNDED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-8 h-8 text-indigo-600" />
          Financial Dashboard
        </h1>
        <p className="text-gray-500 mt-2">Manage your active service escrows and wallet payout history comprehensively.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 mb-6 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('escrow')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'escrow' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Service Escrows
          {activeTab === 'escrow' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-md animate-fade-in-up"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all relative ${
            activeTab === 'wallet' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Wallet History
          {activeTab === 'wallet' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-md animate-fade-in-up"></span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        
        {/* ESCROW TAB */}
        {activeTab === 'escrow' && (
          <div className="animate-fade-in">
            {escrows.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No pending escrows</h3>
                <p className="text-gray-500">When customers pay for estimates, the secure escrow payments will appear here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-sm">
                        <th className="p-4 whitespace-nowrap">ID</th>
                        <th className="p-4 whitespace-nowrap">Date</th>
                        <th className="p-4 whitespace-nowrap">Amount</th>
                        <th className="p-4 whitespace-nowrap">Service Request</th>
                        <th className="p-4 whitespace-nowrap">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {escrows.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              #{payment.id.toString().padStart(6, '0')}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 text-sm whitespace-nowrap flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(payment.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-gray-900">${parseFloat(payment.amount).toFixed(2)}</div>
                          </td>
                          <td className="p-4">
                            {payment.service_request_details ? (
                              <Link 
                                to={`/workshop/service-flow/${payment.service_request_details.id}`}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 group"
                              >
                                {payment.service_request_details.vehicle}
                                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Unknown</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getEscrowColor(payment.status)}`}>
                              {payment.status}
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
        )}

        {/* WALLET TAB */}
        {activeTab === 'wallet' && (
          <div className="animate-fade-in">
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">No wallet transfers</h3>
                <p className="text-gray-500">Completed escrows pushed to your wallet will appear down here.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-sm">
                        <th className="p-4 whitespace-nowrap">ID</th>
                        <th className="p-4 whitespace-nowrap">Date</th>
                        <th className="p-4 whitespace-nowrap">Type</th>
                        <th className="p-4 whitespace-nowrap">Description</th>
                        <th className="p-4 whitespace-nowrap text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <span className="font-mono text-xs text-gray-500">#{txn.id}</span>
                          </td>
                          <td className="p-4 text-gray-600 text-sm whitespace-nowrap">
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
        )}

      </div>
    </div>
  );
};

export default WorkshopPayment;
