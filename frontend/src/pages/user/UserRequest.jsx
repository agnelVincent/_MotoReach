import React, { useState } from 'react';
import {
  Car,
  Wrench,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Camera,
  CheckCircle2
} from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';
import { useDispatch } from 'react-redux';
import { createServiceRequest } from '../../redux/slices/serviceRequestSlice';
import { useNavigate } from 'react-router-dom';

import { toast } from 'react-hot-toast';

const UserRequest = () => {
  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleModel: '',
    issueCategory: '',
    description: '',
    latitude: null,
    longitude: null,
  });

  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueCategories = [
    "Engine & Transmission",
    "Brakes & Suspension",
    "Electrical & Battery",
    "Body Work & Paint",
    "Oil & General Service",
    "Tires & Alignment",
    "Other"
  ];

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file: file,
      preview: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const data = new FormData();
    data.append('vehicle_type', formData.vehicleType);
    data.append('vehicle_model', formData.vehicleModel);
    data.append('issue_category', formData.issueCategory);
    data.append('description', formData.description);
    data.append('user_latitude', formData.latitude);
    data.append('user_longitude', formData.longitude);

    images.forEach(image => {
      data.append('images', image.file);
    });

    const resultAction = await dispatch(createServiceRequest(data));
    setIsSubmitting(false);

    if (createServiceRequest.fulfilled.match(resultAction)) {
      const newRequestId = resultAction.payload.request.id;
      navigate(`/user/workshops-nearby/${newRequestId}`);
    } else {
      const errorMsg = resultAction.payload ? JSON.stringify(resultAction.payload) : "Failed to create request. Please try again.";
      toast.error(`Error: ${errorMsg}`);
      console.error("Creation failed:", resultAction.payload);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl shadow-lg shadow-blue-200/50 mb-6 transform hover:scale-105 transition-transform">
            <Car className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-3">
            Request Service
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Describe your vehicle issue and connect with trusted workshops nearby
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Section 1: Vehicle & Issue Info */}
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
                Vehicle Information
              </h2>
              <p className="text-sm text-slate-500 mt-1 ml-12">Tell us about your vehicle</p>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Vehicle Type <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sedan, SUV, Bike"
                  className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Vehicle Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Toyota Camry 2022"
                  className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400"
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Issue Category <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all appearance-none bg-white text-slate-900 font-medium cursor-pointer"
                    onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value })}
                    required
                  >
                    <option value="">Select issue category</option>
                    {issueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Problem Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="5"
                  placeholder="Please describe the issue in detail. The more information you provide, the better we can help..."
                  className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-slate-900 placeholder:text-slate-400 resize-none"
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Location Picker */}
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                Vehicle Location
              </h2>
              <p className="text-sm text-slate-500 mt-1 ml-12">Pin your exact location for accurate service</p>
            </div>
            <div className="p-8">
              {formData.latitude && formData.longitude && (
                <div className="mb-4 flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-3 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-semibold">Location selected successfully</span>
                </div>
              )}
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>

          {/* Section 3: Multi-Image Upload */}
          <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl transition-shadow">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-xl">
                  <Camera className="w-5 h-5 text-violet-600" />
                </div>
                Add Photos
              </h2>
              <p className="text-sm text-slate-500 mt-1 ml-12">Upload images to help workshops understand the issue (Optional)</p>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg transform hover:scale-110"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer group">
                  <div className="p-3 bg-slate-100 group-hover:bg-blue-100 rounded-full transition-colors mb-2">
                    <Plus className="w-7 h-7 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <span className="text-sm text-slate-600 font-semibold">Add Photo</span>
                  <span className="text-xs text-slate-400 mt-1">Up to 10MB</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button Section */}
          <div className="pt-4 pb-8">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-3xl p-8 border border-slate-200">
              <button
                type="submit"
                disabled={isSubmitting || !formData.latitude}
                className={`w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200/50 hover:shadow-2xl hover:shadow-blue-300/50 active:scale-[0.98] transition-all disabled:from-slate-300 disabled:to-slate-400 disabled:shadow-none disabled:cursor-not-allowed group`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Request...
                  </>
                ) : (
                  <>
                    Find Nearby Workshops
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="p-1.5 bg-emerald-100 rounded-full">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="font-medium">Secure escrow payment</span>
                </div>
                <div className="hidden sm:block w-1 h-1 bg-slate-300 rounded-full" />
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="p-1.5 bg-blue-100 rounded-full">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium">Verified workshops only</span>
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserRequest;