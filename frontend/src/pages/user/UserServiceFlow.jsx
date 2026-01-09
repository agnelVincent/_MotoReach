import React, { useState } from 'react';
import { 
  CheckCircle, 
  Phone, 
  Send, 
  Star, 
  MapPin, 
  Mail, 
  AlertCircle,
  Ban,
  DollarSign,
  FileCheck,
  Wrench,
  CreditCard,
  Clock,
  Shield
} from 'lucide-react';

const UserServiceFlow = () => {
  const [currentStatus] = useState('ESTIMATE_SHARED');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [messageInput, setMessageInput] = useState('');

  const statusFlow = [
    { key: 'CREATED', label: 'Request Created', icon: FileCheck },
    { key: 'PLATFORM_FEE_PAID', label: 'Platform Fee Paid', icon: CreditCard },
    { key: 'CONNECTED', label: 'Workshop Connected', icon: CheckCircle },
    { key: 'ESTIMATE_SHARED', label: 'Estimate Shared', icon: DollarSign },
    { key: 'SERVICE_AMOUNT_PAID', label: 'Service Amount Paid', icon: CreditCard },
    { key: 'IN_PROGRESS', label: 'Service In Progress', icon: Wrench },
    { key: 'COMPLETED', label: 'Service Completed', icon: CheckCircle },
    { key: 'VERIFIED', label: 'Verified & Closed', icon: Shield }
  ];

  const messages = [
    { id: 1, sender: 'workshop', text: 'Hello! We have received your service request.', time: '10:30 AM' },
    { id: 2, sender: 'user', text: 'Great! When can you start the service?', time: '10:35 AM' },
    { id: 3, sender: 'workshop', text: 'We can start tomorrow morning. The estimated cost is ₹2,500.', time: '10:40 AM' },
    { id: 4, sender: 'user', text: 'That works for me. Please proceed.', time: '10:45 AM' },
    { id: 5, sender: 'workshop', text: 'Perfect! We will send you the detailed estimate shortly.', time: '10:50 AM' }
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

  const handleOtpChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otpValues];
      newOtp[index] = value;
      setOtpValues(newOtp);
    }
  };

  const showCancelButton = !['IN_PROGRESS', 'COMPLETED', 'VERIFIED'].includes(currentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Service Tracking
          </h1>
          <p className="text-gray-600">Request ID: #SRV-2024-001</p>
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
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                        completed ? 'bg-green-500' : current ? 'bg-blue-600' : 'bg-gray-300'
                      }`}>
                        <Icon className="w-8 h-8 text-white" />
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

            <div className="md:hidden space-y-4">
              {statusFlow.map((status, index) => {
                const Icon = status.icon;
                const completed = isStatusCompleted(index);
                const current = isStatusCurrent(index);
                
                return (
                  <div key={status.key} className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      completed ? 'bg-green-500' : current ? 'bg-blue-600' : 'bg-gray-300'
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold">AutoFix Workshop</h3>
                  <p className="text-blue-100 text-xs">Active</p>
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
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  } rounded-2xl px-4 py-3`}>
                    <p className="text-sm">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                />
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Workshop Details</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-gray-800">AutoFix Workshop</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      Connected
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">4.8 (120 reviews)</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600">123 MG Road, Koramangala, Bangalore - 560034</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-600">+91 98765 43210</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <p className="text-sm text-gray-600">contact@autofix.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Service Cost
              </h3>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 border-dashed min-h-[120px] flex items-center justify-center">
                <div className="text-center">
                  <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-700">Estimated amount will be shared here</p>
                  <p className="text-xs text-gray-500 mt-1">Pending workshop estimate</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {showCancelButton && (
                <button className="w-full py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-300 flex items-center justify-center gap-2 font-semibold">
                  <Ban className="w-5 h-5" />
                  Cancel Connection
                </button>
              )}
              
              <button className="w-full py-3 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-all duration-300 flex items-center justify-center gap-2 font-semibold">
                <AlertCircle className="w-5 h-5" />
                Report a Problem
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Service Completion Verification</h3>
              <p className="text-gray-600">
                Service provider will share an OTP after service completion. Enter OTP to confirm completion.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
                Enter 6-Digit OTP
              </label>
              <div className="flex gap-3 justify-center mb-6">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    value={value}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />
                ))}
              </div>

              <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl">
                Verify & Complete Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserServiceFlow;