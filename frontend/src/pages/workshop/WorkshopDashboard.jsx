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


const WorkshopDashboard = () => {
  const metrics = [
    {
      title: 'Total Revenue',
      value: '₹1,24,580',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      title: 'Active Requests',
      value: '18',
      change: '+3',
      isPositive: true,
      icon: FileText,
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    {
      title: 'Completed Services',
      value: '142',
      change: '+8.2%',
      isPositive: true,
      icon: CheckCircle,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      title: 'Active Mechanics',
      value: '12',
      change: '+2',
      isPositive: true,
      icon: Users,
      gradient: 'from-orange-500 to-red-600',
      bgGradient: 'from-orange-50 to-red-50'
    }
  ];

  const recentRequests = [
    { id: '#REQ-1234', customer: 'John Doe', service: 'Oil Change', status: 'In Progress', time: '2 hours ago', priority: 'high' },
    { id: '#REQ-1235', customer: 'Jane Smith', service: 'Brake Repair', status: 'Pending', time: '4 hours ago', priority: 'medium' },
    { id: '#REQ-1236', customer: 'Mike Johnson', service: 'Engine Tune-up', status: 'Completed', time: '6 hours ago', priority: 'low' },
    { id: '#REQ-1237', customer: 'Sarah Williams', service: 'Tire Replacement', status: 'In Progress', time: '1 hour ago', priority: 'high' },
  ];

  const topMechanics = [
    { name: 'Rajesh Kumar', completed: 45, rating: 4.9, earnings: '₹35,200' },
    { name: 'Amit Sharma', completed: 38, rating: 4.8, earnings: '₹28,500' },
    { name: 'Vijay Patel', completed: 32, rating: 4.7, earnings: '₹24,800' },
  ];

  const monthlyData = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: 61000 },
    { month: 'May', revenue: 55000 },
    { month: 'Jun', revenue: 72000 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

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

          {/* Revenue Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-1">Revenue Overview</h2>
                  <p className="text-sm text-gray-600">Monthly revenue trends</p>
                </div>
                <div className="flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-600">+15.3%</span>
                </div>
              </div>

              <div className="space-y-4">
                {monthlyData.map((data, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 w-12">{data.month}</span>
                    <div className="flex-1">
                      <div className="h-10 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg transition-all duration-1000 flex items-center justify-end pr-3"
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
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 shadow-lg text-white">
                <Activity className="w-12 h-12 mb-4 opacity-80" />
                <h3 className="text-3xl font-bold mb-2">98.5%</h3>
                <p className="text-indigo-100">Customer Satisfaction</p>
              </div>

              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-lg text-white">
                <Clock className="w-12 h-12 mb-4 opacity-80" />
                <h3 className="text-3xl font-bold mb-2">2.5 hrs</h3>
                <p className="text-orange-100">Avg. Service Time</p>
              </div>
            </div>
          </div>

          {/* Recent Requests & Top Mechanics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Requests */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Recent Requests</h2>
                <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
              </div>

              <div className="space-y-3">
                {recentRequests.map((request, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        request.priority === 'high' ? 'bg-red-500' : 
                        request.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-800">{request.customer}</p>
                          <span className="text-xs text-gray-500">{request.id}</span>
                        </div>
                        <p className="text-sm text-gray-600">{request.service}</p>
                        <p className="text-xs text-gray-500 mt-1">{request.time}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      request.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      request.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {request.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Mechanics */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Top Performing Mechanics</h2>
                <Award className="w-6 h-6 text-yellow-500" />
              </div>

              <div className="space-y-4">
                {topMechanics.map((mechanic, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-lg hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                        'bg-gradient-to-br from-orange-300 to-orange-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{mechanic.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-600">{mechanic.completed} services</span>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs font-semibold text-gray-700">{mechanic.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">{mechanic.earnings}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDashboard;