import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { CreditCard, ArrowUpRight, ArrowDownRight, Search, Receipt, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await axiosInstance.get('/payments/history/');
        setPayments(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch payment history');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'PENDING':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'FAILED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'REFUNDED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatPaymentType = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Receipt className="w-8 h-8 text-blue-600" />
          Payment History
        </h1>
        <p className="text-gray-500 mt-2">Comprehensive track of all your platform fees, service escrows, and subscriptions.</p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-200">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No payments yet</h3>
          <p className="text-gray-500">When you make transactions on MotoReach, they will appear here professionally tracked.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold text-sm">
                  <th className="p-4 whitespace-nowrap">Transaction ID</th>
                  <th className="p-4 whitespace-nowrap">Date</th>
                  <th className="p-4 whitespace-nowrap">Amount</th>
                  <th className="p-4 whitespace-nowrap">Type</th>
                  <th className="p-4 whitespace-nowrap">Status</th>
                  <th className="p-4 whitespace-nowrap">Service Request</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        #{payment.id.toString().padStart(6, '0')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600 text-sm whitespace-nowrap flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(payment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900 flex items-center gap-1">
                        ₹{parseFloat(payment.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm font-medium text-gray-800">
                        {formatPaymentType(payment.payment_type)}
                      </div>
                      {payment.is_refunded && (
                        <span className="text-xs text-red-500 font-semibold mt-0.5 block">Refunded</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {payment.service_request_details ? (
                        <Link 
                          to={`/user/service-flow/${payment.service_request_details.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 group"
                        >
                          Request #{payment.service_request_details.id}
                          <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Not applicable</span>
                      )}
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

export default UserPaymentHistory;
