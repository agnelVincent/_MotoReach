import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMechanicWallet } from '../../redux/slices/mechanicWalletSlice';

import {
  Wallet,
  TrendingUp,
  Gift,
  Wrench,
  ArrowDownLeft,
  Calendar,
  Filter,
  ChevronDown,
  BadgeCheck,
  Star,
  IndianRupee,
  Clock,
  Search,
  Users,
} from 'lucide-react';


// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount);

const formatDate = (iso) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTime = (iso) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const FILTER_OPTIONS = [
  { label: 'All Transactions', value: 'ALL' },
  { label: 'Service Share', value: 'SERVICE_SHARE' },
  { label: 'Bonus', value: 'BONUS' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const MechanicWallet = () => {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const dispatch = useDispatch()
  const { balance, totalEarned, thisMonth, totalBonuses, totalServices, earnings, loading, error } = useSelector((state) => state.mechanicWallet);

  const filtered = earnings.filter((e) => {
    const matchFilter = activeFilter === 'ALL' || e.earning_type === activeFilter;
    const matchSearch =
      search === '' ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      (e.service_execution?.service_request?.issue_category?.toLowerCase().includes(search.toLowerCase())) ||
      (e.service_execution?.service_request?.vehicle_model?.toLowerCase().includes(search.toLowerCase())) ||
      String(e.service_execution?.service_request?.id).includes(search);
    return matchFilter && matchSearch;
  });

  const stats = [
    {
      label: 'Total Earned',
      value: formatCurrency(MOCK_WALLET.total_earned),
      icon: TrendingUp,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'This Month',
      value: formatCurrency(MOCK_WALLET.this_month),
      icon: Calendar,
      gradient: 'from-green-500 to-emerald-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Bonuses Received',
      value: formatCurrency(MOCK_WALLET.total_bonuses),
      icon: Gift,
      gradient: 'from-purple-500 to-pink-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Services Done',
      value: MOCK_WALLET.total_services,
      icon: Wrench,
      gradient: 'from-orange-500 to-red-600',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 pb-16">
      <div className="pt-6 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* ── Page Header ── */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-1 flex items-center gap-3">
              <Wallet className="w-8 h-8 text-orange-500" />
              My Wallet
            </h1>
            <p className="text-gray-500 text-sm">Your earnings, service shares, and bonus history at a glance</p>
          </div>

          {/* ── Balance Hero Card ── */}
          <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-3xl p-8 shadow-2xl mb-8 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
              <div>
                <p className="text-orange-100 text-sm font-medium mb-2 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" />
                  Available Balance
                </p>
                <div className="flex items-center gap-3">
                  <h2 className="text-5xl font-extrabold text-white tracking-tight">
                    {showBalance ? formatCurrency(MOCK_WALLET.balance) : '₹ ••••••'}
                  </h2>
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    title={showBalance ? 'Hide balance' : 'Show balance'}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showBalance ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>
                <p className="text-orange-200 text-xs mt-2">Withdrawals will be available in a future update</p>
              </div>

              <div className="flex gap-3">
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 text-center border border-white/20">
                  <p className="text-orange-100 text-xs mb-1">This Month</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(MOCK_WALLET.this_month)}</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-4 text-center border border-white/20">
                  <p className="text-orange-100 text-xs mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Bonuses</p>
                  <p className="text-white font-bold text-lg">{formatCurrency(MOCK_WALLET.total_bonuses)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`group relative bg-white rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden`}>
                  <div className={`absolute inset-0 ${s.bg} opacity-40`} />
                  <div className="relative z-10">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xl font-extrabold text-gray-800">{s.value}</p>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Earning Breakdown Bar ── */}
          <div className="bg-white rounded-2xl p-5 shadow-md mb-6">
            <p className="text-sm font-semibold text-gray-600 mb-3">Earnings Breakdown</p>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                  style={{ width: `${((MOCK_WALLET.total_earned - MOCK_WALLET.total_bonuses) / MOCK_WALLET.total_earned * 100).toFixed(1)}%` }}
                />
              </div>
              <div
                className="h-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all"
                style={{ width: `${(MOCK_WALLET.total_bonuses / MOCK_WALLET.total_earned * 100).toFixed(1)}%` }}
              />
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                Service Share — {formatCurrency(MOCK_WALLET.total_earned - MOCK_WALLET.total_bonuses)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                Bonuses — {formatCurrency(MOCK_WALLET.total_bonuses)}
              </span>
            </div>
          </div>

          {/* ── Transaction History ── */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
                  <p className="text-sm text-gray-500 mt-0.5">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search service, vehicle..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 w-full sm:w-56 transition"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mt-4">
                {FILTER_OPTIONS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setActiveFilter(f.value)}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      activeFilter === f.value
                        ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction List */}
            <div className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <IndianRupee className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No transactions found</p>
                  <p className="text-sm mt-1">Try adjusting your filter or search</p>
                </div>
              ) : (
                filtered.map((earning) => {
                  const isBonus = earning.earning_type === 'BONUS';
                  const sr = earning.service_execution?.service_request;

                  return (
                    <div
                      key={earning.id}
                      className="group flex items-start gap-4 px-6 py-5 hover:bg-orange-50/40 transition-colors duration-150"
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${
                        isBonus
                          ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
                      }`}>
                        {isBonus
                          ? <Gift className="w-5 h-5 text-white" />
                          : <Wrench className="w-5 h-5 text-white" />
                        }
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {/* Type badge */}
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                            isBonus
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isBonus ? <Gift className="w-3 h-3" /> : <BadgeCheck className="w-3 h-3" />}
                            {isBonus ? 'Bonus' : 'Service Share'}
                          </span>

                          {/* Service ref */}
                          {sr && (
                            <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                              REQ #{sr.id}
                            </span>
                          )}
                        </div>

                        {/* Primary info */}
                        <p className="text-sm font-semibold text-gray-800 truncate">
                          {sr ? `${sr.issue_category} — ${sr.vehicle_model}` : 'Bonus Payment'}
                        </p>

                        {/* Secondary info */}
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(earning.created_at)} · {formatTime(earning.created_at)}
                          </span>
                          {!isBonus && earning.service_execution?.mechanic_count && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {earning.service_execution.mechanic_count} mechanic{earning.service_execution.mechanic_count > 1 ? 's' : ''} — 20% pool split equally
                            </span>
                          )}
                          {isBonus && (
                            <span className="text-purple-500 italic truncate max-w-xs">
                              {earning.description.replace('Bonus from workshop admin: ', '')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-1 text-lg font-extrabold text-green-600">
                          <ArrowDownLeft className="w-4 h-4" />
                          ₹{parseFloat(earning.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">Credited</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer note */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                All amounts are credited automatically after service OTP verification or when a bonus is sent by your workshop admin.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MechanicWallet;
