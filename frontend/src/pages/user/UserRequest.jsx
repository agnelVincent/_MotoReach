import React, { useState } from 'react';
import {
  Car,
  Wrench,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';
import { useDispatch } from 'react-redux';
import { createServiceRequest } from '../../redux/slices/serviceRequestSlice';
import { useNavigate } from 'react-router-dom';

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

  const dispatch = useDispatch()
  const navigate = useNavigate()

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
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Car className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create Service Request</h1>
          <p className="mt-2 text-slate-500 text-lg">Tell us what's wrong, and we'll find the best nearby workshops.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Section 1: Vehicle & Issue Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-500" /> Vehicle Details
              </h2>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Type</label>
                <input
                  type="text"
                  placeholder="e.g. Sedan, SUV, Bike"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Vehicle Model</label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Camry 2022"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Issue Category</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                  onChange={(e) => setFormData({ ...formData, issueCategory: e.target.value })}
                  required
                >
                  <option value="">Select a category</option>
                  {issueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Description
                </label>
                <textarea
                  rows="4"
                  placeholder="Describe the problem in detail..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                ></textarea>
              </div>
            </div>
          </div>

          {/* Section 2: Location Picker */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-500" /> Precise Location
              </h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">Select the exact location where the vehicle is located.</p>
              <LocationPicker onLocationSelect={handleLocationSelect} />
            </div>
          </div>

          {/* Section 3: Multi-Image Upload */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-500" /> Upload Photos (Optional)
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {images.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
                  <Plus className="w-8 h-8 text-slate-400" />
                  <span className="text-xs text-slate-500 font-medium mt-2">Add Photo</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* Submit Button Section */}
          <div className="flex flex-col items-center gap-4">
            <button
              type="submit"
              disabled={isSubmitting || !formData.latitude}
              className={`w-full md:w-auto md:min-w-[300px] flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-300 disabled:shadow-none`}
            >
              {isSubmitting ? "Processing..." : "Next: Choose Workshop"}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <ShieldCheck className="w-4 h-4" />
              <span>Payments are held in secure escrow</span>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserRequest;