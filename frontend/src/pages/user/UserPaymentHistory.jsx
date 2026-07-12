import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { CreditCard, ArrowUpRight, ArrowDownRight, Search, Receipt, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination from '../../components/Pagination';

const UserPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setMounted(true);
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

  const getStatusConfig = (status) => {
    switch (status) {
      case 'COMPLETED': return { cls: 'bg-emerald-50 text-emerald-600 border-emerald-100', dot: 'bg-emerald-400' };
      case 'PENDING':   return { cls: 'bg-amber-50 text-amber-600 border-amber-100',     dot: 'bg-amber-400' };
      case 'FAILED':    return { cls: 'bg-red-50 text-red-600 border-red-100',           dot: 'bg-red-400' };
      case 'REFUNDED':  return { cls: 'bg-slate-50 text-slate-600 border-slate-100',     dot: 'bg-slate-400' };
      default:          return { cls: 'bg-gray-50 text-gray-600 border-gray-100',        dot: 'bg-gray-400' };
    }
  };

  const formatPaymentType = (type) =>
    type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const totalSpend = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const currentPayments = payments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p style={{ fontFamily: "'Geist','Inter',sans-serif" }} className="text-gray-400 text-sm">
            Loading payment history…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body    { font-family: 'Geist', 'Inter', sans-serif; }

        .ph-hero {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%);
        }
        .ph-hero-noise::before {
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
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }

        .ph-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
        }

        .grid-lines {
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        /* Stat cards */
        .stat-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #f1f5f9;
          padding: 1.25rem 1.5rem;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .stat-card:hover {
          box-shadow: 0 8px 30px rgba(99,102,241,0.08);
          transform: translateY(-2px);
        }

        /* Table */
        .ph-table { width: 100%; border-collapse: collapse; }
        .ph-table thead th {
          padding: 0.875rem 1.25rem;
          font-family: 'Syne', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #94a3b8;
          background: #f8f9fc;
          border-bottom: 1px solid #f1f5f9;
          white-space: nowrap;
          text-align: left;
        }
        .ph-table tbody tr {
          border-bottom: 1px solid #f8f9fc;
          transition: background 0.15s;
        }
        .ph-table tbody tr:last-child { border-bottom: none; }
        .ph-table tbody tr:hover { background: #fafaff; }
        .ph-table tbody td {
          padding: 1rem 1.25rem;
          font-family: 'Geist','Inter',sans-serif;
          font-size: 0.875rem;
          color: #475569;
          white-space: nowrap;
          vertical-align: middle;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.2rem 0.75rem;
          border-radius: 99px;
          border: 1px solid;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.65rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .txn-id {
          font-family: 'Geist Mono', 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          background: #f1f5f9;
          color: #64748b;
          padding: 0.2rem 0.6rem;
          border-radius: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .link-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          color: #6366f1;
          transition: color 0.15s, gap 0.15s;
        }
        .link-btn:hover { color: #4f46e5; gap: 0.4rem; }
      `}</style>

      {/* ── HERO ── */}
      <div className="ph-hero ph-hero-noise relative overflow-hidden">
        <div className="glow-dot w-80 h-80 bg-indigo-500 opacity-20 -top-20 -left-10" />
        <div className="glow-dot w-56 h-56 bg-violet-400 opacity-15 top-10 right-16" />
        <div className="glow-dot w-64 h-64 bg-blue-400 opacity-10 bottom-0 left-1/3" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className={`inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/90 mb-5 opacity-0 ${mounted ? 'animate-fade-up' : ''}`}>
            <Receipt className="w-3.5 h-3.5 text-indigo-300" />
            <span className="section-label text-white/80">Financials</span>
          </div>

          <h1 className={`font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight mb-2 opacity-0 ${mounted ? 'animate-fade-up delay-100' : ''}`}>
            Payment History
          </h1>
          <p className={`font-body text-white/50 text-sm md:text-base max-w-lg opacity-0 ${mounted ? 'animate-fade-up delay-200' : ''}`}>
            A full record of your platform fees, service escrows, and subscriptions.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </div>

      {/* ── CONTENT ── */}
      <div className="grid-lines max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {error ? (
          <div className="ph-card p-5 flex items-start gap-3 border-red-100 bg-red-50">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-red-700 text-sm">Failed to load payments</p>
              <p className="font-body text-red-500 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        ) : payments.length === 0 ? (
          /* ── EMPTY STATE ── */
          <div className="ph-card p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
              <CreditCard className="w-7 h-7 text-indigo-300" />
            </div>
            <h3 className="font-display font-bold text-gray-900 text-lg mb-1">No payments yet</h3>
            <p className="font-body text-gray-400 text-sm max-w-xs">
              When you make transactions on MotoReach, they will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* ── STAT CARDS ── */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 opacity-0 ${mounted ? 'animate-fade-up delay-300' : ''}`}>
              {[
                {
                  label: 'Total Transactions',
                  value: payments.length,
                  icon: Receipt,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-50',
                  border: 'border-indigo-100',
                },
                {
                  label: 'Completed',
                  value: payments.filter(p => p.status === 'COMPLETED').length,
                  icon: ArrowUpRight,
                  color: 'text-emerald-600',
                  bg: 'bg-emerald-50',
                  border: 'border-emerald-100',
                },
                {
                  label: 'Pending',
                  value: payments.filter(p => p.status === 'PENDING').length,
                  icon: Calendar,
                  color: 'text-amber-600',
                  bg: 'bg-amber-50',
                  border: 'border-amber-100',
                },
                {
                  label: 'Total Spent',
                  value: `₹${totalSpend.toFixed(2)}`,
                  icon: CreditCard,
                  color: 'text-violet-600',
                  bg: 'bg-violet-50',
                  border: 'border-violet-100',
                },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="stat-card">
                    <div className={`w-9 h-9 rounded-xl ${s.bg} border ${s.border} flex items-center justify-center mb-3`}>
                      <Icon className={`w-4 h-4 ${s.color}`} />
                    </div>
                    <p className="section-label text-gray-400 mb-1">{s.label}</p>
                    <p className="font-display font-bold text-gray-900 text-xl">{s.value}</p>
                  </div>
                );
              })}
            </div>

            {/* ── TABLE ── */}
            <div className="ph-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                <span className="section-label text-indigo-500">Transactions</span>
              </div>
              <div className="overflow-x-auto">
                <table className="ph-table">
                  <thead>
                    <tr>
                      <th>Transaction ID</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Service Request</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentPayments.map((payment) => {
                      const sc = getStatusConfig(payment.status);
                      return (
                        <tr key={payment.id}>
                          {/* ID */}
                          <td>
                            <span className="txn-id">#{payment.id.toString().padStart(6, '0')}</span>
                          </td>

                          {/* Date */}
                          <td>
                            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              {new Date(payment.created_at).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </div>
                          </td>

                          {/* Amount */}
                          <td>
                            <span className="font-display font-bold text-gray-900 text-base">
                              ₹{parseFloat(payment.amount).toFixed(2)}
                            </span>
                          </td>

                          {/* Type */}
                          <td>
                            <span className="font-body font-medium text-gray-700 text-sm">
                              {formatPaymentType(payment.payment_type)}
                            </span>
                            {payment.is_refunded && (
                              <span className="block text-[10px] font-display font-bold text-red-500 mt-0.5 uppercase tracking-wide">
                                Refunded
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`status-badge ${sc.cls}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                              {payment.status}
                            </span>
                          </td>

                          {/* Service Request */}
                          <td>
                            {payment.service_request_details ? (
                              <Link
                                to={`/user/service-flow/${payment.service_request_details.id}`}
                                className="link-btn"
                              >
                                Request #{payment.service_request_details.id}
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            ) : (
                              <span className="font-body text-gray-300 text-xs italic">Not applicable</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between">
                <p className="font-body text-gray-400 text-xs">{payments.length} transaction{payments.length !== 1 ? 's' : ''}</p>
                <p className="font-display font-bold text-gray-500 text-xs">
                  Total spent: <span className="text-indigo-600">₹{totalSpend.toFixed(2)}</span>
                </p>
              </div>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={payments.length}
              itemsPerPage={itemsPerPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserPaymentHistory;