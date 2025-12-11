import React, { useState, useRef, useEffect } from 'react';
import { 
  Car, Bell, User, Menu, X, LayoutDashboard, AlertCircle, Building2, Users, CreditCard, Wallet, LogOut, ChevronDown,
  UserPlus,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  Calendar,
  Activity,
  Shield,
  Award,
  Zap
} from 'lucide-react';

// AdminNavbar Component (embedded for demo)
const AdminNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/dashboard');

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reports / Complaints', path: '/reports', icon: AlertCircle },
    { name: 'Workshops', path: '/workshops', icon: Building2 },
    { name: 'Mechanics', path: '/mechanics', icon: Users },
    { name: 'Subscription', path: '/subscription', icon: CreditCard },
    { name: 'Wallet', path: '/wallet', icon: Wallet },
  ];

  const profileMenuItems = [
    { name: 'Profile', icon: User, action: 'profile' },
    { name: 'Logout', icon: LogOut, action: 'logout' },
  ];

  const handleNavClick = (path) => {
    setActiveLink(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => activeLink === path;

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button onClick={() => handleNavClick('/dashboard')} className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-2 rounded-lg group-hover:from-slate-800 group-hover:to-black transition-all duration-300">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-800 group-hover:text-slate-700 transition-colors duration-300">MotoReach</span>
              <span className="text-xs text-gray-500 -mt-1">Admin</span>
            </div>
          </button>

          <div className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.path} onClick={() => handleNavClick(link.path)} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${isActive(link.path) ? 'text-slate-700 bg-slate-100' : 'text-gray-700 hover:text-slate-700 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{link.name}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <button className="relative p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="relative">
              <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-2 p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">Admin User</p>
                    <p className="text-xs text-gray-500">admin@motorreach.com</p>
                  </div>
                  {profileMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button key={item.action} className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-200 ${item.action === 'logout' ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'}`}>
                        <Icon className="w-4 h-4" />
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-3">
            <button className="relative p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all duration-300">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-700 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all duration-300">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button key={link.path} onClick={() => handleNavClick(link.path)} className={`w-full flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-all duration-300 ${isActive(link.path) ? 'bg-slate-100 text-slate-700' : 'text-gray-700 hover:bg-gray-50 hover:text-slate-700'}`}>
                  <Icon className="w-5 h-5" />
                  {link.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

// AdminDashboard Component
const AdminDashboard = () => {
  const metrics = [
    {
      title: 'Total Users',
      value: '12,458',
      change: '+15.3%',
      isPositive: true,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    {
      title: 'Total Workshops',
      value: '847',
      change: '+8.2%',
      isPositive: true,
      icon: Building2,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      title: 'Total Mechanics',
      value: '3,245',
      change: '+12.1%',
      isPositive: true,
      icon: User,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50'
    },
    {
      title: 'Total Requests',
      value: '28,672',
      change: '+22.5%',
      isPositive: true,
      icon: FileText,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      title: 'Total Subscriptions',
      value: '4,892',
      change: '+18.7%',
      isPositive: true,
      icon: CreditCard,
      gradient: 'from-cyan-500 to-blue-600',
      bgGradient: 'from-cyan-50 to-blue-50'
    },
    {
      title: 'Total Revenue',
      value: '₹45,67,890',
      change: '+25.4%',
      isPositive: true,
      icon: DollarSign,
      gradient: 'from-yellow-500 to-orange-600',
      bgGradient: 'from-yellow-50 to-orange-50'
    }
  ];

  const monthlyData = [
    { month: 'Jan', revenue: 280000 },
    { month: 'Feb', revenue: 320000 },
    { month: 'Mar', revenue: 295000 },
    { month: 'Apr', revenue: 385000 },
    { month: 'May', revenue: 410000 },
    { month: 'Jun', revenue: 456789 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  const recentSignups = [
    { name: 'Rajesh Kumar', email: 'rajesh@example.com', type: 'User', time: '5 mins ago' },
    { name: 'AutoFix Workshop', email: 'autofix@example.com', type: 'Workshop', time: '12 mins ago' },
    { name: 'Amit Sharma', email: 'amit@example.com', type: 'Mechanic', time: '25 mins ago' },
    { name: 'Sarah Williams', email: 'sarah@example.com', type: 'User', time: '1 hour ago' },
  ];

  const pendingApprovals = [
    { name: 'SpeedCare Workshop', location: 'Bangalore', requestedOn: '2 days ago', status: 'Pending' },
    { name: 'ProMech Services', location: 'Mumbai', requestedOn: '3 days ago', status: 'Pending' },
    { name: 'QuickFix Auto', location: 'Delhi', requestedOn: '5 days ago', status: 'Pending' },
  ];

  const recentComplaints = [
    { id: 'COMP-1234', user: 'John Doe', workshop: 'AutoFix Workshop', issue: 'Poor service quality', priority: 'high', status: 'Open' },
    { id: 'COMP-1235', user: 'Jane Smith', workshop: 'SpeedCare', issue: 'Delayed service', priority: 'medium', status: 'In Review' },
    { id: 'COMP-1236', user: 'Mike Johnson', workshop: 'ProMech', issue: 'Billing issue', priority: 'low', status: 'Resolved' },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case 'User':
        return 'bg-blue-100 text-blue-700';
      case 'Workshop':
        return 'bg-purple-100 text-purple-700';
      case 'Mechanic':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-red-100 text-red-700';
      case 'In Review':
        return 'bg-yellow-100 text-yellow-700';
      case 'Resolved':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      <AdminNavbar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGradient} opacity-50`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className={`flex items-center gap-1 text-sm font-semibold ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {metric.change}
                      </div>
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-800 mb-1">
                      {metric.value}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      {metric.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Revenue Overview</h2>
                  <p className="text-sm text-gray-600">Monthly revenue trends (Last 6 months)</p>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">+25.4%</span>
                </div>
              </div>

              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-12">{data.month}</span>
                    <div className="flex-1">
                      <div className="h-10 bg-gradient-to-r from-slate-100 to-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-slate-600 to-slate-800 rounded-lg transition-all duration-1000 flex items-center justify-end pr-3"
                          style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                        >
                          <span className="text-xs font-semibold text-white">₹{(data.revenue / 1000).toFixed(0)}K</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl p-6 shadow-lg text-white">
                <Activity className="w-12 h-12 mb-4 opacity-80" />
                <h3 className="text-3xl font-bold mb-2">99.2%</h3>
                <p className="text-slate-200">Platform Uptime</p>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white">
                <Zap className="w-12 h-12 mb-4 opacity-80" />
                <h3 className="text-3xl font-bold mb-2">1.2M</h3>
                <p className="text-blue-100">Total Transactions</p>
              </div>
            </div>
          </div>

          {/* Recent Signups & Pending Approvals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Signups */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Recent Signups</h2>
                </div>
                <button className="text-sm text-slate-700 hover:text-slate-900 font-medium">View All</button>
              </div>

              <div className="space-y-3">
                {recentSignups.map((signup, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{signup.name}</p>
                        <p className="text-xs text-gray-500">{signup.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getTypeColor(signup.type)}`}>
                        {signup.type}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{signup.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Workshop Approvals */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
                </div>
                <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">{pendingApprovals.length} Pending</span>
              </div>

              <div className="space-y-3">
                {pendingApprovals.map((approval, index) => (
                  <div key={index} className="p-4 bg-orange-50 rounded-lg border border-orange-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800">{approval.name}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {approval.location}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(approval.status)}`}>
                        {approval.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Requested {approval.requestedOn}</p>
                      <div className="flex gap-2">
                        <button className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Complaints */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Recent Reports / Complaints</h2>
              </div>
              <button className="text-sm text-slate-700 hover:text-slate-900 font-medium">View All</button>
            </div>

            <div className="space-y-3">
              {recentComplaints.map((complaint, index) => (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono font-semibold text-gray-600">{complaint.id}</span>
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 mb-1">{complaint.issue}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                      <span>User: {complaint.user}</span>
                      <span>•</span>
                      <span>Workshop: {complaint.workshop}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-4 py-2 rounded-full ${getStatusColor(complaint.status)} whitespace-nowrap`}>
                    {complaint.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;