
import { 
   User, AlertCircle, Building2, Users, CreditCard,
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
  Zap
} from 'lucide-react';
import { useEffect} from 'react';
import {useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux';
import { fetchAdminStats } from '../../redux/slices/adminSlice';
import { useWorkshopVerification } from '../../hooks/useWorkshopVerification';



const AdminDashboard = () => {

  const navigate = useNavigate();
  const dispatch = useDispatch()
  const {stats} = useSelector(state => state.admin)

  useEffect(() => {
    dispatch(fetchAdminStats())
  },[])


  const metrics = [
    {
      title: 'Total Users',
      value: stats.metrics.total_users,
      isPositive: true,
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    {
      title: 'Total Workshops',
      value: stats.metrics.total_workshops,
      isPositive: true,
      icon: Building2,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      title: 'Total Mechanics',
      value: stats.metrics.total_mechanics,
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

const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(); 
  };


  const recentComplaints = [
    { id: 'COMP-1234', user: 'John Doe', workshop: 'AutoFix Workshop', issue: 'Poor service quality', priority: 'high', status: 'Open' },
    { id: 'COMP-1235', user: 'Jane Smith', workshop: 'SpeedCare', issue: 'Delayed service', priority: 'medium', status: 'In Review' },
    { id: 'COMP-1236', user: 'Mike Johnson', workshop: 'ProMech', issue: 'Billing issue', priority: 'low', status: 'Resolved' },
  ];

const getTypeColor = (type) => {
    const t = type.toLowerCase();
    if (t === 'user') return 'bg-blue-100 text-blue-700';
    if (t === 'workshop_admin' || t === 'workshop') return 'bg-purple-100 text-purple-700';
    if (t === 'mechanic') return 'bg-orange-100 text-orange-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (role) => {
  const r = role.toLowerCase();

  if (r === 'user') return 'User';
  if (r === 'workshop_admin' || r === 'workshop') return 'Workshop';
  if (r === 'mechanic') return 'Mechanic';

  return role; 
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

  const { handleStatusUpdate } = useWorkshopVerification();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
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
            {/* Recent Signups - DYNAMIC */}
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
                {stats.recent_signups.map((signup, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{signup.full_name}</p>
                        <p className="text-xs text-gray-500">{signup.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getTypeColor(signup.role)}`}>
                        {getRoleLabel(signup.role)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{formatTime(signup.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-800">Pending Approvals</h2>
                </div>
                <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    {stats.pending_approvals.length} Pending
                </span>
              </div>

              <div className="space-y-3">
                {stats.pending_approvals.map((approval, index) => (
                  <div 
                    key={approval.id || index} 
                    onClick={() => navigate(`/admin/workshop-details/${approval.id}`)}
                    className="p-4 bg-orange-50 rounded-lg border border-orange-100 hover:shadow-md transition-all duration-200 cursor-pointer group relative"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                          {approval.name}
                        </p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                          <Building2 className="w-3 h-3" />
                          {approval.location}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                        {approval.status}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Requested {formatTime(approval.requestedOn)}</p>
                      
                      {/* Container for buttons */}
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // CRITICAL: Stop the card's onClick from firing
                            handleStatusUpdate(e, approval.id, 'approve');
                          }}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-200 shadow-sm hover:scale-105 relative z-10"
                          title="Approve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // CRITICAL: Stop the card's onClick from firing
                            handleStatusUpdate(e, approval.id, 'reject');
                          }}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 shadow-sm hover:scale-105 relative z-10"
                          title="Reject"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                
                {stats.pending_approvals.length === 0 && (
                  <div className="text-center py-6 text-gray-500 italic">
                    No pending approvals found.
                  </div>
                )}
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