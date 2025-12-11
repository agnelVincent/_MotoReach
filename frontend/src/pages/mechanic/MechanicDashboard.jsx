import React, { useState, useRef, useEffect } from 'react';
import { 
  Car, Bell, User, Menu, X, LayoutDashboard, FileText, Building2, LogOut, ChevronDown,
  Briefcase, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Wrench,
  MapPin,
  Calendar,
  ArrowRight,
  Star,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import MechanicNavbar from '../../components/navbars/MechanicNavbar';

const MechanicDashboard = () => {
  const recentRequests = [
    {
      userId: 'USR-1001',
      requestId: 'REQ-5678',
      problem: 'Engine Oil Change',
      status: 'In Progress',
      priority: 'medium',
      location: 'Koramangala, Bangalore',
      scheduledTime: 'Today, 2:00 PM',
      customerName: 'Rajesh Kumar'
    },
    {
      userId: 'USR-1002',
      requestId: 'REQ-5679',
      problem: 'Brake System Repair',
      status: 'Pending',
      priority: 'high',
      location: 'Indiranagar, Bangalore',
      scheduledTime: 'Today, 4:30 PM',
      customerName: 'Priya Sharma'
    },
    {
      userId: 'USR-1003',
      requestId: 'REQ-5680',
      problem: 'Battery Replacement',
      status: 'Scheduled',
      priority: 'low',
      location: 'Whitefield, Bangalore',
      scheduledTime: 'Tomorrow, 10:00 AM',
      customerName: 'Amit Patel'
    },
    {
      userId: 'USR-1004',
      requestId: 'REQ-5681',
      problem: 'Tire Puncture Fix',
      status: 'Completed',
      priority: 'high',
      location: 'HSR Layout, Bangalore',
      scheduledTime: 'Yesterday, 3:00 PM',
      customerName: 'Sneha Reddy'
    },
  ];

  const stats = [
    { label: 'Completed Today', value: '5', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', gradient: 'from-green-500 to-emerald-600' },
    { label: 'Active Jobs', value: '3', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', gradient: 'from-blue-500 to-indigo-600' },
    { label: 'Today\'s Earnings', value: '₹2,450', icon: DollarSign, color: 'text-orange-600', bg: 'bg-orange-50', gradient: 'from-orange-500 to-red-600' },
    { label: 'Rating', value: '4.8', icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50', gradient: 'from-yellow-500 to-orange-600' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700';
      case 'Scheduled':
        return 'bg-purple-100 text-purple-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50">
      <MechanicNavbar />

      <div className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Mechanic Dashboard
            </h1>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                  <div className={`absolute inset-0 ${stat.bg} opacity-50`}></div>
                  
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <h3 className="text-3xl font-bold text-gray-800 mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-sm text-gray-600 font-medium">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Apply for Workshop Section */}
          <div className="mb-8">
            <div className="relative bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl p-8 shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMjAgMjBjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHpNMTYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-10"></div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                    <Briefcase className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                      Join a Workshop
                    </h2>
                    <p className="text-orange-100 text-lg">
                      Connect with verified workshops and expand your opportunities
                    </p>
                  </div>
                </div>
                
                <button className="group px-8 py-4 bg-white text-orange-700 font-bold rounded-xl shadow-2xl hover:shadow-white/50 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 whitespace-nowrap">
                  Apply Now
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Recent/Ongoing Requests Section */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Your Recent Requests</h2>
                <p className="text-gray-600">Assigned work and ongoing services</p>
              </div>
              <button className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {recentRequests.map((request, index) => (
                <div
                  key={index}
                  className="group relative bg-gradient-to-r from-gray-50 to-orange-50 rounded-xl p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Priority Indicator */}
                    <div className={`w-1 lg:w-2 h-full lg:h-20 rounded-full ${getPriorityColor(request.priority)} absolute left-0 top-0 lg:relative`}></div>

                    {/* Request Info */}
                    <div className="flex-1 pl-4 lg:pl-0">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-800">{request.problem}</h3>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {request.customerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {request.requestId}
                            </span>
                            <span className="flex items-center gap-1 text-orange-600 font-medium">
                              <Clock className="w-4 h-4" />
                              {request.scheduledTime}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-orange-500" />
                        <span>{request.location}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group-hover:scale-105">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Highlights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white">
              <TrendingUp className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-3xl font-bold mb-2">127</h3>
              <p className="text-blue-100">Total Jobs Completed</p>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 shadow-lg text-white">
              <Award className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-3xl font-bold mb-2">98.5%</h3>
              <p className="text-green-100">Customer Satisfaction</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl p-6 shadow-lg text-white">
              <Target className="w-12 h-12 mb-4 opacity-80" />
              <h3 className="text-3xl font-bold mb-2">₹45,230</h3>
              <p className="text-purple-100">Total Earnings</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;