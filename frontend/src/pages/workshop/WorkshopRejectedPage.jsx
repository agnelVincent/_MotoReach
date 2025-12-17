import React from 'react';
// Assuming Heroicons are installed
import { XCircleIcon, EnvelopeIcon, DocumentTextIcon } from '@heroicons/react/24/outline'; 

const WorkshopRejectedPage = () => {
    return (
        // Wrapper: Dark background for contrast, min-h-screen for full view
        <div className="flex justify-center items-center min-h-screen p-4 md:p-8 bg-gray-900">
            
            {/* Status Container Card: Sleek design, uses red border for rejection */}
            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition duration-500">
                
                {/* Header Section: Gradient Accent (Red/Danger) */}
                <div className="p-8 md:p-12 text-white bg-gradient-to-r from-red-600 to-pink-500 text-center">
                    
                    {/* Visual Icon Container */}
                    <div className="mb-4 inline-block p-4 rounded-full bg-white/20 backdrop-blur-sm">
                        {/* X-Circle Icon: Represents rejection/failure */}
                        <XCircleIcon className="w-10 h-10 text-white" aria-hidden="true" /> 
                    </div>

                    {/* Primary Heading */}
                    <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">
                        Registration Rejected
                    </h1>

                    {/* Main Message */}
                    <p className="text-lg md:text-xl text-red-100 font-medium">
                        We regret to inform you that your workshop application was not approved by the Super Admin.
                    </p>
                </div>

                {/* Body Content Section */}
                <div className="p-8 md:p-12">
                    
                    {/* Status Box */}
                    <div className="mb-10 p-5 bg-red-50 border border-red-200 rounded-lg text-left">
                        <div className="flex items-center">
                            <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                            <p className="text-lg font-semibold text-red-800">
                                Current Status: <span className="text-red-600">REJECTED</span>
                            </p>
                        </div>
                    </div>

                    {/* Actionable Steps Section */}
                    <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 border-gray-100">
                            What You Can Do Next
                        </h3>
                        
                        <ul className="space-y-6">
                            {/* Step 1: Contact Support */}
                            <li className="flex items-start">
                                <EnvelopeIcon className="flex-shrink-0 w-6 h-6 text-red-500 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Contact Support for Details</p>
                                    <p className="text-gray-500 text-sm">Reach out to our support team to understand the specific reasons for the rejection and potential corrective steps.</p>
                                </div>
                            </li>
                            {/* Step 2: Review Guidelines */}
                            <li className="flex items-start">
                                <DocumentTextIcon className="flex-shrink-0 w-6 h-6 text-red-500 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Review Application Guidelines</p>
                                    <p className="text-gray-500 text-sm">Ensure your business information and documentation comply with all platform requirements before reapplying.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* Call to Action Button */}
                    <div className="mt-10 text-center">
                        <button className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out">
                            <EnvelopeIcon className="w-5 h-5 mr-2 -ml-1" />
                            Contact Support
                        </button>
                    </div>
                    
                    {/* Footer Note */}
                    <p className="mt-10 pt-6 text-center text-sm text-gray-500 border-t border-gray-200">
                        We're committed to helping you join our network. Please use the support button above for assistance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WorkshopRejectedPage;