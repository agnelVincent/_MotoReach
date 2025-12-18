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
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const UserHome = () => {
  const quickActions = [
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

  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate()


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10">
        {/* Welcome Banner with Glassmorphism */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMjAgMjBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNMTYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2 rounded-full text-white mb-6 border border-white/30 shadow-lg">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-semibold tracking-wide">Welcome Back</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
                Hello, <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 bg-clip-text text-transparent">{user.full_name}</span>!
              </h1>
              <p className="text-xl md:text-2xl text-blue-50 max-w-3xl mx-auto mb-12 leading-relaxed">
                Your journey to hassle-free vehicle maintenance starts here
              </p>

              {/* Primary CTA - Request Service */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
                <button onClick={() => navigate("/user/request")} className="group relative px-10 py-5 bg-white text-blue-700 font-bold rounded-2xl shadow-2xl hover:shadow-white/50 transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 overflow-hidden w-full sm:w-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <FileText className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-lg">Request Service Now</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Wave Divider */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-24">
              <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="rgb(248, 250, 252)" fillOpacity="0.9"/>
              <path d="M0,96L48,90.7C96,85,192,75,288,80C384,85,480,107,576,112C672,117,768,107,864,101.3C960,96,1056,96,1152,101.3C1248,107,1344,117,1392,122.7L1440,128L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="rgb(248, 250, 252)"/>
            </svg>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="py-16 md:py-24 -mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-2 rounded-full text-white mb-4 shadow-lg">
                <Zap className="w-5 h-5" />
                <span className="text-sm font-bold tracking-wide">Quick Access</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                What would you like to do?
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Jump right into your most used features and manage your services effortlessly
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <button
                    key={index}
                    className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-100"
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${action.shadowColor} shadow-xl`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-white transition-colors duration-300">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300 mb-4">
                        {action.description}
                      </p>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-white transform translate-x-0 group-hover:translate-x-2 transition-all duration-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* MotoReach Journey Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-white via-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2 rounded-full text-white mb-4 shadow-xl">
                <Award className="w-5 h-5" />
                <span className="text-sm font-bold tracking-wide">Your Progress</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Your MotoReach Journey
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Celebrating your achievements and milestones with us
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {journeyStats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-100"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-60`}></div>
                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-5xl md:text-6xl font-bold text-gray-800 mb-3 group-hover:scale-105 transition-transform duration-300">
                        {stat.value}
                      </h3>
                      <p className="text-sm text-gray-700 font-semibold uppercase tracking-wide">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enhanced Progress Bar */}
            <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-10 shadow-2xl overflow-hidden border border-blue-400/20">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMjAgMjBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNMTYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-2xl">
                      <Award className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        Level Progress
                      </h3>
                      <p className="text-blue-100">Keep going to unlock amazing rewards</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-2xl text-white font-bold border-2 border-white/30 shadow-xl">
                      <Star className="w-5 h-5 text-yellow-300" />
                      Gold Member
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-white/20 rounded-full h-5 mb-4 backdrop-blur-sm border border-white/30">
                  <div className="relative bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 h-5 rounded-full transition-all duration-1000 shadow-2xl overflow-hidden" style={{ width: '75%' }}>
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-blue-100 mb-6">
                  <span className="font-semibold">24 / 32 Services</span>
                  <span className="font-bold text-white">75% Complete</span>
                </div>
                
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 shadow-xl">
                  <Target className="w-6 h-6 text-yellow-300 flex-shrink-0" />
                  <p className="text-white">
                    Complete <span className="font-bold text-yellow-300">8 more services</span> to reach <span className="font-bold text-yellow-300">Platinum level</span> and unlock exclusive benefits!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why MotoReach Section */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 px-5 py-2 rounded-full text-white mb-4 shadow-xl">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-bold tracking-wide">Why Choose Us</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
                Why MotoReach?
              </h2>
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                Experience automotive services that prioritize quality, transparency, and your peace of mind
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-100"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${feature.iconBg} mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg`}>
                        <Icon className={`w-10 h-10 ${feature.iconColor}`} />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-gray-900 transition-colors duration-300">
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
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default UserHome;