import { 
  FileText, Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Activity,
  Award,
} from 'lucide-react';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkshopStats } from '../../redux/slices/workshopMechanicSlice';


const WorkshopDashboard = () => {

  const {stats} = useSelector((state) => state.workshopMechanic)

  const metrics = [
    {
      title: 'Total Revenue',
      value: stats.total_revenue,
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      title: 'Active Requests',
      value: stats.active_requests,
      change: '+3',
      isPositive: true,
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    {
      title: 'Completed Services',
      value: stats.completed_services,
      change: '+8.2%',
      isPositive: true,
      icon: CheckCircle,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      title: 'Active Mechanics',
      value: stats.active_mechanics,
      change: '+2',
      isPositive: true,
      icon: Users,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50'
    }
  ];

  const recentRequests = stats.recent_requests || []

  const topMechanics = stats.top_mechanics || []

  const monthlyData = stats.monthly_data || []

  const dispatch = useDispatch()

  useEffect(()=>{
    dispatch(fetchWorkshopStats())
  },[dispatch])
  
  const maxRevenue = monthlyData.length
  ? Math.max(...monthlyData.map(d => d.revenue))
  : 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Workshop Dashboard
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        {metric.isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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

          {/* Main Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Revenue & Recent Requests (Takes 2 columns on lg) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Revenue Chart */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Revenue Overview</h2>
                    <p className="text-sm text-gray-500">6-month revenue progression</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">Active</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-500 w-12">{data.month}</span>
                      <div className="flex-1">
                        <div className="h-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg transition-all duration-1000 flex items-center justify-end pr-3"
                            style={{ width: `${maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0}%` }}
                          >
                            {data.revenue > 0 && <span className="text-xs font-semibold text-white">₹{(data.revenue).toFixed(0)}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Requests */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Recent Service Requests</h2>
                    <p className="text-sm text-gray-500">Latest customer activities</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {recentRequests.length > 0 ? recentRequests.map((request, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-2 h-2 rounded-full mt-2 shadow-sm ${
                          request.priority === 'high' ? 'bg-red-500' : 
                          request.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-gray-800">{request.customer}</p>
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 rounded-md">{request.id}</span>
                          </div>
                          <p className="text-sm text-gray-600">{request.service}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <Clock className="w-3 h-3 text-gray-400" />
                             <p className="text-xs text-gray-500">{request.time}</p>
                          </div>
                        </div>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1.5 rounded-lg shadow-sm border ${
                        request.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        request.status === 'In Progress' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                        'bg-amber-50 border-amber-100 text-amber-700'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  )) : (
                    <p className="text-center text-gray-500 py-4">No recent requests found</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column: Top Mechanics (Takes 1 column on lg) */}
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div>
                     <h2 className="text-xl font-bold text-gray-800">Top Mechanics</h2>
                     <p className="text-sm text-gray-500">Based on services completed</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center">
                    <Award className="w-5 h-5 text-orange-500" />
                  </div>
                </div>

                <div className="space-y-4">
                  {topMechanics?.length > 0 ? topMechanics.map((mechanic, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                          'bg-gradient-to-br from-orange-200 to-orange-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{mechanic.name}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              {mechanic.completed} services
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-gray-500 py-4">No top mechanics data available</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDashboard;