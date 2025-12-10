import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const ProfileInput = ({
    label,
    value,
    Icon,
    isEditMode,
    type = "text",
    onChange,
    isPassword = false,
    showPassword,
    onTogglePassword,
    passwordMatchError, // Specific error for password mismatch
    errorMessage // General error message (e.g., from validation/API)
}) => {
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const errorText = errorMessage || passwordMatchError;
    const isError = !!errorText; // Convert to boolean

    // Determine if the field is in edit mode or is a password field (which is always editable)
    const canBeEdited = isEditMode || isPassword;

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            {canBeEdited ? (
                <div className="relative">
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

                    <input
                        type={inputType}
                        value={value}
                        onChange={onChange}
                        // Disable fields that are in edit mode but should not be edited (e.g., email)
                        disabled={isEditMode && label.includes('(Read-only)')}
                        className={`w-full pl-11 ${isPassword ? "pr-12" : "pr-4"} py-3 border 
                            ${isError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"} 
                            rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300
                            ${isEditMode && label.includes('(Read-only)') ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
                        `}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={onTogglePassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-800">{value || 'N/A'}</span>
                </div>
            )}

            {isError && (
                <p className="text-sm text-red-600 mt-2">
                    {errorText}
                </p>
            )}
        </div>
    );
};


export default ProfileInput;