import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
  CreditCard, Wallet, ArrowUpRight, ArrowDownLeft,
  ShieldCheck, Loader2, AlertCircle, Calendar, Mail,
  Lock, Unlock, Activity, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Pagination from '../../components/Pagination';

const WorkshopPayment = () => {
  const [activeTab, setActiveTab] = useState('escrow');
  const [escrows, setEscrows] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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

  const escrowStatusStyle = (status) => {
    if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'PENDING')   return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'REFUNDED')  return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc]">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center animate-pulse">
          <CreditCard className="w-6 h-6 text-indigo-600" />
        </div>
        <span className="ml-3 font-body text-gray-400 text-sm">Loading financial data…</span>
      </div>
    );
  }

  const tabs = [
    { id: 'escrow', label: 'Service Escrows', icon: ShieldCheck, count: escrows.length },
    { id: 'wallet', label: 'Wallet History',  icon: Wallet,     count: transactions.length },
  ];

  const currentEscrows = escrows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalEscrowPages = Math.ceil(escrows.length / itemsPerPage);

  const currentTransactions = transactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalTransactionPages = Math.ceil(transactions.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body   { font-family: 'Geist', 'Inter', sans-serif; }

        .pay-hero {
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
        .grid-lines {
          background-image: linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .tab-btn {
          position: relative;
          transition: color 0.2s ease;
        }
        .tab-indicator {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #6366f1, #818cf8);
          border-radius: 2px 2px 0 0;
        }
        .tbl-row {
          transition: background 0.15s ease;
        }
        .tbl-row:hover {
          background: #fafbff;
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
      `}</style>

      {/* ── HERO ── */}
      <section className="pay-hero hero-noise relative overflow-hidden">
        <div className="glow-dot w-96 h-96 bg-indigo-500 opacity-20 top-[-80px] left-[-60px]" />
        <div className="glow-dot w-72 h-72 bg-violet-400 opacity-15 top-10 right-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 md:pt-14 md:pb-32">
          <div className="inline-flex items-center gap-2 badge-pill px-4 py-1.5 rounded-full text-white/80 mb-6">
            <CreditCard className="w-3.5 h-3.5" />
            <span className="section-label text-white/70">Financial Dashboard</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight">
                Payments &{' '}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-200 to-indigo-200 bg-clip-text text-transparent">
                  Escrows
                </span>
              </h1>
              <p className="font-body text-white/40 text-sm mt-2">
                Manage service escrows and wallet payout history
              </p>
            </div>
            <div className="badge-pill px-4 py-2 rounded-xl flex items-center gap-2 self-start sm:self-auto">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="font-display font-semibold text-white/70 text-sm">{escrows.length} active escrows</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#f8f9fc]" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }} />
      </section>

      {/* ── STAT STRIP ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Escrows',    value: escrows.length,                                                                        color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: ShieldCheck },
            { label: 'Completed',        value: escrows.filter(e => e.status === 'COMPLETED').length,                                  color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: Unlock },
            { label: 'Held in Escrow',   value: escrows.filter(e => !e.escrow_released).length,                                       color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Lock },
            { label: 'Wallet Transfers', value: transactions.length,                                                                   color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100', icon: Wallet },
          ].map(({ label, value, color, bg, border, icon: Icon }) => (
            <div key={label} className="stat-card bg-white rounded-2xl p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-xl ${bg} border ${border} flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className={`font-display font-bold text-2xl ${color}`}>{value}</div>
              <div className="font-body text-gray-400 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TABS + CONTENT ── */}
      <section className="grid-lines max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-600 px-5 py-3.5 rounded-2xl mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-body text-sm">{error}</span>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex gap-1 border-b border-gray-100 mb-5">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`tab-btn font-display font-semibold text-sm px-5 py-3 flex items-center gap-2 ${
                activeTab === id ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-lg font-bold ${
                activeTab === id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
              }`}>{count}</span>
              {activeTab === id && <span className="tab-indicator" />}
            </button>
          ))}
        </div>

        {/* ── ESCROW TAB ── */}
        {activeTab === 'escrow' && (
          <div className="fade-in">
            {escrows.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No pending escrows" desc="When customers pay for estimates, secure escrow payments will appear here." />
            ) : (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <span className="section-label text-indigo-500 block mb-0.5">Escrow Records</span>
                    <h2 className="font-display font-bold text-gray-900 text-lg">Service Escrows</h2>
                  </div>
                  <span className="font-body text-gray-400 text-xs">{escrows.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {['ID', 'Date', 'Paid By', 'Amount', 'Service Request', 'Status', 'Funds'].map(h => (
                          <th key={h} className="px-5 py-3.5 section-label text-gray-400 whitespace-nowrap font-normal">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentEscrows.map((payment) => (
                        <tr key={payment.id} className="tbl-row border-b border-gray-50 last:border-0">
                          <td className="px-5 py-4">
                            <span className="font-body text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
                              #{payment.id.toString().padStart(6, '0')}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-300" />
                              <span className="font-body text-gray-500 text-sm">
                                {new Date(payment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {payment.payer_email ? (
                              <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                <span className="font-body text-gray-700 text-sm truncate max-w-[160px]">{payment.payer_email}</span>
                              </div>
                            ) : (
                              <span className="font-body text-gray-300 text-sm">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-display font-bold text-gray-900">₹{parseFloat(payment.amount).toFixed(2)}</span>
                          </td>
                          <td className="px-5 py-4">
                            {payment.service_request_details ? (
                              <Link
                                to={`/workshop/service-flow/${payment.service_request_details.id}`}
                                className="font-display font-semibold text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1 group"
                              >
                                {payment.service_request_details.vehicle}
                                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </Link>
                            ) : (
                              <span className="font-body text-gray-300 text-sm italic">Unknown</span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`font-display font-bold text-xs px-3 py-1 rounded-xl border ${escrowStatusStyle(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {payment.escrow_released ? (
                              <span className="inline-flex items-center gap-1.5 font-display font-bold text-xs px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <Unlock className="w-3 h-3" /> Released
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 font-display font-bold text-xs px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                                <Lock className="w-3 h-3" /> Held
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalEscrowPages}
                  onPageChange={setCurrentPage}
                  totalItems={escrows.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </div>
        )}

        {/* ── WALLET TAB ── */}
        {activeTab === 'wallet' && (
          <div className="fade-in">
            {transactions.length === 0 ? (
              <EmptyState icon={Wallet} title="No wallet transfers" desc="Completed escrows pushed to your wallet will appear here." />
            ) : (
              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <span className="section-label text-indigo-500 block mb-0.5">Transaction Log</span>
                    <h2 className="font-display font-bold text-gray-900 text-lg">Wallet History</h2>
                  </div>
                  <span className="font-body text-gray-400 text-xs">{transactions.length} records</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-50">
                        {['ID', 'Date', 'Type', 'Description', 'Amount'].map(h => (
                          <th key={h} className={`px-5 py-3.5 section-label text-gray-400 whitespace-nowrap font-normal ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {currentTransactions.map((txn) => (
                        <tr key={txn.id} className="tbl-row border-b border-gray-50 last:border-0">
                          <td className="px-5 py-4">
                            <span className="font-body text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">#{txn.id}</span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-body text-gray-500 text-sm">
                              {new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1.5 font-display font-bold text-xs px-3 py-1 rounded-xl border ${
                              txn.transaction_type === 'CREDIT'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : 'bg-rose-50 text-rose-600 border-rose-100'
                            }`}>
                              {txn.transaction_type === 'CREDIT'
                                ? <ArrowDownLeft className="w-3 h-3" />
                                : <ArrowUpRight className="w-3 h-3" />
                              }
                              {txn.transaction_type}
                            </span>
                          </td>
                          <td className="px-5 py-4 max-w-[240px]">
                            <span className="font-body text-gray-700 text-sm">{txn.description}</span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className={`font-display font-bold text-base ${txn.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                              {txn.transaction_type === 'CREDIT' ? '+' : '−'}₹{parseFloat(txn.amount).toFixed(2)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalTransactionPages}
                  onPageChange={setCurrentPage}
                  totalItems={transactions.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

/* ── Empty state helper ── */
const EmptyState = ({ icon: Icon, title, desc }) => (
  <div className="card p-14 text-center">
    <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
      <Icon className="w-7 h-7 text-indigo-400" />
    </div>
    <p className="font-display font-bold text-gray-900 text-lg mb-1">{title}</p>
    <p className="font-body text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">{desc}</p>
  </div>
);

export default WorkshopPayment;