
import { Lock, Eye, EyeOff } from 'lucide-react'; 

const ProfileInput = ({
    label,
    value,
    Icon, 
    isEditMode,
    type = 'text',
    onChange,
    isPassword = false,
    showPassword,
    onTogglePassword,
    passwordMatchError, 
}) => {
    const inputType = isPassword 
        ? (showPassword ? 'text' : 'password') 
        : type;

    const isPasswordSection = label.includes('Password');

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>
            
            {isEditMode || isPasswordSection ? (
                <div className="relative">
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    
                    <input
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        className={`w-full pl-11 ${isPassword ? 'pr-12' : 'pr-4'} py-3 border 
                            ${passwordMatchError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'} 
                            rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300`}
                        placeholder={`Enter ${label.toLowerCase()}`}
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
            ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-800">{value}</span>
                </div>
            )}

            {passwordMatchError && (
                <p className="text-sm text-red-600 mt-2">{passwordMatchError}</p>
            )}
        </div>
    );
};

export default ProfileInput;