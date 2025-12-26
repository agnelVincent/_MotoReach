import { XCircleIcon, EnvelopeIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { reApplyWorkshop } from '../../redux/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const WorkshopRejectedPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { loading } = useSelector((state) => state.auth);

    const handleReApply = async () => {
        try {
            const resultAction = await dispatch(reApplyWorkshop()).unwrap();
            toast.success(resultAction.message || 'Re-application submitted successfully');
            navigate('/workshop/pending');
        } catch (error) {
            toast.error(error.error || 'Failed to re-apply');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen p-4 md:p-8 bg-gray-900">

            <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden transform transition duration-500">

                <div className="p-8 md:p-12 text-white bg-gradient-to-r from-red-600 to-pink-500 text-center">

                    <div className="mb-4 inline-block p-4 rounded-full bg-white/20 backdrop-blur-sm">
                        <XCircleIcon className="w-10 h-10 text-white" aria-hidden="true" />
                    </div>

                    <h1 className="text-3xl md:text-5xl font-extrabold mb-2 tracking-tight">
                        Registration Rejected
                    </h1>

                    <p className="text-lg md:text-xl text-red-100 font-medium">
                        We regret to inform you that your workshop application was not approved by the Super Admin.
                    </p>
                </div>

                <div className="p-8 md:p-12">

                    <div className="mb-10 p-5 bg-red-50 border border-red-200 rounded-lg text-left">
                        <div className="flex items-center">
                            <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                            <p className="text-lg font-semibold text-red-800">
                                Current Status: <span className="text-red-600">REJECTED</span>
                            </p>
                        </div>
                    </div>

                    <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2 border-gray-100">
                            What You Can Do Next
                        </h3>

                        <ul className="space-y-6">
                            <li className="flex items-start">
                                <ArrowPathIcon className="flex-shrink-0 w-6 h-6 text-blue-500 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Request Approval Again</p>
                                    <p className="text-gray-500 text-sm">If you believe this was a mistake or have corrected any issues, you can request approval again.</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <EnvelopeIcon className="flex-shrink-0 w-6 h-6 text-red-500 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Contact Support for Details</p>
                                    <p className="text-gray-500 text-sm">Reach out to our support team to understand the specific reasons for the rejection and potential corrective steps.</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <DocumentTextIcon className="flex-shrink-0 w-6 h-6 text-red-500 mt-0.5 mr-4" />
                                <div>
                                    <p className="text-lg font-semibold text-gray-700">Review Application Guidelines</p>
                                    <p className="text-500 text-sm">Ensure your business information and documentation comply with all platform requirements before reapplying.</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={handleReApply}
                            disabled={loading}
                            className={`inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <ArrowPathIcon className="w-5 h-5 mr-2 -ml-1" />
                                    Request Again
                                </>
                            )}
                        </button>

                        <button className="inline-flex items-center px-8 py-3 border border-gray-300 text-lg font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out">
                            <EnvelopeIcon className="w-5 h-5 mr-2 -ml-1" />
                            Contact Support
                        </button>
                    </div>

                    <p className="mt-10 pt-6 text-center text-sm text-gray-500 border-t border-gray-200">
                        We're committed to helping you join our network. Please use the support button above for assistance.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WorkshopRejectedPage;