import React, { useState } from 'react';
import { 
  CheckCircle, 
  Phone, 
  Send, 
  User, 
  Mail, 
  UserMinus,
  UserPlus,
  DollarSign,
  Shield,
  AlertCircle,
  FileCheck,
  CreditCard,
  Wrench,
  Clock,
  Link2,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

const WorkshopServiceFlow = () => {
  const [currentStatus] = useState('CONNECTED');
  const [messageInput, setMessageInput] = useState('');
  const [estimateAmount, setEstimateAmount] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);

  const statusFlow = [
    { key: 'CREATED', label: 'Request Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Platform Fee Paid', icon: CreditCard },
    { key: 'CONNECTING', label: 'Connecting', icon: Link2 },
    { key: 'CONNECTED', label: 'Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate Shared', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Service Amount Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'Service In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Service Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified & Closed', icon: Shield }
  ];

  const messages = [
    { id: 1, sender: 'user', text: 'Hello! When can you start the service?', time: '10:35 AM' },
    { id: 2, sender: 'workshop', text: 'We can start tomorrow morning. The estimated cost is ₹2,500.', time: '10:40 AM' },
    { id: 3, sender: 'user', text: 'That works for me. Please proceed.', time: '10:45 AM' },
    { id: 4, sender: 'workshop', text: 'Perfect! We will send you the detailed estimate shortly.', time: '10:50 AM' },
    { id: 5, sender: 'user', text: 'Thank you!', time: '10:52 AM' }
  ];

  const servicePersonnel = [
    {
      id: 1,
      name: 'Ramesh Patel',
      role: 'Workshop Admin',
      contact: '+91 98765 43210',
      email: 'ramesh@autofix.com'
    },
    {
      id: 2,
      name: 'Vikram Singh',
      role: 'Assigned Mechanic',
      contact: '+91 98765 43211',
      email: 'vikram@autofix.com'
    }
  ];

  const getCurrentStatusIndex = () => {
    return statusFlow.findIndex(s => s.key === currentStatus);
  };

  const isStatusCompleted = (index) => {
    return index < getCurrentStatusIndex();
  };

  const isStatusCurrent = (index) => {
    return index === getCurrentStatusIndex();
  };

  const handleGenerateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setShowOtp(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Service Management Dashboard
          </h1>
          <p className="text-gray-600">Request ID: #SRV-2024-001 | Customer: Rajesh Kumar</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Service Progress</h2>
          <div className="relative">
            <div className="hidden md:flex items-center justify-between">
              {statusFlow.map((status, index) => {
                const Icon = status.icon;
                const completed = isStatusCompleted(index);
                const current = isStatusCurrent(index);
                
                return (
                  <div key={status.key} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                        completed ? 'bg-green-500' : current ? 'bg-purple-600' : 'bg-gray-300'
                      }`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <p className={`text-xs text-center mt-3 font-medium ${
                        completed || current ? 'text-gray-800' : 'text-gray-400'
                      }`}>
                        {status.label}
                      </p>
                    </div>
                    {index < statusFlow.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        completed ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="md:hidden space-y-3">
              {statusFlow.map((status, index) => {
                const Icon = status.icon;
                const completed = isStatusCompleted(index);
                const current = isStatusCurrent(index);
                
                return (
                  <div key={status.key} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      completed ? 'bg-green-500' : current ? 'bg-purple-600' : 'bg-gray-300'
                    }`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className={`font-medium ${
                      completed || current ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {status.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: '600px' }}>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">Rajesh Kumar</h3>
                  <p className="text-purple-100 text-xs">Customer</p>
                </div>
              </div>
              <button className="p-2 bg-white bg-opacity-20 rounded-full hover:bg-opacity-30 transition-all duration-300">
                <Phone className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'workshop' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    message.sender === 'workshop'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  } rounded-2xl px-4 py-3`}>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'workshop' ? 'text-purple-100' : 'text-gray-500'
                    }`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
                <button className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-300 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Service Personnel</h3>
              
              <div className="space-y-4">
                {servicePersonnel.map((person) => (
                  <div key={person.id} className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl p-4 border border-purple-100">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{person.name}</p>
                        <p className="text-sm text-purple-600 font-medium">{person.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{person.contact}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{person.email}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 text-xs font-semibold flex items-center justify-center gap-1">
                        <UserMinus className="w-4 h-4" />
                        Remove
                      </button>
                      <button className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all duration-300 text-xs font-semibold flex items-center justify-center gap-1">
                        <UserPlus className="w-4 h-4" />
                        Assign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Set Estimated Service Amount
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimate Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={estimateAmount}
                    onChange={(e) => setEstimateAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                  />
                </div>
                
                <button className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                  Share Estimate with User
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-600" />
                Service Completion OTP
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                Generate OTP after service completion to allow user verification.
              </p>

              {!generatedOtp ? (
                <button 
                  onClick={handleGenerateOtp}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg"
                >
                  Generate OTP
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border-2 border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-purple-700">Generated OTP</p>
                      <button 
                        onClick={() => setShowOtp(!showOtp)}
                        className="p-1 hover:bg-purple-200 rounded transition-all duration-300"
                      >
                        {showOtp ? <EyeOff className="w-4 h-4 text-purple-600" /> : <Eye className="w-4 h-4 text-purple-600" />}
                      </button>
                    </div>
                    <p className="text-3xl font-bold text-purple-900 tracking-widest text-center">
                      {showOtp ? generatedOtp : '••••••'}
                    </p>
                  </div>
                  <button 
                    onClick={handleGenerateOtp}
                    className="w-full py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all duration-300 text-sm font-medium"
                  >
                    Regenerate OTP
                  </button>
                </div>
              )}
            </div>

            <button className="w-full py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all duration-300 flex items-center justify-center gap-2 font-semibold shadow-md">
              <AlertCircle className="w-5 h-5" />
              Report Complaint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopServiceFlow;