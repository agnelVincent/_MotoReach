import React from 'react';
import { PlayCircle, CheckCircle, Loader2 } from 'lucide-react';

const ServiceActionButton = ({ currentStatus, onStart, onEnd, disabled, loading }) => {
  if (currentStatus === 'SERVICE_AMOUNT_PAID') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-500">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-blue-600" />
          Start Service
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          The service amount has been paid by the customer. You can now begin the service execution. Press the button below to mark the service as in-progress.
        </p>
        <button
          onClick={onStart}
          disabled={disabled || loading}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <PlayCircle className="w-5 h-5" />
              Start Service
            </>
          )}
        </button>
      </div>
    );
  }

  if (currentStatus === 'IN_PROGRESS') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 border-t-4 border-emerald-500">
        <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          Complete Service
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          The service is currently marked as in-progress. Once you have finished all required work, mark it as completed to proceed to OTP verification.
        </p>
        <button
          onClick={onEnd}
          disabled={disabled || loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              End Service
            </>
          )}
        </button>
      </div>
    );
  }

  return null;
};

export default ServiceActionButton;
