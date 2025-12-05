
import InputField from "../../components/InputField";
import TextAreaField from "../../components/TextAreaField";
import { useState } from 'react';
import { User, Building2, Wrench, Mail, Lock, Phone, MapPin, FileText, } from 'lucide-react';

const Register = () => {
  const [selectedRole, setSelectedRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [workshopType, setWorkshopType] = useState('individual');
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    workshopName: '',
    workshopAddress: '',
    state: '',
    city: '',
    pinCode: '',
    locality: '',
    licenseNumber: '',
    contactNumber: ''
  });

  const roles = [
    { id: 'user', name: 'User', icon: User },
    { id: 'workshop', name: 'Workshop', icon: Building2 },
    { id: 'mechanic', name: 'Mechanic', icon: Wrench }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    console.log('Form submitted:', { role: selectedRole, ...formData });
    // Handle registration logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <div className="flex-grow flex items-center justify-center px-4 py-12 mt-16">
        <div className="w-full max-w-2xl">
          {/* Registration Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Create Account
              </h1>
              <p className="text-gray-600">
                Join MotoReach and get started today
              </p>
            </div>

            {/* Role Selection */}
            <div className="flex gap-3 mb-8 p-2 bg-gray-100 rounded-xl">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                      selectedRole === role.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-transparent text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{role.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Registration Form */}
            <div className="space-y-5">
              {/* Common Fields for All Roles */}
              <InputField
                label="Full Name"
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                icon={User}
              />

              <InputField
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                icon={Mail}
              />

              <InputField
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
                icon={Lock}
                isPassword={true}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword(!showPassword)}
              />

              <InputField
                label="Confirm Password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                icon={Lock}
                isPassword={true}
                showPassword={showConfirmPassword}
                onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              {/* Workshop Specific Fields */}
              {selectedRole === 'workshop' && (
                <>
                  <InputField
                    label="Workshop Name"
                    type="text"
                    name="workshopName"
                    value={formData.workshopName}
                    onChange={handleInputChange}
                    placeholder="Enter workshop name"
                    icon={Building2}
                  />

                  <TextAreaField
                    label="Workshop Address"
                    name="workshopAddress"
                    value={formData.workshopAddress}
                    onChange={handleInputChange}
                    placeholder="Enter complete address"
                    icon={MapPin}
                    rows={3}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="State"
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Enter state"
                    />

                    <InputField
                      label="City"
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField
                      label="Pin Code"
                      type="text"
                      name="pinCode"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      placeholder="Enter pin code"
                    />

                    <InputField
                      label="Locality"
                      type="text"
                      name="locality"
                      value={formData.locality}
                      onChange={handleInputChange}
                      placeholder="Enter locality"
                    />
                  </div>

                  <InputField
                    label="License Number"
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="Enter license number"
                    icon={FileText}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Workshop Type
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="workshopType"
                          value="individual"
                          checked={workshopType === 'individual'}
                          onChange={(e) => setWorkshopType(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Individual</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="workshopType"
                          value="team"
                          checked={workshopType === 'team'}
                          onChange={(e) => setWorkshopType(e.target.value)}
                          className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">Team</span>
                      </label>
                    </div>
                  </div>

                  <InputField
                    label="Contact Number"
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleInputChange}
                    placeholder="Enter contact number"
                    icon={Phone}
                  />
                </>
              )}

              {/* Mechanic Specific Fields */}
              {selectedRole === 'mechanic' && (
                <InputField
                  label="Contact Number"
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="Enter contact number"
                  icon={Phone}
                />
              )}

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-md hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
              >
                Create Account
              </button>
            </div>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300">
                  Sign in
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;