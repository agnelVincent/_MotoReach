import React from 'react';
import { 
  FileText, 
  MapPin, 
  PackageCheck, 
  CreditCard, 
  History, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Wrench,
  Shield,
  Clock,
  Zap,
  CheckCircle,
  Star,
  Sparkles,
  Award,
  Target,
  ChevronRight
} from 'lucide-react';

const UserHome = () => {
  const quickActions = [
    {
      title: 'Create Service Request',
      description: 'Book a new service',
      icon: FileText,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      shadowColor: 'shadow-blue-500/50',
      iconBg: 'bg-blue-500'
    },
    {
      title: 'Find Workshops',
      description: 'Explore nearby workshops',
      icon: MapPin,
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      shadowColor: 'shadow-purple-500/50',
      iconBg: 'bg-purple-500'
    },
    {
      title: 'Track Service',
      description: 'Monitor your service',
      icon: PackageCheck,
      gradient: 'from-green-500 via-emerald-600 to-teal-600',
      shadowColor: 'shadow-green-500/50',
      iconBg: 'bg-green-500'
    },
    {
      title: 'Payments & Invoices',
      description: 'Manage transactions',
      icon: CreditCard,
      gradient: 'from-orange-500 via-amber-600 to-yellow-600',
      shadowColor: 'shadow-orange-500/50',
      iconBg: 'bg-orange-500'
    },
    {
      title: 'Service History',
      description: 'View past services',
      icon: History,
      gradient: 'from-pink-500 via-rose-600 to-red-600',
      shadowColor: 'shadow-pink-500/50',
      iconBg: 'bg-pink-500'
    }
  ];

  const journeyStats = [
    {
      icon: CheckCircle,
      value: '24',
      label: 'Requests Completed',
      gradient: 'from-green-400 to-emerald-600',
      iconColor: 'text-green-600',
      bgGradient: 'from-green-50 to-emerald-50'
    },
    {
      icon: DollarSign,
      value: '₹12,450',
      label: 'Total Savings',
      gradient: 'from-blue-400 to-blue-600',
      iconColor: 'text-blue-600',
      bgGradient: 'from-blue-50 to-indigo-50'
    },
    {
      icon: Building2,
      value: '8',
      label: 'Workshops Visited',
      gradient: 'from-purple-400 to-purple-600',
      iconColor: 'text-purple-600',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      icon: Wrench,
      value: '32',
      label: 'Services Taken',
      gradient: 'from-orange-400 to-orange-600',
      iconColor: 'text-orange-600',
      bgGradient: 'from-orange-50 to-amber-50'
    }
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Workshops & Mechanics',
      description: 'All service providers undergo thorough verification and background checks for your safety.',
      gradient: 'from-blue-50 to-indigo-50',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    {
      icon: DollarSign,
      title: 'Transparent Pricing',
      description: 'Know exactly what you pay upfront with no hidden charges or surprise fees.',
      gradient: 'from-green-50 to-emerald-50',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    {
      icon: Clock,
      title: 'Fast Service & Scheduling',
      description: 'Book appointments instantly with real-time availability and quick turnaround times.',
      gradient: 'from-orange-50 to-amber-50',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100'
    },
    {
      icon: PackageCheck,
      title: 'Real-Time Tracking Updates',
      description: 'Monitor your service status from booking to completion with live notifications.',
      gradient: 'from-purple-50 to-pink-50',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100'
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description: 'Multiple payment options with encrypted transactions ensuring complete security.',
      gradient: 'from-red-50 to-rose-50',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    {
      icon: Star,
      title: 'Smooth User Experience',
      description: 'Intuitive platform designed for effortless navigation and hassle-free service booking.',
      gradient: 'from-yellow-50 to-amber-50',
      iconColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Welcome Banner with Glassmorphism */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMjAgMjBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNMTYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white mb-6 border border-white/30">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Welcome to your dashboard</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                Hello, <span className="bg-gradient-to-r from-blue-200 to-purple-200 bg-clip-text text-transparent">User</span>!
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-2xl mx-auto">
                Your journey to hassle-free vehicle maintenance starts here
              </p>
            </div>
          </div>

          {/* Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="rgb(248, 250, 252)"/>
            </svg>
          </div>
        </section>

        {/* Quick Actions Section with Enhanced Design */}
        <section className="py-12 md:py-20 -mt-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full text-blue-700 mb-4">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-semibold">Quick Access</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                What would you like to do?
              </h2>
              <p className="text-gray-600 text-lg">
                Jump right into your most used features
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${action.shadowColor} shadow-lg`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-2 group-hover:text-white transition-colors duration-300">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300">
                        {action.description}
                      </p>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-white mt-3 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* MotoReach Journey Section with Cards */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-white to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 rounded-full text-white mb-4 shadow-lg">
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">Your Progress</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                Your MotoReach Journey
              </h2>
              <p className="text-gray-600 text-lg">
                Celebrating your achievements with us
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {journeyStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}></div>
                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 group-hover:scale-110 transition-transform duration-300">
                        {stat.value}
                      </h3>
                      <p className="text-sm text-gray-600 font-semibold">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMjAgMjBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNMTYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Level Progress
                      </h3>
                      <p className="text-blue-100 text-sm">Keep going to unlock rewards</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold border border-white/30">
                      <Star className="w-4 h-4 text-yellow-300" />
                      Gold Member
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-white/20 rounded-full h-4 mb-3 backdrop-blur-sm">
                  <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 h-4 rounded-full transition-all duration-1000 shadow-lg relative overflow-hidden" style={{ width: '75%' }}>
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-blue-100">
                  <span>24 / 32 Services</span>
                  <span className="font-semibold">75% Complete</span>
                </div>
                
                <div className="mt-4 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                  <Target className="w-5 h-5 text-yellow-300" />
                  <p className="text-white text-sm">
                    Complete <span className="font-bold">8 more services</span> to reach <span className="font-bold text-yellow-300">Platinum level</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why MotoReach Section with Enhanced Cards */}
        <section className="py-12 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 rounded-full text-white mb-4 shadow-lg">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">Why Choose Us</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3">
                Why MotoReach?
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Experience automotive services that prioritize quality, transparency, and your peace of mind
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden border border-gray-100"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl ${feature.iconBg} mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-md`}>
                        <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-gray-900 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to Action Section with Enhanced Design */}
        <section className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMjAgMjBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNMTYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
          
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6 border-4 border-white/30">
              <TrendingUp className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Ready for Your Next Service?
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Book quality automotive services from verified professionals in just a few clicks
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-2xl hover:shadow-white/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                <FileText className="w-5 h-5" />
                Create Service Request
                <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
              </button>
              
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5" />
                Browse Workshops
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserHome;