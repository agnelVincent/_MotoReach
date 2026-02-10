
import {  Eye, EyeOff , AlertCircle} from 'lucide-react';

const InputField = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  icon: Icon,
  isPassword = false,
  showPassword,
  onTogglePassword,
  error
}) => {

  const baseClasses = 'w-full';
    const paddingClasses = `${Icon ? 'pl-11' : 'px-4'} ${isPassword ? 'pr-12' : 'pr-4'} py-3`;
    const errorClasses = error 
        ? 'border-red-500 ring-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'; 

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          className={`${baseClasses} ${paddingClasses} border ${errorClasses} rounded-lg focus:ring-2 transition-all duration-300`}
          placeholder={placeholder}
        />
        {isPassword && (
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {error && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </p>
        )}

    </div>
  );
};

export default InputField