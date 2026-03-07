import React, { useState, useRef } from 'react';
import { X, Upload, AlertCircle, Phone, Image as ImageIcon } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import toast from 'react-hot-toast';

const ReportComplaintModal = ({ isOpen, onClose, serviceRequestId }) => {
    const [description, setDescription] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);

    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be less than 5MB');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!description.trim()) {
            toast.error('Please provide a description');
            return;
        }

        if (!phoneNumber.trim()) {
            toast.error('Please provide a contact number');
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('phone_number', phoneNumber);
            if (imageFile) {
                formData.append('image_file', imageFile);
            }

            await axiosInstance.post(`/service-request/${serviceRequestId}/complaint/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            toast.success('Complaint submitted successfully. Our team will review it shortly.');

            // Reset form
            setDescription('');
            setPhoneNumber('');
            removeImage('');
            onClose();
        } catch (error) {
            console.error('Complaint submission error:', error);
            toast.error(error.response?.data?.error || 'Failed to submit complaint. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-red-50 px-6 py-4 flex items-center justify-between border-b border-red-100">
                    <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <h2 className="text-lg font-bold">Report a Problem</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                        If you are facing any issues with the service or behavior, please provide details below. Our admin team will review it and take necessary action.
                    </p>

                    <div className="space-y-4">
                        {/* Phone Number Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="Enter your phone number"
                                    className="pl-10 w-full rounded-lg border-gray-300 border py-2.5 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400"
                                    required
                                />
                            </div>
                        </div>

                        {/* Description Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Please describe the issue in detail..."
                                className="w-full rounded-lg border-gray-300 border px-3 py-2 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                required
                            />
                        </div>

                        {/* Image Upload Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Proof / Evidence (Optional)
                            </label>

                            {!imagePreview ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                >
                                    <ImageIcon className="w-8 h-8 mb-2 text-gray-400" />
                                    <p className="text-sm font-medium">Click to upload an image</p>
                                    <p className="text-xs mt-1">PNG, JPG up to 5MB</p>
                                </div>
                            ) : (
                                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="bg-white text-red-600 p-2 rounded-lg font-medium text-sm hover:bg-red-50 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <X className="w-4 h-4" />
                                            Remove Image
                                        </button>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-200 focus:outline-none transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-red-600 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-500/30 focus:outline-none shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Submit Complaint'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportComplaintModal;
