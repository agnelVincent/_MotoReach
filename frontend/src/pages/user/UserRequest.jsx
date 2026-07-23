import React, { useState } from 'react';
import {
  Car,
  Wrench,
  FileText,
  X,
  Plus,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';
import { useDispatch } from 'react-redux';
import { createServiceRequest } from '../../redux/slices/serviceRequestSlice';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { formatBackendError } from '../../utils/errorHandler';

const UserRequest = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    vehicleType: '',
    vehicleModel: '',
    issueCategory: '',
    description: '',
    latitude: 0,
    longitude: 0,
  });
  
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const issueCategories = [
    'Engine & Transmission',
    'Brakes & Suspension',
    'Electrical & Battery',
    'Tires & Wheels',
    'AC & Heating',
    'General Maintenance / Towing',
  ];

  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_COUNT = 5;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleLocationSelect = (location) => {
    setFormData((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng,
    }));
    if (formErrors.location) {
      setFormErrors((prev) => ({ ...prev, location: null }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const availableSlots = MAX_IMAGE_COUNT - images.length;

    if (files.length > availableSlots) {
      toast.error(`You can only add ${availableSlots} more image(s).`);
    }

    const validFiles = files.slice(0, availableSlots).filter((file) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not supported.`);
        return false;
      }
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds ${MAX_IMAGE_SIZE_MB}MB.`);
        return false;
      }
      return true;
    });

    const newEntries = validFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newEntries]);
    e.target.value = '';
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => {
      const target = prev[indexToRemove];
      if (target?.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const validateForm = () => {
    const errors = {};

    const vType = formData.vehicleType.trim();
    if (!vType) errors.vehicleType = 'Vehicle type is required.';
    else if (vType.length < 2) errors.vehicleType = 'Vehicle type must be at least 2 characters.';
    else if (vType.length > 50) errors.vehicleType = 'Vehicle type must not exceed 50 characters.';

    const vModel = formData.vehicleModel.trim();
    if (!vModel) errors.vehicleModel = 'Vehicle model is required.';
    else if (vModel.length < 2) errors.vehicleModel = 'Vehicle model must be at least 2 characters.';
    else if (vModel.length > 80) errors.vehicleModel = 'Vehicle model must not exceed 80 characters.';

    if (!formData.issueCategory) errors.issueCategory = 'Please select an issue category.';

    const desc = formData.description.trim();
    if (!desc) errors.description = 'Description is required.';
    else if (desc.length < 20) errors.description = 'Please describe the issue in at least 20 characters.';
    else if (desc.length > 1000) errors.description = 'Description must not exceed 1000 characters.';

    if (!formData.latitude || !formData.longitude || (formData.latitude === 0 && formData.longitude === 0)) {
      errors.location = 'Please pin your location on the map.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }

    setIsSubmitting(true);

    const data = new FormData();
    data.append('vehicle_type', formData.vehicleType.trim());
    data.append('vehicle_model', formData.vehicleModel.trim());
    data.append('issue_category', formData.issueCategory);
    data.append('description', formData.description.trim());
    data.append('user_latitude', formData.latitude);
    data.append('user_longitude', formData.longitude);

    images.forEach((image) => {
      data.append('images', image.file);
    });

    const resultAction = await dispatch(createServiceRequest(data));
    setIsSubmitting(false);

    if (createServiceRequest.fulfilled.match(resultAction)) {
      const newRequestId = resultAction.payload.request.id;
      navigate(`/user/workshops-nearby/${newRequestId}`);
    } else {
      const errorMsg = formatBackendError(resultAction.payload, 'Failed to create request. Please try again.');
      toast.error(errorMsg);
      console.error('Creation failed:', resultAction.payload);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Geist:wght@400;500;600&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        .font-body { font-family: 'Geist', sans-serif; }
        .hero-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%); }
        .hero-noise::before { content:''; position:absolute; inset:0; background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events:none; }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
      `}</style>

      {/* HERO SECTION */}
      <section className="hero-gradient hero-noise relative overflow-hidden pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="absolute -left-10 -top-10 h-80 w-80 rounded-full bg-indigo-500 opacity-20 blur-[100px] pointer-events-none" />
        <div className="absolute right-10 top-10 h-64 w-64 rounded-full bg-violet-400 opacity-15 blur-[80px] pointer-events-none" />

        <div className="absolute right-12 top-16 hidden h-40 w-40 rounded-full border border-white/10 md:flex items-center justify-center pointer-events-none" style={{ animation: 'float 6s ease-in-out infinite' }}>
          <div className="h-32 w-32 rounded-full border border-white/5 flex items-center justify-center">
            <Car className="h-8 w-8 text-white/20" />
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-1.5 text-white/90 mb-6">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-display text-[10px] tracking-widest font-bold uppercase text-white/80">New Service Request</span>
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl max-w-2xl leading-[1.1]">
            Tell us what's{' '}
            <span className="bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200 bg-clip-text text-transparent">wrong</span>
          </h1>
          <p className="font-body mt-4 max-w-xl text-base md:text-lg leading-relaxed text-slate-300/80">
            Describe your vehicle issue and we'll connect you with verified workshops nearby — fast, transparent, and hassle-free.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-50" style={{ clipPath: 'ellipse(60% 100% at 50% 100%)' }} />
      </section>

      {/* FORM CONTENT */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-24 -mt-6 relative z-20">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Card 1: Vehicle & Issue */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/70">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-900 text-lg">Vehicle Information</h2>
                <p className="font-body text-xs text-slate-500 mt-0.5">Tell us about your vehicle and the dynamic issue</p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="font-display text-xs font-bold tracking-wide text-slate-700 uppercase block">Vehicle Type <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.vehicleType}
                    placeholder="e.g., Sedan, SUV, Motorcycle"
                    className="font-body w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                  />
                  {formErrors.vehicleType && (
                    <p className="font-body text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{formErrors.vehicleType}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="font-display text-xs font-bold tracking-wide text-slate-700 uppercase block">Vehicle Model <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    placeholder="e.g., Toyota Camry 2022"
                    className="font-body w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
                    onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                  />
                  {formErrors.vehicleModel && (
                    <p className="font-body text-xs text-rose-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />{formErrors.vehicleModel}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-display text-xs font-bold tracking-wide text-slate-700 uppercase block">Issue Category <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <select
                    value={formData.issueCategory}
                    className="font-body w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 py-3 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
                    onChange={(e) => handleInputChange('issueCategory', e.target.value)}
                  >
                    <option value="" disabled>Select the most relevant category</option>
                    {issueCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {formErrors.issueCategory && (
                  <p className="font-body text-xs text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{formErrors.issueCategory}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-display text-xs font-bold tracking-wide text-slate-700 uppercase flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-slate-400" />
                  Problem Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  placeholder="Please describe the issue in detail. The more info you share, the faster workshops can diagnose..."
                  className="font-body w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 resize-none"
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
                {formErrors.description && (
                  <p className="font-body text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{formErrors.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Location */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/70">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-900 text-lg">Vehicle Location</h2>
                <p className="font-body text-xs text-slate-500 mt-0.5">Pin your precise breakdown or pick-up location</p>
              </div>
            </div>
            
            <div className="p-6 sm:p-8 space-y-4">
              {formData.latitude && formData.longitude ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="font-body text-sm font-medium">Location successfully locked in</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-amber-800">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                  <span className="font-body text-sm font-medium">Map interaction required to dispatch nearby dynamic aid</span>
                </div>
              )}
              {formErrors.location && (
                <p className="font-body text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{formErrors.location}
                </p>
              )}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <LocationPicker onLocationSelect={handleLocationSelect} />
              </div>
            </div>
          </div>

          {/* Card 3: Photos */}
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/70">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:px-8 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white shadow-sm shadow-purple-200">
                <Camera className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display font-bold text-slate-900 text-lg">
                  Add Photos <span className="text-xs font-normal text-slate-400 ml-1">(Optional)</span>
                </h2>
                <p className="font-body text-xs text-slate-500 mt-0.5">Visual details help mechanics estimate costs more accurately</p>
              </div>
            </div>
            
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                    <img src={img.preview} alt="upload preview" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <button 
                      type="button" 
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-md transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 hover:bg-rose-600"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {images.length < MAX_IMAGE_COUNT && (
                  <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-400 cursor-pointer transition-all duration-200 group">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-500 group-hover:text-indigo-600 transition-colors duration-200">
                      <Plus className="h-5 w-5" />
                    </div>
                    <span className="font-display text-xs font-bold text-slate-700 mt-3">Upload Media</span>
                    <span className="font-body text-[10px] text-slate-400 mt-1">
                      {images.length}/{MAX_IMAGE_COUNT} · Max {MAX_IMAGE_SIZE_MB}MB each
                    </span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Submit Action Block */}
          <div className="rounded-2xl bg-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-slate-900/20">
            <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="font-display font-bold text-xl sm:text-2xl">Ready to broadcast your request?</h3>
                <p className="font-body text-xs sm:text-sm text-slate-400 mt-1">We will fetch active offers from matching verified stations near you instantly.</p>
              </div>

              <div className="w-full md:w-auto shrink-0">
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.latitude}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] px-6 py-3.5 font-display font-bold text-sm text-white shadow-xl shadow-indigo-900/40 transition-all duration-150 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed group"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-white" />
                      <span>Sourcing Stations...</span>
                    </>
                  ) : (
                    <>
                      <span>Find Nearby Workshops</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {!formData.latitude && (
              <p className="font-body text-amber-400 text-xs mt-4 flex items-center gap-1.5 border-t border-white/5 pt-4">
                <MapPin className="h-3.5 w-3.5" /> Please set your location in Section 2 above to activate search dispatch.
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 pt-5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-body">Secure platform network</span>
              </div>
              <div className="h-1 w-1 rounded-full bg-slate-700 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-indigo-400" />
                <span className="font-body">100% Certified Mechanics Only</span>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default UserRequest;