import React from 'react';
// Assuming Heroicons are installed
import { ClockIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

import { useSelector } from 'react-redux';

const WorkshopPendingPage = () => {
    const { user } = useSelector(state => state.auth);
    const isReRequest = user?.workshop_status === 'REQUESTED_AGAIN';

    return (
        // Wrapper: Darker background for contrast, min-h-screen for full view
        <div className="flex justify-center items-center min-h-screen p-4 md:p-8 bg-gray-900 mt-10">

            {/* Status Container Card: Sleeker, darker border, larger shadow */}
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition duration-500 hover:shadow-3xl">

                {/* Header Section: Gradient Accent */}
                <div className={`p-8 md:p-12 text-white bg-gradient-to-r ${isReRequest ? 'from-blue-600 to-indigo-500' : 'from-yellow-500 to-orange-400'} text-center`}>

                    {/* Visual Icon Container with a subtle pulse */}
                    <div className="mb-4 inline-block p-4 rounded-full bg-white/20 backdrop-blur-sm animate-pulse-slow-custom">
                        <ClockIcon className="w-10 h-10 text-white" aria-hidden="true" />
                    </div>

                    {/* Primary Heading */}
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">
                        {isReRequest ? 'Re-Verification In Progress' : 'Verification In Progress'}
                    </h1>

                    {/* Main Message */}
                    <p className={`text-lg md:text-xl font-medium ${isReRequest ? 'text-blue-100' : 'text-yellow-100'}`}>
                        {isReRequest
                            ? "We have received your re-application request. Our team will review your updated details shortly."
                            : "Your professional journey starts now. We're reviewing your application details."
                        }
                    </p>
                </div>

                {/* Body Content Section */}
                <div className="p-8 md:p-12">

                    {/* Status Box */}
                    <div className={`mb-10 p-5 border rounded-lg text-left ${isReRequest ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'}`}>
                        <div className="flex items-center">
                            <ExclamationCircleIcon className={`w-6 h-6 mr-3 ${isReRequest ? 'text-blue-600' : 'text-yellow-600'}`} />
                            <p className={`text-lg font-semibold ${isReRequest ? 'text-blue-800' : 'text-yellow-800'}`}>
                                Current Status: <span className={`${isReRequest ? 'text-blue-600' : 'text-yellow-600'}`}>
                                    {isReRequest ? 'REQUESTED AGAIN' : 'PENDING'}
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Timeline/Next Steps Section */}
                    <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 border-gray-100">
                            Your Next Steps
                        </h3>

                        <ul className="space-y-6">
                            {/* Step 1: Review */}
                            <li className="flex items-start">
                                <CheckCircleIcon className="flex-shrink-0 w-6 h-6 text-gray-400 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Application Received & Queued</p>
                                    <p className="text-gray-500 text-sm">Our team is verifying the authenticity of your submitted license and documentation.</p>
                                </div>
                            </li>
                            {/* Step 2: Notification */}
                            <li className="flex items-start">
                                <CheckCircleIcon className="flex-shrink-0 w-6 h-6 text-gray-400 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Email Notification</p>
                                    <p className="text-gray-500 text-sm">We will send a definitive notification (Approved or Rejected) to your registered email address.</p>
                                </div>
                            </li>
                            {/* Step 3: Access */}
                            <li className="flex items-start">
                                <CheckCircleIcon className="flex-shrink-0 w-6 h-6 text-gray-400 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Full Platform Access</p>
                                    <p className="text-gray-500 text-sm">Once approved, the full suite of workshop management tools will be unlocked in your dashboard.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Footer Note */}
                    <p className="mt-10 pt-6 text-center text-sm text-gray-500 border-t border-gray-200">
                        *Estimated review time is **24-48 business hours**. Thank you for your patience.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WorkshopPendingPage;